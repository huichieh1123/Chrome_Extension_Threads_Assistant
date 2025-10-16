# FastAPI 本機推論服務

## 啟動
```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app:app --host 127.0.0.1 --port 8723 --reload
```

## 端點

* `POST /score`

  ```json
  { "text": "內容..." }
  ```

  回應：

  ```json
  { "score": 0.42 }
  ```

* `POST /score_batch`

  ```json
  { "texts": ["內容1", "內容2"] }
  ```

  回應：

  ```json
  { "scores": [0.42, 0.77] }
  ```

## 將你的模型接進來

修改 `model.py` 的 `predict_proba(texts: list[str]) -> list[float]`，回傳 0~1 分數。
如需相依（e.g., scikit-learn, transformers），請自行加入 `requirements.txt`。

> 若將來改用雲端或容器化部署，extension 端只需在 `manifest.json` 的 `host_permissions` 加入對應網域，`bg.js` 目標 URL 改成你的服務位置即可。

