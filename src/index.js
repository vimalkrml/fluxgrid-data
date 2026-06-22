/**
 * @datafluxgrid/fluxgrid-data
 * Composable frontend data pipelines
 */

/**
 * @template T
 * @param {import('./index').QueryConfig<T>} config
 * @returns {import('./index').QueryInstance<T>}
 */
function createQuery(config) {
    return {
        run(data, options = {}) {
            const t0 = performance.now();

            const {
                term = "",
                page = 1,
                sortField = config.sort?.field ?? "",
                sortDir = config.sort?.dir ?? "asc",
                filterFn,
                selected = [],
                pageSize = config.pageSize ?? 10,
            } = options;

            let result = [...data];

            // 1. Static filter from config
            if (config.filter) result = result.filter(config.filter);

            // 2. Dynamic filter from run() — dropdown, slider etc
            if (filterFn) result = result.filter(filterFn);

            // 3. Search across specified fields
            if (term && config.search?.length) {
                const t = term.toLowerCase();
                result = result.filter((item) =>
                    config.search.some((field) =>
                        String(item[field] ?? "").toLowerCase().includes(t)
                    )
                );
            }

            // 4. Sort
            if (sortField) {
                result = [...result].sort((a, b) => {
                    const av = a[sortField];
                    const bv = b[sortField];
                    const cmp =
                        typeof av === "number"
                            ? av - bv
                            : String(av).localeCompare(String(bv));
                    return sortDir === "desc" ? -cmp : cmp;
                });
            }

            const total = result.length;

            // 5. GroupBy — returns different shape
            if (config.groupBy) {
                const groups = {};
                result.forEach((item) => {
                    const key = String(item[config.groupBy] ?? "Other");
                    if (!groups[key]) groups[key] = [];
                    groups[key].push(item);
                });
                return {
                    groups,
                    total,
                    ms: Math.round(performance.now() - t0),
                };
            }

            // 6. Paginate
            const pages = Math.max(1, Math.ceil(total / pageSize));
            const p = Math.max(1, Math.min(page, pages));
            const from = total === 0 ? 0 : (p - 1) * pageSize + 1;
            const to = Math.min(p * pageSize, total);
            const pageData = result.slice((p - 1) * pageSize, p * pageSize);

            // 7. Selection helpers (for checkbox select-all)
            const pageIds = pageData.map((x) => x.id).filter((id) => id != null);
            const selOnPage = pageIds.filter((id) => selected.includes(id));
            const allSelected = pageIds.length > 0 && selOnPage.length === pageIds.length;
            const someSelected = selOnPage.length > 0 && !allSelected;

            return {
                data: pageData,
                total,
                page: p,
                pages,
                pageSize,
                from,
                to,
                hasNext: p < pages,
                hasPrev: p > 1,
                term,
                sortField,
                sortDir,
                isEmpty: total === 0 && !term,
                isNoResults: total === 0 && !!term,
                allSelected,
                someSelected,
                ms: Math.round(performance.now() - t0),
            };
        },

        toJSON() {
            return { ...config };
        },
    };
}

createQuery.fromJSON = function (json) {
    return createQuery(json);
};

module.exports = { createQuery };
module.exports.createQuery = createQuery;