// app.js — entry point
// Wires together storage (model), render (view), and DOM events
// (controller). Kept intentionally thin: state lives here, behavior
// lives in the modules.

import { loadTasks, saveTasks, loadTheme, saveTheme } from './modules/storage.js';
import { renderTaskList, renderStats } from './modules/render.js';
import { validateTaskInput } from './modules/validation.js';

// ---- State ----
let tasks = loadTasks();
let currentFilter = 'all'; // 'all' | 'active' | 'completed'
let editingId = null;

// ---- DOM refs ----
const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const errorEl = document.getElementById('form-error');
const listEl = document.getElementById('task-list');
const tallyEl = document.getElementById('tally-open');
const footerEl = document.getElementById('footer-count');
const filterBtns = document.querySelectorAll('.filter-btn[data-filter]');
const clearCompletedBtn = document.getElementById('clear-completed');
const themeToggle = document.getElementById('theme-toggle');

// ---- Model helpers ----
const createTask = (text) => ({
  id: Date.now() + Math.random().toString(36).slice(2, 7),
  text: text.trim(),
  completed: false,
  createdAt: new Date().toISOString(),
});

const persistAndRender = () => {
  saveTasks(tasks);
  render();
};

// ---- Derived data / view logic ----
const getVisibleTasks = () => {
  const sorted = [...tasks].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (currentFilter === 'active') return sorted.filter((t) => !t.completed);
  if (currentFilter === 'completed') return sorted.filter((t) => t.completed);
  return sorted;
};

function render() {
  renderTaskList(listEl, getVisibleTasks(), currentFilter);
  renderStats(
    {
      openCount: tasks.filter((t) => !t.completed).length,
      totalCount: tasks.length,
    },
    tallyEl,
    footerEl
  );
}

// ---- Form submission (Create) ----
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const { valid, message } = validateTaskInput(input.value);

  if (!valid) {
    errorEl.textContent = message;
    input.classList.add('has-error');
    input.setAttribute('aria-invalid', 'true');
    input.focus();
    return;
  }

  errorEl.textContent = '';
  input.classList.remove('has-error');
  input.removeAttribute('aria-invalid');

  tasks.push(createTask(input.value));
  input.value = '';
  persistAndRender();
});

// Clear inline error as soon as the user starts fixing it.
input.addEventListener('input', () => {
  if (errorEl.textContent) {
    errorEl.textContent = '';
    input.classList.remove('has-error');
    input.removeAttribute('aria-invalid');
  }
});

// ---- Event delegation for the task list (Update / Delete / Edit) ----
listEl.addEventListener('click', (e) => {
  const taskEl = e.target.closest('.task');
  if (!taskEl) return;
  const id = taskEl.dataset.id;
  const index = tasks.findIndex((t) => String(t.id) === id);
  if (index === -1) return;

  // Toggle completion
  if (e.target.closest('.task__stamp')) {
    tasks[index].completed = !tasks[index].completed;
    persistAndRender();
    return;
  }

  // Delete (with a lightweight confirm to avoid accidental loss)
  if (e.target.closest('.delete-btn')) {
    const confirmed = window.confirm(`Delete "${tasks[index].text}"?`);
    if (!confirmed) return;
    tasks.splice(index, 1);
    persistAndRender();
    return;
  }

  // Enter edit mode
  if (e.target.closest('.edit-btn')) {
    startEdit(taskEl, tasks[index]);
    return;
  }
});

function startEdit(taskEl, task) {
  if (editingId) return; // one edit at a time
  editingId = task.id;

  const textEl = taskEl.querySelector('.task__text');
  const original = task.text;

  const editInput = document.createElement('input');
  editInput.type = 'text';
  editInput.className = 'task__edit-input';
  editInput.value = original;
  editInput.maxLength = 120;

  textEl.replaceWith(editInput);
  editInput.focus();
  editInput.setSelectionRange(editInput.value.length, editInput.value.length);

  const commit = () => {
    const { valid } = validateTaskInput(editInput.value);
    const index = tasks.findIndex((t) => t.id === task.id);
    if (index !== -1 && valid) {
      tasks[index].text = editInput.value.trim();
    }
    editingId = null;
    persistAndRender();
  };

  const cancel = () => {
    editingId = null;
    render();
  };

  editInput.addEventListener('blur', commit);
  editInput.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter') { ev.preventDefault(); commit(); }
    if (ev.key === 'Escape') { ev.preventDefault(); cancel(); }
  });
}

// ---- Filters ----
filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    filterBtns.forEach((b) => b.classList.toggle('is-active', b === btn));
    render();
  });
});

// ---- Clear completed ----
clearCompletedBtn.addEventListener('click', () => {
  const completedCount = tasks.filter((t) => t.completed).length;
  if (completedCount === 0) return;
  if (!window.confirm(`Remove ${completedCount} completed task(s)?`)) return;
  tasks = tasks.filter((t) => !t.completed);
  persistAndRender();
});

// ---- Theme toggle (persisted, respects system preference on first load) ----
function initTheme() {
  const saved = loadTheme();
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  const theme = saved || (prefersLight ? 'light' : 'dark');
  document.documentElement.setAttribute('data-theme', theme);
}

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  saveTheme(next);
});

// ---- Boot ----
initTheme();
render();
