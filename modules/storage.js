// modules/storage.js
// Thin abstraction around localStorage so the rest of the app never
// touches the Web Storage API (or its JSON quirks) directly.

const STORAGE_KEY = 'taskflow.tasks';
const THEME_KEY = 'taskflow.theme';

/**
 * Persist the tasks array to localStorage.
 * @param {Array<Object>} tasks
 */
export const saveTasks = (tasks) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (err) {
    // Most likely quota exceeded or storage disabled (private browsing).
    console.error('Could not save tasks:', err);
    return false;
  }
};

/**
 * Load tasks from localStorage. Always returns an array, even if
 * storage is empty, corrupted, or unavailable.
 * @returns {Array<Object>}
 */
export const loadTasks = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Could not load tasks, starting fresh:', err);
    return [];
  }
};

export const saveTheme = (theme) => {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (err) {
    console.error('Could not save theme preference:', err);
  }
};

export const loadTheme = () => {
  try {
    return localStorage.getItem(THEME_KEY);
  } catch (err) {
    return null;
  }
};
