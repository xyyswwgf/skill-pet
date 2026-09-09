const state = {
  data: null,
  query: '',
  selected: null,
  loading: false,
  error: null,
  lastUpdated: null,
}

const list = document.querySelector('#list')
const search = document.querySelector('#search')
const stats = document.querySelector('#stats')
const pet = document.querySelector('#pet')
const refresh = document.querySelector('#refresh')
const status = document.querySelector('#status')
let tauriInvoke = null
let pointerState = null
let didDrag = false
const PANEL_ANCHORS = ['top-left', 'top-right', 'bottom-left', 'bottom-right']

const PERSONAL_SUMMARIES = {
  'aspnet-core': '用于开发、审查和重构 ASP.NET Core 应用，适合后端接口、认证、依赖注入、中间件和项目架构相关任务。',
  'awesome-design-md': '用于读取和利用设计参考资料，帮助做品牌、产品界面和视觉风格分析。',
  'cloudflare-deploy': '用于把应用部署到 Cloudflare，覆盖 Workers、Pages、环境变量和发布流程。',
  'jupyter-notebook': '用于创建、编辑和整理 Jupyter Notebook，适合数据分析、实验记录和可执行文档。',
  'karpathy-guidelines': '用于写代码时遵守更严格的工程判断，减少常见的 LLM 编程错误。',
  'playwright': '用于自动化浏览器测试和页面检查，适合验证前端交互、截图和端到端流程。',
  'ppt-master': '用于制作高质量 PPT，把资料转成 SVG 页面并导出 PPTX，适合完整演示文稿项目。',
  'vercel-deploy': '用于把应用或网站部署到 Vercel，覆盖构建、发布和部署检查。',
  'caveman': '用于极简压缩沟通，减少文字和 token 消耗。',
  'diagnose': '用于系统化排查复杂 bug、性能问题和回归问题。',
  'find-skills': '用于发现、推荐或安装适合当前任务的 agent skills。',
  'grill-me': '用于严格追问和挑战计划，帮助把方案中的假设、风险和空洞点暴露出来。',
  'grill-with-docs': '用于结合已有文档严格审查计划，验证方案是否符合真实上下文。',
  'handoff': '用于把当前对话整理成交接文档，方便另一个 agent 或后续任务继续。',
  'impeccable': '用于设计、重设计、审查和打磨产品体验或视觉方案。',
  'improve-codebase-architecture': '用于发现代码库架构改进机会，关注领域建模、边界和长期可维护性。',
  'prototype': '用于先做一个轻量原型，帮助验证产品、交互或技术方案。',
  'setup-matt-pocock-skills': '用于在项目里配置 agent skills 说明区和相关文档结构。',
  'tdd': '用于按测试驱动开发流程工作，先写测试，再实现，再重构。',
  'to-issues': '用于把计划、PRD 或规格拆成可独立执行的 issue。',
  'to-prd': '用于把当前讨论整理成 PRD，沉淀目标、范围、需求和验收标准。',
  'triage': '用于按结构化流程分诊问题、需求或缺陷，明确状态和下一步。',
  'write-a-skill': '用于创建新的 agent skill，包含结构、触发条件和使用说明。',
  'zoom-out': '用于拉高视角，总结更大的背景、方向和取舍。',
  'diagram-design': '用于制作架构图、流程图、时序图、数据流、ER 图、甘特图等高质量图表，可输出 HTML、SVG 或 PNG。',
  'ab-test-analysis': '用于分析 A/B 测试结果，判断显著性、样本量、置信区间和是否上线。',
  'ansoff-matrix': '用于用安索夫矩阵分析增长路径，比较市场渗透、市场开发、产品开发和多元化。',
  'analyze-feature-requests': '用于整理和归类功能请求，提炼主题并给出优先级建议。',
  'beachhead-segment': '用于选择产品首次切入的目标市场，比较不同细分人群的机会和风险。',
  'brainstorm-experiments-existing': '用于为现有产品设计实验，验证功能、转化或留存相关假设。',
  'brainstorm-experiments-new': '用于为新产品想法设计轻量实验，先验证需求和市场风险。',
  'brainstorm-ideas-existing': '用于围绕现有产品生成改进机会和新功能方向。',
  'brainstorm-ideas-new': '用于为新产品生成早期功能想法和产品方向。',
  'brainstorm-okrs': '用于制定团队 OKR，把公司目标拆成清晰目标和可衡量的关键结果。',
  'business-model': '用于生成商业模式画布，梳理客户、价值主张、渠道、收入和成本结构。',
  'cohort-analysis': '用于做用户 cohort 分析，查看留存、活跃、转化和分组趋势。',
  'competitive-battlecard': '用于制作竞品 battlecard，整理定位、优势、弱点和销售应对话术。',
  'competitor-analysis': '用于分析竞争对手，比较能力、定位、差异化和机会。',
  'create-prd': '用于创建 PRD，沉淀背景、目标、范围、需求、指标和验收标准。',
  'customer-journey-map': '用于绘制客户旅程，梳理阶段、触点、痛点、情绪和机会。',
  'draft-nda': '用于起草保密协议草案，覆盖双方、保密范围、义务和期限。',
  'dummy-dataset': '用于生成测试用假数据，支持 CSV、JSON、SQL 等格式。',
  'grammar-check': '用于检查文本语法、逻辑和表达流畅度，并给出修改建议。',
  'growth-loops': '用于设计增长飞轮，分析用户行为如何带来可持续新增和复用。',
  'gtm-motions': '用于选择 Go-To-Market 动作，比较销售、渠道、PLG、内容等路径。',
  'gtm-strategy': '用于制定 Go-To-Market 策略，梳理目标客户、定位、渠道和启动计划。',
  'identify-assumptions-existing': '用于识别现有产品功能里的关键风险假设。',
  'identify-assumptions-new': '用于识别新产品想法里的市场、用户、商业和执行假设。',
  'ideal-customer-profile': '用于定义理想客户画像，明确目标客户特征、需求、预算和购买触发点。',
  'intended-vs-implemented': '用于比较系统原本应该实现什么和实际实现了什么，找出偏差。',
  'interview-script': '用于生成客户访谈脚本，围绕 JTBD、痛点、行为和决策过程提问。',
  'job-stories': '用于把需求写成 Job Story，表达用户在具体情境下想完成的任务。',
  'lean-canvas': '用于生成 Lean Canvas，梳理问题、解决方案、用户群、渠道、成本和指标。',
  'market-segments': '用于拆分市场细分，比较不同客户群的需求、规模和进入难度。',
  'market-sizing': '用于估算 TAM、SAM、SOM，形成市场规模判断。',
  'marketing-ideas': '用于生成营销创意，覆盖渠道、信息、活动形式和执行成本。',
  'metrics-dashboard': '用于设计产品指标看板，明确核心指标、输入指标和数据口径。',
  'monetization-strategy': '用于设计变现策略，比较订阅、使用量、服务、广告等模式。',
  'north-star-metric': '用于定义北极星指标，并拆解支持它的输入指标。',
  'opportunity-solution-tree': '用于构建机会解决方案树，把目标、机会、方案和实验连接起来。',
  'outcome-roadmap': '用于把功能路线图改成结果导向路线图，围绕目标和指标组织计划。',
  'pestle-analysis': '用于做 PESTLE 分析，梳理政治、经济、社会、技术、法律和环境因素。',
  'porters-five-forces': '用于用波特五力分析行业竞争格局和结构性压力。',
  'pre-mortem': '用于做预演式风险分析，提前识别计划失败的可能原因。',
  'pricing-strategy': '用于设计定价策略，比较价格模型、包装、价值度量和风险。',
  'prioritization-frameworks': '用于选择和应用优先级框架，例如 RICE、ICE、MoSCoW 等。',
  'prioritize-assumptions': '用于按影响和风险排序产品假设，并建议验证实验。',
  'prioritize-features': '用于给功能列表排序，综合影响、成本、风险和战略匹配度。',
  'privacy-policy': '用于起草隐私政策草案，覆盖数据收集、使用、存储、共享和用户权利。',
  'product-name': '用于为产品生成命名方案，并说明记忆点、定位和风险。',
  'product-strategy': '用于制定产品战略，覆盖目标客户、价值主张、差异化、路线图和指标。',
  'product-vision': '用于生成产品愿景，表达产品长期方向和希望创造的变化。',
  'positioning-ideas': '用于生成产品定位方向，比较目标客户、差异点和关键信息。',
  'release-notes': '用于根据变更、PRD 或工单生成面向用户的发布说明。',
  'retro': '用于组织复盘，整理做得好的地方、问题、原因和后续行动。',
  'review-resume': '用于审查简历，关注结构、影响表达、关键词和岗位匹配度。',
  'sentiment-analysis': '用于分析用户反馈情绪，提取主题、正负面倾向和改进方向。',
  'shipping-artifacts': '用于整理 AI 构建应用的交付文档，帮助项目更容易维护和移交。',
  'source-command-analyze-cohorts': '用于根据用户数据做 cohort 分析，输出留存和行为分组结果。',
  'source-command-analyze-feedback': '用于批量分析用户反馈，提取主题、情绪和需求信号。',
  'source-command-battlecard': '用于生成销售用竞品 battlecard，帮助团队应对竞品比较。',
  'source-command-competitive-analysis': '用于分析竞争格局，整理竞品能力、定位和差异化机会。',
  'source-command-draft-nda': '用于快速起草 NDA 草案，适合商务合作前的保密协议准备。',
  'source-command-generate-data': '用于生成测试数据，适合原型、测试和演示场景。',
  'source-command-market-product': '用于围绕产品生成营销创意、定位、价值主张和命名。',
  'source-command-meeting-notes': '用于把会议记录整理成纪要、决策和行动项。',
  'source-command-plan-okrs': '用于规划团队 OKR，把目标和关键结果组织成可执行版本。',
  'source-command-pre-mortem': '用于对 PRD、计划或功能做上线前风险预演。',
  'source-command-proofread': '用于校对文本，修正语法、逻辑和表达问题。',
  'source-command-red-team-prd': '用于红队审查 PRD 或策略，挑战关键假设和薄弱点。',
  'source-command-review-resume': '用于系统审查 PM 简历，指出结构、表达和匹配问题。',
  'source-command-stakeholder-map': '用于绘制利益相关者地图，明确沟通对象、影响力和关注点。',
  'source-command-tailor-resume': '用于根据岗位描述定制简历，提高关键词和经历匹配度。',
  'source-command-test-scenarios': '用于从用户故事或需求生成测试场景。',
  'source-command-transform-roadmap': '用于把功能清单式路线图转成结果导向路线图。',
  'source-command-value-proposition': '用于用 JTBD 结构设计价值主张，明确用户、场景和收益。',
  'sprint-plan': '用于规划 sprint，结合容量、优先级、依赖和验收目标安排工作。',
  'stakeholder-map': '用于制作利益相关者地图，按权力和兴趣安排沟通策略。',
  'startup-canvas': '用于生成 Startup Canvas，整合产品战略、用户、商业模式和启动计划。',
  'strategy-red-team': '用于红队审查战略、路线图或 PRD，找出高风险假设。',
  'summarize-interview': '用于总结客户访谈，提炼需求、痛点、行为和机会。',
  'summarize-meeting': '用于把会议内容整理成结构化纪要、决策和后续事项。',
  'swot-analysis': '用于做 SWOT 分析，整理优势、劣势、机会和威胁。',
  'test-scenarios': '用于根据需求或用户故事生成系统测试场景。',
  'user-personas': '用于创建用户画像，概括目标用户、动机、痛点和使用场景。',
  'user-segmentation': '用于根据反馈或行为把用户分群，明确不同群体的需求。',
  'user-stories': '用于写用户故事，包含角色、目标、价值和验收标准。',
  'value-prop-statements': '用于生成价值主张文案，适合营销、销售和 onboarding 场景。',
  'value-proposition': '用于设计完整价值主张，说明用户、任务、痛点、收益和差异化。',
  'wwas': '用于把需求写成 Why-What-Acceptance 格式的产品 backlog 项。',
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]))
}

function sourceLabel(skill) {
  const parts = [skill.source.label]
  if (skill.source.version) parts.push(skill.source.version)
  return parts.join(' · ')
}

const GROUP_LABELS = {
  'diagram-design': '图表设计',
  'pm-ai-shipping': 'AI 交付',
  'pm-data-analytics': '数据分析',
  'pm-execution': '产品执行',
  'pm-go-to-market': '市场进入',
  'pm-market-research': '市场研究',
  'pm-marketing-growth': '营销增长',
  'pm-product-discovery': '产品发现',
  'pm-product-strategy': '产品战略',
  'pm-toolkit': 'PM 工具箱',
}

const GROUP_SUMMARIES = {
  'diagram-design': '用于集中制作高质量图表，包括架构图、流程图、时序图、数据流、ER 图、甘特图、桑基图、UML 和数据库 schema 等。',
  'pm-ai-shipping': '用于 AI 应用交付检查，覆盖实现偏差分析、交付文档和后续维护材料。',
  'pm-data-analytics': '用于产品数据分析，覆盖 A/B 测试、cohort 分析和 SQL 查询。',
  'pm-execution': '用于产品执行工作，覆盖 PRD、OKR、sprint 计划、用户故事、测试场景、复盘、预演风险和发布说明。',
  'pm-go-to-market': '用于市场进入策略，覆盖 ICP、首个目标市场、GTM 策略、增长飞轮和竞品 battlecard。',
  'pm-market-research': '用于市场研究，覆盖竞品分析、市场规模、用户画像、用户分群、情绪分析和客户旅程。',
  'pm-marketing-growth': '用于营销增长，覆盖营销创意、产品命名、定位、价值主张和北极星指标。',
  'pm-product-discovery': '用于产品发现，覆盖功能请求分析、假设识别、实验设计、访谈脚本、机会树和优先级排序。',
  'pm-product-strategy': '用于产品战略，覆盖商业模式、Lean Canvas、定价、变现、SWOT、PESTLE、五力分析和产品愿景。',
  'pm-toolkit': '用于常见 PM 文档和文本处理，覆盖 NDA、隐私政策、简历审查和语法校对。',
  'source-command': '用于把常见 PM 工作快速变成命令式入口，覆盖反馈分析、会议纪要、OKR、风险预演、测试场景、路线图转换、简历处理和价值主张。',
  'codex-user': '用于你直接放在 Codex 用户 skills 目录里的本地能力。',
  'project': '用于当前项目单独配置的 skills。',
}

function chineseUsageSummary(skill) {
  const name = skill.name || '这个 skill'
  if (PERSONAL_SUMMARIES[name]) return PERSONAL_SUMMARIES[name]
  return `用于处理 ${name} 相关任务，具体触发方式和能力说明保存在该 skill 的本地说明文件中。`
}

function timestamp(skill) {
  const value = skill.updatedAt ?? skill.updated_at ?? ''
  const parsed = Number(value)
  if (Number.isFinite(parsed) && parsed > 0) return parsed * 1000
  const date = Date.parse(value)
  return Number.isFinite(date) ? date : 0
}

function filtered() {
  if (!state.data) return []
  const q = state.query.trim().toLowerCase()
  return state.data.skills
    .filter((skill) => skill.source.personal)
    .filter((skill) => {
      const haystack = `${skill.name} ${chineseUsageSummary(skill)} ${skill.source.plugin || ''}`.toLowerCase()
      return !q || haystack.includes(q)
    })
    .sort((a, b) => timestamp(b) - timestamp(a) || a.name.localeCompare(b.name))
}

function groupFor(skill) {
  if (skill.name.startsWith('source-command-')) return { key: 'source-command', label: '快捷命令类 skills' }
  const plugin = skill.source.plugin
  if (plugin) return { key: plugin, label: GROUP_LABELS[plugin] || plugin }
  if (skill.source.kind === 'codex-user') return { key: 'codex-user', label: '本地 Codex skills' }
  if (skill.source.kind === 'project') return { key: 'project', label: '当前项目 skills' }
  return { key: skill.source.kind, label: skill.source.label }
}

function groupedSkills(skills) {
  const groups = new Map()
  for (const skill of skills) {
    const group = groupFor(skill)
    if (!groups.has(group.key)) groups.set(group.key, { ...group, skills: [], latest: 0 })
    const item = groups.get(group.key)
    item.skills.push(skill)
    item.latest = Math.max(item.latest, timestamp(skill))
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      skills: group.skills.sort((a, b) => timestamp(b) - timestamp(a) || a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => b.latest - a.latest || a.label.localeCompare(b.label))
}

function groupSummary(group) {
  if (GROUP_SUMMARIES[group.key]) return GROUP_SUMMARIES[group.key]
  if (group.skills.length === 1) return chineseUsageSummary(group.skills[0])
  const examples = group.skills.slice(0, 5).map((skill) => skill.name).join('、')
  return `包含 ${group.skills.length} 个相关 skills，主要包括 ${examples} 等能力。`
}

function skillNamesPreview(group) {
  const names = group.skills.map((skill) => skill.name)
  const shown = names.slice(0, 6).join('、')
  return names.length > 6 ? `${shown} 等 ${names.length} 个` : shown
}

function displayGroups() {
  return groupedSkills(filtered())
}

function renderStats() {
  const personalTotal = state.data?.counts.personalTotal ?? state.data?.counts.personal_total ?? 0
  const chips = [`${personalTotal} 个 skills`, '按更新时间排序']
  stats.innerHTML = chips.map((chip) => `<span class="chip">${escapeHtml(chip)}</span>`).join('')
}

function renderList() {
  if (state.loading && !state.data) {
    list.innerHTML = '<div class="empty-state"><strong>正在读取本机 skills</strong><span>首次扫描可能需要一点时间。</span></div>'
    return
  }
  if (state.error) {
    list.innerHTML = `<div class="error-state"><strong>无法读取 skills</strong><span>${escapeHtml(state.error)}</span><button class="retry" type="button" data-action="retry">重新扫描</button></div>`
    return
  }
  const groups = displayGroups()
  if (!state.selected && groups[0]) state.selected = groups[0].key
  list.innerHTML = groups.map((group) => {
    const expanded = group.key === state.selected
    const skills = group.skills.map((skill) => `
      <li>
        <strong>${escapeHtml(skill.name)}</strong>
        <span>${escapeHtml(chineseUsageSummary(skill))}</span>
      </li>
    `).join('')
    return `
    <section class="module ${expanded ? 'open' : ''}">
      <button class="item ${expanded ? 'active' : ''}" data-id="${escapeHtml(group.key)}" type="button" aria-expanded="${expanded}">
        <strong>${escapeHtml(group.label)} <em>${escapeHtml(skillNamesPreview(group))}</em></strong>
        <p>${escapeHtml(groupSummary(group))}</p>
        <small>${group.skills.length} 个 skills</small>
      </button>
      ${expanded ? `<ul class="inline-skills">${skills}</ul>` : ''}
    </section>
  `
  }).join('') || `<div class="empty-state"><strong>${state.query ? '没有匹配的 skills' : '还没有可显示的 skills'}</strong><span>${state.query ? '尝试换一个关键词。' : '安装或添加 skill 后，点击刷新即可读取。'}</span></div>`
}

function render() {
  renderStats()
  renderList()
  refresh.disabled = state.loading
  refresh.textContent = state.loading ? '扫描中' : '刷新'
  if (state.loading) status.textContent = '正在扫描本机 Codex skills...'
  else if (state.error) status.textContent = '读取失败，可重新扫描。'
  else if (state.lastUpdated) status.textContent = '仅读取本机内容；展开时会自动刷新。'
}

list.addEventListener('click', (event) => {
  if (event.target.closest('[data-action="retry"]')) {
    refreshSkills()
    return
  }
  const button = event.target.closest('button[data-id]')
  if (!button) return
  state.selected = button.dataset.id
  render()
})

search.addEventListener('input', () => {
  state.query = search.value
  state.selected = null
  render()
})

refresh.addEventListener('click', () => {
  refreshSkills()
})

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || document.body.classList.contains('collapsed')) return
  if (document.activeElement === search && search.value) {
    search.value = ''
    state.query = ''
    state.selected = null
    render()
    return
  }
  setPanelMode(true)
})

pet.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return
  pointerState = {
    startX: event.screenX,
    startY: event.screenY,
    lastX: event.screenX,
    lastY: event.screenY,
  }
  didDrag = false
  pet.setPointerCapture(event.pointerId)
})

pet.addEventListener('pointermove', async (event) => {
  if (!pointerState || !tauriInvoke) return
  const totalDx = event.screenX - pointerState.startX
  const totalDy = event.screenY - pointerState.startY
  if (!didDrag && Math.hypot(totalDx, totalDy) < 4) return
  didDrag = true
  const dx = event.screenX - pointerState.lastX
  const dy = event.screenY - pointerState.lastY
  pointerState.lastX = event.screenX
  pointerState.lastY = event.screenY
  if (dx || dy) tauriInvoke('move_window', { dx, dy })
})

pet.addEventListener('pointerup', (event) => {
  try {
    pet.releasePointerCapture(event.pointerId)
  } catch {
    // Pointer capture may already be released by the platform.
  }
  if (!didDrag) togglePanel()
  pointerState = null
})

pet.addEventListener('pointercancel', () => {
  pointerState = null
})

function applyPanelAnchor(anchor) {
  document.body.classList.remove(...PANEL_ANCHORS.map((value) => `anchor-${value}`))
  if (anchor) document.body.classList.add(`anchor-${anchor}`)
}

async function setPanelMode(collapsed) {
  if (!tauriInvoke) {
    document.body.classList.toggle('collapsed', collapsed)
    return
  }
  const mode = await tauriInvoke('set_panel_mode', { collapsed })
  applyPanelAnchor(mode.anchor)
  document.body.classList.toggle('collapsed', collapsed)
}

async function loadSkills() {
  if (window.__TAURI_INTERNALS__) {
    tauriInvoke = window.__TAURI__.core.invoke
    state.data = await tauriInvoke('discover_skills')
  } else {
    const response = await fetch('/api/skills')
    state.data = await response.json()
  }
  if (state.data.error) throw new Error(state.data.error)
}

async function refreshSkills() {
  if (state.loading) return
  state.loading = true
  state.error = null
  render()
  try {
    await loadSkills()
    state.lastUpdated = Date.now()
  } catch (error) {
    state.error = error instanceof Error ? error.message : '发生未知错误。'
  } finally {
    state.loading = false
    render()
  }
}

async function togglePanel() {
  const willCollapse = !document.body.classList.contains('collapsed')
  if (!willCollapse) {
    await refreshSkills()
  }
  await setPanelMode(willCollapse)
}

async function main() {
  await refreshSkills()
  if (tauriInvoke) await setPanelMode(true)
  else {
    applyPanelAnchor('bottom-right')
    await setPanelMode(false)
  }
}

main()
