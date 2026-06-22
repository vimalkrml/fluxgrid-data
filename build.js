const fs = require("fs");
const path = require("path");

const src = fs.readFileSync("src/index.js", "utf8");

// CJS build — already is CJS
fs.mkdirSync("dist", { recursive: true });
fs.writeFileSync("dist/index.js", src);

// ESM build — swap module.exports → export
const esm = src
    .replace(/module\.exports\s*=.*\n?/g, "")
    .replace(/module\.exports\.\w+\s*=.*\n?/g, "")
    + "\nexport { createQuery };\nexport default createQuery;\n";

fs.writeFileSync("dist/index.esm.js", esm);

// Copy types
fs.copyFileSync("src/index.d.ts", "dist/index.d.ts");