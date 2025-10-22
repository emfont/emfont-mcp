import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const EMFONT_API_BASE = "https://font.emtech.cc";
const USER_AGENT = "emfont-mcp/1.0";

// Helper function for making emfont API requests
async function makeEmfontRequest<T>(url: string, method: string = "GET", body?: any): Promise<T | null> {
    const headers: Record<string, string> = {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
    };

    const options: RequestInit = {
        method,
        headers,
    };

    if (body && method === "POST") {
        headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return (await response.json()) as T;
    } catch (error) {
        console.error("Error making emfont request:", error);
        return null;
    }
}

// Type definitions
interface FontInfo {
    id: string;
    name: string;
    weight: number[];
    author?: string;
    name_zh?: string;
    name_en?: string;
    category?: string;
    tags?: string[];
    family?: string;
}

interface FontDetailInfo {
    name: {
        original?: string;
        zh?: string;
        en?: string;
    };
    category?: string;
    weight: number[];
    tag?: string[];
    family?: string;
    version?: string;
    license?: string;
    source?: string;
    author?: string;
    description?: string;
}

interface GenerateFontResponse {
    status: string;
    message?: string;
    name: string;
    location: string[];
}

// Create server instance
const server = new McpServer({
    name: "emfont",
    version: "1.0.0",
});

// Register emfont tools
server.tool(
    "list-fonts",
    "列出所有可用的字體或搜尋特定字體",
    {
        query: z.string().optional().describe("搜尋關鍵字（選填），可用於過濾字體列表"),
    },
    async args => {
        const query = args?.query;
        const url = query ? `${EMFONT_API_BASE}/list?q=${encodeURIComponent(query)}` : `${EMFONT_API_BASE}/list`;

        const fontList = await makeEmfontRequest<FontInfo[]>(url);

        if (!fontList) {
            return {
                content: [
                    {
                        type: "text",
                        text: "無法取得字體列表",
                    },
                ],
            };
        }

        if (fontList.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: query ? `找不到符合 "${query}" 的字體` : "目前沒有可用的字體",
                    },
                ],
            };
        }

        const formattedList = fontList.map(
            font => `ID: ${font.id}\n名稱: ${font.name}\n字重: ${font.weight.join(", ")}\n分類: ${font.category || "未分類"}\n標籤: ${font.tags?.join(", ") || "無"}\n---`
        );

        const listText = query ? `符合 "${query}" 的字體 (共 ${fontList.length} 個):\n\n${formattedList.join("\n")}` : `所有可用字體 (共 ${fontList.length} 個):\n\n${formattedList.join("\n")}`;

        return {
            content: [
                {
                    type: "text",
                    text: listText,
                },
            ],
        };
    }
);

server.tool(
    "get-font-info",
    "取得指定字體的詳細資訊",
    {
        fontId: z.string().describe("字體 ID，例如 'jfOpenHuninn' 或 'GenJyuuGothicP'"),
    },
    async ({ fontId }) => {
        const url = `${EMFONT_API_BASE}/info/${fontId}`;
        const fontInfo = await makeEmfontRequest<FontDetailInfo>(url);

        if (!fontInfo) {
            return {
                content: [
                    {
                        type: "text",
                        text: `無法取得字體 "${fontId}" 的詳細資訊，請確認字體 ID 是否正確`,
                    },
                ],
            };
        }

        const infoText = [
            `字體資訊: ${fontInfo.name.zh || fontInfo.name.original || fontId}`,
            "",
            `原始名稱: ${fontInfo.name.original || "未提供"}`,
            `中文名稱: ${fontInfo.name.zh || "未提供"}`,
            `英文名稱: ${fontInfo.name.en || "未提供"}`,
            `分類: ${fontInfo.category || "未分類"}`,
            `可用字重: ${fontInfo.weight.join(", ")}`,
            `標籤: ${fontInfo.tag?.join(", ") || "無"}`,
            `字體家族: ${fontInfo.family || "未提供"}`,
            `版本: ${fontInfo.version || "未提供"}`,
            `授權: ${fontInfo.license || "未提供"}`,
            `作者: ${fontInfo.author || "未提供"}`,
            `來源: ${fontInfo.source || "未提供"}`,
            "",
            `描述: ${fontInfo.description || "無描述"}`,
        ].join("\n");

        return {
            content: [
                {
                    type: "text",
                    text: infoText,
                },
            ],
        };
    }
);

server.tool(
    "generate-font",
    "生成包含指定文字的客製化字體檔案",
    {
        fontId: z.string().describe("字體 ID，例如 'jfOpenHuninn'"),
        words: z.string().describe("要包含在字體中的文字內容"),
        weight: z.number().min(100).max(900).optional().describe("字體粗細 (100-900，預設 400)"),
        min: z.boolean().optional().describe("是否使用極致壓縮（不建議用於內文）"),
        format: z.enum(["woff2", "woff", "ttf"]).optional().describe("字體檔案格式 (預設 woff2)"),
    },
    async args => {
        const fontId = args.fontId;
        const words = args.words;
        const weight = args.weight || 400;
        const min = args.min || false;
        const format = args.format || "woff2";

        const url = `${EMFONT_API_BASE}/g/${fontId}`;
        const body = {
            words,
            weight,
            min,
            format,
        };

        const result = await makeEmfontRequest<GenerateFontResponse>(url, "POST", body);

        if (!result) {
            return {
                content: [
                    {
                        type: "text",
                        text: `無法生成字體檔案，請確認字體 ID "${fontId}" 是否正確`,
                    },
                ],
            };
        }

        if (result.status !== "success") {
            return {
                content: [
                    {
                        type: "text",
                        text: `字體生成失敗: ${result.message || "未知錯誤"}`,
                    },
                ],
            };
        }

        const cssCode = result.location.map((url, index) => `@font-face {\n    font-family: '${result.name}';\n    src: url('${url}') format('${format}');\n}`).join("\n\n");

        const usageExample = `.emfont-${fontId} {\n    font-family: '${result.name}', sans-serif;\n}`;

        const resultText = [
            `✓ 字體生成成功！`,
            "",
            `字體名稱: ${result.name}`,
            `包含文字: ${words}`,
            `字重: ${weight}`,
            `格式: ${format}`,
            `極致壓縮: ${min ? "是" : "否"}`,
            "",
            `字體檔案連結 (共 ${result.location.length} 個):`,
            ...result.location.map((loc, i) => `  ${i + 1}. ${loc}`),
            "",
            "CSS 使用範例:",
            "```css",
            cssCode,
            "",
            usageExample,
            "```",
        ].join("\n");

        return {
            content: [
                {
                    type: "text",
                    text: resultText,
                },
            ],
        };
    }
);

server.tool(
    "get-css-link",
    "取得字體的 CSS 載入連結（類似 Google Fonts）",
    {
        fontId: z.string().describe("字體 ID"),
        weight: z.number().optional().describe("指定字重（選填），不指定則載入完整字體"),
        words: z.string().optional().describe("只包含特定文字（選填）"),
        min: z.boolean().optional().describe("是否使用極致壓縮"),
    },
    async args => {
        const fontId = args.fontId;
        const weight = args.weight;
        const words = args.words;
        const min = args.min || false;

        let url = `${EMFONT_API_BASE}/css/${fontId}`;

        if (weight) {
            url += `/${weight}`;
        }

        const params = new URLSearchParams();
        if (words) params.append("words", words);
        if (weight && !url.includes(`/${weight}`)) params.append("weight", weight.toString());
        if (min) params.append("min", "true");

        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        const htmlExample = `<link href="${url}" rel="stylesheet" />`;
        const cssExample = `@import url("${url}");`;

        const resultText = [
            `字體 CSS 載入連結:`,
            "",
            `字體 ID: ${fontId}`,
            weight ? `字重: ${weight}` : "字重: 完整字體",
            words ? `包含文字: ${words}` : "",
            min ? `極致壓縮: 是` : "",
            "",
            "HTML 使用方式:",
            "```html",
            htmlExample,
            "```",
            "",
            "CSS 使用方式:",
            "```css",
            cssExample,
            "```",
            "",
            "完整連結:",
            url,
        ]
            .filter(Boolean)
            .join("\n");

        return {
            content: [
                {
                    type: "text",
                    text: resultText,
                },
            ],
        };
    }
);

// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("emfont MCP Server running on stdio");
}

main().catch(error => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
