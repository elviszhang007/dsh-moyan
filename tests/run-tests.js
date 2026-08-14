// dsh-moyan tests. Run with `npm test` (Node >= 18, no dependencies).
//
// The client bundle is loaded exactly like the harness loads it, except the
// browser globals are stubbed: the factory registers through
// window.__ModuleLoader__.load, and only the pure helpers are exercised.
// React components are not rendered here (they run hooks only in a real
// render pass), so `react` and the icon primitives resolve to inert stubs.
import assert from "node:assert/strict";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

// --- browser global stubs ------------------------------------------------
function makeStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => {
      map.set(key, String(value));
    },
    removeItem: (key) => {
      map.delete(key);
    },
  };
}

let handoff = null;
globalThis.window = {
  __ModuleLoader__: {
    load: (h) => {
      handoff = h;
    },
  },
  localStorage: makeStorage(),
};
globalThis.document = {
  querySelector: () => null,
  createElement: () => ({ dataset: {}, setAttribute() {}, appendChild() {} }),
  head: { appendChild() {} },
};

await import(pathToFileURL(join(here, "..", "lib", "client.js")).href);
assert.ok(handoff !== null, "the client bundle registered its factory");

const hostApi = await import(pathToFileURL(join(here, "..", "lib", "index.js")).href);
assert.equal(typeof hostApi.apply, "function");

const reactStub = {};
const primitivesStub = {
  IconSettingsOutline14: () => null,
  IconRefreshOutline14: () => null,
  IconCloseFill14: () => null,
};
const api = handoff.factory((spec) => {
  if (spec === "react") return reactStub;
  if (spec === "@deepseek-ai/dsh-client-ui-primitives") return primitivesStub;
  throw new Error(`test: unexpected require("${spec}")`);
});
const T = api._test;
assert.equal(typeof api.apply, "function");
assert.deepEqual(api.inject, []);

// --- corpus sanity -------------------------------------------------------
{
  assert.ok(T.CORPUS.length >= 60, `corpus should stay rich (got ${T.CORPUS.length})`);
  const seen = new Set();
  for (const entry of T.CORPUS) {
    assert.ok(typeof entry.t === "string" && entry.t.length > 0, "every entry needs text");
    assert.ok([...entry.t].length <= 30, `quote exceeds 30 chars: ${entry.t}`);
    assert.ok(typeof entry.s === "string" && entry.s.length > 0, `entry needs a source: ${entry.t}`);
    assert.ok(!seen.has(entry.t), `duplicate quote: ${entry.t}`);
    seen.add(entry.t);
  }
}

// --- todayKey -------------------------------------------------------------
{
  assert.equal(T.todayKey(new Date(2026, 7, 14)), "2026-08-14");
  assert.match(T.todayKey(), /^\d{4}-\d{1,2}-\d{1,2}$/);
}

// --- randomIndex ----------------------------------------------------------
{
  const alwaysZero = () => 0;
  const almostOne = () => 0.999999;
  assert.equal(T.randomIndex(1, 0, alwaysZero), 0);
  assert.equal(T.randomIndex(10, -1, alwaysZero), 0);
  // exclusion: with rng -> 0 and exclude = 0, the pick must jump to 1
  assert.equal(T.randomIndex(10, 0, alwaysZero), 1);
  assert.equal(T.randomIndex(10, -1, almostOne), 9);
  // exclusion: never returns the excluded index when count > 1
  for (let i = 0; i < 50; i++) {
    const index = T.randomIndex(10, 5, Math.random);
    assert.ok(index >= 0 && index < 10);
    assert.notEqual(index, 5);
  }
  // Set / array excludes
  for (let i = 0; i < 50; i++) {
    const index = T.randomIndex(10, new Set([2, 4, 6]), Math.random);
    assert.ok(![2, 4, 6].includes(index));
  }
  assert.equal(T.randomIndex(10, [0, 1, 2, 3, 4, 5, 6, 7, 8], almostOne), 9);
  // empty pool: every index excluded falls back to the full range
  assert.ok([0, 1].includes(T.randomIndex(2, new Set([0, 1]), alwaysZero)));
  assert.equal(T.randomIndex(2, new Set([0, 1]), almostOne), 1);
  // uniform-ish sampling: 2000 draws over 10 buckets, each within 120..280
  {
    const buckets = new Array(10).fill(0);
    for (let i = 0; i < 2000; i++) buckets[T.randomIndex(10, -1, Math.random)]++;
    for (const n of buckets) assert.ok(n >= 120 && n <= 280, `bucket drifted: ${buckets}`);
  }
}

// --- recent / history buffers ---------------------------------------------
{
  assert.equal(T.HISTORY_LIMIT, 5);
  assert.equal(T.RECENT_LIMIT, 10);
  assert.deepEqual(T.pushHistory([], { t: "甲", s: "a" }), [{ t: "甲", s: "a" }]);
  const history = ["h1", "h2", "h3", "h4", "h5", "h6"]
    .reduce((acc, t) => T.pushHistory(acc, { t, s: "x" }), []);
  assert.equal(history.length, 5);
  assert.equal(history[0].t, "h2", "history keeps only the last 5 steps");
  const recent = ["r1", "r2", "r3", "r4", "r5", "r6", "r7", "r8", "r9", "r10", "r11"]
    .reduce((acc, t) => T.pushRecent(acc, t), []);
  assert.equal(recent.length, 10);
  assert.deepEqual(recent, ["r2", "r3", "r4", "r5", "r6", "r7", "r8", "r9", "r10", "r11"]);
}

// --- excludedIndexes -------------------------------------------------------
{
  const corpus = [{ t: "甲" }, { t: "乙" }, { t: "丙" }];
  assert.deepEqual([...T.excludedIndexes(corpus, ["甲", "丙"])], [0, 2]);
  assert.deepEqual([...T.excludedIndexes(corpus, [])], []);
}

// --- pickQuote ------------------------------------------------------------
{
  const daily = { mode: "daily", date: "2026-08-14", index: 3 };
  // same day: reuse the stored index
  assert.equal(T.pickQuote(daily, "2026-08-14", () => 0.9).index, 3);
  // new day: roll to a fresh one, never the stored one
  const rolled = T.pickQuote(daily, "2026-08-15", () => 0);
  assert.notEqual(rolled.index, 3);
  assert.deepEqual({ index: rolled.index, t: rolled.t, s: rolled.s }, {
    index: rolled.index,
    t: T.CORPUS[rolled.index].t,
    s: T.CORPUS[rolled.index].s,
  });
  // open mode: the stored index is irrelevant
  const openA = T.pickQuote({ mode: "open", date: "", index: 2 }, "2026-08-14", () => 0.3);
  const openB = T.pickQuote({ mode: "open", date: "", index: 9 }, "2026-08-14", () => 0.3);
  assert.equal(openA.index, openB.index);
}

// --- parseCorpus ----------------------------------------------------------
{
  const parsed = T.parseCorpus(`
# a comment
句子一 | 出处一
句子二｜出处二

broken line without separator
| 没有句子
没有出处 |

`);
  assert.deepEqual(parsed, [
    { t: "句子一", s: "出处一" },
    { t: "句子二", s: "出处二" },
  ]);
  assert.deepEqual(T.parseCorpus(""), []);
}

// --- corpus.txt consistency ----------------------------------------------
{
  const { readFileSync } = await import("node:fs");
  const raw = readFileSync(join(here, "..", "corpus.txt"), "utf8");
  const parsed = T.parseCorpus(raw);
  assert.ok(parsed.length >= 60, `corpus.txt should stay rich (got ${parsed.length})`);
  const seen = new Set();
  for (const entry of parsed) {
    assert.ok([...entry.t].length <= 30, `corpus.txt quote exceeds 30 chars: ${entry.t}`);
    assert.ok(!seen.has(entry.t), `corpus.txt duplicate quote: ${entry.t}`);
    assert.ok(!entry.t.includes("|"), `corpus.txt quote contains a separator: ${entry.t}`);
    if (entry.s.includes("《")) {
      assert.ok(entry.s.includes("》"), `corpus.txt unbalanced brackets: ${entry.s}`);
    }
    seen.add(entry.t);
  }
  // The editable file and the built-in fallback must stay in sync.
  const key = (e) => `${e.t}|${e.s}`;
  const txtSet = new Set(parsed.map(key));
  const builtinSet = new Set(T.CORPUS.map(key));
  const onlyTxt = [...txtSet].filter((k) => !builtinSet.has(k));
  const onlyBuiltin = [...builtinSet].filter((k) => !txtSet.has(k));
  assert.equal(onlyTxt.length, 0, `corpus.txt entries missing from built-in fallback: ${onlyTxt}`);
  assert.equal(onlyBuiltin.length, 0, `built-in fallback entries missing from corpus.txt: ${onlyBuiltin}`);
}

// --- source attribution spot checks ---------------------------------------
// Hand-verified pairs; each must appear verbatim in both sources.
{
  const { readFileSync } = await import("node:fs");
  const raw = readFileSync(join(here, "..", "corpus.txt"), "utf8");
  const txt = T.parseCorpus(raw);
  const KNOWN = [
    ["探索未至之境", "深度求索公司"],
    ["路漫漫其修远兮，吾将上下而求索。", "屈原《离骚》"],
    ["生命是一袭华美的袍，爬满了蚤子。", "张爱玲《天才梦》"],
    ["于千万人之中遇见你所要遇见的人。", "张爱玲《爱》"],
    ["我行过许多地方的桥，看过许多次数的云。", "沈从文《从文家书》"],
    ["从前的日色变得慢，车，马，邮件都慢，一生只够爱一个人。", "木心《云雀叫了一整天》"],
    ["生活是种律动，须有光有影，有左有右，有晴有雨。", "老舍《小病》"],
    ["一个人只拥有此生此世是不够的，他还应该拥有诗意的世界。", "王小波《万寿寺》"],
    ["命定的局限尽可永在，不屈的挑战却不可须臾或缺。", "史铁生《病隙碎笔》"],
    ["你走，我不送你；你来，无论多大风多大雨，我要去接你。", "梁实秋《送行》"],
    ["卑鄙是卑鄙者的通行证，高尚是高尚者的墓志铭。", "北岛《回答》"],
    ["与其在悬崖上展览千年，不如在爱人肩头痛哭一晚。", "舒婷《神女峰》"],
    ["他强由他强，清风拂山岗；他横由他横，明月照大江。", "金庸《倚天屠龙记》"],
    ["我们都生活在阴沟里，但仍有人仰望星空。", "王尔德《温德米尔夫人的扇子》"],
    ["这是最好的时代，这是最坏的时代。", "狄更斯《双城记》"],
    ["在隆冬，我终于知道，我身上有一个不可战胜的夏天。", "加缪《夏天集》"],
    ["回忆是一条没有归途的路。", "马尔克斯《百年孤独》"],
    ["我心里一直都在暗暗设想，天堂应该是图书馆的模样。", "博尔赫斯《关于天赐的诗》"],
    ["人的一切都应该是美丽的：面貌、衣裳、心灵、思想。", "契诃夫《万尼亚舅舅》"],
    ["人最宝贵的是生命，生命属于人只有一次。", "奥斯特洛夫斯基《钢铁是怎样炼成的》"],
    ["世界是美好的，值得我们为之奋斗。", "海明威《丧钟为谁而鸣》"],
    ["犹豫，就会败北。", "《只狼》"],
  ];
  const match = (list, [t, s]) => list.some((e) => e.t === t && e.s === s);
  for (const pair of KNOWN) {
    assert.ok(match(txt, pair), `corpus.txt spot check failed: ${pair[0]} / ${pair[1]}`);
    assert.ok(match(T.CORPUS, pair), `built-in spot check failed: ${pair[0]} / ${pair[1]}`);
  }
}

// --- pickQuote against a custom corpus ------------------------------------
{
  const small = [
    { t: "甲", s: "出处甲" },
    { t: "乙", s: "出处乙" },
    { t: "丙", s: "出处丙" },
  ];
  const daily = { mode: "daily", date: "2026-08-14", index: 1 };
  assert.deepEqual(T.pickQuote(daily, "2026-08-14", () => 0, small), { index: 1, t: "乙", s: "出处乙" });
  // stored index out of range for this corpus: fresh pick, never index 1
  const outOfRange = { mode: "daily", date: "2026-08-13", index: 9 };
  const rolled = T.pickQuote(outOfRange, "2026-08-14", () => 0, small);
  assert.notEqual(rolled.index, 1);
  assert.ok(rolled.index >= 0 && rolled.index < 3);
  assert.equal(rolled.t, small[rolled.index].t);
}

// --- settings persistence -------------------------------------------------
{
  window.localStorage = makeStorage();
  assert.deepEqual(T.loadSettings(), T.DEFAULT_SETTINGS);

  window.localStorage = makeStorage({ [T.STORAGE_KEY]: "{not json" });
  assert.deepEqual(T.loadSettings(), T.DEFAULT_SETTINGS, "corrupted JSON falls back");

  window.localStorage = makeStorage({
    [T.STORAGE_KEY]: JSON.stringify({ mode: "weekly", date: "x", index: 0 }),
  });
  assert.deepEqual(T.loadSettings(), T.DEFAULT_SETTINGS, "unknown mode falls back");

  window.localStorage = makeStorage();
  T.saveSettings({ mode: "daily", date: "2026-08-14", index: 7 });
  assert.deepEqual(T.loadSettings(), { mode: "daily", date: "2026-08-14", index: 7 });
}

// --- nextMidnightDelay ----------------------------------------------------
{
  const noon = new Date(2026, 7, 14, 12, 0, 0);
  const delay = T.nextMidnightDelay(noon);
  // 12h + 1s grace = 43201000 ms
  assert.ok(delay > 43200000 && delay < 43202000, `unexpected delay ${delay}`);
}

// --- apply() registration -------------------------------------------------
{
  // no slots service (e.g. non-web composition): quiet no-op
  api.apply({ get: () => undefined });

  let registered = null;
  const fakeSlots = {
    inject: (name, callback) => {
      assert.equal(name, "sidebar.footer.action");
      callback();
    },
    register: (options, component) => {
      registered = { options, component };
    },
  };
  api.apply({ get: (name) => (name === "slots" ? fakeSlots : undefined) });
  assert.ok(registered !== null, "register is called once the slot is declared");
  assert.equal(registered.options.name, "sidebar.footer.action");
  assert.equal(registered.options.id, "moyan");
  assert.equal(registered.options.order, -100);
  assert.equal(typeof registered.component, "function");
}

// --- host half: corpus route ----------------------------------------------
{
  // without a webServer service (non-web profile): quiet no-op
  hostApi.apply({ inject: () => {} });

  let registeredRoute = null;
  let effectDisposer = null;
  const fakeWebCtx = {
    effect: (fn) => {
      effectDisposer = fn;
    },
    webServer: {
      register: (options) => {
        registeredRoute = options;
      },
    },
  };
  const fakeCtx = {
    inject: (deps, callback) => {
      assert.deepEqual(deps, ["webServer"]);
      callback(fakeWebCtx);
    },
  };
  hostApi.apply(fakeCtx);
  assert.ok(effectDisposer !== null, "the route registers inside an owned effect");
  effectDisposer();
  assert.ok(registeredRoute !== null);
  assert.equal(registeredRoute.kind, "prefix");
  assert.equal(registeredRoute.path, "/plugins/dsh-moyan/corpus.txt");

  // exercise the handler against the real corpus.txt
  let status = 0;
  let headers = null;
  let body = "";
  const res = {
    writeHead: (code, h) => {
      status = code;
      headers = h;
    },
    end: (chunk) => {
      body = Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk ?? "");
    },
  };
  await registeredRoute.handler({ method: "GET" }, res);
  assert.equal(status, 200);
  assert.equal(headers["content-type"], "text/plain; charset=utf-8");
  assert.equal(headers["cache-control"], "no-cache");
  assert.ok(body.includes("路漫漫其修远兮"), "served body carries the corpus");

  status = 0;
  await registeredRoute.handler({ method: "POST" }, res);
  assert.equal(status, 405);
}

console.log("dsh-moyan: all tests passed.");
