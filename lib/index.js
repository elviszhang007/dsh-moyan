// Node half of dsh-moyan: serves the editable corpus file to the browser
// half. The browser UI fetches /plugins/dsh-moyan/corpus.txt on every page
// load, and this handler re-reads <package root>/corpus.txt on every
// request — so editing that file is the day-to-day way to add or remove
// quotes: save, refresh the page, done. No restart, no rebuild.
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** The corpus file lives at the package root, next to package.json. */
const CORPUS_PATH = join(dirname(fileURLToPath(import.meta.url)), "..", "corpus.txt");

export function apply(ctx) {
  // Soft dependency: non-web profiles have no webServer service and the
  // callback simply never fires there (this package stays a safe no-op).
  ctx.inject(["webServer"], (webCtx) => {
    webCtx.effect(() => webCtx.webServer.register({
      kind: "prefix",
      path: "/plugins/dsh-moyan/corpus.txt",
      handler: async (req, res) => {
        if (req.method !== "GET" && req.method !== "HEAD") {
          res.writeHead(405);
          res.end();
          return;
        }
        try {
          const body = await readFile(CORPUS_PATH);
          res.writeHead(200, {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "no-cache",
          });
          res.end(body);
        } catch {
          // Missing or unreadable corpus file: the browser half falls back
          // to its built-in corpus, so the plugin keeps working.
          res.writeHead(404);
          res.end();
        }
      },
    }), "dsh-moyan: corpus route");
  });
}
