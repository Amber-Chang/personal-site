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
  renderMermaidDiagram: (input: {
    id: string;
    loadMermaid: () => Promise<MermaidApi>;
    source: string;
  }) => Promise<{ status: "ready"; svg: string } | { status: "error" }>;
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

  assert.deepEqual(result, { status: "ready", svg: '<svg><g><text>甲</text></g><animate attributeName="x"/>乙</svg>' });
});

test("diagrams keep their natural width so wide ones scroll inside their own container", async () => {
  const { MERMAID_CONFIG } = await loadMermaidModule();

  for (const diagramType of ["flowchart", "sequence", "class", "state", "er", "gantt", "journey", "pie", "mindmap", "timeline"]) {
    assert.deepEqual(MERMAID_CONFIG[diagramType], { useMaxWidth: false }, diagramType);
  }
});

test("renderMermaidDiagram initializes mermaid, validates the source and returns the svg", async () => {
  const { MERMAID_CONFIG, renderMermaidDiagram } = await loadMermaidModule();
  const { api, calls } = createMermaidStub();

  const result = await renderMermaidDiagram({ id: "mermaid-r1", loadMermaid: async () => api, source: "flowchart LR\n  A --> B" });

  assert.deepEqual(result, { status: "ready", svg: '<svg id="mermaid-r1"></svg>' });
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
