# 人民幣匯率儀表板

[English](README.md) | [简体中文](README.zh-CN.md) | **繁體中文**

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

一個自架的網頁儀表板，用於追蹤以人民幣為中心的匯率資料，支援互動式圖表、AI 智慧分析，以及英文、簡體中文、繁體中文三語介面。

## 功能特色

- **19 個貨幣對**每日追蹤 —— 英鎊/歐元/美元/以色列謝克爾兌人民幣、多組交叉匯率、人民幣兌日元/韓元/新台幣/印度盧比/盧布/港幣/烏克蘭格里夫納，以及比特幣交叉對
- **互動式圖表**，帶最大/最小值標籤、十字準線提示和拖曳排序
- **兩種顯示模式** —— 分離檢視（19 張獨立圖表）或合併檢視（3 張多線圖表）
- **彈性時間範圍** —— 滾動視窗（7天/1個月/3個月/6個月/1年）、日曆錨定（本/上週/月/年）或全部資料
- **欄數佈局切換** —— 1、2、3 或 4 欄
- **匯出功能** —— 個別匯出各圖表 PNG 或合併為一張圖片，均包含圖表標題
- **AI 對話側邊欄** —— 基於自架 LiteLLM 代理，針對目前顯示資料提問分析；支援左右移動和拖曳調整寬度
- **主題切換** —— 兩套 UI 各提供多種視覺主題，偏好持久儲存
- **三語介面** —— English、简体中文、繁體中文自由切換
- **兩套 UI** —— 經典介面（`/`）與終端介面（`/v2`），可相互導覽切換
- **無需建置** —— 原生 JS + CDN 引入的 Chart.js

## 截圖

**分離檢視** —— 以網格形式展示 19 張獨立圖表，每張追蹤一個貨幣對。右側 AI 對話側邊欄已展開，顯示波動分析摘要，包含最小值/最大值/區間彙總表及主要發現。

**合併檢視** —— 3 張多線分組圖表（西方貨幣→人民幣、人民幣兌出、交叉匯率），便於同組貨幣對的橫向比較。AI 對話側邊欄標示了所有貨幣對中波動最大和最小的匯率。

## 環境需求

- Python 3.9+
- pip 套件：`fastapi`、`uvicorn`、`requests`

```bash
pip install -r requirements.txt
```

## 快速開始

```bash
# 1. 採集歷史資料（最近 90 天）
python collect.py --backfill

# 2. 啟動服務並自動開啟瀏覽器
python launch.py
```

或手動啟動服務：

```bash
uvicorn app:app --reload
# 開啟 http://localhost:8000
# 終端介面：http://localhost:8000/v2
```

## 資料採集

匯率資料來源於 [fawazahmed0 currency API](https://github.com/fawazahmed0/exchange-api)，完全免費，無需 API 金鑰。

```bash
python collect.py                        # 僅採集今日匯率
python collect.py --backfill             # 回填最近 90 天
python collect.py --backfill --days 365  # 自訂回填天數
python collect.py --workers 8            # 自訂並發執行緒數
```

採集器會自動略過資料庫中已存在的記錄，可隨時安全重複執行。

## AI 對話設定

AI 對話側邊欄需要搭配自架的 [LiteLLM 代理](https://docs.litellm.ai/docs/proxy/quick_start)使用。

1. 點擊工具列中的 **AI 對話** 按鈕開啟側邊欄
2. 點擊側邊欄標題中的 **設定** 按鈕
3. 填寫 LiteLLM 位址（預設：`http://localhost:6655/litellm`）和 API 金鑰，點擊 **載入** 取得可用模型
4. 選擇模型後點擊 **儲存**
5. 勾選要作為上下文的圖表，然後輸入問題送出

憑證僅儲存在瀏覽器 `localStorage` 中，伺服器端不做任何持久化儲存。

## 貨幣對說明

| 分組 | 貨幣對 |
|---|---|
| 兌入人民幣 | 英鎊、歐元、美元、以色列謝克爾 -> 人民幣 |
| 交叉匯率 | 英鎊 -> 歐元、英鎊 -> 美元、歐元 -> 美元、美元 -> 日元、美元 -> 新台幣 |
| 人民幣兌出 | 人民幣 -> 日元、韓元、新台幣、印度盧比、盧布、港幣、烏克蘭格里夫納 |
| 加密貨幣 | BTC -> 美元、人民幣、歐元 |

如需新增貨幣對，請更新 `collect.py` 中的 `PAIRS`，並在 `templates/index.html` / `static/charts.js`（經典介面）和 `templates/index-v2.html` / `static/charts-v2.js`（終端介面）中新增對應的圖表卡片。

## 專案結構

```
app.py                # FastAPI 服務端及 API 路由
collect.py            # ETL：採集並儲存每日匯率
db.py                 # SQLite 資料層（rates.db）
launch.py             # 啟動服務並開啟瀏覽器
templates/
  index.html          # 經典介面 UI
  index-v2.html       # 終端介面 UI
static/
  charts.js           # 經典介面：圖表邏輯、國際化、AI 對話
  charts-v2.js        # 終端介面：圖表邏輯、國際化、AI 對話
```
