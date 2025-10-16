# Threads Reader 專案

這是一個結合了 Chrome 擴充功能與 Python FastAPI 後端的專案，旨在分析 threads.net 網站上的貼文，並提供客製化的內容審查功能。

## ✨ 功能特色

- **即時情緒分析**：擴充功能會抓取頁面上的貼文，發送到後端進行情緒分析。
- **視覺化標籤**：在每則貼文上顯示其情緒標籤 (例如：POSITIVE)。
- **可客製化 UI**：
    - 點擊擴充功能圖示可開啟設定彈窗。
    - 提供三個審查器開關：情緒貼文、假新聞、相關貼文。
    - 當「情緒貼文審查器」開啟時，可透過點擊表情符號來設定過濾的閾值。
- **FastAPI 後端**：使用 Python FastAPI 建立，包含一個用於接收貼文並回傳分析結果的 API 端點。
- **快取機制**：後端包含一個簡單的記憶體快取，避免重複分析相同的貼文。

## 📂 專案結構

```
Chrome_Extension_Threads_Assistant-dev/
├── backend/
│   ├── app.py              # FastAPI 後端主程式
│   ├── sentiment/          # 情緒分析模組
│   ├── store/              # 快取模組
│   └── schemas.py          # 資料結構定義
├── extension/
│   ├── manifest.json       # 擴充功能設定檔，爬蟲
│   ├── content.js          # 內容腳本
│   ├── background.js       # 背景腳本
│   ├── overlay.js          # 標籤覆蓋層
│   ├── popup.html          # 設定彈窗
│   └── popup.js            # 彈窗邏輯

```

## 🚀 啟動指南

請依照以下步驟來設定並啟動專案。

### 前置需求

- Python 3.8+
- Google Chrome 瀏覽器
- pip (Python 套件管理器)

# 1. 後端設定與啟動 (Backend)

打開你的終端機 (例如：Powershell, Cmd)，然後執行以下指令：

**a.進入專案目錄**
```
cd D:\Download\Chrome_Extension_Threads_Assistant-dev\Chrome_Extension_Threads_Assistant-dev
```
**b.建立虛擬環境**
```
python -m venv .venv
```
**c.啟用虛擬環境**
```
.venv\Scripts\activate
```
**d.安裝依賴套件**
```
pip install -r requirements.txt
```
**e.啟動 FastAPI 伺服器**
```sh
uvicorn backend.app:app --reload
```
看到 `Application startup complete.` 的訊息即表示後端已成功在 `http://127.0.0.1:8000` 上運行。


# 2. 擴充功能安裝 (Extension)

**a. 開啟 Chrome 擴充功能頁面**
   在 Chrome 網址列輸入 `chrome://extensions` 並進入。

**b. 開啟開發人員模式**
   在頁面的右上角，找到並**開啟「開發人員模式」**的開關。

**c. 載入擴充功能**
   點擊左上角的**「載入未封裝項目」**按鈕，然後選擇本專案中的 `extension` 資料夾。

   路徑: ```D:\Download\Chrome_Extension_Threads_Assistant-dev\Chrome_Extension_Threads_Assistant-dev\extension```

## ⚠️ 重要提醒

為了讓擴充功能正確抓取 Threads.net 上的貼文資料，你**必須**手動更新 CSS 選擇器。

1.  **編輯檔案**：`extension/content.js`
2.  **找到並修改**：檔案中的 `postElements`, `author`, `text` 等變數的 `querySelector` 或 `querySelectorAll` 中的選擇器字串。
3.  **如何尋找**：在 `threads.net` 網站上，對著貼文元素按右鍵 -> 「檢查」，在開發者工具中找到對應的 HTML 標籤與 class 名稱。

```
