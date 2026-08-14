// Browser half of dsh-moyan. Registers as a client module (the same
// `window.__ModuleLoader__.load({ id, factory })` contract the shipped client
// plugins use) and renders one quote directly above the sidebar settings row.
//
// Mount point: `sidebar.footer.action` — the list slot the sidebar shell
// renders in a row ABOVE `sidebar.settings`. The slot renderer wraps every
// slot in a `display: contents` cell, so this entry's root element is a
// direct flex child of the footer row and grows to fill it (the Cordis panel
// keeps its own compact cell at the right end).
//
// The quote block never truncates: the sentence wraps across as many lines
// as it needs and the source gets its own line, so no ellipsis ever hides
// text.
//
// Services are reached through the client Cordis context only; React and the
// icon primitives come from the shell's module seeds (`require` here is the
// module loader's require, not Node's).
window.__ModuleLoader__.load({
  id: "dsh-moyan",
  factory: (require) => {
    "use strict";
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    const React = require("react");
    const {
      IconSettingsOutline14,
      IconRefreshOutline14,
      IconCloseFill14,
      IconChevronLeftOutline14,
    } = require("@deepseek-ai/dsh-client-ui-primitives");

    // ------------------------------------------------------------------
    // Built-in fallback corpus. Day-to-day editing happens in the
    // `corpus.txt` file at the package root: the host half serves it over
    // /plugins/dsh-moyan/corpus.txt and the UI prefers it when present.
    // This list only keeps the plugin working when the file is missing or
    // unreadable. Text is kept short (30 chars at most).
    // ------------------------------------------------------------------
    const CORPUS = [
      // 古诗词 / 古文
      { t: "路漫漫其修远兮，吾将上下而求索。", s: "屈原《离骚》" },
      { t: "会当凌绝顶，一览众山小。", s: "杜甫《望岳》" },
      { t: "天生我材必有用，千金散尽还复来。", s: "李白《将进酒》" },
      { t: "长风破浪会有时，直挂云帆济沧海。", s: "李白《行路难》" },
      { t: "山重水复疑无路，柳暗花明又一村。", s: "陆游《游山西村》" },
      { t: "海内存知己，天涯若比邻。", s: "王勃《送杜少府之任蜀州》" },
      { t: "莫愁前路无知己，天下谁人不识君。", s: "高适《别董大》" },
      { t: "落红不是无情物，化作春泥更护花。", s: "龚自珍《己亥杂诗》" },
      { t: "问渠那得清如许，为有源头活水来。", s: "朱熹《观书有感》" },
      { t: "等闲识得东风面，万紫千红总是春。", s: "朱熹《春日》" },
      { t: "纸上得来终觉浅，绝知此事要躬行。", s: "陆游《冬夜读书示子聿》" },
      { t: "千磨万击还坚劲，任尔东西南北风。", s: "郑燮《竹石》" },
      { t: "不畏浮云遮望眼，自缘身在最高层。", s: "王安石《登飞来峰》" },
      { t: "沉舟侧畔千帆过，病树前头万木春。", s: "刘禹锡《酬乐天》" },
      { t: "无可奈何花落去，似曾相识燕归来。", s: "晏殊《浣溪沙》" },
      { t: "竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。", s: "苏轼《定风波》" },
      { t: "回首向来萧瑟处，归去，也无风雨也无晴。", s: "苏轼《定风波》" },
      { t: "人生如逆旅，我亦是行人。", s: "苏轼《临江仙》" },
      { t: "且将新火试新茶，诗酒趁年华。", s: "苏轼《望江南》" },
      { t: "春风得意马蹄疾，一日看尽长安花。", s: "孟郊《登科后》" },
      { t: "寄蜉蝣于天地，渺沧海之一粟。", s: "苏轼《赤壁赋》" },
      { t: "大鹏一日同风起，扶摇直上九万里。", s: "李白《上李邕》" },
      { t: "仰天大笑出门去，我辈岂是蓬蒿人。", s: "李白《南陵别儿童入京》" },
      { t: "醉后不知天在水，满船清梦压星河。", s: "唐珙《题龙阳县青草湖》" },
      { t: "黑发不知勤学早，白首方悔读书迟。", s: "颜真卿《劝学》" },
      { t: "欲穷千里目，更上一层楼。", s: "王之涣《登鹳雀楼》" },
      { t: "千淘万漉虽辛苦，吹尽狂沙始到金。", s: "刘禹锡《浪淘沙》" },
      { t: "不识庐山真面目，只缘身在此山中。", s: "苏轼《题西林壁》" },
      { t: "梅须逊雪三分白，雪却输梅一段香。", s: "卢钺《雪梅》" },
      { t: "苔花如米小，也学牡丹开。", s: "袁枚《苔》" },
      { t: "野火烧不尽，春风吹又生。", s: "白居易《赋得古原草送别》" },
      { t: "及时当勉励，岁月不待人。", s: "陶渊明《杂诗》" },
      { t: "海阔凭鱼跃，天高任鸟飞。", s: "《增广贤文》" },
      // 名著 / 名句
      { t: "真的勇士，敢于直面惨淡的人生。", s: "鲁迅《记念刘和珍君》" },
      { t: "世上本没有路，走的人多了，也便成了路。", s: "鲁迅《故乡》" },
      { t: "幸福的家庭都是相似的，不幸的家庭各有各的不幸。", s: "《安娜·卡列尼娜》" },
      { t: "人可以被毁灭，但不能被打败。", s: "《老人与海》" },
      { t: "生存还是毁灭，这是一个问题。", s: "《哈姆雷特》" },
      { t: "凡是过往，皆为序章。", s: "莎士比亚《暴风雨》" },
      { t: "如果冬天来了，春天还会远吗？", s: "雪莱《西风颂》" },
      { t: "重要的东西用眼睛是看不见的。", s: "《小王子》" },
      { t: "星星发亮，是为了让每个人找到属于自己的星星。", s: "《小王子》" },
      { t: "满地都是六便士，他却抬头看见了月亮。", s: "《月亮与六便士》" },
      { t: "黑夜给了我黑色的眼睛，我却用它寻找光明。", s: "顾城《一代人》" },
      { t: "面朝大海，春暖花开。", s: "海子《面朝大海》" },
      { t: "生如夏花之绚烂，死如秋叶之静美。", s: "泰戈尔《飞鸟集》" },
      { t: "世界以痛吻我，我要报之以歌。", s: "泰戈尔《飞鸟集》" },
      { t: "天空没有留下翅膀的痕迹，但我已飞过。", s: "泰戈尔《飞鸟集》" },
      { t: "人是为活着本身而活着的。", s: "余华《活着》" },
      { t: "生活不止眼前的苟且，还有诗和远方。", s: "《生活不止眼前的苟且》" },
      { t: "我思故我在。", s: "笛卡尔《谈谈方法》" },
      { t: "认识你自己。", s: "德尔斐神谕" },
      { t: "未哭过长夜的人，不足以语人生。", s: "歌德" },
      { t: "真正的英雄主义，是认清生活真相后依然热爱生活。", s: "罗曼·罗兰" },
      { t: "我荒废了时间，时间便把我荒废了。", s: "莎士比亚《理查二世》" },
      { t: "人是一根会思想的芦苇。", s: "帕斯卡《思想录》" },
      { t: "谁终将声震人间，必长久深自缄默。", s: "尼采" },
      // 文学作品（扩充）
      { t: "生命是一袭华美的袍，爬满了蚤子。", s: "张爱玲《天才梦》" },
      { t: "于千万人之中遇见你所要遇见的人。", s: "张爱玲《爱》" },
      { t: "我行过许多地方的桥，看过许多次数的云。", s: "沈从文《从文家书》" },
      { t: "命定的局限尽可永在，不屈的挑战却不可须臾或缺。", s: "史铁生《病隙碎笔》" },
      { t: "一个人只拥有此生此世是不够的，他还应该拥有诗意的世界。", s: "王小波《万寿寺》" },
      { t: "从前的日色变得慢，车，马，邮件都慢，一生只够爱一个人。", s: "木心《云雀叫了一整天》" },
      { t: "生活是种律动，须有光有影，有左有右，有晴有雨。", s: "老舍《小病》" },
      { t: "不乱于心，不困于情，不畏将来，不念过往。", s: "丰子恺《不宠无惊过一生》" },
      { t: "你走，我不送你；你来，无论多大风多大雨，我要去接你。", s: "梁实秋《送行》" },
      { t: "人一定要爱着点什么，恰似草木对光阴的钟情。", s: "汪曾祺《人间草木》" },
      { t: "卑鄙是卑鄙者的通行证，高尚是高尚者的墓志铭。", s: "北岛《回答》" },
      { t: "与其在悬崖上展览千年，不如在爱人肩头痛哭一晚。", s: "舒婷《神女峰》" },
      { t: "青春是一本太仓促的书。", s: "席慕蓉《青春》" },
      { t: "每想你一次，天上飘落一粒沙，从此形成了撒哈拉。", s: "三毛《撒哈拉的故事》" },
      { t: "他强由他强，清风拂山岗；他横由他横，明月照大江。", s: "金庸《倚天屠龙记》" },
      { t: "生活不能等待别人来安排，要自己去争取和奋斗。", s: "路遥《平凡的世界》" },
      { t: "世界上的事情，最忌讳的就是个十全十美。", s: "莫言《檀香刑》" },
      { t: "世界是美好的，值得我们为之奋斗。", s: "海明威《丧钟为谁而鸣》" },
      { t: "在隆冬，我终于知道，我身上有一个不可战胜的夏天。", s: "加缪《夏天集》" },
      { t: "重要的不是治愈，而是带着病痛活下去。", s: "加缪《西西弗神话》" },
      { t: "回忆是一条没有归途的路。", s: "马尔克斯《百年孤独》" },
      { t: "爱是一种不死的欲望，是疲惫生活中的英雄梦想。", s: "杜拉斯《情人》" },
      { t: "我心里一直都在暗暗设想，天堂应该是图书馆的模样。", s: "博尔赫斯《关于天赐的诗》" },
      { t: "我们都生活在阴沟里，但仍有人仰望星空。", s: "王尔德《温德米尔夫人的扇子》" },
      { t: "这是最好的时代，这是最坏的时代。", s: "狄更斯《双城记》" },
      { t: "死并非生的对立面，而是作为生的一部分永存。", s: "村上春树《挪威的森林》" },
      { t: "人不是因为美丽才可爱，而是因为可爱才美丽。", s: "列夫·托尔斯泰" },
      { t: "人的一切都应该是美丽的：面貌、衣裳、心灵、思想。", s: "契诃夫《万尼亚舅舅》" },
      { t: "人最宝贵的是生命，生命属于人只有一次。", s: "奥斯特洛夫斯基《钢铁是怎样炼成的》" },
      { t: "世界上任何一本书都不能带给你好运，但它们能让你成为自己。", s: "赫尔曼·黑塞" },
      // 其他 / 名言
      { t: "探索未至之境", s: "深度求索公司" },
      { t: "为此，我准备了一百口棺材，其中一口，留给自己。", s: "朱镕基" },
      // 游戏 / 动漫台词
      { t: "犹豫，就会败北。", s: "《只狼》" },
      { t: "万物皆虚，万事皆允。", s: "《刺客信条》" },
      { t: "愿风指引你的道路。", s: "《魔兽世界》" },
      { t: "时间就是金钱，我的朋友。", s: "《魔兽世界》" },
      { t: "愿圣光与你同在。", s: "《魔兽世界》" },
      { t: "战争，战争从未改变。", s: "《辐射》" },
      { t: "赞美太阳！", s: "《黑暗之魂》" },
      { t: "即使引导早已破碎，也请当上艾尔登之王。", s: "《艾尔登法环》" },
      { t: "夜之城没有活着的传奇。", s: "《赛博朋克2077》" },
      { t: "这个世界需要更多的英雄！", s: "《守望先锋》" },
      { t: "这一切都是命运石之门的选择！", s: "《命运石之门》" },
      { t: "人类的赞歌，就是勇气的赞歌。", s: "《JOJO的奇妙冒险》" },
      { t: "人被杀，就会死。", s: "《Fate/stay night》" },
      { t: "一切恐惧，源于火力不足。", s: "游戏圈名梗" },
    ];

    // ------------------------------------------------------------------
    // Pure helpers (no DOM, no React): exported through exports._test so
    // `npm test` can exercise them under Node with browser globals stubbed.
    // ------------------------------------------------------------------
    const STORAGE_KEY = "dsh-moyan:v1";
    const DEFAULT_SETTINGS = { mode: "daily", date: "", index: -1 };

    /** Local calendar day key, e.g. "2026-08-14" (zero-padded). */
    function todayKey(now) {
      const d = now instanceof Date ? now : new Date();
      const pad = (n) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    }

    /**
     * Pick an index uniformly from [0, count) while avoiding the excluded
     * indexes when possible. `excludes` may be a single index (number), an
     * array, or a Set; `-1` means nothing to exclude. Candidates are drawn
     * from the non-excluded pool, so the distribution stays unbiased no
     * matter how many indexes are excluded; when every index is excluded
     * the pool falls back to the full range so the pick always succeeds.
     */
    function randomIndex(count, excludes, rng) {
      if (!(count >= 1)) return 0;
      const pick = rng === undefined ? Math.random : rng;
      const excluded = new Set(
        excludes === undefined || excludes === null || excludes === -1 ? [] :
        typeof excludes === "number" ? [excludes] :
        excludes instanceof Set || Array.isArray(excludes) ? excludes : [],
      );
      const pool = [];
      for (let i = 0; i < count; i++) if (!excluded.has(i)) pool.push(i);
      const source = pool.length > 0 ? pool : Array.from({ length: count }, (_, i) => i);
      const sample = Math.floor(pick() * source.length);
      return source[sample % source.length];
    }

    /** Build the quote record carried by UI state for one corpus index. */
    function quoteAt(corpus, index) {
      const entry = corpus[index];
      return { index, t: entry.t, s: entry.s };
    }

    /** Corpus indexes whose text appeared in the recent list. */
    function excludedIndexes(corpus, recentTexts) {
      const seen = new Set(recentTexts);
      const indexes = new Set();
      for (let i = 0; i < corpus.length; i++) {
        if (seen.has(corpus[i].t)) indexes.add(i);
      }
      return indexes;
    }

    const HISTORY_LIMIT = 5;
    const RECENT_LIMIT = 10;

    /** Record the previously shown quote, keeping at most 5 steps. */
    function pushHistory(history, quote) {
      return [...history, quote].slice(-HISTORY_LIMIT);
    }

    /** Record a recently shown quote text, keeping at most 10 steps. */
    function pushRecent(recent, text) {
      return [...recent, text].slice(-RECENT_LIMIT);
    }

    /**
     * Pick a quote according to mode:
     * - daily: reuse the stored index while `settings.date === today`, else
     *   pick a fresh one (never the stored one).
     * - open:  always pick fresh.
     */
    function pickQuote(settings, today, rng, corpus = CORPUS) {
      const stored = settings.index >= 0 && settings.index < corpus.length;
      if (settings.mode === "daily" && settings.date === today && stored) {
        return quoteAt(corpus, settings.index);
      }
      const exclude = settings.mode === "daily" && stored ? settings.index : -1;
      return quoteAt(corpus, randomIndex(corpus.length, exclude, rng));
    }

    /**
     * Parse the corpus file served by the host half: one `句子 | 出处` per
     * line; blank lines and `#` comments are ignored; both `|` and `｜`
     * work as separators. Lines without a separator or an empty side are
     * skipped.
     */
    function parseCorpus(text) {
      const entries = [];
      for (const raw of String(text).split(/\r?\n/)) {
        const line = raw.trim();
        if (line === "" || line.startsWith("#")) continue;
        const cut = line.search(/[|｜]/);
        if (cut < 1) continue;
        const t = line.slice(0, cut).trim();
        const s = line.slice(cut + 1).trim();
        if (t !== "" && s !== "") entries.push({ t, s });
      }
      return entries;
    }

    function loadSettings() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw !== null) {
          const parsed = JSON.parse(raw);
          if (parsed !== null && typeof parsed === "object" &&
              (parsed.mode === "daily" || parsed.mode === "open")) {
            return {
              mode: parsed.mode,
              date: typeof parsed.date === "string" ? parsed.date : "",
              index: Number.isInteger(parsed.index) ? parsed.index : -1,
            };
          }
        }
      } catch {
        // Private mode, blocked storage, corrupted JSON: fall back.
      }
      return { ...DEFAULT_SETTINGS };
    }

    function saveSettings(settings) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch {
        // Non-fatal: the quote still works, it just won't stick.
      }
    }

    /** Milliseconds until the next local midnight (plus a 1s grace). */
    function nextMidnightDelay(now) {
      const d = now instanceof Date ? now : new Date();
      const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      return Math.max(1000, next.getTime() - d.getTime() + 1000);
    }

    // ------------------------------------------------------------------
    // Stylesheet. Colors/fonts ride the harness theme tokens so light and
    // dark modes follow automatically; the quote text is the harness body
    // font at reduced opacity, and the bar mimics the Settings row chrome
    // (transparent, rounded, hover background).
    // ------------------------------------------------------------------
    const CSS = [
      ".hkt-row{flex:1 1 auto;min-width:0;box-sizing:border-box;display:flex;flex-direction:column;align-items:stretch;margin:4px -4px;padding:8px 10px;border-radius:12px;font-family:var(--dsw-font-family,inherit);font-size:13px;line-height:20px;color:var(--dsw-alias-label-secondary,#61666b);background:transparent;transition:background .15s var(--ds-ease-in-out,ease);cursor:default}",
      ".hkt-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}",
      ".hkt-text{white-space:normal;overflow-wrap:anywhere;min-width:0;opacity:.75}",
      ".hkt-meta{display:flex;align-items:center;gap:4px;margin-top:4px;min-width:0}",
      ".hkt-source{flex:1 1 auto;min-width:0;text-align:right;font-size:12px;line-height:18px;opacity:.5;white-space:normal;overflow-wrap:anywhere}",
      ".hkt-gear{flex:none;display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;margin:0;padding:0;border:none;border-radius:50%;background:transparent;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;opacity:0;transition:opacity .15s var(--ds-ease-in-out,ease)}",
      ".hkt-row:hover .hkt-gear,.hkt-gear:focus-visible,.hkt-gear[data-open=true]{opacity:1}",
      ".hkt-gear:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}",
      ".hkt-pop{position:fixed;z-index:1000;box-sizing:border-box;width:236px;padding:10px 12px 12px;background:var(--dsw-alias-bg-layer-2,#fff);border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:12px;box-shadow:var(--dsw-shadow-lv3,0 8px 24px rgba(0,0,0,.12));font-family:var(--dsw-font-family,inherit);color:var(--dsw-alias-label-primary,#0f1115);font-size:13px;line-height:20px}",
      ".hkt-pop-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}",
      ".hkt-pop-title{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#61666b);opacity:.85}",
      ".hkt-pop-close{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;padding:0;border:none;border-radius:50%;background:transparent;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer}",
      ".hkt-pop-close:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}",
      ".hkt-pop-quote{margin-bottom:10px}",
      ".hkt-pop-quote-text{font-size:13px;line-height:20px;color:var(--dsw-alias-label-primary,#0f1115)}",
      ".hkt-pop-quote-src{margin-top:2px;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#61666b);opacity:.8}",
      ".hkt-pop-label{margin-bottom:4px;font-size:11px;line-height:16px;color:var(--dsw-alias-label-secondary,#61666b);opacity:.7}",
      ".hkt-modes{display:flex;gap:6px}",
      ".hkt-mode{flex:1 1 0;box-sizing:border-box;height:28px;padding:0;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:8px;background:transparent;font-family:inherit;font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer}",
      ".hkt-mode:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}",
      ".hkt-mode[data-on=true]{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12));color:var(--dsw-alias-label-primary,#0f1115)}",
      ".hkt-actions{display:flex;gap:6px;margin-top:8px}",
      ".hkt-back{flex:none;display:inline-flex;align-items:center;justify-content:center;box-sizing:border-box;width:28px;height:28px;padding:0;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer}",
      ".hkt-back:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}",
      ".hkt-back:disabled{opacity:.35;cursor:default}",
      ".hkt-refresh{display:flex;align-items:center;justify-content:center;gap:6px;box-sizing:border-box;flex:1 1 auto;min-width:0;height:28px;padding:0;border:1px solid var(--dsw-alias-border-l2,rgba(0,0,0,.08));border-radius:8px;background:transparent;font-family:inherit;font-size:12px;line-height:18px;color:var(--dsw-alias-label-primary,#0f1115);cursor:pointer}",
      ".hkt-refresh:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}",
    ].join("\n");

    const TAG_ID = "dsh-moyan/moyan.css";
    if (
      typeof document !== "undefined" &&
      document.querySelector("style[data-plugin-css=" + JSON.stringify(TAG_ID) + "]") === null
    ) {
      const tag = document.createElement("style");
      tag.dataset.plugin = "dsh-moyan";
      tag.dataset.pluginCss = TAG_ID;
      tag.textContent = CSS;
      document.head.appendChild(tag);
    }

    // ------------------------------------------------------------------
    // UI
    // ------------------------------------------------------------------

    /** First state: honors the stored daily pick, or rolls a fresh one. */
    function initialState() {
      const settings = loadSettings();
      const today = todayKey();
      if (settings.mode === "daily" && settings.date === today &&
          settings.index >= 0 && settings.index < CORPUS.length) {
        const quote = quoteAt(CORPUS, settings.index);
        return { settings, quote, corpus: CORPUS, recent: [quote.t], history: [] };
      }
      const quote = pickQuote(settings, today);
      const recent = [quote.t];
      if (settings.mode === "daily") {
        const next = { mode: "daily", date: today, index: quote.index };
        saveSettings(next);
        return { settings: next, quote, corpus: CORPUS, recent, history: [] };
      }
      return { settings, quote, corpus: CORPUS, recent, history: [] };
    }

    function MoyanEntry({ wide }) {
      const [state, setState] = React.useState(initialState);
      const [today, setToday] = React.useState(todayKey);
      const [open, setOpen] = React.useState(false);
      const [popPos, setPopPos] = React.useState(null);
      const barRef = React.useRef(null);
      const popRef = React.useRef(null);

      // One roll step shared by every path that swaps the quote: record the
      // outgoing quote in the recent (10) and history (5) buffers, then pick
      // from the corpus avoiding the recent texts.
      const roll = React.useCallback((prev) => {
        const recent = pushRecent(prev.recent, prev.quote.t);
        const history = pushHistory(prev.history, prev.quote);
        const index = randomIndex(prev.corpus.length, excludedIndexes(prev.corpus, recent));
        const quote = quoteAt(prev.corpus, index);
        return { recent, history, quote };
      }, []);

      const refresh = React.useCallback(() => {
        setState((prev) => {
          const { recent, history, quote } = roll(prev);
          let settings = prev.settings;
          if (settings.mode === "daily") {
            settings = { ...settings, date: todayKey(), index: quote.index };
            saveSettings(settings);
          }
          return { ...prev, settings, quote, recent, history };
        });
      }, [roll]);

      const undo = React.useCallback(() => {
        setState((prev) => {
          if (prev.history.length === 0) return prev;
          const quote = prev.history[prev.history.length - 1];
          const history = prev.history.slice(0, -1);
          let settings = prev.settings;
          if (settings.mode === "daily") {
            const index = prev.corpus.findIndex((entry) => entry.t === quote.t && entry.s === quote.s);
            if (index >= 0) {
              settings = { ...settings, date: todayKey(), index };
              saveSettings(settings);
            }
          }
          return { ...prev, settings, quote, history };
        });
      }, []);

      const setMode = React.useCallback((mode) => {
        setState((prev) => {
          if (prev.settings.mode === mode) return prev;
          const { recent, history, quote } = roll(prev);
          const settings = mode === "daily"
            ? { mode: "daily", date: todayKey(), index: quote.index }
            : { mode: "open", date: "", index: -1 };
          saveSettings(settings);
          return { ...prev, settings, quote, recent, history };
        });
      }, [roll]);

      // Local-midnight rollover: re-pick in daily mode when the day flips.
      React.useEffect(() => {
        const timer = window.setTimeout(() => setToday(todayKey()), nextMidnightDelay());
        return () => window.clearTimeout(timer);
      }, [today]);

      React.useEffect(() => {
        if (state.settings.mode !== "daily" || state.settings.date === today) return;
        setState((prev) => {
          const { recent, history, quote } = roll(prev);
          const settings = { mode: "daily", date: today, index: quote.index };
          saveSettings(settings);
          return { ...prev, settings, quote, recent, history };
        });
      }, [today, state.settings.mode, roll]);

      // Prefer the editable corpus file served by the host half; fall back
      // to the built-in list when the route is missing or parses empty.
      // The host reads the file on every request, so edits apply on the
      // next page load without restarting dsh web.
      React.useEffect(() => {
        let cancelled = false;
        fetch("/plugins/dsh-moyan/corpus.txt", { cache: "no-store" })
          .then((response) => (response.ok ? response.text() : Promise.reject(new Error("corpus route: " + response.status))))
          .then((text) => {
            if (cancelled) return;
            const list = parseCorpus(text);
            if (list.length === 0) return;
            setState((prev) => {
              if (prev.quote.index < list.length) {
                return { ...prev, corpus: list };
              }
              // The stored index fell out of the edited corpus: roll a new
              // quote against the NEW list, still recording the outgoing one.
              const recent = pushRecent(prev.recent, prev.quote.t);
              const history = pushHistory(prev.history, prev.quote);
              const index = randomIndex(list.length, excludedIndexes(list, recent));
              return { ...prev, corpus: list, quote: quoteAt(list, index), recent, history };
            });
          })
          .catch(() => {
            // Keep the built-in fallback corpus.
          });
        return () => {
          cancelled = true;
        };
      }, []);

      // Keep the popover's bottom edge tied to the quote block's top edge:
      // re-measure whenever either changes size (a short/long quote swap
      // resizes both the block and the popover's quote preview), so the
      // panel never covers the block or drifts away from it.
      const reposition = React.useCallback(() => {
        if (popRef.current === null || barRef.current === null) return;
        const bar = barRef.current.getBoundingClientRect();
        const pop = popRef.current.getBoundingClientRect();
        let top = bar.top - pop.height - 8;
        if (top < 8) top = bar.bottom + 8;
        const left = Math.min(Math.max(8, bar.left), window.innerWidth - pop.width - 8);
        setPopPos((prev) => (prev !== null && prev.left === left && prev.top === top ? prev : { left, top }));
      }, []);

      React.useLayoutEffect(() => {
        if (!open) return;
        reposition();
        if (typeof ResizeObserver === "undefined" || barRef.current === null || popRef.current === null) return;
        const observer = new ResizeObserver(reposition);
        observer.observe(barRef.current);
        observer.observe(popRef.current);
        return () => observer.disconnect();
      }, [open, state.quote, reposition]);

      // Dismiss on Escape / outside pointerdown; re-anchor on window resize.
      React.useEffect(() => {
        if (!open) return;
        const onKey = (event) => {
          if (event.key === "Escape") setOpen(false);
        };
        const onDown = (event) => {
          const target = event.target;
          if (barRef.current !== null && barRef.current.contains(target)) return;
          if (popRef.current !== null && popRef.current.contains(target)) return;
          setOpen(false);
        };
        const onResize = () => reposition();
        window.addEventListener("keydown", onKey);
        window.addEventListener("pointerdown", onDown);
        window.addEventListener("resize", onResize);
        return () => {
          window.removeEventListener("keydown", onKey);
          window.removeEventListener("pointerdown", onDown);
          window.removeEventListener("resize", onResize);
        };
      }, [open, reposition]);

      // Rail (collapsed) mode hides the whole block: drop any open panel
      // (its anchors vanish with the block).
      React.useEffect(() => {
        if (!wide) setOpen(false);
      }, [wide]);

      const { quote } = state;
      const gear = React.createElement(
        "button",
        {
          type: "button",
          className: "hkt-gear",
          "aria-label": "墨言设置",
          "data-open": open ? "true" : undefined,
          onClick: () => setOpen((value) => !value),
        },
        React.createElement(IconSettingsOutline14, { size: 14 }),
      );

      let popover = null;
      if (open) {
        popover = React.createElement(
          "div",
          {
            ref: popRef,
            className: "hkt-pop",
            role: "dialog",
            "aria-label": "墨言设置",
            style: popPos === null ? { visibility: "hidden" } : { left: popPos.left, top: popPos.top },
          },
          React.createElement("div", { className: "hkt-pop-head" },
            React.createElement("span", { className: "hkt-pop-title" }, "墨言"),
            React.createElement("button", {
              type: "button",
              className: "hkt-pop-close",
              "aria-label": "关闭",
              onClick: () => setOpen(false),
            }, React.createElement(IconCloseFill14, { size: 12 })),
          ),
          React.createElement("div", { className: "hkt-pop-quote" },
            React.createElement("div", { className: "hkt-pop-quote-text" }, quote.t),
            React.createElement("div", { className: "hkt-pop-quote-src" }, quote.s),
          ),
          React.createElement("div", { className: "hkt-pop-label" }, "刷新频率"),
          React.createElement("div", { className: "hkt-modes" },
            React.createElement("button", {
              type: "button",
              className: "hkt-mode",
              "data-on": state.settings.mode === "open" ? "true" : undefined,
              onClick: () => setMode("open"),
            }, "每次打开"),
            React.createElement("button", {
              type: "button",
              className: "hkt-mode",
              "data-on": state.settings.mode === "daily" ? "true" : undefined,
              onClick: () => setMode("daily"),
            }, "每天"),
          ),
          React.createElement("div", { className: "hkt-actions" },
            React.createElement("button", {
              type: "button",
              className: "hkt-back",
              "aria-label": "回到上一句",
              title: "回到上一句",
              disabled: state.history.length === 0,
              onClick: undo,
            }, React.createElement(IconChevronLeftOutline14, { size: 14 })),
            React.createElement("button", {
              type: "button",
              className: "hkt-refresh",
              onClick: refresh,
            },
              React.createElement(IconRefreshOutline14, { size: 14 }),
              "换一句",
            ),
          ),
        );
      }

      // Rail (collapsed) mode: hide — the footer row keeps its other entries.
      // (All hooks above already ran, so folding never changes hook order.)
      if (!wide) return null;

      return React.createElement(
        "div",
        { ref: barRef, className: "hkt-row" },
        React.createElement("div", { className: "hkt-text" }, quote.t),
        React.createElement(
          "div",
          { className: "hkt-meta" },
          React.createElement("span", { className: "hkt-source" }, "—— " + quote.s),
          gear,
        ),
        popover,
      );
    }

    function apply(ctx) {
      const slots = ctx.get("slots");
      if (slots === undefined) return;
      // Wait for the sidebar shell to declare the footer slot, then register.
      slots.inject("sidebar.footer.action", () => slots.register(
        { name: "sidebar.footer.action", id: "moyan", order: -100 },
        MoyanEntry,
      ));
    }

    exports.apply = apply;
    exports.inject = [];
    exports._test = {
      CORPUS,
      STORAGE_KEY,
      DEFAULT_SETTINGS,
      todayKey,
      randomIndex,
      excludedIndexes,
      pushHistory,
      pushRecent,
      HISTORY_LIMIT,
      RECENT_LIMIT,
      quoteAt,
      pickQuote,
      parseCorpus,
      loadSettings,
      saveSettings,
      nextMidnightDelay,
    };
    return module.exports;
  },
});
