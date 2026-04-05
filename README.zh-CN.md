# 人民币汇率仪表盘

[English](README.md) | **简体中文**

一个自托管的网页仪表盘，用于追踪以人民币为中心的汇率数据，支持交互式图表、AI 智能分析和中英双语界面。

## 功能特性

- **12 个货币对**每日追踪 —— 英镑/欧元/美元兑人民币、交叉汇率，以及人民币兑日元/韩元/新台币/印度卢比/卢布/港币
- **交互式图表**，带最大/最小值标签、十字准线提示和拖拽排序
- **两种显示模式** —— 分离视图（12 张独立图表）或合并视图（3 张多线图表）
- **灵活的时间范围** —— 滚动窗口（7天/1个月/3个月/6个月/1年）、日历锚定（本/上周/月/年）或全部数据
- **列数布局切换** —— 1、2 或 3 列
- **导出功能** —— 单独导出各图表 PNG 或合并为一张图片
- **AI 对话侧边栏** —— 基于自托管 LiteLLM 代理，针对当前显示数据提问分析
- **中英双语界面** —— English 与简体中文自由切换
- **无需构建** —— 原生 JS + CDN 引入的 Chart.js

## 截图

**分离视图** —— 以网格形式展示 12 张独立图表，每张追踪一个货币对。右侧 AI 对话侧边栏已展开，显示波动分析摘要，包含最小值/最大值/区间汇总表及主要发现。

![分离视图](pictures/CNY%20Exchange%20Rate%20Dashboard%20-%20Separate%20View.zh-CN.png)

**合并视图** —— 3 张多线分组图表（西方货币→人民币、人民币兑出、交叉汇率），便于同组货币对的横向对比。AI 对话侧边栏标注了所有货币对中波动最大和最小的汇率。

![合并视图](pictures/CNY%20Exchange%20Rate%20Dashboard%20-%20Merged%20View.zh-CN.png)

## 环境要求

- Python 3.9+
- pip 依赖包：`fastapi`、`uvicorn`、`requests`

```bash
pip install -r requirements.txt
```

## 快速开始

```bash
# 1. 采集历史数据（最近 90 天）
python collect.py --backfill

# 2. 启动服务并自动打开浏览器
python launch.py
```

或手动启动服务：

```bash
uvicorn app:app --reload
# 访问 http://localhost:8000
```

## 数据采集

汇率数据来源于 [fawazahmed0 currency API](https://github.com/fawazahmed0/exchange-api)，完全免费，无需 API 密钥。

```bash
python collect.py                        # 仅采集今日汇率
python collect.py --backfill             # 回填最近 90 天
python collect.py --backfill --days 365  # 自定义回填天数
python collect.py --workers 8            # 自定义并发线程数
```

采集器会自动跳过数据库中已存在的记录，可随时安全重复运行。

## AI 对话配置

AI 对话侧边栏需要配合自托管的 [LiteLLM 代理](https://docs.litellm.ai/docs/proxy/quick_start)使用。

1. 点击工具栏中的 **AI 对话** 按钮打开侧边栏
2. 点击侧边栏标题中的 **设置** 按钮
3. 填写 LiteLLM 地址（默认：`http://localhost:6655/litellm`）和 API 密钥，点击 **加载** 获取可用模型
4. 选择模型后点击 **保存**
5. 勾选需要作为上下文的图表，然后输入问题发送

凭证仅保存在浏览器 `localStorage` 中，服务端不做任何持久化存储。

## 货币对说明

| 分组 | 货币对 |
|---|---|
| 兑入人民币 | 英镑、欧元、美元 -> 人民币 |
| 交叉汇率 | 英镑 -> 欧元、英镑 -> 美元、欧元 -> 美元 |
| 人民币兑出 | 人民币 -> 日元、韩元、新台币、印度卢比、卢布、港币 |

如需添加新货币对，请更新 `collect.py` 中的 `PAIRS`，并在 `templates/index.html` 和 `static/charts.js` 中添加对应的图表卡片。

## 项目结构

```
app.py           # FastAPI 服务端及 API 路由
collect.py       # ETL：采集并存储每日汇率
db.py            # SQLite 数据层（rates.db）
launch.py        # 启动服务并打开浏览器
templates/
  index.html     # 仪表盘 UI
static/
  charts.js      # 图表逻辑、国际化、AI 对话
```
