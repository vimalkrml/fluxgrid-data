# @datafluxgrid/fluxgrid-data

[![npm version](https://img.shields.io/npm/v/@datafluxgrid/fluxgrid-data)](https://www.npmjs.com/package/@datafluxgrid/fluxgrid-data)
[![npm downloads](https://img.shields.io/npm/dw/@datafluxgrid/fluxgrid-data)](https://www.npmjs.com/package/@datafluxgrid/fluxgrid-data)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@datafluxgrid/fluxgrid-data)](https://bundlephobia.com/package/@datafluxgrid/fluxgrid-data)
[![license](https://img.shields.io/npm/l/@datafluxgrid/fluxgrid-data)](https://github.com/vimalkrml/fluxgrid-data/blob/main/LICENSE)

Composable frontend data pipelines — search, sort, filter, paginate, and group arrays with one reusable query definition.

Works with JavaScript, TypeScript, React, Vue, Svelte, Angular, and plain HTML. Zero dependencies.

---

## Installation

```bash
npm install @datafluxgrid/fluxgrid-data

yarn add @datafluxgrid/fluxgrid-data

pnpm add @datafluxgrid/fluxgrid-data
```

### CDN — no build step

```html
<script src="https://cdn.jsdelivr.net/npm/@datafluxgrid/fluxgrid-data/dist/index.js"></script>
<!-- createQuery is now available as a global -->
<script>
  const q = createQuery({ search: ["name"], pageSize: 10 });
</script>
```

---

## Quick Start

```js
import { createQuery } from "@datafluxgrid/fluxgrid-data";

const users = [
  { id: 1, name: "Arjun Sharma", role: "Admin", salary: 95000 },
  { id: 2, name: "Priya Nair", role: "Editor", salary: 72000 },
  { id: 3, name: "Rahul Mehta", role: "Viewer", salary: 61000 },
];

// 1. Define once — outside any component
const userQuery = createQuery({
  search: ["name", "role"],
  sort: { field: "name", dir: "asc" },
  pageSize: 10,
});

// 2. Run anywhere with current UI state
const result = userQuery.run(users, { term: "arj", page: 1 });

console.log(result.data); // [{ id: 1, name: 'Arjun Sharma', ... }]
console.log(result.total); // 1
console.log(result.hasNext); // false
console.log(result.isEmpty); // false
console.log(result.ms); // 0  (query time in milliseconds)
```

---

## React Example

Define the query outside the component once. Inside the component, only call `.run()` with current state. Zero logic inside the component.

```jsx
import { useState } from "react";
import { createQuery } from "@datafluxgrid/fluxgrid-data";

// Defined ONCE — outside the component
const userQuery = createQuery({
  search: ["name", "email", "department"],
  sort: { field: "name", dir: "asc" },
  pageSize: 10,
});

export function UsersTable({ users }) {
  const [term, setTerm] = useState("");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [selected, setSelected] = useState([]);
  const [roleFilter, setRole] = useState("");

  // One call — get everything back
  const result = userQuery.run(users, {
    term,
    page,
    sortField,
    sortDir,
    selected,
    filterFn: (u) => !roleFilter || u.role === roleFilter,
  });

  return (
    <>
      <input
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setPage(1);
        }}
        placeholder="Search..."
      />

      <select
        value={roleFilter}
        onChange={(e) => {
          setRole(e.target.value);
          setPage(1);
        }}
      >
        <option value="">All roles</option>
        <option value="Admin">Admin</option>
        <option value="Editor">Editor</option>
        <option value="Viewer">Viewer</option>
      </select>

      {result.isEmpty && <p>No users yet.</p>}
      {result.isNoResults && <p>No results for "{result.term}"</p>}

      <p>
        Showing {result.from}–{result.to} of {result.total}
      </p>

      <table>
        <tbody>
          {result.data.map((user) => (
            <tr key={user.id}>
              <td>
                <input
                  type="checkbox"
                  checked={selected.includes(user.id)}
                  onChange={(e) => {
                    setSelected((s) =>
                      e.target.checked
                        ? [...s, user.id]
                        : s.filter((id) => id !== user.id),
                    );
                  }}
                />
              </td>
              <td>{user.name}</td>
              <td>{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button disabled={!result.hasPrev} onClick={() => setPage((p) => p - 1)}>
        Prev
      </button>
      <button disabled={!result.hasNext} onClick={() => setPage((p) => p + 1)}>
        Next
      </button>

      <span>
        Page {result.page} of {result.pages}
      </span>
    </>
  );
}
```

---

## TypeScript Example

Pass your data type as a generic to get full autocomplete on field names and typed `result.data`.

```ts
import { createQuery } from "@datafluxgrid/fluxgrid-data";

interface User {
  id: number;
  name: string;
  role: "Admin" | "Editor" | "Viewer";
  department: string;
  salary: number;
}

const userQuery = createQuery<User>({
  search: ["name", "department"], // only User keys — autocomplete works
  sort: { field: "salary", dir: "desc" },
  pageSize: 5,
});

const result = userQuery.run(users, { term, page });
// result.data    is typed as User[]
// result.total   is typed as number
// result.hasNext is typed as boolean
```

---

## GroupBy Example

Add `groupBy` to the config. The result shape changes to `{ groups, total, ms }`.

```js
const taskQuery = createQuery({
  search: ["title", "assignee"],
  groupBy: "status",
  sort: { field: "priority", dir: "asc" },
});

const { groups, total } = taskQuery.run(tasks, { term });

// groups = {
//   'Todo':        [{ title: 'Design landing page', ... }, ...],
//   'In Progress': [{ title: 'Fix login bug', ... }, ...],
//   'Done':        [{ title: 'Write API docs', ... }, ...],
// }

Object.entries(groups).map(([status, items]) => (
  <section key={status}>
    <h3>
      {status} ({items.length})
    </h3>
    {items.map((task) => (
      <TaskCard key={task.id} task={task} />
    ))}
  </section>
));
```

---

## Serializable Pipelines

Pipelines can be saved to localStorage, sent to an API, or shared via URL — then restored exactly.

```js
// Save
const saved = userQuery.toJSON();
localStorage.setItem("myQuery", JSON.stringify(saved));

// Restore anywhere — same result
const restored = createQuery.fromJSON(
  JSON.parse(localStorage.getItem("myQuery")),
);

// What toJSON() produces:
// {
//   search:   ['name', 'email'],
//   sort:     { field: 'name', dir: 'asc' },
//   pageSize: 10
// }
```

---

## Vue 3 Example

```vue
<script setup>
import { ref, computed } from "vue";
import { createQuery } from "@datafluxgrid/fluxgrid-data";

const props = defineProps(["users"]);
const term = ref("");
const page = ref(1);

const userQuery = createQuery({
  search: ["name", "role"],
  sort: { field: "name" },
  pageSize: 10,
});

const result = computed(() =>
  userQuery.run(props.users, { term: term.value, page: page.value }),
);
</script>

<template>
  <input v-model="term" placeholder="Search..." @input="page = 1" />
  <p>Showing {{ result.from }}–{{ result.to }} of {{ result.total }}</p>
  <tr v-for="user in result.data" :key="user.id">
    <td>{{ user.name }}</td>
    <td>{{ user.role }}</td>
  </tr>
  <button :disabled="!result.hasPrev" @click="page--">Prev</button>
  <button :disabled="!result.hasNext" @click="page++">Next</button>
</template>
```

---

## Without vs With

### Without @datafluxgrid/fluxgrid-data

```js
// Copy-pasted in every component — no meta, no reuse
const filteredAll = users
  .filter((u) =>
    ["name", "email"].some((f) => u[f].toLowerCase().includes(term)),
  )
  .sort((a, b) => a.name.localeCompare(b.name));

const total = filteredAll.length;
const pages = Math.ceil(total / 10);
const hasNext = page < pages;
const hasPrev = page > 1;
const from = total === 0 ? 0 : (page - 1) * 10 + 1;
const to = Math.min(page * 10, total);
const data = filteredAll.slice((page - 1) * 10, page * 10);
// ...and isEmpty, isNoResults, allSelected, someSelected still missing
```

### With @datafluxgrid/fluxgrid-data

```js
// Defined once — reused in every component
const userQuery = createQuery({
  search: ["name", "email"],
  sort: { field: "name", dir: "asc" },
  pageSize: 10,
});

// One call — all meta included
const {
  data,
  total,
  page,
  pages,
  from,
  to,
  hasNext,
  hasPrev,
  isEmpty,
  isNoResults,
  allSelected,
  someSelected,
  ms,
} = userQuery.run(users, { term, page, selected });
```

---

## API Reference

### createQuery(config)

| Option     | Type                | Description                                                                  |
| ---------- | ------------------- | ---------------------------------------------------------------------------- |
| `search`   | `string[]`          | Fields to search across when term is provided                                |
| `sort`     | `{ field, dir }`    | Default sort field and direction. `dir` is `'asc'` or `'desc'`               |
| `pageSize` | `number`            | Records per page. Default is 10                                              |
| `filter`   | `(item) => boolean` | Static filter applied on every `.run()` call                                 |
| `groupBy`  | `string`            | Group records by this field. Changes result shape to `{ groups, total, ms }` |

### query.run(data, options)

| Option      | Type                   | Description                                                        |
| ----------- | ---------------------- | ------------------------------------------------------------------ |
| `term`      | `string`               | Search term. Empty string means no filter — show all               |
| `page`      | `number`               | Current page number. Starts at 1                                   |
| `pageSize`  | `number`               | Override pageSize from config for this run                         |
| `sortField` | `string`               | Override sort field from config for this run                       |
| `sortDir`   | `'asc' \| 'desc'`      | Override sort direction for this run                               |
| `filterFn`  | `(item) => boolean`    | Dynamic filter — for dropdowns, sliders, toggles                   |
| `selected`  | `(string \| number)[]` | Selected row IDs. Used to compute `allSelected` and `someSelected` |

### Result object

| Field          | Type      | Description                                                               |
| -------------- | --------- | ------------------------------------------------------------------------- |
| `data`         | `T[]`     | Records for the current page — ready to render                            |
| `total`        | `number`  | Total matching records across all pages                                   |
| `page`         | `number`  | Current page number                                                       |
| `pages`        | `number`  | Total number of pages                                                     |
| `pageSize`     | `number`  | Records per page                                                          |
| `from`         | `number`  | First record number — use for "Showing 21–30 of 247"                      |
| `to`           | `number`  | Last record number                                                        |
| `hasNext`      | `boolean` | True if there is a next page                                              |
| `hasPrev`      | `boolean` | True if there is a previous page                                          |
| `term`         | `string`  | Active search term — use for highlighting matched text                    |
| `sortField`    | `string`  | Active sort field — use to show sort arrow on column header               |
| `sortDir`      | `string`  | Active sort direction — `'asc'` or `'desc'`                               |
| `isEmpty`      | `boolean` | True when total = 0 and term is empty. Show empty state illustration      |
| `isNoResults`  | `boolean` | True when total = 0 and term is not empty. Show "no results" message      |
| `allSelected`  | `boolean` | True when all rows on current page are selected                           |
| `someSelected` | `boolean` | True when some but not all rows are selected — for indeterminate checkbox |
| `ms`           | `number`  | Query execution time in milliseconds                                      |

---

## Why @datafluxgrid/fluxgrid-data

### Competitor comparison

| Feature                                                    | `@datafluxgrid/fluxgrid-data` | `@tanstack/react-table` | `fuse.js` | `match-sorter` | `datapipe-js` |
| ---------------------------------------------------------- | ----------------------------- | ----------------------- | --------- | -------------- | ------------- |
| Search across fields                                       | Yes                           | Yes                     | Yes       | Yes            | Yes           |
| Sort                                                       | Yes                           | Yes                     | No        | Yes            | Yes           |
| Paginate                                                   | Yes                           | Yes                     | No        | No             | No            |
| GroupBy                                                    | Yes                           | Yes                     | No        | No             | Yes           |
| Full meta output (total, from, to, hasNext, hasPrev)       | Yes                           | No — manual             | No        | No             | No            |
| isEmpty / isNoResults states                               | Yes                           | No                      | No        | No             | No            |
| allSelected / someSelected helpers                         | Yes                           | No                      | No        | No             | No            |
| Serializable toJSON() / fromJSON()                         | Yes                           | No                      | No        | No             | No            |
| Framework agnostic (React, Vue, Svelte, Angular, plain JS) | Yes                           | No — needs adapter      | Yes       | Yes            | Yes           |
| No columns definition required                             | Yes                           | No — mandatory          | Yes       | Yes            | Yes           |
| Zero dependencies                                          | Yes                           | Yes                     | Yes       | No             | No            |
| TypeScript support                                         | Yes                           | Yes                     | Yes       | Yes            | Partial       |
| Works in plain script tag (CDN)                            | Yes                           | No                      | Yes       | No             | No            |
| Actively maintained                                        | Yes                           | Yes                     | Yes       | Yes            | No            |
| Bundle size (minzipped)                                    | ~1 kB                         | ~15–20 kB               | ~5 kB     | ~3 kB          | ~8 kB         |
| Setup lines of code                                        | ~5                            | ~40–60                  | ~10       | ~5             | ~10           |

---

### Why not just use TanStack Table?

TanStack Table is a powerful headless table engine — but it requires:

- A mandatory columns definition array before you can do anything
- A React adapter — not usable in Vue, Svelte, or plain JS without switching packages
- Manually wiring `onSortingChange`, `onPaginationChange`, `onGlobalFilterChange` — every piece of state is your responsibility
- No meta output — `total`, `from`, `to`, `isEmpty`, `isNoResults` are all calculated by you
- No serializable pipelines — state lives inside a React hook, cannot be saved to JSON or restored

`@datafluxgrid/fluxgrid-data` is not a replacement for TanStack Table. If you need column resizing, pinning, virtualization, or cell-level rendering — use TanStack Table. If you need search + sort + paginate + full meta in 5 lines, reusable across any framework — use fluxgrid-data.

---

### Why not just use Fuse.js?

Fuse.js does fuzzy search brilliantly — but that is all it does. No sort, no pagination, no meta output. You still need to write all the slicing, sorting, and counting logic yourself on top of it. Every component that uses it ends up with the same boilerplate repeated.

---

### Why not just use match-sorter?

match-sorter gives you ranked search results — items that match better appear first. Useful, but it returns a sorted array and nothing else. No pagination, no total count, no page meta. You are back to writing `.slice()`, `Math.ceil()`, and page state yourself in every component.

---

### Why not just use datapipe-js?

The concept is the closest to fluxgrid-data — a chainable JS pipeline. But it was last published over 2 years ago, has 46 weekly downloads, and has no frontend-specific meta output (`hasNext`, `isEmpty`, `isNoResults`). It was built for data analytics, not for driving UI state.

---

### The gap fluxgrid-data fills

Every existing option forces a choice between:

- Search only — Fuse.js, match-sorter
- Full table engine with heavy setup and React lock-in — TanStack Table
- Dead and abandoned — datapipe-js

None of them give you: search + sort + paginate + full UI meta + serializable pipelines + framework agnostic + 5 lines of setup.

That is the gap `@datafluxgrid/fluxgrid-data` fills.

---

## Framework Support

| Framework          | Import                                                           |
| ------------------ | ---------------------------------------------------------------- |
| React / Next.js    | `import { createQuery } from '@datafluxgrid/fluxgrid-data'`      |
| Vue / Nuxt         | `import { createQuery } from '@datafluxgrid/fluxgrid-data'`      |
| Svelte / SvelteKit | `import { createQuery } from '@datafluxgrid/fluxgrid-data'`      |
| Angular            | `import { createQuery } from '@datafluxgrid/fluxgrid-data'`      |
| Plain HTML         | CDN script tag — `createQuery` available as global               |
| Node.js            | `const { createQuery } = require('@datafluxgrid/fluxgrid-data')` |

---

## License

MIT © [Vimal K R](https://github.com/vimalkrml)

Part of the [Datafluxgrid](https://datafluxgrid.com) ecosystem.
