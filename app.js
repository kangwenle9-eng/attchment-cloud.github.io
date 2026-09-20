const main = document.querySelector('#main');
const sidebar = document.querySelector('#sidebar');
const scrim = document.querySelector('#scrim');
const menuButton = document.querySelector('#menu-button');
const searchInput = document.querySelector('#search');
const toast = document.querySelector('#toast');

const state = { course: '', days: [], docs: new Map(), currentRoute: 'home' };

const resourceGroups = [
  {
    title: '学习与记录',
    items: [
      ['学习入口', 'README.md'],
      ['学习进度', 'progress.md'],
      ['每日记录模板', 'templates/daily-record.md'],
      ['任务书模板', 'templates/task-brief.md'],
      ['评分表', 'templates/evaluation-rubric.md'],
      ['证据台账', 'templates/evidence-log.md'],
      ['错误日志', 'templates/error-log.md']
    ]
  },
  {
    title: '参考与实践',
    items: [
      ['Codex / Agent 能力地图', 'reference/codex-agent-map.md'],
      ['8 份 PDF 内容地图', 'reference/pdf-content-map.md'],
      ['综合项目说明', 'capstone/README.md'],
      ['故障演练', 'capstone/failure-drills.md'],
      ['结业考核', 'capstone/final-assessment.md'],
      ['Skill 说明', 'skill.md'],
      ['自动化提示词示例', 'examples/automation-prompts.md'],
      ['子智能体提示词示例', 'examples/subagent-prompts.md'],
      ['Worktree 实验', 'examples/worktree-lab.md']
    ]
  }
];

function escapeHtml(value = '') {
  return value.replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[char]);
}

function docHash(path) {
  return `#doc/${encodeURIComponent(path)}`;
}

function resolveDocPath(href, basePath) {
  const cleanHref = href.replace(/&amp;/g, '&');
  if (/^https?:\/\//i.test(cleanHref)) return { href: cleanHref, external: true };
  if (cleanHref.startsWith('#')) return { href: cleanHref, external: false };
  if (cleanHref.toLowerCase().endsWith('.pdf')) return { href: '#resources', external: false };
  if (cleanHref.includes('.md')) {
    const resolved = new URL(cleanHref, `https://local/${basePath}`).pathname.replace(/^\//, '');
    return { href: docHash(decodeURIComponent(resolved)), external: false };
  }
  return { href: cleanHref, external: false };
}

function inline(text, basePath = 'README.md') {
  let html = escapeHtml(text);
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    const link = resolveDocPath(href, basePath);
    return `<a href="${escapeHtml(link.href)}"${link.external ? ' target="_blank" rel="noopener noreferrer"' : ''}>${label}</a>`;
  });
  return html;
}

function slugify(value) {
  return value.trim().toLowerCase().replace(/[^\w\u4e00-\u9fff]+/g, '-').replace(/^-|-$/g, '');
}

function renderMarkdown(markdown, basePath = 'README.md') {
  const lines = markdown.replace(/\r/g, '').split('\n');
  let html = '';
  let paragraph = [];
  let listType = '';
  let inCode = false;
  let codeLines = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    html += `<p>${inline(paragraph.join(' '), basePath)}</p>`;
    paragraph = [];
  };
  const closeList = () => {
    if (!listType) return;
    html += `</${listType}>`;
    listType = '';
  };

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      flushParagraph();
      closeList();
      if (!inCode) {
        inCode = true;
        codeLines = [];
      } else {
        html += `<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`;
        inCode = false;
      }
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      continue;
    }

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    const unordered = line.match(/^\s*[-*]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);

    if (heading) {
      flushParagraph();
      closeList();
      const level = Math.min(heading[1].length + 1, 4);
      html += `<h${level} id="${slugify(heading[2])}">${inline(heading[2], basePath)}</h${level}>`;
    } else if (/^\s*---+\s*$/.test(line)) {
      flushParagraph();
      closeList();
      html += '<hr>';
    } else if (line.startsWith('> ')) {
      flushParagraph();
      closeList();
      html += `<blockquote>${inline(line.slice(2), basePath)}</blockquote>`;
    } else if (unordered || ordered) {
      flushParagraph();
      const wanted = unordered ? 'ul' : 'ol';
      if (listType !== wanted) {
        closeList();
        listType = wanted;
        html += `<${listType}>`;
      }
      const item = (unordered || ordered)[1].replace(/^\[[ xX]\]\s*/, '');
      html += `<li>${inline(item, basePath)}</li>`;
    } else if (!line.trim()) {
      flushParagraph();
      closeList();
    } else {
      closeList();
      paragraph.push(line.trim());
    }
  }
  flushParagraph();
  closeList();
  if (inCode) html += `<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`;
  return html;
}

async function fetchDoc(path) {
  if (state.docs.has(path)) return state.docs.get(path);
  if (path.includes('..') || path.startsWith('/')) throw new Error('无效资料路径');
  const response = await fetch(`content/${path}`);
  if (!response.ok) throw new Error(`未能载入 ${path}`);
  const text = await response.text();
  state.docs.set(path, text);
  return text;
}

function parseCourse(markdown) {
  const lines = markdown.replace(/\r/g, '').split('\n');
  const days = [];
  let week = 1;
  let weekTitle = '';
  let current = null;

  const flush = () => {
    if (!current) return;
    current.body = current.lines.join('\n').trim();
    delete current.lines;
    days.push(current);
    current = null;
  };

  for (const line of lines) {
    const weekMatch = line.match(/^## 第\s*(\d+)\s*周[：:]\s*(.+)$/);
    const dayMatch = line.match(/^### 第\s*(\d+)\s*天[：:]\s*(.+)$/);
    const boundary = /^### 第\s*\d+\s*周周测/.test(line) || /^## 结业/.test(line);
    if (weekMatch) {
      flush();
      week = Number(weekMatch[1]);
      weekTitle = weekMatch[2].trim();
      continue;
    }
    if (dayMatch) {
      flush();
      current = {
        number: Number(dayMatch[1]),
        title: dayMatch[2].trim(),
        week,
        weekTitle,
        lines: []
      };
      continue;
    }
    if (boundary) {
      flush();
      continue;
    }
    if (current) current.lines.push(line);
  }
  flush();
  return days;
}

function dayId(number) {
  return `day-${String(number).padStart(2, '0')}`;
}

function renderCourseNav() {
  const host = document.querySelector('#course-nav');
  const weeks = [...new Set(state.days.map(day => day.week))];
  host.innerHTML = weeks.map(week => {
    const days = state.days.filter(day => day.week === week);
    return `<div class="week-block">
      <div class="week-label">第 ${week} 周</div>
      ${days.map(day => `<a class="day-link" data-day="${dayId(day.number)}" href="#course/${dayId(day.number)}"><span class="day-number">${String(day.number).padStart(2, '0')}</span>${escapeHtml(day.title)}</a>`).join('')}
    </div>`;
  }).join('');
}

function setActive(route) {
  document.querySelectorAll('[data-route]').forEach(link => {
    const key = route.startsWith('course/') ? 'course' : route.split('/')[0];
    link.classList.toggle('active', link.dataset.route === key);
  });
  document.querySelectorAll('[data-day]').forEach(link => {
    link.classList.toggle('active', route.endsWith(link.dataset.day));
  });
}

function closeMenu() {
  sidebar.classList.remove('open');
  scrim.hidden = true;
  menuButton.setAttribute('aria-expanded', 'false');
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  window.setTimeout(() => toast.classList.remove('show'), 1800);
}

function homeView() {
  const weeks = [...new Set(state.days.map(day => day.week))];
  return `<section class="hero">
    <div class="eyebrow">30 天学习路线</div>
    <h1>把 Codex 从聊天工具，练成可靠的工作伙伴。</h1>
    <p>每天用一小时，依次掌握任务描述、证据验证、Skill、Agent、自动化与端到端工作流。先学习，再实践，最后按清晰标准验收。</p>
  </section>

  <section class="summary-strip" aria-label="课程摘要">
    <div class="summary-item"><strong>30 天</strong><span>从基础操作到独立综合项目</span></div>
    <div class="summary-item"><strong>45–60 分钟</strong><span>每天建议学习时长</span></div>
    <div class="summary-item"><strong>70 分</strong><span>每日练习通过线</span></div>
  </section>

  <div class="section-heading"><div><div class="eyebrow">课程地图</div><h2>四周循序进阶</h2></div><p>从第 1 天开始最稳妥</p></div>
  <section class="week-grid">
    ${weeks.map(week => {
      const days = state.days.filter(day => day.week === week);
      return `<article class="week-card">
        <div class="week-index">WEEK ${week}</div>
        <h3>${escapeHtml(days[0]?.weekTitle || `第 ${week} 周`)}</h3>
        <div class="week-days">${days.map(day => `<a href="#course/${dayId(day.number)}">第 ${day.number} 天</a>`).join('')}</div>
      </article>`;
    }).join('')}
  </section>

  <div class="section-heading"><div><div class="eyebrow">辅助入口</div><h2>需要时再打开</h2></div></div>
  <section class="quick-grid">
    <a class="quick-card" href="#videos"><strong>B 站学习导航</strong><span>按课程天数搭配视频，视频不替代练习。</span></a>
    <a class="quick-card" href="#capstone"><strong>第 28–30 天综合项目</strong><span>完成学习资料助理、故障演练与独立考核。</span></a>
    <a class="quick-card" href="#resources"><strong>资料与模板</strong><span>任务书、记录、评分、证据和错误日志。</span></a>
  </section>`;
}

function dayView(day) {
  if (!day) return '<div class="error">没有找到这一天的课程。</div>';
  const promptMatch = day.body.match(/^- \*\*开课提示词\*\*[：:]\s*`([^`]+)`\s*$/m);
  const prompt = promptMatch ? promptMatch[1] : '';
  const body = day.body.replace(/^- \*\*开课提示词\*\*[：:]\s*`([^`]+)`\s*$/m, '');
  const weekDays = state.days.filter(item => item.week === day.week);
  const previous = state.days.find(item => item.number === day.number - 1);
  const next = state.days.find(item => item.number === day.number + 1);
  return `<div class="article-wrap">
    <div>
      <article class="article">
        <header class="article-header">
          <div class="day-kicker"><span>${day.number}</span>第 ${day.week} 周</div>
          <h1>${escapeHtml(day.title)}</h1>
          <p>${escapeHtml(day.weekTitle)}</p>
        </header>
        ${renderMarkdown(body, '30-day-course.md')}
        ${prompt ? `<div class="prompt-card"><strong>开课提示词</strong><p>${escapeHtml(prompt)}</p><button class="copy-button" data-copy="${escapeHtml(prompt)}">复制提示词</button></div>` : ''}
      </article>
      <nav class="pager" aria-label="课程翻页">
        ${previous ? `<a href="#course/${dayId(previous.number)}"><small>上一天</small>第 ${previous.number} 天 · ${escapeHtml(previous.title)}</a>` : '<span></span>'}
        ${next ? `<a href="#course/${dayId(next.number)}"><small>下一天</small>第 ${next.number} 天 · ${escapeHtml(next.title)}</a>` : '<span></span>'}
      </nav>
    </div>
    <aside class="article-aside">
      <p class="aside-title">本周课程</p>
      ${weekDays.map(item => `<a href="#course/${dayId(item.number)}">${item.number}. ${escapeHtml(item.title)}</a>`).join('')}
    </aside>
  </div>`;
}

function searchView(query) {
  const normalized = query.trim().toLowerCase();
  const results = state.days.filter(day => `${day.title}\n${day.body}`.toLowerCase().includes(normalized));
  return `<section class="hero"><div class="eyebrow">课程搜索</div><h1>“${escapeHtml(query)}”</h1><p>在 30 天课程标题与内容中找到 ${results.length} 个结果。</p></section>
    <div class="search-results">${results.length ? results.map(day => {
      const clean = day.body.replace(/[*`#\[\]]/g, '').replace(/\n+/g, ' ');
      return `<a class="result-item" href="#course/${dayId(day.number)}"><strong>第 ${day.number} 天 · ${escapeHtml(day.title)}</strong><span>${escapeHtml(clean.slice(0, 120))}…</span></a>`;
    }).join('') : '<div class="empty-state">没有匹配内容，换一个更短的关键词试试。</div>'}</div>`;
}

async function documentView(path, eyebrow = '学习资料') {
  const markdown = await fetchDoc(path);
  return `<article class="article"><div class="eyebrow">${escapeHtml(eyebrow)}</div>${renderMarkdown(markdown, path)}</article>`;
}

async function capstoneView() {
  const markdown = await fetchDoc('capstone/README.md');
  return `<section class="hero"><div class="eyebrow">第 28–30 天</div><h1>综合项目</h1><p>把课程中的检查、分析、证据和验收方法组合成一次完整交付。</p></section>
    <section class="quick-grid" style="margin-bottom:24px">
      <a class="quick-card" href="${docHash('capstone/README.md')}"><strong>项目说明</strong><span>输入接口、必需交付物与 100 分验收标准。</span></a>
      <a class="quick-card" href="${docHash('capstone/failure-drills.md')}"><strong>故障演练</strong><span>练习识别问题、恢复与记录。</span></a>
      <a class="quick-card" href="${docHash('capstone/final-assessment.md')}"><strong>独立考核</strong><span>验证能否独立完成可靠工作流。</span></a>
    </section>
    <article class="article">${renderMarkdown(markdown, 'capstone/README.md')}</article>`;
}

function resourcesView() {
  return `<section class="hero"><div class="eyebrow">随用随取</div><h1>资料与模板</h1><p>课程引用的记录表、评分标准、参考地图和实践说明都可以直接在浏览器中阅读。</p></section>
    ${resourceGroups.map(group => `<section><div class="section-heading"><h2>${escapeHtml(group.title)}</h2></div><ul class="resource-list">${group.items.map(([label, path]) => `<li><a href="${docHash(path)}"><strong>${escapeHtml(label)}</strong><small>${escapeHtml(path)}</small></a></li>`).join('')}</ul></section>`).join('')}`;
}

async function renderRoute() {
  const route = decodeURIComponent((location.hash || '#home').slice(1));
  state.currentRoute = route;
  setActive(route);
  closeMenu();
  searchInput.value = '';
  main.innerHTML = '<div class="loading">正在载入…</div>';
  try {
    if (route === 'home') {
      main.innerHTML = homeView();
    } else if (route.startsWith('course/')) {
      const number = Number(route.match(/day-(\d+)/)?.[1]);
      main.innerHTML = dayView(state.days.find(day => day.number === number));
    } else if (route === 'videos') {
      main.innerHTML = await documentView('reference/bilibili-learning-guide.md', '视频辅助学习');
    } else if (route === 'capstone') {
      main.innerHTML = await capstoneView();
    } else if (route === 'resources') {
      main.innerHTML = resourcesView();
    } else if (route.startsWith('doc/')) {
      main.innerHTML = await documentView(route.slice(4));
    } else {
      main.innerHTML = homeView();
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    main.focus({ preventScroll: true });
  } catch (error) {
    main.innerHTML = `<div class="error"><h1>资料暂时打不开</h1><p>${escapeHtml(error.message)}</p><p><a href="#home">返回学习总览</a></p></div>`;
  }
}

menuButton.addEventListener('click', () => {
  const open = !sidebar.classList.contains('open');
  sidebar.classList.toggle('open', open);
  scrim.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
});
scrim.addEventListener('click', closeMenu);
window.addEventListener('hashchange', renderRoute);

searchInput.addEventListener('input', event => {
  const query = event.target.value.trim();
  if (!query) {
    renderRoute();
    return;
  }
  setActive('search');
  main.innerHTML = searchView(query);
});

document.addEventListener('click', async event => {
  const button = event.target.closest('[data-copy]');
  if (!button) return;
  try {
    await navigator.clipboard.writeText(button.dataset.copy);
    showToast('提示词已复制');
  } catch {
    showToast('复制失败，请长按文字复制');
  }
});

async function boot() {
  try {
    state.course = await fetchDoc('30-day-course.md');
    state.days = parseCourse(state.course);
    if (state.days.length !== 30) throw new Error(`课程数量异常：读取到 ${state.days.length} 天`);
    renderCourseNav();
    await renderRoute();
  } catch (error) {
    main.innerHTML = `<div class="error"><h1>课程载入失败</h1><p>${escapeHtml(error.message)}</p></div>`;
  }
}

boot();
