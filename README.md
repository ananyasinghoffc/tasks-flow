# TaskFlow Lite

A fully client-side task manager. Vanilla JS, no frameworks, no build step — open `index.html` and it runs.

## Run it

Just open `index.html` in a browser, or serve the folder statically:

```bash
npx serve .
# or
python3 -m http.server 8080
```

## Architecture

A lightweight MVC split, enforced with ES modules:

| Layer | File | Responsibility |
|---|---|---|
| Model | `modules/storage.js` | Load/save tasks & theme to `localStorage`, JSON (de)serialization |
| View | `modules/render.js` | All DOM writes, keyed reconciliation so re-renders touch only changed rows |
| Controller | `app.js` | Owns app state, wires form/list/filter events, calls model + view |
| Rules | `modules/validation.js` | Input validation + HTML-escaping |

### Data shape

```js
{
  id: "1712345678901-a1b2c",
  text: "Learn JavaScript",
  completed: false,
  createdAt: "2026-08-08T09:00:00.000Z"
}
```

Stored under the `taskflow.tasks` key in `localStorage` as a JSON array. Theme preference is stored separately under `taskflow.theme`.

### Event flow

```
submit (form) ──► validate ──► createTask() ──► push to tasks[]
                                                 │
click (list, delegated) ──► toggle/delete/edit ─┤
                                                 ▼
                                        saveTasks() ──► renderTaskList()
```

All list interactions (toggle, edit, delete) are handled through a single delegated click listener on `#task-list`, so newly-added rows never need their own listeners attached.

### Rendering strategy

`renderTaskList` diffs the incoming task array against the `.task[data-id]` nodes already in the DOM: existing rows are updated in place, only genuinely new or removed rows cause DOM insertions/removals. This keeps re-renders cheap even with large lists, and preserves focus/scroll position on unrelated rows.

## Features

- Create, complete, edit (inline), and delete tasks
- Filter: All / Active / Completed, plus "clear completed"
- Empty-state messaging per filter
- Inline validation (empty / >120 chars) with `aria-live` error text
- Dark/light theme toggle, persisted, defaults to system preference
- Keyboard support: `Enter` commits an inline edit, `Escape` cancels it
- XSS-safe rendering via `textContent` + an `escapeHTML` fallback

## Known limits / next steps

- Data lives only in this browser (by design — see `taskflow-api` for a server-backed version)
- No drag-to-reorder
- No undo for delete (a confirm dialog guards against accidental loss instead)
