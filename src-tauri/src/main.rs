use serde::Serialize;
use std::collections::{BTreeMap, HashSet};
use std::env;
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::time::UNIX_EPOCH;
use tauri::window::Color;
use tauri::{LogicalSize, Manager, PhysicalPosition, Position, Size, State};

const MAX_SKILL_BYTES: u64 = 256 * 1024;
const MAX_TREE_ENTRIES: usize = 160;
const MAX_PLUGIN_SCAN_DIRS: usize = 12_000;
const MAX_PROJECT_SCAN_DIRS: usize = 3_000;
const SYSTEM_MARKETPLACES: [&str; 4] = ["openai-bundled", "openai-primary-runtime", "openai-curated", "openai-curated-remote"];
const BALL_SIZE: f64 = 72.0;
const PANEL_WIDTH: f64 = 520.0;
const PANEL_HEIGHT: f64 = 720.0;

#[derive(Clone, Serialize)]
struct SkillSource {
    kind: String,
    label: String,
    personal: bool,
    marketplace: Option<String>,
    plugin: Option<String>,
    version: Option<String>,
}

#[derive(Clone, Serialize)]
struct SkillFile {
    path: String,
    kind: String,
}

#[derive(Clone, Serialize)]
struct SkillRecord {
    id: String,
    name: String,
    description: String,
    source: SkillSource,
    path: String,
    canonical_path: String,
    updated_at: String,
    content: String,
    body: String,
    content_truncated: bool,
    body_lines: usize,
    body_words: usize,
    file_count: usize,
    files: Vec<SkillFile>,
    files_truncated: bool,
}

#[derive(Serialize)]
struct RootRecord {
    label: String,
    path: String,
    available: bool,
}

#[derive(Serialize)]
struct Counts {
    total: usize,
    personal_total: usize,
    by_kind: BTreeMap<String, usize>,
}

#[derive(Serialize)]
struct DiscoverResponse {
    workspace_root: String,
    roots: Vec<RootRecord>,
    skills: Vec<SkillRecord>,
    counts: Counts,
}

#[derive(Clone, Copy, Serialize)]
#[serde(rename_all = "kebab-case")]
enum PanelAnchor {
    TopLeft,
    TopRight,
    BottomLeft,
    BottomRight,
}

impl Default for PanelAnchor {
    fn default() -> Self {
        Self::BottomRight
    }
}

#[derive(Default)]
struct WindowState {
    anchor: Mutex<PanelAnchor>,
}

#[derive(Serialize)]
struct PanelMode {
    anchor: PanelAnchor,
}

#[derive(Default)]
struct ParsedSkill {
    name: Option<String>,
    description: Option<String>,
    body: String,
}

fn home_dir() -> Result<PathBuf, String> {
    env::var_os("HOME")
        .map(PathBuf::from)
        .ok_or_else(|| "HOME is not set".to_string())
}

fn is_ignored(name: &str) -> bool {
    matches!(name, ".git" | "node_modules" | ".next" | ".turbo" | "dist" | "build" | "coverage")
}

fn canonical_dir(path: &Path) -> Option<PathBuf> {
    let real = fs::canonicalize(path).ok()?;
    if real.is_dir() {
        Some(real)
    } else {
        None
    }
}

fn path_string(path: &Path) -> String {
    path.to_string_lossy().to_string()
}

fn skill_id(canonical_path: &Path, source: &SkillSource) -> String {
    let input = format!("{}:{}:{}", source.kind, source.label, canonical_path.display());
    let hash = input.bytes().fold(0xcbf29ce484222325_u64, |acc, byte| {
        (acc ^ byte as u64).wrapping_mul(0x100000001b3)
    });
    format!("{hash:016x}")
}

fn parse_frontmatter(content: &str, fallback_name: &str) -> ParsedSkill {
    if !content.starts_with("---") {
        return ParsedSkill {
            name: Some(fallback_name.to_string()),
            description: None,
            body: content.trim().to_string(),
        };
    }

    let rest = &content[3..];
    let Some(end) = rest.find("\n---") else {
        return ParsedSkill {
            name: Some(fallback_name.to_string()),
            description: None,
            body: content.trim().to_string(),
        };
    };

    let frontmatter = &rest[..end];
    let body_start = 3 + end + "\n---".len();
    let body = content[body_start..].trim().to_string();
    let mut name = None;
    let mut description = None;

    for line in frontmatter.lines() {
        let Some((key, value)) = line.split_once(':') else {
            continue;
        };
        let clean = value.trim().trim_matches('"').trim_matches('\'').to_string();
        match key.trim() {
            "name" => name = Some(clean),
            "description" => description = Some(clean),
            _ => {}
        }
    }

    ParsedSkill {
        name: name.or_else(|| Some(fallback_name.to_string())),
        description,
        body,
    }
}

fn read_skill_file(path: &Path) -> Result<(String, bool, String), String> {
    let metadata = fs::metadata(path).map_err(|err| err.to_string())?;
    let mut file = fs::File::open(path).map_err(|err| err.to_string())?;
    let mut buffer = vec![0; metadata.len().min(MAX_SKILL_BYTES) as usize];
    file.read_exact(&mut buffer).map_err(|err| err.to_string())?;
    let updated = metadata
        .modified()
        .ok()
        .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
        .map(|duration| duration.as_secs().to_string())
        .unwrap_or_else(|| "unknown".to_string());
    Ok((String::from_utf8_lossy(&buffer).to_string(), metadata.len() > MAX_SKILL_BYTES, updated))
}

fn file_tree(root: &Path) -> (Vec<SkillFile>, usize, bool) {
    fn walk(root: &Path, current: &Path, depth: usize, files: &mut Vec<SkillFile>, count: &mut usize, truncated: &mut bool) {
        if files.len() >= MAX_TREE_ENTRIES || depth > 4 {
            *truncated = true;
            return;
        }
        let Ok(entries) = fs::read_dir(current) else {
            return;
        };
        let mut entries = entries.filter_map(Result::ok).collect::<Vec<_>>();
        entries.sort_by_key(|entry| entry.file_name());
        for entry in entries {
            if files.len() >= MAX_TREE_ENTRIES {
                *truncated = true;
                return;
            }
            let file_type = match entry.file_type() {
                Ok(value) => value,
                Err(_) => continue,
            };
            if file_type.is_symlink() {
                continue;
            }
            let name = entry.file_name().to_string_lossy().to_string();
            let path = entry.path();
            let relative = path.strip_prefix(root).unwrap_or(&path).to_string_lossy().to_string();
            if file_type.is_dir() {
                if is_ignored(&name) {
                    continue;
                }
                files.push(SkillFile { path: relative, kind: "directory".to_string() });
                walk(root, &path, depth + 1, files, count, truncated);
            } else if file_type.is_file() {
                *count += 1;
                files.push(SkillFile { path: relative, kind: "file".to_string() });
            }
        }
    }

    let mut files = Vec::new();
    let mut count = 0;
    let mut truncated = false;
    walk(root, root, 0, &mut files, &mut count, &mut truncated);
    (files, count, truncated)
}

fn skill_from_directory(directory: &Path, source: SkillSource) -> Option<SkillRecord> {
    let canonical = canonical_dir(directory)?;
    let skill_file = canonical.join("SKILL.md");
    if !skill_file.is_file() {
        return None;
    }

    let (content, content_truncated, updated_at) = read_skill_file(&skill_file).ok()?;
    let fallback_name = canonical.file_name()?.to_string_lossy().to_string();
    let parsed = parse_frontmatter(&content, &fallback_name);
    let body_words = parsed.body.split_whitespace().count();
    let body_lines = if parsed.body.is_empty() { 0 } else { parsed.body.lines().count() };
    let (files, file_count, files_truncated) = file_tree(&canonical);

    Some(SkillRecord {
        id: skill_id(&canonical, &source),
        name: parsed.name.unwrap_or(fallback_name),
        description: parsed.description.unwrap_or_else(|| "No description provided.".to_string()),
        source,
        path: path_string(directory),
        canonical_path: path_string(&canonical),
        updated_at,
        content,
        body: parsed.body,
        content_truncated,
        body_lines,
        body_words,
        file_count,
        files,
        files_truncated,
    })
}

fn direct_skill_children(root: &Path, source: SkillSource) -> Vec<SkillRecord> {
    let Some(_) = canonical_dir(root) else {
        return Vec::new();
    };
    let Ok(entries) = fs::read_dir(root) else {
        return Vec::new();
    };
    entries
        .filter_map(Result::ok)
        .filter(|entry| entry.file_type().map(|kind| kind.is_dir() && !kind.is_symlink()).unwrap_or(false))
        .filter_map(|entry| skill_from_directory(&entry.path(), source.clone()))
        .collect()
}

fn project_skill_roots(workspace: &Path) -> Vec<PathBuf> {
    fn walk(current: &Path, depth: usize, seen: &mut HashSet<PathBuf>, roots: &mut Vec<PathBuf>, scanned: &mut usize) {
        if depth > 8 || *scanned >= MAX_PROJECT_SCAN_DIRS {
            return;
        }
        let Some(real) = canonical_dir(current) else {
            return;
        };
        if !seen.insert(real.clone()) {
            return;
        }
        *scanned += 1;

        let candidate = real.join(".agents").join("skills");
        if candidate.is_dir() {
            roots.push(candidate);
        }

        let Ok(entries) = fs::read_dir(&real) else {
            return;
        };
        for entry in entries.filter_map(Result::ok) {
            let name = entry.file_name().to_string_lossy().to_string();
            if is_ignored(&name) || name == ".agents" {
                continue;
            }
            if entry.file_type().map(|kind| kind.is_dir() && !kind.is_symlink()).unwrap_or(false) {
                walk(&entry.path(), depth + 1, seen, roots, scanned);
            }
        }
    }

    let mut seen = HashSet::new();
    let mut roots = Vec::new();
    let mut scanned = 0;
    walk(workspace, 0, &mut seen, &mut roots, &mut scanned);
    roots
}

fn plugin_info(directory: &Path) -> (Option<String>, Option<String>, Option<String>) {
    let parts = directory.iter().map(|part| part.to_string_lossy().to_string()).collect::<Vec<_>>();
    let Some(index) = parts.iter().position(|part| part == "cache") else {
        return (None, None, None);
    };
    (parts.get(index + 1).cloned(), parts.get(index + 2).cloned(), parts.get(index + 3).cloned())
}

fn user_added_plugin(marketplace: &Option<String>) -> bool {
    marketplace
        .as_ref()
        .map(|name| !SYSTEM_MARKETPLACES.contains(&name.as_str()))
        .unwrap_or(false)
}

fn plugin_skill_directories(cache_root: &Path) -> Vec<PathBuf> {
    fn walk(root: &Path, current: &Path, seen: &mut HashSet<PathBuf>, found: &mut Vec<PathBuf>, scanned: &mut usize) {
        if *scanned >= MAX_PLUGIN_SCAN_DIRS {
            return;
        }
        let Some(real) = canonical_dir(current) else {
            return;
        };
        if !real.starts_with(root) || !seen.insert(real.clone()) {
            return;
        }
        *scanned += 1;
        if real.join("SKILL.md").is_file() {
            found.push(real.clone());
        }
        let Ok(entries) = fs::read_dir(&real) else {
            return;
        };
        for entry in entries.filter_map(Result::ok) {
            let name = entry.file_name().to_string_lossy().to_string();
            if is_ignored(&name) {
                continue;
            }
            if entry.file_type().map(|kind| kind.is_dir() && !kind.is_symlink()).unwrap_or(false) {
                walk(root, &entry.path(), seen, found, scanned);
            }
        }
    }

    let Some(real_root) = canonical_dir(cache_root) else {
        return Vec::new();
    };
    let mut seen = HashSet::new();
    let mut found = Vec::new();
    let mut scanned = 0;
    walk(&real_root, &real_root, &mut seen, &mut found, &mut scanned);
    found.sort();
    found
}

#[tauri::command]
fn discover_skills(workspace: Option<String>) -> Result<DiscoverResponse, String> {
    let home = home_dir()?;
    let workspace_path = workspace.map(PathBuf::from).unwrap_or(env::current_dir().map_err(|err| err.to_string())?);
    let workspace_root = canonical_dir(&workspace_path).ok_or_else(|| "workspace is not a readable directory".to_string())?;
    let codex_user = home.join(".codex").join("skills");
    let codex_system = codex_user.join(".system");
    let shared_user = home.join(".agents").join("skills");
    let plugin_cache = home.join(".codex").join("plugins").join("cache");

    let mut roots = vec![
        RootRecord { label: "Codex user".to_string(), path: path_string(&codex_user), available: codex_user.is_dir() },
        RootRecord { label: "Codex system".to_string(), path: path_string(&codex_system), available: codex_system.is_dir() },
        RootRecord { label: "Shared user".to_string(), path: path_string(&shared_user), available: shared_user.is_dir() },
        RootRecord { label: "Codex plugin cache".to_string(), path: path_string(&plugin_cache), available: plugin_cache.is_dir() },
    ];

    let mut skills = Vec::new();
    skills.extend(direct_skill_children(&codex_user, SkillSource { kind: "codex-user".to_string(), label: "Codex user".to_string(), personal: true, marketplace: None, plugin: None, version: None }));
    skills.extend(direct_skill_children(&codex_system, SkillSource { kind: "codex-system".to_string(), label: "Codex system".to_string(), personal: false, marketplace: None, plugin: None, version: None }));
    skills.extend(direct_skill_children(&shared_user, SkillSource { kind: "shared-user".to_string(), label: "Shared/local".to_string(), personal: false, marketplace: None, plugin: None, version: None }));

    for root in project_skill_roots(&workspace_root) {
        roots.push(RootRecord { label: "Project".to_string(), path: path_string(&root), available: true });
        skills.extend(direct_skill_children(&root, SkillSource { kind: "project".to_string(), label: "Project".to_string(), personal: true, marketplace: None, plugin: None, version: None }));
    }

    for directory in plugin_skill_directories(&plugin_cache) {
        let (marketplace, plugin, version) = plugin_info(&directory);
        let label = plugin.as_ref().map(|name| format!("Plugin: {name}")).unwrap_or_else(|| "Plugin cache".to_string());
        let personal = user_added_plugin(&marketplace);
        if let Some(skill) = skill_from_directory(&directory, SkillSource { kind: "plugin-cache".to_string(), label, personal, marketplace, plugin, version }) {
            skills.push(skill);
        }
    }

    let mut unique = BTreeMap::<String, SkillRecord>::new();
    for skill in skills {
        unique.insert(format!("{}:{}", skill.source.kind, skill.canonical_path), skill);
    }
    let mut skills = unique.into_values().collect::<Vec<_>>();
    skills.sort_by(|a, b| a.name.cmp(&b.name).then(a.source.label.cmp(&b.source.label)));

    let mut by_kind = BTreeMap::new();
    let mut personal_total = 0;
    for skill in &skills {
        *by_kind.entry(skill.source.kind.clone()).or_insert(0) += 1;
        if skill.source.personal {
            personal_total += 1;
        }
    }

    Ok(DiscoverResponse {
        workspace_root: path_string(&workspace_root),
        roots,
        counts: Counts { total: skills.len(), personal_total, by_kind },
        skills,
    })
}

#[tauri::command]
fn set_panel_mode(
    app: tauri::AppHandle,
    window_state: State<WindowState>,
    collapsed: bool,
) -> Result<PanelMode, String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())?;
    window
        .set_background_color(Some(Color(0, 0, 0, 0)))
        .map_err(|err| err.to_string())?;
    let scale = window.scale_factor().map_err(|err| err.to_string())?;
    let old_position = window.outer_position().map_err(|err| err.to_string())?;
    let old_size = window.outer_size().map_err(|err| err.to_string())?;

    let ball_width = (BALL_SIZE * scale).round() as u32;
    let ball_height = ball_width;
    let anchor = *window_state
        .anchor
        .lock()
        .map_err(|_| "window state lock failed".to_string())?;

    let (new_x, new_y, size, next_anchor) = if collapsed {
        let ball_x = match anchor {
            PanelAnchor::TopLeft | PanelAnchor::BottomLeft => old_position.x,
            PanelAnchor::TopRight | PanelAnchor::BottomRight => {
                old_position.x + old_size.width as i32 - ball_width as i32
            }
        };
        let ball_y = match anchor {
            PanelAnchor::TopLeft | PanelAnchor::TopRight => old_position.y,
            PanelAnchor::BottomLeft | PanelAnchor::BottomRight => {
                old_position.y + old_size.height as i32 - ball_height as i32
            }
        };
        (ball_x, ball_y, LogicalSize::new(BALL_SIZE, BALL_SIZE), anchor)
    } else {
        let monitor = window.current_monitor().map_err(|err| err.to_string())?;
        let (work_x, work_y, work_width, work_height) = monitor
            .map(|monitor| {
                let area = monitor.work_area();
                (area.position.x, area.position.y, area.size.width, area.size.height)
            })
            .unwrap_or((old_position.x, old_position.y, (PANEL_WIDTH * scale) as u32, (PANEL_HEIGHT * scale) as u32));
        let work_right = work_x + work_width as i32;
        let work_bottom = work_y + work_height as i32;
        let space_left = (old_position.x + ball_width as i32 - work_x).max(ball_width as i32) as u32;
        let space_right = (work_right - old_position.x).max(ball_width as i32) as u32;
        let space_up = (old_position.y + ball_height as i32 - work_y).max(ball_height as i32) as u32;
        let space_down = (work_bottom - old_position.y).max(ball_height as i32) as u32;
        let expand_right = space_right >= space_left;
        let expand_down = space_down >= space_up;
        let target_width = ((PANEL_WIDTH * scale).round() as u32)
            .min(if expand_right { space_right } else { space_left });
        let target_height = ((PANEL_HEIGHT * scale).round() as u32)
            .min(if expand_down { space_down } else { space_up });
        let next_anchor = match (expand_right, expand_down) {
            (true, true) => PanelAnchor::TopLeft,
            (false, true) => PanelAnchor::TopRight,
            (true, false) => PanelAnchor::BottomLeft,
            (false, false) => PanelAnchor::BottomRight,
        };
        let new_x = if expand_right {
            old_position.x
        } else {
            old_position.x + ball_width as i32 - target_width as i32
        };
        let new_y = if expand_down {
            old_position.y
        } else {
            old_position.y + ball_height as i32 - target_height as i32
        };
        (
            new_x,
            new_y,
            LogicalSize::new(target_width as f64 / scale, target_height as f64 / scale),
            next_anchor,
        )
    };

    *window_state
        .anchor
        .lock()
        .map_err(|_| "window state lock failed".to_string())? = next_anchor;
    window
        .set_min_size(Some(Size::Logical(LogicalSize::new(BALL_SIZE, BALL_SIZE))))
        .map_err(|err| err.to_string())?;
    window.set_size(Size::Logical(size)).map_err(|err| err.to_string())?;
    window
        .set_position(Position::Physical(PhysicalPosition::new(new_x, new_y)))
        .map_err(|err| err.to_string())?;
    window.set_always_on_top(true).map_err(|err| err.to_string())?;
    Ok(PanelMode { anchor: next_anchor })
}

#[tauri::command]
fn move_window(app: tauri::AppHandle, dx: f64, dy: f64) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "main window not found".to_string())?;
    let position = window.outer_position().map_err(|err| err.to_string())?;
    let scale = window.scale_factor().map_err(|err| err.to_string())?;
    let size = window.outer_size().map_err(|err| err.to_string())?;
    let monitor = window.current_monitor().map_err(|err| err.to_string())?;
    let (work_x, work_y, work_width, work_height) = monitor
        .map(|monitor| {
            let area = monitor.work_area();
            (area.position.x, area.position.y, area.size.width, area.size.height)
        })
        .unwrap_or((position.x, position.y, size.width, size.height));
    let max_x = (work_x + work_width as i32 - size.width as i32).max(work_x);
    let max_y = (work_y + work_height as i32 - size.height as i32).max(work_y);
    let next_x = (position.x + (dx * scale).round() as i32).clamp(work_x, max_x);
    let next_y = (position.y + (dy * scale).round() as i32).clamp(work_y, max_y);
    window
        .set_position(Position::Physical(PhysicalPosition::new(next_x, next_y)))
        .map_err(|err| err.to_string())?;
    window.set_always_on_top(true).map_err(|err| err.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                window.set_background_color(Some(Color(0, 0, 0, 0)))?;
                window.set_shadow(false)?;
                window.set_always_on_top(true)?;
            }
            Ok(())
        })
        .manage(WindowState::default())
        .invoke_handler(tauri::generate_handler![discover_skills, set_panel_mode, move_window])
        .run(tauri::generate_context!())
        .expect("error while running Skill Pet");
}

fn main() {
    run();
}
