# emfont MCP Server

你可以使用 emfont MCP 來尋找適合的字體，生成檔案，和套用到你的專案中。

## 使用方式

### 本地

1. 請先安裝相依套件並編譯程式碼：

```bash
pnpm install
pnpm build
```

1. 接著在你的 AI 工具中，設定 MCP 檔案路徑為 `build/index.js`。或著是你也可以直接使用命令列啟動 MCP 伺服器：

```bash
pnpm start
```

並設定 MCP 檔案路徑為 `http://localhost:3000/mcp`。