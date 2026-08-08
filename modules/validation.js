// modules/validation.js
// All rules for whether a task entry is acceptable live here so
// app.js and render.js don't have to know the specifics.

export const MIN_LENGTH = 1;
export const MAX_LENGTH = 120;

/**
 * Validate raw task input text.
 * @param {string} value
 * @returns {{ valid: boolean, message: string }}
 */
export const validateTaskInput = (value) => {
  const trimmed = (value ?? '').trim();

  if (trimmed.length < MIN_LENGTH) {
    return { valid: false, message: 'Enter a task before adding it.' };
  }
  if (trimmed.length > MAX_LENGTH) {
    return { valid: false, message: `Keep it under ${MAX_LENGTH} characters.` };
  }
  return { valid: true, message: '' };
};

/**
 * Escape HTML-significant characters to prevent XSS when task text
 * is injected into the DOM via innerHTML.
 * @param {string} str
 * @returns {string}
 */
export const escapeHTML = (str) =>
  String(str).replace(/[&<>"']/g, (tag) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[tag]));
