// modules/render.js
// Handles all DOM output. Uses keyed reconciliation (diff by task id)
// instead of wiping and rebuilding the whole list on every change —
// existing rows are updated in place, only new/removed rows touch
// the DOM tree, which keeps things fast for large lists.

import { escapeHTML } from './validation.js';

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: '2-digit',
  minute: '2-digit',
});

const formatTimestamp = (iso) => {
  try {
    return timeFormatter.format(new Date(iso));
  } catch {
    return '';
  }
};

const buildTaskElement = (task) => {
  const li = document.createElement('li');
  li.className = `task${task.completed ? ' completed' : ''}`;
  li.dataset.id = task.id;

  li.innerHTML = `
    <button type="button" class="task__stamp" aria-label="Toggle complete"></button>
    <span class="task__text"></span>
    <span class="task__time"></span>
    <div class="task__actions">
      <button type="button" class="task__action-btn edit-btn" aria-label="Edit task">✎</button>
      <button type="button" class="task__action-btn delete-btn" aria-label="Delete task">✕</button>
    </div>
  `;

  updateTaskElement(li, task);
  return li;
};

const updateTaskElement = (li, task) => {
  li.classList.toggle('completed', !!task.completed);

  const stamp = li.querySelector('.task__stamp');
  stamp.setAttribute('aria-pressed', String(!!task.completed));

  const textEl = li.querySelector('.task__text');
  // textContent, not innerHTML — escapeHTML is a defense-in-depth
  // extra for anywhere this value might later be templated as HTML.
  textEl.textContent = escapeHTML(task.text);

  const timeEl = li.querySelector('.task__time');
  timeEl.textContent = task.createdAt ? formatTimestamp(task.createdAt) : '';
};

const buildEmptyState = (filter) => {
  const li = document.createElement('li');
  li.className = 'empty-state';
  const copy = {
    all: ['No entries yet', 'Add your first task above to start the ledger.'],
    active: ['Nothing open', 'Every task is marked complete. Nicely done.'],
    completed: ['Nothing finished yet', 'Completed tasks will collect here.'],
  }[filter] || ['No entries', 'Add a task to get started.'];

  li.innerHTML = `
    <span class="empty-state__mark">${copy[0]}</span>
    <p class="empty-state__hint">${copy[1]}</p>
  `;
  return li;
};

/**
 * Render the visible list of tasks into taskListElement, reconciling
 * against whatever is already in the DOM instead of clearing it.
 * @param {HTMLElement} taskListElement
 * @param {Array<Object>} visibleTasks - already filtered/sorted
 * @param {string} activeFilter - 'all' | 'active' | 'completed'
 */
export function renderTaskList(taskListElement, visibleTasks, activeFilter = 'all') {
  const existingNodes = new Map();
  taskListElement.querySelectorAll('.task[data-id]').forEach((node) => {
    existingNodes.set(node.dataset.id, node);
  });

  // Clear a lingering empty-state node; it isn't keyed.
  const emptyNode = taskListElement.querySelector('.empty-state');
  if (emptyNode) emptyNode.remove();

  if (visibleTasks.length === 0) {
    existingNodes.forEach((node) => node.remove());
    taskListElement.appendChild(buildEmptyState(activeFilter));
    return;
  }

  let cursor = taskListElement.firstElementChild;

  visibleTasks.forEach((task) => {
    const key = String(task.id);
    let node = existingNodes.get(key);

    if (node) {
      updateTaskElement(node, task);
      existingNodes.delete(key);
    } else {
      node = buildTaskElement(task);
    }

    if (cursor !== node) {
      taskListElement.insertBefore(node, cursor);
    } else {
      cursor = cursor.nextElementSibling;
    }
  });

  // Anything left in existingNodes is no longer in the visible set.
  existingNodes.forEach((node) => {
    node.classList.add('is-removing');
    node.addEventListener('animationend', () => node.remove(), { once: true });
    // Fallback in case animation is skipped (reduced motion, etc.)
    setTimeout(() => node.remove(), 250);
  });
}

/**
 * Update the header tally and footer count.
 */
export function renderStats({ openCount, totalCount }, tallyEl, footerEl) {
  tallyEl.textContent = String(openCount);
  footerEl.textContent = `${totalCount} ${totalCount === 1 ? 'entry' : 'entries'}`;
}
