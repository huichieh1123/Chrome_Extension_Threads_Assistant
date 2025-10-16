# Threads Sentiment Filter

這是一個 Chrome 擴充功能專案，它使用本地執行的機器學習模型，對 Threads 網站上的貼文進行即時情緒分析，並根據使用者設定的情緒等級，動態隱藏或顯示貼文。

## 主要功能

- **啟發式內容抓取**: 使用先進的 DOM 分析技術，不依賴固定的 class 名稱，能更好地適應未來 Threads 網站的改版。
- **本地模型推論**: 透過在本地運行的 FastAPI 伺服器，載入 Hugging Face 上的 `tabularisai/multilingual-sentiment-analysis` 模型進行情緒分析，保護使用者隱私。
- **動態內容過濾**: 根據使用者在 Popup 彈窗中設定的情緒等級 (例如：只看正面、中性以上等)，即時隱藏分數不符的貼文。
- **友善的使用者體驗**: 被隱藏的貼文會顯示原因 (例如「評級: Negative」)，並提供一個「仍然顯示」的按鈕，讓使用者可以隨時恢復查看原文。

## 技術棧

- **前端**: Chrome Extension (Manifest V3), JavaScript
- **後端**: Python, FastAPI
- **機器學習**: `transformers`, `torch`, `tabularisai/multilingual-sentiment-analysis` model

## 目錄結構

```
.
├─ extension/      # Chrome 擴充功能的前端檔案
└─ server/         # Python FastAPI 後端伺服器與模型
```

---

## 安裝與啟動指南

請嚴格依照以下步驟執行，以確保環境正確設定。

### 1. 啟動後端伺服器

打開一個新的終端機 (例如 PowerShell 或 Command Prompt)，然後逐行執行以下指令：

**a. 進入專案根目錄**
```powershell
cd C:\Users\ajhui\桌面\projects\Chrome_Extension_Threads_Assistant
```

**b. 進入 `server` 目錄**
```powershell
cd server
```

**c. 建立並啟用虛擬環境**
```powershell
# 建立虛擬環境
python -m venv .venv

# 啟用虛擬環境
.\.venv\Scripts\activate
```
成功啟用後，您的指令提示符前方會出現 `(.venv)` 字樣。

**d. 安裝必要的 Python 套件**
```powershell
# 使用 python -m pip 確保使用正確的 pip
python -m pip install -r requirements.txt
```

**e. 啟動後端伺服器**
```powershell
# 使用 python -m uvicorn 確保使用正確的 uvicorn
python -m uvicorn app:app --host 127.0.0.1 --port 8723 --reload
```

> **⚠️ 重要提示：**
> 第一次執行此指令時，後端會需要**數分鐘**來下載 `multilingual-sentiment-analysis` 模型 (約 400-500MB)。請耐心等候，直到您看到終端機顯示 `Sentiment analysis model loaded successfully.` 和 `Uvicorn running on http://127.0.0.1:8723`。

### 2. 載入 Chrome 擴充功能

**a. 打開 Chrome 擴充功能頁面**
   在您的 Chrome 瀏覽器網址列輸入 `chrome://extensions/` 並前往。

**b. 開啟開發人員模式**
   在頁面的右上角，找到「開發人員模式」並打開它的開關。

**c. 載入擴充功能**
   點擊左上角的「載入未封裝項目」按鈕，然後在跳出的視窗中，選擇本專案中的 `extension` 資料夾。

### 3. 開始使用

安裝完成後，擴充功能會自動在 `https://www.threads.net/` 的頁面上運作。您可以點擊瀏覽器右上角的擴充功能圖示，打開 Popup 彈窗來調整您想要過濾的情緒等級。

## 常見問題

- **Q: 後端啟動時顯示 `ModuleNotFoundError`**
  - **A:** 這 99% 是因為您的 Python 環境不正確。請嚴格依照本文件的安裝指南，特別是**啟用虛擬環境** (`.venv\Scripts\activate`) 以及使用 `python -m pip` 和 `python -m uvicorn` 的指令。

- **Q: 貼文沒有被隱藏**
  - **A:** 請確認您的後端伺服器正在正常運行，並且沒有顯示任何錯誤。同時，您可以打開擴充功能的背景腳本 Console (在 `chrome://extensions` 頁面點擊「服務工作處理程序」) 來查看是否有 API 連線錯誤。