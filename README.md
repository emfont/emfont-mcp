# emfont MCP Server

你可以使用 emfont MCP 來尋找適合的字體，生成檔案，和套用到你的專案中。你可使用線上服務，或是在本地端執行 MCP 伺服器。

MCP 網址：[https://font.emtech.cc/mcp](https://font.emtech.cc/mcp)
Repo 網址：[https://github.com/emfont/emfont-mcp](https://github.com/emfont/emfont-mcp)

## 本地運行

首先請你先從 GitHub 下載 MCP 專案，安裝 Node.js 與 pnpm，並進行編譯：

```bash
pnpm install
pnpm build
```

接著你可以選擇以下兩種方式來運行 MCP：

### 本地伺服器

```bash
pnpm start
```

並設定 MCP 檔案路徑為 `http://localhost:3000/mcp`。

### 檔案路徑

你也可以直接將 MCP 檔案路徑設定為 `build/index.js`。

## 設定方式

-   [VS Code](https://code.visualstudio.com/docs/copilot/customization/mcp-servers)
-   [Claude](https://modelcontextprotocol.io/docs/develop/connect-local-servers) (GPT 和 Claude 遠端連線需要 Pro 方案)
