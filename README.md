# Threads Sentiment Filter — Route A (Local Python API + Chrome MV3)

本專案在 Threads 網頁（`https://www.threads.net/*`）上，直接讀取 DOM、以本機 Python 模型服務評分貼文情緒，低於閾值則隱藏（不使用 Threads API）。

## 組成
- `extension/`: Chrome 擴充套件（Manifest V3）
  - content script 監聽/抽取貼文文字 → 送 background → 呼叫本機 API → 動態隱藏 DOM
  - 參數使用 `chrome.storage.sync`（key：`enabled`、`threshold`）
- `server/`: Python FastAPI
  - `/score`：單則貼文打分（0~1）
  - `/score_batch`：多則貼文批次打分

## 快速開始
1. 安裝並啟動 Python 服務
   ```bash
   cd server
   python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env  # 如需參數調整可改 .env
   uvicorn app:app --host 127.0.0.1 --port 8723 --reload
   ```

2. 載入擴充套件

   * 打開 Chrome → `chrome://extensions/`
   * 右上角開啟「開發人員模式」
   * 點「載入未封裝項目」→ 選擇 `extension/` 資料夾
   * 進入 `https://www.threads.net/` 測試

3. 控制啟用與閾值

   * 若你已有自己的 `popup.*`，請確保用 `chrome.storage.sync` 讀寫以下 key：

     * `enabled`: `boolean`（預設 `true`）
     * `threshold`: `number` 0~1（預設 `0.35`）
   * 若無 UI，已內建簡易 Popup 可調整。

## 常見問題

* **CORS**：background service worker 代理 fetch → 一般無需額外 CORS。若你改成頁面直連 API，請在 `server/app.py` 開啟 CORS。
* **DOM 變動**：若 Threads 調整了 DOM 結構，請修改 `content.js` 中的 `isPostContainer()` 和 `extractPostText()`。
* **效能**：已使用 WeakMap 快取與內容雜湊避免重複推論；如需更快，改用 `/score_batch` 批次。
