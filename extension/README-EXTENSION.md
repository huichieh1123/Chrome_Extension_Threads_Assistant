# Extension 說明

## 設定 Key（供既有 UI 使用）
- `enabled: boolean`（預設 true）— 是否啟用過濾
- `threshold: number`（預設 0.35）— 低於此分數即隱藏

若你**已經有** `popup.html/js/css`，請在 UI 中讀寫上述 key 到 `chrome.storage.sync`。  
若沒有，專案已附上簡易版 Popup（可調開關與閾值）。

## 權限
- `host_permissions`: 允許存取 `https://www.threads.net/*` 與 `http://127.0.0.1:8723/*`
- `permissions`: 僅 `storage`

## 調整 DOM 選擇器
Threads 若改版，請更新 `content.js`：
- `isPostContainer()`
- `extractPostText()`
