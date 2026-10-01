/* ─────────────────────────────────────────────────────────────
   STRIVER 79 DSA TRACKER — frontend logic
   ───────────────────────────────────────────────────────────── */

const API = '';  // same-origin

// ── Topic icons map ──────────────────────────────────────────
const TOPIC_ICONS = {
  'Array and Hashing':         '📊',
  'Binary Search':             '🔍',
  'Linked List':               '🔗',
  'Stacks and Queues':         '📚',
  'Strings':                   '🔤',
  'Recursion and Backtracking':'🌀',
  'Trees (BT + BST)':          '🌳',
  'Heaps':                     '🏔️',
  'Graphs':                    '🕸️',
  'Dynamic Programming':       '🧩',
  'Tries':                     '🌐',
};

// ── App State ────────────────────────────────────────────────
let state = {
  grouped: {},          // { topicName: [question, ...] }
  total: 0,
  filter: 'all',        // 'all' | 'starred' | 'undone' | 'done'
  search: '',
  collapsedTopics: new Set(),
  noteTimers: {},
  activeQuestionId: null,
  modalView: 'edit',    // 'edit' | 'preview' | 'split'
};

// ── Init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  bindFilters();
  bindSearch();
  bindActions();
  bindModalEvents();
  fetchData();
});

async function fetchData() {
  try {
    const res = await fetch(`${API}/api/questions`);
    if (!res.ok) throw new Error('Server error ' + res.status);
    const data = await res.json();
    state.grouped = data.grouped || {};
    state.total   = data.total   || 0;
    render();
  } catch (err) {
    console.error(err);
    showToast('❌ Failed to load questions. Is the server running?', 5000);
    document.getElementById('loading-state').innerHTML =
      `<p style="color:#ef4444">⚠️ Could not connect to server.<br><small>${err.message}</small></p>`;
  }
}

// ── Filters, Search & Actions ────────────────────────────────
function bindFilters() {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      state.filter = btn.dataset.filter;
      render();
    });
  });
}

function bindSearch() {
  const input = document.getElementById('search-input');
  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.search = input.value.trim().toLowerCase();
      render();
    }, 200);
  });
}

function bindActions() {
  const expandBtn = document.getElementById('btn-expand-all');
  const collapseBtn = document.getElementById('btn-collapse-all');

  if (expandBtn) expandBtn.addEventListener('click', expandAllTopics);
  if (collapseBtn) collapseBtn.addEventListener('click', collapseAllTopics);
}

function expandAllTopics() {
  state.collapsedTopics.clear();
  renderTopics();
  showToast('Expanded all topics');
}

function collapseAllTopics() {
  for (const topic of Object.keys(state.grouped)) {
    state.collapsedTopics.add(topic);
  }
  renderTopics();
  showToast('Collapsed all topics');
}

function matchesFilter(q) {
  if (state.filter === 'starred') return q.isStarred;
  if (state.filter === 'undone')  return !q.isDone;
  if (state.filter === 'done')    return q.isDone;
  return true;
}

function matchesSearch(q) {
  if (!state.search) return true;
  return q.name.toLowerCase().includes(state.search);
}

// ── Render ───────────────────────────────────────────────────
function render() {
  updateHeader();
  renderTopics();
}

function updateHeader() {
  const allQuestions = Object.values(state.grouped).flat();
  const done    = allQuestions.filter(q => q.isDone).length;
  const starred = allQuestions.filter(q => q.isStarred).length;
  const notes   = allQuestions.filter(q => q.notes && q.notes.trim()).length;
  const total   = allQuestions.length;

  const doneEl = document.getElementById('stat-done');
  const starredEl = document.getElementById('stat-starred');
  const notesEl = document.getElementById('stat-notes');
  const progDoneEl = document.getElementById('progress-done');
  const progTotalEl = document.getElementById('progress-total');
  const fillEl = document.getElementById('header-progress-fill');

  if (doneEl) doneEl.textContent = done;
  if (starredEl) starredEl.textContent = starred;
  if (notesEl) notesEl.textContent = notes;
  if (progDoneEl) progDoneEl.textContent = done;
  if (progTotalEl) progTotalEl.textContent = total;

  if (fillEl) {
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    fillEl.style.width = pct + '%';
  }
}

function renderTopics() {
  const container = document.getElementById('topics-container');
  const loading   = document.getElementById('loading-state');
  const empty     = document.getElementById('empty-state');

  loading.style.display   = 'none';
  container.style.display = 'flex';
  empty.style.display     = 'none';

  let anyVisible = false;
  container.innerHTML = '';

  for (const [topic, questions] of Object.entries(state.grouped)) {
    const filtered = questions.filter(q => matchesFilter(q) && matchesSearch(q));
    if (filtered.length === 0) continue;
    anyVisible = true;

    const doneCnt = questions.filter(q => q.isDone).length;
    const totalCnt = questions.length;
    const pct = totalCnt > 0 ? Math.round((doneCnt / totalCnt) * 100) : 0;
    const collapsed = state.collapsedTopics.has(topic);

    const card = document.createElement('div');
    card.className = `topic-card${collapsed ? ' collapsed' : ''}`;
    card.dataset.topic = topic;

    card.innerHTML = `
      <div class="topic-header" onclick="toggleTopic('${escHtml(topic)}')">
        <div class="topic-title-wrap">
          <svg class="topic-chevron${collapsed ? ' collapsed' : ''}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
          <span class="topic-name">${escHtml(topic)}</span>
        </div>
        <div class="topic-progress-wrap">
          <span class="topic-progress-label">${doneCnt}/${totalCnt}</span>
          <div class="topic-progress-bar">
            <div class="topic-progress-fill" style="width:${pct}%"></div>
          </div>
        </div>
      </div>
      <div class="topic-body" style="max-height:${collapsed ? '0' : '9999px'}">
        <table class="questions-table" aria-label="${escHtml(topic)} questions">
          <thead>
            <tr>
              <th class="col-center col-done">Done</th>
              <th class="col-center col-star">Star</th>
              <th class="col-name">Question</th>
              <th class="col-center col-link">Link</th>
              <th class="col-center col-notes">Notes</th>
            </tr>
          </thead>
          <tbody>
            ${filtered.map(q => renderRow(q)).join('')}
          </tbody>
        </table>
      </div>
    `;

    container.appendChild(card);
  }

  if (!anyVisible) {
    container.style.display = 'none';
    empty.style.display = 'flex';
    empty.style.flexDirection = 'column';
    empty.style.alignItems = 'center';
  }
}

function renderRow(q) {
  const hasNote = q.notes && q.notes.trim().length > 0;
  return `
    <tr class="question-row${q.isDone ? ' is-done' : ''}" id="row-${q._id}" data-id="${q._id}">
      <td class="col-done">
        <label class="cb-wrap" title="${q.isDone ? 'Mark as not done' : 'Mark as done'}">
          <input type="checkbox" ${q.isDone ? 'checked' : ''}
            onchange="toggleDone('${q._id}', this.checked)" aria-label="Mark ${escHtml(q.name)} as done" />
          <span class="cb-box">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="#07071a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
        </label>
      </td>
      <td class="col-star">
        <button class="star-btn${q.isStarred ? ' starred' : ''}" id="star-${q._id}"
          onclick="toggleStar('${q._id}', !this.classList.contains('starred'))"
          title="${q.isStarred ? 'Remove star' : 'Star for revisit'}"
          aria-label="${q.isStarred ? 'Unstar' : 'Star'} ${escHtml(q.name)}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${q.isStarred ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </button>
      </td>
      <td class="col-name">
        <span class="q-name" id="name-${q._id}">${escHtml(q.name)}</span>
      </td>
      <td class="col-link">
        <div class="link-cell-wrap">
          ${q.link
            ? `<a href="${q.link}" target="_blank" rel="noopener noreferrer" class="link-btn"
                 aria-label="Solve ${escHtml(q.name)}">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
                Solve
               </a>
               <button class="edit-link-btn" onclick="editLink('${q._id}', '${escHtml(q.link)}')" title="Edit URL">
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
               </button>`
            : `<button class="add-link-btn" onclick="editLink('${q._id}', '')" title="Add URL">+ Link</button>`
          }
        </div>
      </td>
      <td class="col-notes">
        <button class="notes-btn${hasNote ? ' has-note' : ''}" id="nbtn-${q._id}"
          onclick="openNotesModal('${q._id}')"
          aria-label="${hasNote ? 'Edit note' : 'Add note'} for ${escHtml(q.name)}">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10,9 9,9 8,9"/>
          </svg>
          ${hasNote ? 'Edit note' : '+ Note'}
        </button>
      </td>
    </tr>
  `;
}

// ── Collapse / Expand Topic ───────────────────────────────────
function toggleTopic(topic) {
  const card = document.querySelector(`.topic-card[data-topic="${escHtml(topic)}"]`);
  if (!card) return;

  if (state.collapsedTopics.has(topic)) {
    state.collapsedTopics.delete(topic);
    card.classList.remove('collapsed');
    card.querySelector('.topic-body').style.maxHeight = '9999px';
  } else {
    state.collapsedTopics.add(topic);
    card.classList.add('collapsed');
    card.querySelector('.topic-body').style.maxHeight = '0';
  }
}

// ── Toggle Done ───────────────────────────────────────────────
async function toggleDone(id, isDone) {
  // Optimistic UI
  const q = findQuestion(id);
  if (q) q.isDone = isDone;
  const row = document.getElementById(`row-${id}`);
  if (row) {
    row.classList.toggle('is-done', isDone);
  }
  updateHeader();
  updateTopicProgress(id);

  try {
    await patchQuestion(id, { isDone });
    showToast(isDone ? '✅ Marked as done!' : '🔲 Marked as not done');
  } catch (err) {
    // Revert
    if (q) q.isDone = !isDone;
    showToast('❌ Failed to update. Check connection.');
  }
}

// ── Toggle Star ───────────────────────────────────────────────
async function toggleStar(id, isStarred) {
  const q = findQuestion(id);
  if (q) q.isStarred = isStarred;

  const btn = document.getElementById(`star-${id}`);
  if (btn) {
    btn.classList.toggle('starred', isStarred);
    btn.querySelector('path').setAttribute('fill', isStarred ? 'currentColor' : 'none');
    btn.title = isStarred ? 'Remove star' : 'Star for revisit';
  }
  updateHeader();

  try {
    await patchQuestion(id, { isStarred });
    showToast(isStarred ? '⭐ Starred for revisit!' : '☆ Unstarred');
  } catch (err) {
    if (q) q.isStarred = !isStarred;
    showToast('❌ Failed to update. Check connection.');
  }
}

// ── Notes Modal Handlers ───────────────────────────────────────
function openNotesModal(id) {
  const q = findQuestion(id);
  if (!q) return;

  state.activeQuestionId = id;
  const modal = document.getElementById('notes-modal');
  const titleEl = document.getElementById('modal-title');
  const textarea = document.getElementById('modal-textarea');

  if (titleEl) titleEl.textContent = `Notes — ${q.name}`;
  if (textarea) textarea.value = q.notes || '';
  
  updateMarkdownPreview(q.notes || '');
  setModalView(state.modalView || 'edit');

  if (modal) modal.style.display = 'flex';
  setTimeout(() => textarea && textarea.focus(), 50);
}

function closeNotesModal() {
  const modal = document.getElementById('notes-modal');
  if (modal) modal.style.display = 'none';
  state.activeQuestionId = null;
}

function setModalView(view) {
  state.modalView = view;
  const editorPane = document.getElementById('modal-editor-pane');
  const previewPane = document.getElementById('modal-preview-pane');
  const modalBody = document.getElementById('modal-body');

  document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
  const activeTab = document.getElementById(`modal-tab-${view}`);
  if (activeTab) activeTab.classList.add('active');

  if (view === 'edit') {
    if (modalBody) modalBody.classList.remove('split-view');
    if (editorPane) editorPane.style.display = 'block';
    if (previewPane) previewPane.style.display = 'none';
  } else if (view === 'preview') {
    if (modalBody) modalBody.classList.remove('split-view');
    if (editorPane) editorPane.style.display = 'none';
    if (previewPane) previewPane.style.display = 'block';
  } else if (view === 'split') {
    if (modalBody) modalBody.classList.add('split-view');
    if (editorPane) editorPane.style.display = 'block';
    if (previewPane) previewPane.style.display = 'block';
  }
}

function updateMarkdownPreview(notesText) {
  const previewEl = document.getElementById('modal-preview-content');
  if (!previewEl) return;
  if (!notesText || !notesText.trim()) {
    previewEl.innerHTML = '<p class="preview-placeholder"><em>No notes content yet. Switch to Edit tab or type on the left!</em></p>';
    return;
  }
  try {
    if (typeof marked !== 'undefined') {
      previewEl.innerHTML = marked.parse(notesText);
    } else {
      previewEl.textContent = notesText;
    }
  } catch (e) {
    previewEl.textContent = notesText;
  }
}

function bindModalEvents() {
  const closeBtn = document.getElementById('modal-close-btn');
  const doneBtn = document.getElementById('modal-done-btn');
  const modal = document.getElementById('notes-modal');
  const textarea = document.getElementById('modal-textarea');

  if (closeBtn) closeBtn.addEventListener('click', closeNotesModal);
  if (doneBtn) doneBtn.addEventListener('click', closeNotesModal);

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeNotesModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.style.display !== 'none') {
      closeNotesModal();
    }
  });

  document.getElementById('modal-tab-edit')?.addEventListener('click', () => setModalView('edit'));
  document.getElementById('modal-tab-preview')?.addEventListener('click', () => setModalView('preview'));
  document.getElementById('modal-tab-split')?.addEventListener('click', () => setModalView('split'));

  if (textarea) {
    textarea.addEventListener('input', () => {
      const id = state.activeQuestionId;
      if (!id) return;
      const text = textarea.value;
      updateMarkdownPreview(text);
      scheduleNoteSave(id, text);
    });
  }
}

// ── Save Notes (debounced) ────────────────────────────────────
function scheduleNoteSave(id, notes) {
  clearTimeout(state.noteTimers[id]);
  state.noteTimers[id] = setTimeout(() => saveNote(id, notes), 600);
}

async function saveNote(id, notes) {
  const q = findQuestion(id);
  if (q) q.notes = notes;

  // Update note button style in list
  const btn = document.getElementById(`nbtn-${id}`);
  const hasNote = notes.trim().length > 0;
  if (btn) {
    btn.classList.toggle('has-note', hasNote);
    btn.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
      </svg>
      ${hasNote ? 'Edit note' : '+ Note'}
    `;
  }
  updateHeader();

  try {
    await patchQuestion(id, { notes });
    const ind = document.getElementById('modal-save-ind');
    if (ind) {
      ind.classList.add('visible');
      setTimeout(() => ind.classList.remove('visible'), 2000);
    }
  } catch (err) {
    showToast('❌ Failed to save note.');
  }
}

// ── Update topic progress bar after toggle ────────────────────
function updateTopicProgress(id) {
  const q = findQuestion(id);
  if (!q) return;
  const topicQuestions = state.grouped[q.topic] || [];
  const done = topicQuestions.filter(x => x.isDone).length;
  const total = topicQuestions.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const card = document.querySelector(`.topic-card[data-topic="${q.topic}"]`);
  if (!card) return;
  const fill = card.querySelector('.topic-progress-fill');
  const label = card.querySelector('.topic-progress-label');
  if (fill) fill.style.width = pct + '%';
  if (label) label.textContent = `${done}/${total}`;
}

// ── Edit Question Link ─────────────────────────────────────────
async function editLink(id, currentLink) {
  const newLink = prompt('Enter problem URL:', currentLink || '');
  if (newLink === null) return;
  const trimmed = newLink.trim();

  const q = findQuestion(id);
  if (q) q.link = trimmed;
  renderTopics();

  try {
    await patchQuestion(id, { link: trimmed });
    showToast(trimmed ? '🔗 Link updated!' : '🗑️ Link removed');
  } catch (err) {
    showToast('❌ Failed to update link.');
    fetchData();
  }
}

// ── API helpers ───────────────────────────────────────────────
async function patchQuestion(id, body) {
  const res = await fetch(`${API}/api/questions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('API error');
  return res.json();
}

function findQuestion(id) {
  for (const questions of Object.values(state.grouped)) {
    const q = questions.find(x => x._id === id);
    if (q) return q;
  }
  return null;
}

// ── Toast ─────────────────────────────────────────────────────
let toastTimer;
function showToast(msg, duration = 2500) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

// ── SVG gradient defs ─────────────────────────────────────────
function injectSvgDefs() {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'svg-defs');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = `
    <defs>
      <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#7c5cfc"/>
        <stop offset="100%" stop-color="#3b82f6"/>
      </linearGradient>
    </defs>
  `;
  document.body.prepend(svg);
}

// ── Escape HTML ───────────────────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
