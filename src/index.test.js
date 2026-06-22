const { test, describe } = require("node:test");
const assert = require("node:assert");
const { createQuery } = require("./index");

// ── Sample data ───────────────────────────────────────────

const USERS = [
    { id: 1, name: "Arjun Sharma", email: "arjun@acme.com", role: "Admin", department: "Engineering", salary: 95000, status: "Active" },
    { id: 2, name: "Priya Nair", email: "priya@acme.com", role: "Editor", department: "Marketing", salary: 72000, status: "Active" },
    { id: 3, name: "Rahul Mehta", email: "rahul@acme.com", role: "Viewer", department: "Finance", salary: 61000, status: "Inactive" },
    { id: 4, name: "Sneha Patel", email: "sneha@acme.com", role: "Editor", department: "Design", salary: 78000, status: "Active" },
    { id: 5, name: "Vikram Singh", email: "vikram@acme.com", role: "Admin", department: "Engineering", salary: 102000, status: "Active" },
    { id: 6, name: "Divya Reddy", email: "divya@acme.com", role: "Viewer", department: "HR", salary: 58000, status: "Inactive" },
    { id: 7, name: "Karthik Iyer", email: "karthik@acme.com", role: "Editor", department: "Engineering", salary: 85000, status: "Active" },
    { id: 8, name: "Meera Nair", email: "meera@acme.com", role: "Viewer", department: "Marketing", salary: 55000, status: "Active" },
    { id: 9, name: "Aditya Kumar", email: "aditya@acme.com", role: "Admin", department: "Product", salary: 110000, status: "Active" },
    { id: 10, name: "Lakshmi Rao", email: "lakshmi@acme.com", role: "Editor", department: "Finance", salary: 74000, status: "Active" },
    { id: 11, name: "Suresh Babu", email: "suresh@acme.com", role: "Viewer", department: "Engineering", salary: 62000, status: "Inactive" },
    { id: 12, name: "Ananya Ghosh", email: "ananya@acme.com", role: "Editor", department: "Design", salary: 79000, status: "Active" },
];

// ── createQuery setup ─────────────────────────────────────

describe("createQuery", () => {

    test("returns a query instance with run and toJSON", () => {
        const q = createQuery({ search: ["name"], pageSize: 5 });
        assert.strictEqual(typeof q.run, "function");
        assert.strictEqual(typeof q.toJSON, "function");
    });

    test("fromJSON is available as static method", () => {
        assert.strictEqual(typeof createQuery.fromJSON, "function");
    });

});

// ── Basic run ─────────────────────────────────────────────

describe("run — no options", () => {

    const q = createQuery({ search: ["name"], pageSize: 5 });

    test("returns all records when no term", () => {
        const r = q.run(USERS);
        assert.strictEqual(r.total, 12);
    });

    test("returns first page by default", () => {
        const r = q.run(USERS);
        assert.strictEqual(r.page, 1);
        assert.strictEqual(r.data.length, 5);
    });

    test("calculates pages correctly", () => {
        const r = q.run(USERS);
        assert.strictEqual(r.pages, 3); // 12 records / 5 per page = 3 pages
    });

    test("from and to are correct on page 1", () => {
        const r = q.run(USERS);
        assert.strictEqual(r.from, 1);
        assert.strictEqual(r.to, 5);
    });

    test("hasNext is true on page 1", () => {
        const r = q.run(USERS);
        assert.strictEqual(r.hasNext, true);
    });

    test("hasPrev is false on page 1", () => {
        const r = q.run(USERS);
        assert.strictEqual(r.hasPrev, false);
    });

    test("ms is a number", () => {
        const r = q.run(USERS);
        assert.strictEqual(typeof r.ms, "number");
    });

});

// ── Search ────────────────────────────────────────────────

describe("run — search", () => {

    const q = createQuery({ search: ["name", "email", "department"], pageSize: 20 });

    test("finds by name", () => {
        const r = q.run(USERS, { term: "arjun" });
        assert.strictEqual(r.total, 1);
        assert.strictEqual(r.data[0].name, "Arjun Sharma");
    });

    test("finds by email", () => {
        const r = q.run(USERS, { term: "priya@acme" });
        assert.strictEqual(r.total, 1);
        assert.strictEqual(r.data[0].name, "Priya Nair");
    });

    test("finds by department", () => {
        const r = q.run(USERS, { term: "engineering" });
        assert.strictEqual(r.total, 4);
    });

    test("search is case insensitive", () => {
        const r1 = q.run(USERS, { term: "ARJUN" });
        const r2 = q.run(USERS, { term: "arjun" });
        assert.strictEqual(r1.total, r2.total);
    });

    test("returns term in result", () => {
        const r = q.run(USERS, { term: "arjun" });
        assert.strictEqual(r.term, "arjun");
    });

    test("empty term returns all records", () => {
        const r = q.run(USERS, { term: "" });
        assert.strictEqual(r.total, 12);
    });

    test("no match returns zero total", () => {
        const r = q.run(USERS, { term: "zzzznotfound" });
        assert.strictEqual(r.total, 0);
    });

    test("partial match works", () => {
        const r = q.run(USERS, { term: "nair" });
        assert.strictEqual(r.total, 2); // Priya Nair + Meera Nair
    });

});

// ── Sort ──────────────────────────────────────────────────

describe("run — sort", () => {

    const q = createQuery({ search: ["name"], pageSize: 20 });

    test("sorts by name asc by default", () => {
        const q2 = createQuery({ search: ["name"], sort: { field: "name", dir: "asc" }, pageSize: 20 });
        const r = q2.run(USERS);
        assert.strictEqual(r.data[0].name, "Aditya Kumar");
    });

    test("sorts by name desc", () => {
        const r = q.run(USERS, { sortField: "name", sortDir: "desc" });
        assert.strictEqual(r.data[0].name, "Vikram Singh");
    });

    test("sorts by salary asc", () => {
        const r = q.run(USERS, { sortField: "salary", sortDir: "asc" });
        assert.strictEqual(r.data[0].salary, 55000);
    });

    test("sorts by salary desc", () => {
        const r = q.run(USERS, { sortField: "salary", sortDir: "desc" });
        assert.strictEqual(r.data[0].salary, 110000);
    });

    test("sortField is returned in result", () => {
        const r = q.run(USERS, { sortField: "salary", sortDir: "asc" });
        assert.strictEqual(r.sortField, "salary");
        assert.strictEqual(r.sortDir, "asc");
    });

    test("does not mutate original array", () => {
        const original = [...USERS];
        q.run(USERS, { sortField: "salary", sortDir: "desc" });
        assert.deepStrictEqual(USERS, original);
    });

});

// ── Pagination ────────────────────────────────────────────

describe("run — pagination", () => {

    const q = createQuery({ search: ["name"], pageSize: 5 });

    test("page 2 returns correct records", () => {
        const r = q.run(USERS, { page: 2 });
        assert.strictEqual(r.page, 2);
        assert.strictEqual(r.from, 6);
        assert.strictEqual(r.to, 10);
        assert.strictEqual(r.data.length, 5);
    });

    test("last page returns remaining records", () => {
        const r = q.run(USERS, { page: 3 });
        assert.strictEqual(r.page, 3);
        assert.strictEqual(r.from, 11);
        assert.strictEqual(r.to, 12);
        assert.strictEqual(r.data.length, 2);
    });

    test("hasPrev is true on page 2", () => {
        const r = q.run(USERS, { page: 2 });
        assert.strictEqual(r.hasPrev, true);
    });

    test("hasNext is false on last page", () => {
        const r = q.run(USERS, { page: 3 });
        assert.strictEqual(r.hasNext, false);
    });

    test("out of bounds page clamps to last page", () => {
        const r = q.run(USERS, { page: 999 });
        assert.strictEqual(r.page, 3);
    });

    test("page 0 clamps to page 1", () => {
        const r = q.run(USERS, { page: 0 });
        assert.strictEqual(r.page, 1);
    });

    test("pageSize override works", () => {
        const r = q.run(USERS, { pageSize: 3 });
        assert.strictEqual(r.data.length, 3);
        assert.strictEqual(r.pages, 4);
    });

});

// ── filterFn ──────────────────────────────────────────────

describe("run — filterFn", () => {

    const q = createQuery({ search: ["name"], pageSize: 20 });

    test("filters by role", () => {
        const r = q.run(USERS, { filterFn: u => u.role === "Admin" });
        assert.strictEqual(r.total, 3);
        r.data.forEach(u => assert.strictEqual(u.role, "Admin"));
    });

    test("filters by status", () => {
        const r = q.run(USERS, { filterFn: u => u.status === "Inactive" });
        assert.strictEqual(r.total, 3);
    });

    test("filterFn + term work together", () => {
        // Admins whose name contains 'a'
        const r = q.run(USERS, {
            term: "a",
            filterFn: u => u.role === "Admin",
        });
        r.data.forEach(u => assert.strictEqual(u.role, "Admin"));
        r.data.forEach(u => assert.ok(u.name.toLowerCase().includes("a")));
    });

    test("filterFn returning false for all gives zero total", () => {
        const r = q.run(USERS, { filterFn: () => false });
        assert.strictEqual(r.total, 0);
    });

    test("filterFn with salary range", () => {
        const r = q.run(USERS, { filterFn: u => u.salary >= 90000 });
        assert.strictEqual(r.total, 3); // Arjun 95k, Vikram 102k, Aditya 110k
        r.data.forEach(u => assert.ok(u.salary >= 90000));
    });

});

// ── Static filter (config.filter) ─────────────────────────

describe("run — config.filter", () => {

    test("static filter always applied", () => {
        const q = createQuery({
            search: ["name"],
            filter: u => u.status === "Active",
            pageSize: 20,
        });
        const r = q.run(USERS);
        r.data.forEach(u => assert.strictEqual(u.status, "Active"));
    });

    test("static filter + filterFn both apply", () => {
        const q = createQuery({
            search: ["name"],
            filter: u => u.status === "Active",
            pageSize: 20,
        });
        const r = q.run(USERS, { filterFn: u => u.role === "Admin" });
        r.data.forEach(u => {
            assert.strictEqual(u.status, "Active");
            assert.strictEqual(u.role, "Admin");
        });
    });

});

// ── isEmpty / isNoResults ─────────────────────────────────

describe("run — empty states", () => {

    const q = createQuery({ search: ["name"], pageSize: 10 });

    test("isEmpty is true when data is empty and no term", () => {
        const r = q.run([]);
        assert.strictEqual(r.isEmpty, true);
        assert.strictEqual(r.isNoResults, false);
    });

    test("isNoResults is true when search finds nothing", () => {
        const r = q.run(USERS, { term: "zzzznotfound" });
        assert.strictEqual(r.isNoResults, true);
        assert.strictEqual(r.isEmpty, false);
    });

    test("neither isEmpty nor isNoResults when data exists", () => {
        const r = q.run(USERS);
        assert.strictEqual(r.isEmpty, false);
        assert.strictEqual(r.isNoResults, false);
    });

    test("from and to are 0 when no results", () => {
        const r = q.run(USERS, { term: "zzzznotfound" });
        assert.strictEqual(r.from, 0);
        assert.strictEqual(r.to, 0);
    });

});

// ── Selection helpers ─────────────────────────────────────

describe("run — selection", () => {

    const q = createQuery({ search: ["name"], pageSize: 5 });

    test("allSelected is false when nothing selected", () => {
        const r = q.run(USERS, { selected: [] });
        assert.strictEqual(r.allSelected, false);
        assert.strictEqual(r.someSelected, false);
    });

    test("someSelected is true when some rows selected", () => {
        const r = q.run(USERS, { page: 1, selected: [1, 2] });
        assert.strictEqual(r.someSelected, true);
        assert.strictEqual(r.allSelected, false);
    });

    test("allSelected is true when all page rows selected", () => {
        const r = q.run(USERS, { page: 1, selected: [1, 2, 3, 4, 5] });
        assert.strictEqual(r.allSelected, true);
        assert.strictEqual(r.someSelected, false);
    });

});

// ── GroupBy ───────────────────────────────────────────────

describe("run — groupBy", () => {

    const q = createQuery({ search: ["name"], groupBy: "role" });

    test("returns groups object", () => {
        const r = q.run(USERS);
        assert.ok(r.groups);
        assert.ok(r.groups["Admin"]);
        assert.ok(r.groups["Editor"]);
        assert.ok(r.groups["Viewer"]);
    });

    test("groups contain correct records", () => {
        const r = q.run(USERS);
        r.groups["Admin"].forEach(u => assert.strictEqual(u.role, "Admin"));
        r.groups["Editor"].forEach(u => assert.strictEqual(u.role, "Editor"));
        r.groups["Viewer"].forEach(u => assert.strictEqual(u.role, "Viewer"));
    });

    test("total is correct", () => {
        const r = q.run(USERS);
        assert.strictEqual(r.total, 12);
    });

    test("groupBy + term filters before grouping", () => {
        const r = q.run(USERS, { term: "nair" }); // Priya Nair (Editor) + Meera Nair (Viewer)
        assert.strictEqual(r.total, 2);
        assert.ok(r.groups["Editor"]);
        assert.ok(r.groups["Viewer"]);
        assert.strictEqual(r.groups["Editor"].length, 1);
        assert.strictEqual(r.groups["Viewer"].length, 1);
    });

    test("ms is a number", () => {
        const r = q.run(USERS);
        assert.strictEqual(typeof r.ms, "number");
    });

});

// ── toJSON / fromJSON ─────────────────────────────────────

describe("serialization", () => {

    test("toJSON returns config object", () => {
        const q = createQuery({ search: ["name", "email"], sort: { field: "name", dir: "asc" }, pageSize: 5 });
        const json = q.toJSON();
        assert.deepStrictEqual(json.search, ["name", "email"]);
        assert.deepStrictEqual(json.sort, { field: "name", dir: "asc" });
        assert.strictEqual(json.pageSize, 5);
    });

    test("fromJSON restores a working query", () => {
        const q = createQuery({ search: ["name"], sort: { field: "name", dir: "asc" }, pageSize: 5 });
        const json = q.toJSON();
        const restored = createQuery.fromJSON(json);
        const r = restored.run(USERS, { term: "arjun" });
        assert.strictEqual(r.total, 1);
        assert.strictEqual(r.data[0].name, "Arjun Sharma");
    });

    test("toJSON is serializable via JSON.stringify", () => {
        const q = createQuery({ search: ["name"], pageSize: 5 });
        const str = JSON.stringify(q.toJSON());
        const restored = createQuery.fromJSON(JSON.parse(str));
        const r = restored.run(USERS);
        assert.strictEqual(r.total, 12);
    });

});

// ── Edge cases ────────────────────────────────────────────

describe("edge cases", () => {

    test("empty array returns isEmpty true", () => {
        const q = createQuery({ search: ["name"], pageSize: 10 });
        const r = q.run([]);
        assert.strictEqual(r.isEmpty, true);
        assert.strictEqual(r.total, 0);
        assert.strictEqual(r.pages, 1);
    });

    test("single record works correctly", () => {
        const q = createQuery({ search: ["name"], pageSize: 10 });
        const r = q.run([USERS[0]]);
        assert.strictEqual(r.total, 1);
        assert.strictEqual(r.pages, 1);
        assert.strictEqual(r.hasNext, false);
        assert.strictEqual(r.hasPrev, false);
        assert.strictEqual(r.from, 1);
        assert.strictEqual(r.to, 1);
    });

    test("original data array is never mutated", () => {
        const q = createQuery({ search: ["name"], sort: { field: "salary", dir: "desc" }, pageSize: 5 });
        const copy = [...USERS];
        q.run(USERS, { term: "a", sortField: "salary", sortDir: "desc" });
        assert.deepStrictEqual(USERS, copy);
    });

    test("pageSize 1 paginates every record", () => {
        const q = createQuery({ search: ["name"], pageSize: 1 });
        const r = q.run(USERS);
        assert.strictEqual(r.pages, 12);
        assert.strictEqual(r.data.length, 1);
    });

    test("pageSize larger than data returns all on one page", () => {
        const q = createQuery({ search: ["name"], pageSize: 100 });
        const r = q.run(USERS);
        assert.strictEqual(r.pages, 1);
        assert.strictEqual(r.data.length, 12);
        assert.strictEqual(r.hasNext, false);
        assert.strictEqual(r.hasPrev, false);
    });

    test("records with missing search field do not throw", () => {
        const q = createQuery({ search: ["name", "bio"], pageSize: 10 });
        assert.doesNotThrow(() => q.run(USERS, { term: "test" }));
    });

});