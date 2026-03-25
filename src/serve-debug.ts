/**
 * Minimal static server for `out/qc-report.html` after `npm run qc`.
 * Usage: npm run serve:debug → http://127.0.0.1:3847/
 */
import { createReadStream, existsSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "node:http";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..", "out");
const PORT = 3847;

const server = createServer((req, res) => {
  const url = req.url?.split("?")[0] ?? "/";
  const safe = normalize(url).replace(/^(\.\.[\/\\])+/, "");
  const file = safe === "/" || safe === "" ? "qc-report.html" : safe.replace(/^\//, "");
  const abs = join(root, file);
  if (!abs.startsWith(root) || !existsSync(abs)) {
    res.writeHead(404);
    res.end("Not found. Run npm run qc first.");
    return;
  }
  res.setHeader("Content-Type", file.endsWith(".html") ? "text/html; charset=utf-8" : "application/json");
  createReadStream(abs).pipe(res);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`MVD debug: http://127.0.0.1:${PORT}/qc-report.html`);
});
