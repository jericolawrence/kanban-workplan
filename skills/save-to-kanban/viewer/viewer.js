// Read-only board viewer. kanban.sh rebuilds data.js (window.KANBAN) next to this file after every write.
const LANES = [
  ['backlog', 'Backlog'], ['next', 'Up next'], ['doing', 'Doing'], ['review', 'Review'], ['done', 'Done'],
];
const data = window.KANBAN || { boards: [] };
const $ = (id) => document.getElementById(id);
const els = { board: $('board'), search: $('search'), kind: $('kind'), lanes: $('lanes'), sheet: $('card-sheet') };

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'on') Object.entries(v).forEach(([e, fn]) => node.addEventListener(e, fn));
    else node.setAttribute(k, v);
  }
  for (const c of children.flat(Infinity)) if (c != null && c !== false && c !== '') node.append(c);
  return node;
}

const badge = (text, variant = 'outline', attrs = {}) => el('span', { class: 'badge', 'data-variant': variant, ...attrs }, text);
// Card data is team-edited JSON, so only http(s) and local image paths become links.
const link = (href, text) => (/^https?:\/\//.test(href)
  ? el('a', { href, target: '_blank', rel: 'noopener', class: 'underline' }, text)
  : text);

// Text with [label](url) and bare http(s) links turned into anchors; everything else stays text.
function rich(text) {
  const out = [];
  const re = /\[([^\]]+)\]\((https?:[^)\s]+)\)|(https?:\/\/[^\s)]+)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    out.push(text.slice(last, m.index), link(m[2] || m[3], m[1] || m[3]));
    last = re.lastIndex;
  }
  out.push(text.slice(last));
  return out;
}

const github = (kind, n) => (data.repo ? link(`https://github.com/${data.repo}/${kind}/${n}`, `#${n}`) : `#${n}`);

function prField(pr) {
  if (!pr) return null;
  if (/^https?:/.test(pr)) return link(pr, pr.replace(/^.*\/pull\//, '#'));
  return github('pull', String(pr).replace(/^#/, ''));
}

let shownKey = null;

function currentBoard() {
  return data.boards.find((b) => b.key === els.board.value) || data.boards[0];
}

function matches(card) {
  const q = els.search.value.trim().toLowerCase();
  if (els.kind.value && card.kind !== els.kind.value) return false;
  if (!q) return true;
  return [card.id, card.title, card.detail, card.oldId, card.owner, card.area, card.where, card.branch, card.notesText]
    .some((v) => v && String(v).toLowerCase().includes(q));
}

function tile(card) {
  const urgent = /^P[01]\b/.test(card.priority || '');
  return el('button', { class: 'card tile gap-2 p-3', on: { click: () => openCard(card) } },
    el('span', { class: 'flex items-center gap-2 text-xs muted' }, el('span', { class: 'font-mono' }, card.id),
      card.pr && el('span', {}, `PR ${String(card.pr).replace(/^.*\/pull\//, '').replace(/^#?/, '#')}`)),
    el('span', { class: 'block text-sm font-medium leading-snug' }, card.title || '(untitled)'),
    card.blocker && el('span', { class: 'block text-xs', style: 'color: var(--destructive)' }, `Blocked: ${card.blocker}`),
    el('span', { class: 'flex flex-wrap gap-1' },
      card.priority && badge(card.priority, urgent ? 'default' : 'outline'),
      card.kind && badge(card.kind, 'secondary'),
      card.ui && badge('UI'),
      card.owner && badge(card.owner, 'outline', { class: 'badge owner', title: card.owner })));
}

function render() {
  const board = currentBoard();
  shownKey = board?.key;
  els.lanes.replaceChildren();
  if (!board) {
    els.lanes.append(el('p', { class: 'muted' }, 'No boards yet. The view fills in after the first kanban.sh write.'));
    return;
  }
  const kinds = [...new Set(board.cards.map((c) => c.kind).filter(Boolean))].sort();
  const keep = els.kind.value;
  els.kind.replaceChildren(el('option', { value: '' }, 'All kinds'), ...kinds.map((k) => el('option', { value: k }, k)));
  els.kind.value = kinds.includes(keep) ? keep : '';

  for (const [status, label] of LANES) {
    const cards = board.cards.filter((c) => c.status === status && matches(c))
      .sort((a, b) => (a.order ?? 1e9) - (b.order ?? 1e9) || String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
    const archive = status === 'done' && board.archive
      && el('p', { class: 'text-xs muted' }, 'Older Done cards: ', link(board.archive, 'Notion archive'));
    els.lanes.append(el('section', { class: 'lane flex min-w-64 flex-1 basis-0 flex-col gap-2', 'aria-label': label },
      el('h2', { class: 'flex items-center gap-2 text-sm font-semibold' }, label, badge(String(cards.length), 'secondary')),
      cards.length ? cards.map(tile) : !archive && el('p', { class: 'text-xs muted' }, 'No cards'),
      archive));
  }
}

function field(label, value) {
  if (value == null || value === '' || (Array.isArray(value) && !value.length)) return null;
  return el('div', { class: 'flex gap-3 text-sm' }, el('dt', { class: 'w-24 shrink-0 muted' }, label), el('dd', { class: 'min-w-0 break-words' }, value));
}

const join = (nodes) => nodes.flatMap((n, i) => (i ? [', ', n] : [n]));

function openCard(card) {
  const board = currentBoard();
  history.replaceState(null, '', `#${board.key}/${card.id}`);
  const lane = (LANES.find(([s]) => s === card.status) || [, card.status])[1];
  $('sheet-title').textContent = card.title || card.id;
  $('sheet-description').textContent = [card.id, lane, card.kind, card.area].filter(Boolean).join(' · ');
  const qa = card.qa && [card.qa.rounds != null && `${card.qa.rounds} rounds`, card.qa.last && `last ${card.qa.last}`, card.qa.note]
    .filter(Boolean).join(', ');
  $('sheet-body').replaceChildren(el('div', { class: 'contents' },
    card.detail && el('p', { class: 'text-sm leading-relaxed break-words' }, rich(card.detail)),
    el('dl', { class: 'flex flex-col gap-2' },
      field('Priority', card.priority),
      field('Progress', card.progress && rich(card.progress)),
      field('Blocker', card.blocker),
      field('Owner', card.owner),
      field('Branch', card.branch && el('code', {}, card.branch)),
      field('PR', prField(card.pr)),
      field('Issue', card.issue && github('issues', card.issue)),
      field('QA', qa),
      field('Where', card.where && rich(card.where)),
      field('Spec', card.spec && rich(card.spec)),
      field('Figma', card.figma && link(card.figma, 'Open in Figma')),
      // parent and blockedBy are GitHub issue numbers (cards.md).
      field('Parent', card.parent && github('issues', card.parent)),
      field('Blocked by', card.blockedBy && join(card.blockedBy.map((n) => github('issues', n)))),
      field('UI', card.ui ? 'Yes' : null),
      field('Added by', card.addedBy),
      field('Old ID', card.oldId),
      field('Created', card.createdAt),
      field('Updated', card.updatedAt),
      field('Notion', card.source && link(card.source, 'Original page'))),
    (card.imageUrls || []).map((src) => el('a', { href: src, target: '_blank', rel: 'noopener' },
      el('img', { src, alt: `${card.id} screenshot`, class: 'w-full rounded-md border', style: 'border-color: var(--border)' }))),
    card.notesText && el('div', { class: 'flex flex-col gap-1' }, el('h3', { class: 'text-sm font-semibold' }, 'Notes'),
      el('div', { class: 'notes rounded-md p-3 break-words', style: 'background: var(--muted)' }, rich(card.notesText)))));
  if (!els.sheet.open) els.sheet.showModal();
  $('sheet-body').scrollTop = 0;
  els.sheet.querySelector('[data-sheet-close]').focus();
}

els.sheet.addEventListener('close', () => history.replaceState(null, '', `#${currentBoard().key}`));
els.sheet.addEventListener('click', (e) => { if (e.target === els.sheet) els.sheet.close(); });
els.sheet.querySelector('[data-sheet-close]').addEventListener('click', () => els.sheet.close());

// #<board> or #<board>/<card id> opens that board (and card).
function followHash() {
  let hash;
  try { hash = decodeURIComponent(location.hash.slice(1)); } catch { hash = ''; }
  const [wanted, cardId] = hash.split('/');
  if (data.boards.some((b) => b.key === wanted) && shownKey !== wanted) {
    els.board.value = wanted;
    els.search.value = '';
    els.kind.value = '';
    render();
  }
  const card = cardId && currentBoard()?.cards.find((c) => c.id === cardId);
  if (card) openCard(card);
  else if (els.sheet.open) els.sheet.close();
}

function init() {
  const dark = matchMedia('(prefers-color-scheme: dark)');
  const theme = () => document.documentElement.classList.toggle('dark', dark.matches);
  dark.addEventListener('change', theme);
  theme();

  const open = (b) => b.cards.filter((c) => c.status !== 'done').length;
  els.board.replaceChildren(...data.boards.map((b) => el('option', { value: b.key }, `${b.title} (${open(b)} open)`)));
  $('generated').textContent = data.generated ? `Updated ${data.generated}. Reload after a kanban.sh write.` : '';

  els.board.addEventListener('change', () => { location.hash = els.board.value; });
  els.search.addEventListener('input', render);
  els.kind.addEventListener('change', render);
  addEventListener('hashchange', followHash);
  render();
  followHash();
}

init();
