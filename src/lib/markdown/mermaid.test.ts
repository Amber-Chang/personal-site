import assert from "node:assert/strict";
import test from "node:test";

type MermaidApi = {
  initialize: (config: Record<string, unknown>) => void;
  parse: (text: string) => Promise<unknown>;
  render: (id: string, text: string) => Promise<{ svg: string }>;
};

type MermaidModule = {
  MERMAID_CONFIG: Record<string, unknown>;
  MERMAID_ERROR_MESSAGE: string;
  MERMAID_MIN_SCALE: number;
  MERMAID_READABLE_MIN_WIDTH_PX: number;
  getMermaidMinWidth: (naturalWidth: number | null) => number | null;
  getSvgNaturalWidth: (svg: string) => number | null;
  renderMermaidDiagram: (input: {
    id: string;
    loadMermaid: () => Promise<MermaidApi>;
    source: string;
  }) => Promise<{ minWidth: number | null; status: "ready"; svg: string } | { status: "error" }>;
  toMermaidElementId: (reactId: string) => string;
};

async function loadMermaidModule(): Promise<MermaidModule> {
  const loadedModule = await import("./mermaid.ts").catch(() => null);

  assert.ok(loadedModule, "expected mermaid module to exist at ./mermaid.ts");

  return loadedModule as MermaidModule;
}

function createMermaidStub(input?: { parseError?: Error; renderError?: Error }) {
  const calls: { initialize: Record<string, unknown>[]; parse: string[]; render: Array<[string, string]> } = {
    initialize: [],
    parse: [],
    render: [],
  };
  const api: MermaidApi = {
    initialize: (config) => {
      calls.initialize.push(config);
    },
    parse: async (text) => {
      calls.parse.push(text);

      if (input?.parseError) {
        throw input.parseError;
      }

      return { diagramType: "flowchart" };
    },
    render: async (id, text) => {
      calls.render.push([id, text]);

      if (input?.renderError) {
        throw input.renderError;
      }

      return { svg: `<svg id="${id}"></svg>` };
    },
  };

  return { api, calls };
}

test("mermaid runs at the strictest security level and never scans the page by itself", async () => {
  const { MERMAID_CONFIG } = await loadMermaidModule();

  assert.equal(MERMAID_CONFIG.securityLevel, "strict");
  assert.equal(MERMAID_CONFIG.startOnLoad, false);
  // 語法錯誤時不讓 Mermaid 自己在頁面上插入錯誤圖示，由元件顯示中文提示。
  assert.equal(MERMAID_CONFIG.suppressErrorRendering, true);
  // 標籤一律輸出成 SVG 文字：標籤裡的 HTML（連結、圖片、按鈕）只會顯示成文字。
  assert.equal(MERMAID_CONFIG.htmlLabels, false);
  // secure 清單裡的設定只能由這裡的 initialize 決定，圖表內的 %%{init}%% 指令改不了。
  // 保留 Mermaid 預設的 6 項，再加上 htmlLabels 與 dompurifyConfig。
  assert.deepEqual(MERMAID_CONFIG.secure, [
    "secure",
    "securityLevel",
    "startOnLoad",
    "maxTextSize",
    "suppressErrorRendering",
    "maxEdges",
    "htmlLabels",
    "dompurifyConfig",
  ]);
});

test("links that mermaid creates (for example from click directives) are removed from the svg", async () => {
  const { renderMermaidDiagram } = await loadMermaidModule();
  const { api } = createMermaidStub();
  const svgWithLinks =
    '<svg><a xlink:href="https://example.com/" target="_blank"><g><text>甲</text></g></a><animate attributeName="x"/><A href="/x">乙</A></svg>';

  api.render = async () => ({ svg: svgWithLinks });

  const result = await renderMermaidDiagram({ id: "mermaid-r5", loadMermaid: async () => api, source: "flowchart LR\n  A" });

  assert.deepEqual(result, { minWidth: null, status: "ready", svg: '<svg><g><text>甲</text></g><animate attributeName="x"/>乙</svg>' });
});

test("renderMermaidDiagram reports the minimum width for a wide diagram", async () => {
  const { renderMermaidDiagram } = await loadMermaidModule();
  const { api } = createMermaidStub();

  api.render = async (id) => ({ svg: `<svg id="${id}" width="100%" style="max-width: 1320px;" viewBox="0 0 1320 56"></svg>` });

  const result = await renderMermaidDiagram({ id: "mermaid-r6", loadMermaid: async () => api, source: "flowchart LR\n  A" });

  assert.equal(result.status === "ready" ? result.minWidth : "error", 720);
});

test("diagrams keep Mermaid's default fit-to-width output (no per-diagram useMaxWidth override)", async () => {
  const { MERMAID_CONFIG } = await loadMermaidModule();

  // Mermaid 預設 useMaxWidth: true：SVG 寬度 100%、最大不超過原尺寸，所以寬的圖會縮到欄寬、不會被放大。
  for (const diagramType of ["flowchart", "sequence", "class", "state", "er", "gantt", "journey", "pie", "mindmap", "timeline"]) {
    assert.equal(MERMAID_CONFIG[diagramType], undefined, diagramType);
  }
});

test("getSvgNaturalWidth reads the diagram's natural width from the root svg", async () => {
  const { getSvgNaturalWidth } = await loadMermaidModule();

  assert.equal(
    getSvgNaturalWidth('<svg id="m" width="100%" style="max-width: 154.5px;" viewBox="-8 -8 154.5 278" role="graphics-document"><g/></svg>'),
    154.5,
  );
  assert.equal(getSvgNaturalWidth('<svg id="m" viewBox="0,0,1320,56"><g/></svg>'), 1320);
  assert.equal(getSvgNaturalWidth('<svg id="m" width="100%" style="max-width: 812px;"><g/></svg>'), 812);
  // 只看最外層的 svg，不讀到裡面元素的 viewBox。
  assert.equal(getSvgNaturalWidth('<svg id="m"><svg viewBox="0 0 50 50"/></svg>'), null);
  assert.equal(getSvgNaturalWidth("<div></div>"), null);
});

test("the minimum width is 80% of the natural width, capped at 45rem", async () => {
  const { MERMAID_MIN_SCALE, MERMAID_READABLE_MIN_WIDTH_PX, getMermaidMinWidth } = await loadMermaidModule();

  // 45rem（720px）：五個節點左右排的流程圖（原寬約 936px）在手機上縮成 77%，字約 10.8px；
  // 也剛好等於平板（768px）的內容欄寬，平板上不會因為最小寬度而捲動。
  assert.equal(MERMAID_READABLE_MIN_WIDTH_PX, 720);
  assert.equal(MERMAID_MIN_SCALE, 0.8);
  assert.equal(getMermaidMinWidth(2280), 720);
  assert.equal(getMermaidMinWidth(936), 720);
  // 比較窄的圖最多縮到原尺寸的 80%：剛好比手機欄寬寬一點的圖可以縮進欄內，不會多出幾 px 的捲動。
  assert.equal(getMermaidMinWidth(678), 542);
  assert.equal(getMermaidMinWidth(360), 288);
  assert.equal(getMermaidMinWidth(null), null);
});

test("renderMermaidDiagram initializes mermaid, validates the source and returns the svg", async () => {
  const { MERMAID_CONFIG, renderMermaidDiagram } = await loadMermaidModule();
  const { api, calls } = createMermaidStub();

  const result = await renderMermaidDiagram({ id: "mermaid-r1", loadMermaid: async () => api, source: "flowchart LR\n  A --> B" });

  assert.deepEqual(result, { minWidth: null, status: "ready", svg: '<svg id="mermaid-r1"></svg>' });
  assert.deepEqual(calls.initialize, [MERMAID_CONFIG]);
  assert.deepEqual(calls.parse, ["flowchart LR\n  A --> B"]);
  assert.deepEqual(calls.render, [["mermaid-r1", "flowchart LR\n  A --> B"]]);
});

test("a syntax error returns the error state without rendering", async () => {
  const { renderMermaidDiagram } = await loadMermaidModule();
  const { api, calls } = createMermaidStub({ parseError: new Error("Parse error on line 1") });

  const result = await renderMermaidDiagram({ id: "mermaid-r2", loadMermaid: async () => api, source: "flowchart LR\n  A -->" });

  assert.deepEqual(result, { status: "error" });
  assert.equal(calls.render.length, 0);
});

test("render failures and loading failures also return the error state instead of throwing", async () => {
  const { renderMermaidDiagram } = await loadMermaidModule();
  const { api } = createMermaidStub({ renderError: new Error("render failed") });

  assert.deepEqual(await renderMermaidDiagram({ id: "mermaid-r3", loadMermaid: async () => api, source: "pie" }), {
    status: "error",
  });
  assert.deepEqual(
    await renderMermaidDiagram({
      id: "mermaid-r4",
      loadMermaid: async () => {
        throw new Error("chunk failed to load");
      },
      source: "pie",
    }),
    { status: "error" },
  );
});

test("the error message is the agreed Chinese copy", async () => {
  const { MERMAID_ERROR_MESSAGE } = await loadMermaidModule();

  assert.equal(MERMAID_ERROR_MESSAGE, "這張圖表的語法有誤，無法顯示。");
});

test("toMermaidElementId turns a React id into a valid element id", async () => {
  const { toMermaidElementId } = await loadMermaidModule();

  assert.equal(toMermaidElementId(":r1:"), "mermaid-r1");
  assert.equal(toMermaidElementId("«r2»"), "mermaid-r2");
  assert.equal(toMermaidElementId("_R_3_"), "mermaid-_R_3_");
});
