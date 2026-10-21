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
  "aspnet-core": "Build, review, and refactor ASP.NET Core applications, including APIs, authentication, middleware, and architecture.",
  "awesome-design-md": "Use design references for brand, product interface, and visual direction.",
  "cloudflare-deploy": "Deploy applications to Cloudflare Workers or Pages and check configuration and releases.",
  "jupyter-notebook": "Create and edit Jupyter notebooks for analysis, experiments, and executable documentation.",
  "karpathy-guidelines": "Apply careful engineering judgment to reduce common AI-assisted coding mistakes.",
  "playwright": "Automate browser testing, screenshots, and end-to-end interface checks.",
  "ppt-master": "Create presentation decks with SVG slides and PPTX export.",
  "vercel-deploy": "Build and deploy applications or websites to Vercel.",
  "caveman": "Communicate in a highly compressed style with fewer words and tokens.",
  "diagnose": "Investigate complex bugs, regressions, and performance problems systematically.",
  "find-skills": "Discover and recommend agent skills for a task.",
  "grill-me": "Challenge a plan through focused questions about assumptions, risks, and gaps.",
  "grill-with-docs": "Test a plan against existing documentation and real project context.",
  "handoff": "Turn a conversation into a handoff document for another agent or later task.",
  "impeccable": "Design, review, and refine product experiences and visual interfaces.",
  "improve-codebase-architecture": "Find codebase architecture improvements that strengthen boundaries and maintainability.",
  "prototype": "Build a lightweight prototype to test a product, interaction, or technical approach.",
  "setup-matt-pocock-skills": "Set up agent skill guidance and related documentation in a project.",
  "tdd": "Work through the test-driven development cycle: test, implement, and refactor.",
  "to-issues": "Break a plan or specification into independently actionable issues.",
  "to-prd": "Turn a discussion into a product requirements document.",
  "triage": "Classify issues and requests, assign status, and identify next steps.",
  "write-a-skill": "Create an agent skill with clear structure, triggers, and instructions.",
  "zoom-out": "Summarize broader context, direction, and tradeoffs.",
  "diagram-design": "Create architecture, flow, sequence, data, ER, Gantt, and other diagrams.",
  "ab-test-analysis": "Analyze A/B test results, sample size, confidence, and launch decisions.",
  "ansoff-matrix": "Compare growth paths with an Ansoff matrix.",
  "analyze-feature-requests": "Group feature requests by theme and suggest priorities.",
  "beachhead-segment": "Compare segments and select an initial target market.",
  "brainstorm-experiments-existing": "Design experiments for an existing product to test feature or retention assumptions.",
  "brainstorm-experiments-new": "Design lean experiments to test demand and market risk for a new idea.",
  "brainstorm-ideas-existing": "Generate improvement opportunities and features for an existing product.",
  "brainstorm-ideas-new": "Generate early feature ideas and directions for a new product.",
  "brainstorm-okrs": "Translate company goals into team objectives and measurable key results.",
  "business-model": "Map customers, value, channels, revenue, and costs in a business model canvas.",
  "cohort-analysis": "Analyze user retention, activity, conversion, and cohort trends.",
  "competitive-battlecard": "Prepare a sales battlecard with positioning, strengths, weaknesses, and responses.",
  "competitor-analysis": "Compare competitors, positioning, differentiation, and opportunities.",
  "create-prd": "Draft a PRD with context, goals, scope, requirements, metrics, and acceptance criteria.",
  "customer-journey-map": "Map customer stages, touchpoints, pain points, emotions, and opportunities.",
  "draft-nda": "Draft a nondisclosure agreement covering parties, scope, duties, and duration.",
  "dummy-dataset": "Generate realistic test data in CSV, JSON, or SQL formats.",
  "grammar-check": "Review text for grammar, logic, flow, and clear expression.",
  "growth-loops": "Design growth loops connecting user behavior to sustainable acquisition and reuse.",
  "gtm-motions": "Compare sales, channel, product-led, and content-led go-to-market approaches.",
  "gtm-strategy": "Plan target customers, positioning, channels, and launch actions.",
  "identify-assumptions-existing": "Identify critical risk assumptions in an existing product feature.",
  "identify-assumptions-new": "Identify market, user, business, and execution assumptions for a new idea.",
  "ideal-customer-profile": "Define the traits, needs, budgets, and buying triggers of ideal customers.",
  "intended-vs-implemented": "Compare intended system behavior with its actual implementation.",
  "interview-script": "Prepare customer interview questions about jobs, pain points, behavior, and decisions.",
  "job-stories": "Express user needs as job stories grounded in specific situations.",
  "lean-canvas": "Map problems, solutions, segments, channels, costs, and metrics.",
  "market-segments": "Compare customer segments by need, size, and ease of entry.",
  "market-sizing": "Estimate total, serviceable, and obtainable markets.",
  "marketing-ideas": "Generate marketing ideas with channels, messages, formats, and costs.",
  "metrics-dashboard": "Define core and input metrics and design a product dashboard.",
  "monetization-strategy": "Compare subscriptions, usage pricing, services, advertising, and other revenue models.",
  "north-star-metric": "Define a north star metric and the input metrics that support it.",
  "opportunity-solution-tree": "Connect outcomes, opportunities, solutions, and experiments.",
  "outcome-roadmap": "Reframe a feature roadmap around outcomes and measurable goals.",
  "pestle-analysis": "Analyze political, economic, social, technological, legal, and environmental factors.",
  "porters-five-forces": "Assess industry competition and structural pressure with Porter's Five Forces.",
  "pre-mortem": "Identify likely reasons a plan could fail before launch.",
  "pricing-strategy": "Compare pricing models, packaging, value measures, and risks.",
  "prioritization-frameworks": "Choose and apply RICE, ICE, MoSCoW, or other prioritization frameworks.",
  "prioritize-assumptions": "Rank assumptions by impact and risk and suggest validation experiments.",
  "prioritize-features": "Rank features by impact, effort, risk, and strategy fit.",
  "privacy-policy": "Draft a privacy policy covering collection, use, storage, sharing, and user rights.",
  "product-name": "Generate product name options with positioning and naming risks.",
  "product-strategy": "Define customers, value, differentiation, roadmap, and metrics.",
  "product-vision": "Write a product vision describing long-term direction and intended change.",
  "positioning-ideas": "Explore positioning options by customer, differentiation, and message.",
  "release-notes": "Turn changes, requirements, or tickets into user-facing release notes.",
  "retro": "Facilitate a retrospective with successes, issues, causes, and actions.",
  "review-resume": "Review a resume for structure, impact, keywords, and role fit.",
  "sentiment-analysis": "Analyze feedback sentiment, themes, and improvement opportunities.",
  "shipping-artifacts": "Prepare documentation that makes an AI-built application easier to ship and maintain.",
  "source-command-analyze-cohorts": "Analyze user data for retention and behavioral cohorts.",
  "source-command-analyze-feedback": "Summarize feedback themes, sentiment, and demand signals.",
  "source-command-battlecard": "Create a sales battlecard for competitor comparisons.",
  "source-command-competitive-analysis": "Compare competitors, positioning, and differentiation.",
  "source-command-draft-nda": "Prepare an NDA draft for a potential business partnership.",
  "source-command-generate-data": "Generate sample data for prototypes, tests, and demos.",
  "source-command-market-product": "Generate marketing ideas, positioning, value propositions, and names.",
  "source-command-meeting-notes": "Turn meeting transcripts into decisions and action items.",
  "source-command-plan-okrs": "Plan team objectives and measurable key results.",
  "source-command-pre-mortem": "Run a pre-launch risk review of a plan, PRD, or feature.",
  "source-command-proofread": "Proofread text for grammar, logic, and clarity.",
  "source-command-red-team-prd": "Challenge critical assumptions in a PRD or strategy.",
  "source-command-review-resume": "Review a product manager resume for clarity and fit.",
  "source-command-stakeholder-map": "Map stakeholder influence and communication needs.",
  "source-command-tailor-resume": "Tailor a resume to a job description.",
  "source-command-test-scenarios": "Generate test scenarios from requirements or user stories.",
  "source-command-transform-roadmap": "Turn a feature list into an outcome-focused roadmap.",
  "source-command-value-proposition": "Structure a value proposition around a user's job, context, and benefit.",
  "sprint-plan": "Plan a sprint around capacity, priorities, dependencies, and acceptance goals.",
  "stakeholder-map": "Map stakeholders by influence and interest to plan communication.",
  "startup-canvas": "Combine product strategy, customers, business model, and launch plans.",
  "strategy-red-team": "Stress-test a strategy, roadmap, or PRD for risky assumptions.",
  "summarize-interview": "Summarize customer interview needs, pain points, behavior, and opportunities.",
  "summarize-meeting": "Turn a meeting into structured notes, decisions, and next steps.",
  "swot-analysis": "Analyze strengths, weaknesses, opportunities, and threats.",
  "test-scenarios": "Generate systematic test scenarios from requirements or user stories.",
  "user-personas": "Describe target users, motivations, pain points, and usage contexts.",
  "user-segmentation": "Segment users by feedback or behavior to clarify their needs.",
  "user-stories": "Write user stories with roles, goals, value, and acceptance criteria.",
  "value-prop-statements": "Write value proposition copy for marketing, sales, and onboarding.",
  "value-proposition": "Define user jobs, pain points, gains, and differentiation.",
  "wwas": "Write backlog items in Why-What-Acceptance format.",
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
  "diagram-design": "Diagram Design",
  "pm-ai-shipping": "AI Shipping",
  "pm-data-analytics": "Data Analytics",
  "pm-execution": "Product Execution",
  "pm-go-to-market": "Go to Market",
  "pm-market-research": "Market Research",
  "pm-marketing-growth": "Marketing and Growth",
  "pm-product-discovery": "Product Discovery",
  "pm-product-strategy": "Product Strategy",
  "pm-toolkit": "PM Toolkit",
}

const GROUP_SUMMARIES = {
  "diagram-design": "Create architecture, flow, sequence, data, ER, Gantt, Sankey, UML, and database diagrams.",
  "pm-ai-shipping": "Review AI application delivery, implementation gaps, shipping documentation, and maintenance handoffs.",
  "pm-data-analytics": "Analyze product data with A/B tests, cohort analysis, and SQL queries.",
  "pm-execution": "Plan and document product delivery with PRDs, OKRs, sprints, user stories, tests, retrospectives, and release notes.",
  "pm-go-to-market": "Plan target customers, a beachhead segment, GTM strategy, growth loops, and competitive sales guidance.",
  "pm-market-research": "Research competitors, market size, personas, segments, sentiment, and customer journeys.",
  "pm-marketing-growth": "Generate marketing ideas, product names, positioning, value propositions, and north star metrics.",
  "pm-product-discovery": "Analyze requests, test assumptions, plan experiments, run interviews, and prioritize opportunities.",
  "pm-product-strategy": "Explore business models, pricing, monetization, SWOT, PESTLE, industry forces, and product vision.",
  "pm-toolkit": "Create common PM documents and improve writing, including NDAs, privacy policies, resumes, and proofreading.",
  "source-command": "Use quick commands for feedback analysis, meeting notes, OKRs, risk reviews, test scenarios, roadmaps, resumes, and value propositions.",
  "codex-user": "Skills you added directly to your Codex user skills directory.",
  "project": "Skills configured specifically for the current project.",
}

function englishUsageSummary(skill) {
  const name = skill.name || 'this skill'
  if (PERSONAL_SUMMARIES[name]) return PERSONAL_SUMMARIES[name]
  return `Use ${name} for its documented tasks; see its local skill file for triggers and capabilities.`
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
      const haystack = `${skill.name} ${englishUsageSummary(skill)} ${skill.source.plugin || ''}`.toLowerCase()
      return !q || haystack.includes(q)
    })
    .sort((a, b) => timestamp(b) - timestamp(a) || a.name.localeCompare(b.name))
}

function groupFor(skill) {
  if (skill.name.startsWith('source-command-')) return { key: 'source-command', label: 'Quick Command Skills' }
  const plugin = skill.source.plugin
  if (plugin) return { key: plugin, label: GROUP_LABELS[plugin] || plugin }
  if (skill.source.kind === 'codex-user') return { key: 'codex-user', label: 'Local Codex Skills' }
  if (skill.source.kind === 'project') return { key: 'project', label: 'Project Skills' }
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
  if (group.skills.length === 1) return englishUsageSummary(group.skills[0])
  const examples = group.skills.slice(0, 5).map((skill) => skill.name).join(', ')
  return `Contains ${group.skills.length} related skills, including ${examples}.`
}

function skillNamesPreview(group) {
  const names = group.skills.map((skill) => skill.name)
  const shown = names.slice(0, 6).join(', ')
  return names.length > 6 ? `${shown}, and ${names.length - 6} more` : shown
}

function displayGroups() {
  return groupedSkills(filtered())
}

function renderStats() {
  const personalTotal = state.data?.counts.personalTotal ?? state.data?.counts.personal_total ?? 0
  const chips = [`${personalTotal} skills`]
  stats.innerHTML = chips.map((chip) => `<span class="chip">${escapeHtml(chip)}</span>`).join('')
}

function renderList() {
  if (state.loading && !state.data) {
    list.innerHTML = '<div class="empty-state"><strong>Reading local skills</strong><span>The first scan may take a moment.</span></div>'
    return
  }
  if (state.error) {
    list.innerHTML = `<div class="error-state"><strong>Unable to read skills</strong><span>${escapeHtml(state.error)}</span><button class="retry" type="button" data-action="retry">Scan again</button></div>`
    return
  }
  const groups = displayGroups()
  if (!state.selected && groups[0]) state.selected = groups[0].key
  list.innerHTML = groups.map((group) => {
    const expanded = group.key === state.selected
    const skills = group.skills.map((skill) => `
      <li>
        <strong>${escapeHtml(skill.name)}</strong>
        <span>${escapeHtml(englishUsageSummary(skill))}</span>
      </li>
    `).join('')
    return `
    <section class="module ${expanded ? 'open' : ''}">
      <button class="item ${expanded ? 'active' : ''}" data-id="${escapeHtml(group.key)}" type="button" aria-expanded="${expanded}">
        <strong>${escapeHtml(group.label)} <em>${escapeHtml(skillNamesPreview(group))}</em></strong>
        <p>${escapeHtml(groupSummary(group))}</p>
        <small>${group.skills.length} skills</small>
      </button>
      ${expanded ? `<ul class="inline-skills">${skills}</ul>` : ''}
    </section>
  `
  }).join('') || `<div class="empty-state"><strong>${state.query ? 'No matching skills' : 'No skills to display yet'}</strong><span>${state.query ? 'Try another search term.' : 'Add a skill, then choose Refresh to scan again.'}</span></div>`
}

function render() {
  renderStats()
  renderList()
  refresh.disabled = state.loading
  refresh.textContent = state.loading ? 'Scanning' : 'Refresh'
  if (state.loading) status.textContent = 'Scanning local Codex skills...'
  else if (state.error) status.textContent = 'Scan failed. You can try again.'
  else if (state.lastUpdated) status.textContent = 'Local read-only inventory, sorted by update time. Refreshes when expanded.'
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
    state.error = error instanceof Error ? error.message : 'An unknown error occurred.'
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
    const previewAnchor = new URLSearchParams(window.location.search).get('anchor')
    applyPanelAnchor(PANEL_ANCHORS.includes(previewAnchor) ? previewAnchor : 'bottom-right')
    await setPanelMode(false)
  }
}

main()
