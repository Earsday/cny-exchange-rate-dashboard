const charts = {};
let mergedMode = false;
let currentLang = "en";

// ── i18n ──────────────────────────────────────────────────────────────────────
const I18N = {
  en: {
    title: "CNY Exchange Rate Dashboard",
    from: "From (MM/DD/YYYY)", to: "To (MM/DD/YYYY)",
    refresh: "Refresh", all: "All", inPast: "In past", since: "Since",
    thisWeek: "This week", thisMonth: "This month", thisYear: "This year",
    lastWeek: "Last week", lastMonth: "Last month", lastYear: "Last year",
    col1: "1 col", col2: "2 cols", col3: "3 cols", col4: "4 cols",
    "7d": "7D", "1m": "1M", "3m": "3M", "6m": "6M", "1y": "1Y",
    crossRatesSection: "Western Cross Rates",
    cryptoSection: "Crypto",
    mergedView: "Merged View", separateView: "Separate View",
    keepUpToDate: "Update offline data", export: "Export",
    exportSeparate: "Separate images", exportCombined: "Combined image",
    aiChat: "AI Chat",
    noData: "No data available",
    mergedCNYTitle: "Western (GBP / EUR / USD) -> CNY",
    mergedCrossTitle: "Cross Rates (GBP / EUR / USD)",
    mergedCNYOutTitle: "CNY Outbound",
    aiAssistant: "AI Assistant",
    moveToLeft: "Move to Left", moveToRight: "Move to Right",
    settings: "Settings",
    includeCharts: "Include charts:",
    selectAll: "All", deselectAll: "None",
    send: "Send",
    chatPlaceholderReady: "Ask about the data...",
    chatPlaceholderNotReady: "Configure AI settings first (click Settings)",
    thinking: "Thinking...",
    aiSettings: "AI Assistant Settings",
    baseUrl: "LiteLLM Base URL", apiKey: "API Key", model: "Model",
    loadModelsHint: "-- load models --", load: "Load", loading: "Loading...",
    loadModelsAlert: "Please fill in the Base URL and API Key first.",
    loadModelsFailed: "Failed to load models: ",
    selectModelHint: "-- select a model --",
    cancel: "Cancel", save: "Save",
    updating: "Updating...", upToDate: "Up-to-date!", failed: "Failed",
    chatError: "Error: ", noChartsSelected: "No charts selected — check at least one chart to include data context.",
    loadingData: "Loading...", selectModelFirst: "Please select a model before saving.",
    noDataYet: "No data yet — run 'Update offline data' to collect rates first.",
    exportTooLarge: "The combined image is too large to export. Try fewer columns or switch to Merged View.",
    resetOrder: "Reset order", resetSize: "Reset size",
    terminalUi: "Terminal UI →",
    theme: "Theme ▾", themeDefault: "Classic Blue", themeMidnight: "Midnight", themeRose: "Rose",
  },
  zh: {
    title: "人民币汇率仪表盘",
    from: "开始（月/日/年）", to: "结束（月/日/年）",
    refresh: "刷新", all: "全部", inPast: "过去", since: "自",
    thisWeek: "本周", thisMonth: "本月", thisYear: "今年",
    lastWeek: "上周", lastMonth: "上月", lastYear: "去年",
    col1: "1列", col2: "2列", col3: "3列", col4: "4列",
    "7d": "7天", "1m": "1个月", "3m": "3个月", "6m": "6个月", "1y": "1年",
    crossRatesSection: "西方货币交叉汇率",
    cryptoSection: "加密货币",
    mergedView: "合并视图", separateView: "分离视图",
    keepUpToDate: "更新离线数据", export: "导出",
    exportSeparate: "分别导出图片", exportCombined: "合并导出图片",
    aiChat: "AI 对话",
    noData: "暂无数据",
    mergedCNYTitle: "西方货币 (GBP / EUR / USD) -> 人民币",
    mergedCrossTitle: "交叉汇率 (GBP / EUR / USD)",
    mergedCNYOutTitle: "人民币兑出",
    aiAssistant: "AI 助手",
    moveToLeft: "移至左侧", moveToRight: "移至右侧",
    settings: "设置",
    includeCharts: "包含图表：",
    selectAll: "全选", deselectAll: "取消",
    send: "发送",
    chatPlaceholderReady: "询问数据相关问题...",
    chatPlaceholderNotReady: "请先配置 AI 设置（点击设置）",
    thinking: "思考中...",
    aiSettings: "AI 助手设置",
    baseUrl: "LiteLLM 地址", apiKey: "API 密钥", model: "模型",
    loadModelsHint: "-- 加载模型 --", load: "加载", loading: "加载中...",
    loadModelsAlert: "请先填写 Base URL 和 API 密钥。",
    loadModelsFailed: "加载模型失败：",
    selectModelHint: "-- 选择模型 --",
    cancel: "取消", save: "保存",
    updating: "更新中...", upToDate: "已是最新！", failed: "失败",
    chatError: "错误：", noChartsSelected: "未选择图表——请至少勾选一个图表以提供数据上下文。",
    loadingData: "加载中...", selectModelFirst: "请先选择模型再保存。",
    noDataYet: '暂无数据——请点击\u201C更新离线数据\u201D按钮先采集汇率数据。',
    exportTooLarge: "合并图片尺寸过大，无法导出。请减少列数或切换至合并视图。",
    resetOrder: "重置顺序", resetSize: "重置大小",
    terminalUi: "终端界面 →",
    theme: "主题 ▾", themeDefault: "经典蓝", themeMidnight: "暗夜", themeRose: "玫瑰",
  },
  zht: {
    title: "人民幣匯率儀表板",
    from: "開始（月/日/年）", to: "結束（月/日/年）",
    refresh: "重新整理", all: "全部", inPast: "過去", since: "自",
    thisWeek: "本週", thisMonth: "本月", thisYear: "今年",
    lastWeek: "上週", lastMonth: "上月", lastYear: "去年",
    col1: "1欄", col2: "2欄", col3: "3欄", col4: "4欄",
    "7d": "7天", "1m": "1個月", "3m": "3個月", "6m": "6個月", "1y": "1年",
    crossRatesSection: "西方貨幣交叉匯率",
    cryptoSection: "加密貨幣",
    mergedView: "合併檢視", separateView: "分離檢視",
    keepUpToDate: "更新離線資料", export: "匯出",
    exportSeparate: "分別匯出圖片", exportCombined: "合併匯出圖片",
    aiChat: "AI 對話",
    noData: "暫無資料",
    mergedCNYTitle: "西方貨幣 (GBP / EUR / USD) -> 人民幣",
    mergedCrossTitle: "交叉匯率 (GBP / EUR / USD)",
    mergedCNYOutTitle: "人民幣兌出",
    aiAssistant: "AI 助理",
    moveToLeft: "移至左側", moveToRight: "移至右側",
    settings: "設定",
    includeCharts: "包含圖表：",
    selectAll: "全選", deselectAll: "取消",
    send: "傳送",
    chatPlaceholderReady: "詢問資料相關問題...",
    chatPlaceholderNotReady: "請先設定 AI（點擊設定）",
    thinking: "思考中...",
    aiSettings: "AI 助理設定",
    baseUrl: "LiteLLM 位址", apiKey: "API 金鑰", model: "模型",
    loadModelsHint: "-- 載入模型 --", load: "載入", loading: "載入中...",
    loadModelsAlert: "請先填寫 Base URL 和 API 金鑰。",
    loadModelsFailed: "載入模型失敗：",
    selectModelHint: "-- 選擇模型 --",
    cancel: "取消", save: "儲存",
    updating: "更新中...", upToDate: "已是最新！", failed: "失敗",
    chatError: "錯誤：", noChartsSelected: "未選擇圖表——請至少勾選一個圖表以提供資料脈絡。",
    loadingData: "載入中...", selectModelFirst: "請先選擇模型再儲存。",
    noDataYet: "暫無資料——請點擊「更新離線資料」按鈕先採集匯率資料。",
    exportTooLarge: "合併圖片尺寸過大，無法匯出。請減少欄數或切換至合併檢視。",
    resetOrder: "重置順序", resetSize: "重置大小",
    terminalUi: "終端介面 →",
    theme: "主題 ▾", themeDefault: "經典藍", themeMidnight: "暗夜", themeRose: "玫瑰",
  }
};

function t(key) {
  return (I18N[currentLang] || I18N.en)[key] || key;
}

function applyLang() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.title = t("title");
  document.documentElement.lang = currentLang === "zh" ? "zh-CN" : currentLang === "zht" ? "zh-TW" : "en-US";
  // Highlight active language button
  const enBtn  = document.getElementById("langEn");
  const zhBtn  = document.getElementById("langZh");
  const zhtBtn = document.getElementById("langZht");
  [{ btn: enBtn, code: "en" }, { btn: zhBtn, code: "zh" }, { btn: zhtBtn, code: "zht" }].forEach(({ btn, code }) => {
    if (!btn) return;
    const active = currentLang === code;
    btn.style.color          = active ? "#1e40af" : "#2563eb";
    btn.style.fontWeight     = active ? "700"     : "400";
    btn.style.textDecoration = active ? "none"    : "underline";
    btn.style.cursor         = active ? "default" : "pointer";
    btn.disabled             = active;
  });
  // Update dynamic placeholders
  const input = document.getElementById("chatInput");
  const ready = !input.disabled;
  input.placeholder = ready ? t("chatPlaceholderReady") : t("chatPlaceholderNotReady");
  // Update toggleMode button (state-dependent)
  document.getElementById("toggleMode").textContent = mergedMode ? t("separateView") : t("mergedView");
  // Update moveSidebarBtn (state-dependent)
  const isLeft = document.getElementById("chatSidebar").classList.contains("sidebar-left");
  document.getElementById("moveSidebarBtn").textContent = isLeft ? t("moveToRight") : t("moveToLeft");
  // Re-render chart checkboxes with localized labels
  populateCheckboxes();
}

function setLang(lang) {
  currentLang = lang;
  localStorage.setItem("lang", lang);
  applyLang();
}

function toggleLang() {
  setLang(currentLang === "en" ? "zh" : "en");
}


const CHART_META = {
  chartGBPCNY:       { label: "GBP -> CNY",      labelZh: "英镑 -> 人民币",      labelZht: "英鎊 -> 人民幣" },
  chartEURCNY:       { label: "EUR -> CNY",      labelZh: "欧元 -> 人民币",      labelZht: "歐元 -> 人民幣" },
  chartUSDCNY:       { label: "USD -> CNY",      labelZh: "美元 -> 人民币",      labelZht: "美元 -> 人民幣" },
  chartGBPEUR:       { label: "GBP -> EUR",      labelZh: "英镑 -> 欧元",        labelZht: "英鎊 -> 歐元" },
  chartGBPUSD:       { label: "GBP -> USD",      labelZh: "英镑 -> 美元",        labelZht: "英鎊 -> 美元" },
  chartEURUSD:       { label: "EUR -> USD",      labelZh: "欧元 -> 美元",        labelZht: "歐元 -> 美元" },
  chartCNYJPY:       { label: "CNY -> JPY",      labelZh: "人民币 -> 日元",      labelZht: "人民幣 -> 日圓" },
  chartCNYKRW:       { label: "CNY -> KRW",      labelZh: "人民币 -> 韩元",      labelZht: "人民幣 -> 韓元" },
  chartCNYTWD:       { label: "CNY -> TWD",      labelZh: "人民币 -> 新台币",    labelZht: "人民幣 -> 新台幣" },
  chartCNYINR:       { label: "CNY -> INR",      labelZh: "人民币 -> 印度卢比",  labelZht: "人民幣 -> 印度盧比" },
  chartCNYRUB:       { label: "CNY -> RUB",      labelZh: "人民币 -> 卢布",      labelZht: "人民幣 -> 盧布" },
  chartCNYHKD:       { label: "CNY -> HKD",      labelZh: "人民币 -> 港币",      labelZht: "人民幣 -> 港幣" },
  chartCNYUAH:       { label: "CNY -> UAH",      labelZh: "人民币 -> 乌克兰格里夫纳", labelZht: "人民幣 -> 烏克蘭格里夫納" },
  chartILSCNY:       { label: "ILS -> CNY",      labelZh: "以色列新谢克尔 -> 人民币", labelZht: "以色列新謝克爾 -> 人民幣" },
  chartUSDJPY:       { label: "USD -> JPY",      labelZh: "美元 -> 日元",        labelZht: "美元 -> 日圓" },
  chartUSDTWD:       { label: "USD -> TWD",      labelZh: "美元 -> 新台币",      labelZht: "美元 -> 新台幣" },
  chartBTCUSD:       { label: "BTC -> USD",      labelZh: "比特币 -> 美元",      labelZht: "比特幣 -> 美元" },
  chartBTCCNY:       { label: "BTC -> CNY",      labelZh: "比特币 -> 人民币",    labelZht: "比特幣 -> 人民幣" },
  chartBTCEUR:       { label: "BTC -> EUR",      labelZh: "比特币 -> 欧元",      labelZht: "比特幣 -> 歐元" },
  chartMergedCNY:    { label: "Western (GBP / EUR / USD) -> CNY",  labelZh: "西方货币 (GBP / EUR / USD) -> 人民币", labelZht: "西方貨幣 (GBP / EUR / USD) -> 人民幣" },
  chartMergedCross:  { label: "Cross Rates (GBP / EUR / USD)",     labelZh: "交叉汇率 (GBP / EUR / USD)",          labelZht: "交叉匯率 (GBP / EUR / USD)" },
  chartMergedCNYOut: { label: "CNY Outbound",    labelZh: "人民币兑出",          labelZht: "人民幣兌出" },
};

function toLocalDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function defaultDates() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 90);
  document.getElementById("toDate").value = toLocalDate(to);
  document.getElementById("fromDate").value = toLocalDate(from);
}

function setRange(days) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  document.getElementById("toDate").value = toLocalDate(to);
  document.getElementById("fromDate").value = toLocalDate(from);
  document.querySelectorAll(".quick-ranges button").forEach(b => b.classList.remove("active"));
  const btn = document.getElementById("qr" + days);
  if (btn) btn.classList.add("active");
  loadAll();
}

async function setAll() {
  const res = await fetch("/api/date-range");
  const { min, max } = await res.json();
  if (!min || !max) { alert(t("noDataYet")); return; }
  document.getElementById("fromDate").value = min;
  document.getElementById("toDate").value = max;
  document.querySelectorAll(".quick-ranges button").forEach(b => b.classList.remove("active"));
  document.getElementById("qrAll").classList.add("active");
  loadAll();
}

function setSince(period) {
  const today = new Date();
  let from, to;

  if (period === "week") {
    from = new Date(today);
    from.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Monday
    to = today;
  } else if (period === "month") {
    from = new Date(today.getFullYear(), today.getMonth(), 1);
    to = today;
  } else if (period === "year") {
    from = new Date(today.getFullYear(), 0, 1);
    to = today;
  } else if (period === "lastWeek") {
    const day = today.getDay() || 7;
    from = new Date(today);
    from.setDate(today.getDate() - day - 6); // last Monday
    to = today;
  } else if (period === "lastMonth") {
    from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    to = today;
  } else if (period === "lastYear") {
    from = new Date(today.getFullYear() - 1, 0, 1);
    to = today;
  }

  document.getElementById("fromDate").value = toLocalDate(from);
  document.getElementById("toDate").value = toLocalDate(to);
  document.querySelectorAll(".quick-ranges button").forEach(b => b.classList.remove("active"));
  const idMap = { week: "qrThisWeek", month: "qrThisMonth", year: "qrThisYear",
                  lastWeek: "qrLastWeek", lastMonth: "qrLastMonth", lastYear: "qrLastYear" };
  document.getElementById(idMap[period]).classList.add("active");
  loadAll();
}

function clearQuickRange() {
  document.querySelectorAll(".quick-ranges button").forEach(b => b.classList.remove("active"));
}

async function fetchRates(base, target) {
  const from = document.getElementById("fromDate").value;
  const to = document.getElementById("toDate").value;
  const params = new URLSearchParams({ base, target });
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  const res = await fetch(`/api/rates?${params}`);
  if (!res.ok) throw new Error(`Failed to fetch ${base}/${target}: ${res.status}`);
  return res.json();
}

const minMaxPlugin = {
  id: "minMaxLabels",
  afterDatasetsDraw(chart) {
    const ctx = chart.ctx;
    chart.data.datasets.forEach((dataset, di) => {
      const values = dataset.data.filter(v => v !== null && v !== undefined);
      if (!values.length) return;
      const max = Math.max(...values);
      const min = Math.min(...values);
      const maxIdx = dataset.data.indexOf(max);
      const minIdx = dataset.data.indexOf(min);
      const meta = chart.getDatasetMeta(di);
      if (!meta.visible) return;

      [{ idx: maxIdx, val: max, above: true }, { idx: minIdx, val: min, above: false }].forEach(({ idx, val, above }) => {
        const pt = meta.data[idx];
        if (!pt) return;
        const x = pt.x;
        const y = pt.y;
        const label = val.toFixed(4);
        const { left, right, top, bottom } = chart.chartArea;

        ctx.save();
        ctx.font = "bold 11px system-ui";
        ctx.textAlign = "center";
        const tw = ctx.measureText(label).width;
        const pad = 3;
        const bw = tw + pad * 2;
        const bh = 16;

        // clamp x so badge stays within chart area
        let bx = x - bw / 2;
        bx = Math.max(left, Math.min(bx, right - bw));

        // place above or below, flip if it would go out of bounds
        let by = above ? y - 24 : y + 6;
        if (by < top) by = y + 6;
        if (by + bh > bottom) by = y - 24;

        ctx.fillStyle = above ? "#16a34a" : "#dc2626";
        ctx.beginPath();
        ctx.rect(bx, by, bw, bh);
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.fillText(label, bx + bw / 2, by + 12);
        ctx.restore();

        // dot
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = above ? "#16a34a" : "#dc2626";
        ctx.fill();
        ctx.restore();
      });
    });
  }
};

Chart.register(minMaxPlugin);

const chartOptions = {
  responsive: true,
  interaction: {
    mode: "index",
    intersect: false,
  },
  plugins: {
    tooltip: {
      mode: "index",
      intersect: false,
      callbacks: {
        label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(4)}`
      }
    },
    crosshair: false,
  },
  scales: {
    x: {
      ticks: { maxTicksLimit: 8 }
    },
    y: {
      ticks: { callback: v => v.toFixed(2) }
    }
  },
  onHover: (event, elements, chart) => {
    const points = chart.getElementsAtEventForMode(event.native, "index", { intersect: false }, false);
    chart.canvas.style.cursor = points.length ? "crosshair" : "default";
  },
};

function renderChart(canvasId, noDataId, label, data, color) {
  const canvas = document.getElementById(canvasId);
  const noData = document.getElementById(noDataId);

  if (!data || data.length === 0) {
    canvas.style.display = "none";
    noData.style.display = "block";
    return;
  }

  canvas.style.display = "block";
  noData.style.display = "none";

  const labels = data.map(d => d.date);
  const values = data.map(d => d.rate);

  if (charts[canvasId]) {
    charts[canvasId].destroy();
  }

  charts[canvasId] = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label,
        data: values,
        borderColor: color,
        backgroundColor: color + "22",
        borderWidth: 2,
        pointRadius: data.length > 60 ? 0 : 3,
        fill: true,
        tension: 0.3,
      }]
    },
    options: { ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }
  });
}

function renderMergedChart(canvasId, datasets) {
  if (charts[canvasId]) {
    charts[canvasId].destroy();
  }

  const noDataId = canvasId.replace("chart", "noData");
  const noDataEl = document.getElementById(noDataId);

  // Use the dates from the first non-empty dataset
  const reference = datasets.find(d => d.data && d.data.length > 0);
  if (!reference) {
    if (noDataEl) { noDataEl.style.display = ""; document.getElementById(canvasId).style.display = "none"; }
    return;
  }
  if (noDataEl) { noDataEl.style.display = "none"; document.getElementById(canvasId).style.display = ""; }
  const labels = reference.data.map(d => d.date);
  const pointRadius = labels.length > 60 ? 0 : 3;

  charts[canvasId] = new Chart(document.getElementById(canvasId), {
    type: "line",
    data: {
      labels,
      datasets: datasets.map(d => ({
        label: d.label,
        data: d.data ? d.data.map(r => r.rate) : [],
        borderColor: d.color,
        backgroundColor: d.color + "22",
        borderWidth: 2,
        pointRadius,
        fill: false,
        tension: 0.3,
      }))
    },
    options: { ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: true, position: "top" } } }
  });
}

async function updateData() {
  const btn = document.getElementById("updateBtn");
  btn.textContent = t("updating");
  btn.disabled = true;
  btn.classList.add("btn-updating");
  btn.style.background = "";
  btn.style.backgroundImage = "";
  let ok = false;
  try {
    const fromDate = document.getElementById("fromDate").value || null;
    const res = await fetch("/api/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ from_date: fromDate }),
    });
    ({ ok } = await res.json());
  } catch (e) {
    ok = false;
  } finally {
    btn.classList.remove("btn-updating");
    btn.textContent = ok ? t("upToDate") : t("failed");
    btn.style.background = ok ? "#16a34a" : "#dc2626";
    setTimeout(() => {
      btn.textContent = t("keepUpToDate");
      btn.style.background = "#16a34a";
      btn.disabled = false;
    }, 2000);
  }
  if (ok) loadAll();
}

function toggleExportMenu() {
  const d = document.getElementById("exportDropdown");
  d.style.display = d.style.display === "flex" ? "none" : "flex";
}

function visibleCanvases() {
  const grid = document.getElementById(mergedMode ? "mergedGrid" : "separateGrid");
  return [...grid.querySelectorAll("canvas")].filter(c => c.style.display !== "none");
}

function exportSeparate() {
  toggleExportMenu();
  const titleH = 48;
  visibleCanvases().forEach(canvas => {
    const title = canvas.closest(".chart-card")?.querySelector("h2")?.textContent.trim() || "";
    const out = document.createElement("canvas");
    out.width = canvas.width;
    out.height = canvas.height + titleH;
    const ctx = out.getContext("2d");
    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.font = "bold 24px sans-serif";
    ctx.fillStyle = "#555";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(title, out.width / 2, titleH / 2);
    ctx.drawImage(canvas, 0, titleH);
    const a = document.createElement("a");
    a.href = out.toDataURL("image/png");
    a.download = (canvas.id || "chart") + ".png";
    a.click();
  });
}

function exportCombined() {
  toggleExportMenu();
  const canvases = visibleCanvases();
  if (!canvases.length) return;

  const grid = document.getElementById(mergedMode ? "mergedGrid" : "separateGrid");
  const colStr = grid.style.gridTemplateColumns || "1fr 1fr";
  const cols = colStr.trim().split(/\s+/).length;

  const gap = 24, pad = 24, titleH = 48;
const cw = canvases[0].width, ch = canvases[0].height;
  const cellH = titleH + ch;
  const rows = Math.ceil(canvases.length / cols);
  const totalW = pad * 2 + cw * cols + gap * (cols - 1);
  const totalH = pad * 2 + cellH * rows + gap * (rows - 1);

  if (totalW > 16384 || totalH > 16384 || totalW * totalH > 268435456) {
    alert(t("exportTooLarge"));
    return;
  }

  const out = document.createElement("canvas");
  out.width = totalW;
  out.height = totalH;
  const ctx = out.getContext("2d");
  ctx.fillStyle = "#f5f5f5";
  ctx.fillRect(0, 0, totalW, totalH);

  ctx.font = "bold 24px sans-serif";
  ctx.fillStyle = "#555";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  canvases.forEach((c, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = pad + col * (cw + gap);
    const y = pad + row * (cellH + gap);
    const title = c.closest(".chart-card")?.querySelector("h2")?.textContent.trim() || "";
    ctx.fillText(title, x + cw / 2, y + titleH / 2);
    ctx.drawImage(c, x, y + titleH);
  });

  const a = document.createElement("a");
  a.href = out.toDataURL("image/png");
  a.download = "charts.png";
  a.click();
}

function setCols(n) {
  document.querySelectorAll(".chart-grid").forEach(g => {
    g.style.gridTemplateColumns = `repeat(${n}, 1fr)`;
  });
  document.querySelectorAll(".col-picker button").forEach(b => b.classList.remove("active"));
  document.getElementById("col" + n).classList.add("active");
  Object.values(charts).forEach(c => {
    c.canvas.removeAttribute("width");
    c.canvas.removeAttribute("height");
    c.canvas.style.width = "";
    c.canvas.style.height = "";
    c.destroy();
  });
  for (const key of Object.keys(charts)) delete charts[key];
  setTimeout(() => loadAll(), 0);
}

function toggleMode() {
  mergedMode = !mergedMode;
  document.getElementById("separateGrid").style.display = mergedMode ? "none" : "grid";
  document.getElementById("mergedGrid").style.display = mergedMode ? "grid" : "none";
  document.getElementById("toggleMode").textContent = mergedMode ? t("separateView") : t("mergedView");
  loadAll();
}

async function loadAll() {
  const refreshBtn = document.getElementById("refreshBtn");
  if (refreshBtn) { refreshBtn.disabled = true; refreshBtn.textContent = t("loadingData"); }
  let gbpCny, eurCny, usdCny, gbpEur, gbpUsd, eurUsd, cnyJpy, cnyKrw, cnyTwd, cnyInr, cnyRub, cnyHkd, cnyUah, ilsCny, usdJpy, usdTwd, btcUsd, btcCny, btcEur;
  try {
    [gbpCny, eurCny, usdCny, gbpEur, gbpUsd, eurUsd, cnyJpy, cnyKrw, cnyTwd, cnyInr, cnyRub, cnyHkd, cnyUah, ilsCny, usdJpy, usdTwd, btcUsd, btcCny, btcEur] = await Promise.all([
      fetchRates("GBP", "CNY"),
      fetchRates("EUR", "CNY"),
      fetchRates("USD", "CNY"),
      fetchRates("GBP", "EUR"),
      fetchRates("GBP", "USD"),
      fetchRates("EUR", "USD"),
      fetchRates("CNY", "JPY"),
      fetchRates("CNY", "KRW"),
      fetchRates("CNY", "TWD"),
      fetchRates("CNY", "INR"),
      fetchRates("CNY", "RUB"),
      fetchRates("CNY", "HKD"),
      fetchRates("CNY", "UAH"),
      fetchRates("ILS", "CNY"),
      fetchRates("USD", "JPY"),
      fetchRates("USD", "TWD"),
      fetchRates("BTC", "USD"),
      fetchRates("BTC", "CNY"),
      fetchRates("BTC", "EUR"),
    ]);
  } catch (e) {
    console.error("Failed to load exchange rates:", e);
    return;
  } finally {
    if (refreshBtn) { refreshBtn.disabled = false; refreshBtn.setAttribute("data-i18n", "refresh"); refreshBtn.textContent = t("refresh"); }
  }

  if (mergedMode) {
    renderMergedChart("chartMergedCNY", [
      { label: "GBP -> CNY", data: gbpCny.data, color: "#9333ea" },
      { label: "EUR -> CNY", data: eurCny.data, color: "#06b6d4" },
      { label: "USD -> CNY", data: usdCny.data, color: "#2563eb" },
    ]);
    renderMergedChart("chartMergedCross", [
      { label: "GBP -> EUR", data: gbpEur.data, color: "#2563eb" },
      { label: "GBP -> USD", data: gbpUsd.data, color: "#f472b6" },
      { label: "EUR -> USD", data: eurUsd.data, color: "#a78bfa" },
    ]);
    renderMergedChart("chartMergedCNYOut", [
      { label: "CNY -> JPY", data: cnyJpy.data, color: "#2563eb" },
      { label: "CNY -> KRW", data: cnyKrw.data, color: "#f472b6" },
      { label: "CNY -> TWD", data: cnyTwd.data, color: "#06b6d4" },
      { label: "CNY -> INR", data: cnyInr.data, color: "#ea580c" },
      { label: "CNY -> RUB", data: cnyRub.data, color: "#9333ea" },
      { label: "CNY -> HKD", data: cnyHkd.data, color: "#0891b2" },
    ]);
  } else {
    renderChart("chartGBPCNY", "noDataGBPCNY", "GBP -> CNY", gbpCny.data, "#9333ea");
    renderChart("chartEURCNY", "noDataEURCNY", "EUR -> CNY", eurCny.data, "#06b6d4");
    renderChart("chartUSDCNY", "noDataUSDCNY", "USD -> CNY", usdCny.data, "#2563eb");
    renderChart("chartGBPEUR", "noDataGBPEUR", "GBP -> EUR", gbpEur.data, "#7c3aed");
    renderChart("chartGBPUSD", "noDataGBPUSD", "GBP -> USD", gbpUsd.data, "#f472b6");
    renderChart("chartEURUSD", "noDataEURUSD", "EUR -> USD", eurUsd.data, "#a78bfa");
    renderChart("chartUSDJPY", "noDataUSDJPY", "USD -> JPY", usdJpy.data, "#d97706");
    renderChart("chartUSDTWD", "noDataUSDTWD", "USD -> TWD", usdTwd.data, "#0891b2");
    renderChart("chartCNYJPY", "noDataCNYJPY", "CNY -> JPY", cnyJpy.data, "#ea580c");
    renderChart("chartBTCUSD", "noDataBTCUSD", "BTC -> USD", btcUsd.data, "#f59e0b");
    renderChart("chartBTCCNY", "noDataBTCCNY", "BTC -> CNY", btcCny.data, "#fb923c");
    renderChart("chartBTCEUR", "noDataBTCEUR", "BTC -> EUR", btcEur.data, "#d97706");
    renderChart("chartCNYUAH", "noDataCNYUAH", "CNY -> UAH", cnyUah.data, "#8b5cf6");
    renderChart("chartILSCNY", "noDataILSCNY", "ILS -> CNY", ilsCny.data, "#0369a1");
    renderChart("chartCNYKRW", "noDataCNYKRW", "CNY -> KRW", cnyKrw.data, "#f472b6");
    renderChart("chartCNYTWD", "noDataCNYTWD", "CNY -> TWD", cnyTwd.data, "#06b6d4");
    renderChart("chartCNYINR", "noDataCNYINR", "CNY -> INR", cnyInr.data, "#b45309");
    renderChart("chartCNYRUB", "noDataCNYRUB", "CNY -> RUB", cnyRub.data, "#e879f9");
    renderChart("chartCNYHKD", "noDataCNYHKD", "CNY -> HKD", cnyHkd.data, "#0d9488");
  }
  populateCheckboxes();
  initDragAndDrop();
  restoreCardOrder();
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function toggleSidebar() {
  const s = document.getElementById("chatSidebar");
  const visible = getComputedStyle(s).display !== "none";
  s.style.display = visible ? "none" : "flex";
  setTimeout(() => {
    Object.values(charts).forEach(c => c.resize());
  }, 50);
}

function toggleSidebarSide() {
  const s = document.getElementById("chatSidebar");
  s.classList.toggle("sidebar-left");
  const isLeft = s.classList.contains("sidebar-left");
  document.getElementById("moveSidebarBtn").textContent = isLeft ? t("moveToRight") : t("moveToLeft");
  requestAnimationFrame(() => {
    Object.values(charts).forEach(c => c.resize());
  });
}

function initSidebarResize() {
  const handle = document.getElementById("sidebarResizeHandle");
  const sidebar = document.getElementById("chatSidebar");
  let startX, startWidth;
  const stored = parseFloat(localStorage.getItem("sidebarWidthFraction"));
  let widthFraction = isNaN(stored) ? null : stored;

  function showResetBtn(visible) {
    const btn = document.getElementById("resetSizeBtn");
    if (btn) { btn.style.display = visible ? "" : "none"; if (visible) { btn.setAttribute("data-i18n", "resetSize"); btn.textContent = t("resetSize"); } }
  }

  function applyFraction() {
    if (widthFraction !== null) {
      const minW = window.innerWidth * 0.15;
      const maxW = window.innerWidth * 0.50;
      sidebar.style.width = Math.min(maxW, Math.max(minW, widthFraction * window.innerWidth)) + "px";
    }
  }

  applyFraction(); // restore persisted width on load
  if (widthFraction !== null) showResetBtn(true);

  window.addEventListener("resize", applyFraction);

  handle.addEventListener("mousedown", e => {
    startX = e.clientX;
    startWidth = sidebar.offsetWidth;
    handle.classList.add("dragging");
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function onMouseMove(e) {
      const isLeft = sidebar.classList.contains("sidebar-left");
      const delta = isLeft ? (e.clientX - startX) : (startX - e.clientX);
      const minW = window.innerWidth * 0.15;
      const maxW = window.innerWidth * 0.50;
      const newW = Math.min(maxW, Math.max(minW, startWidth + delta));
      widthFraction = newW / window.innerWidth;
      sidebar.style.width = newW + "px";
    }

    function onMouseUp() {
      handle.classList.remove("dragging");
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (widthFraction !== null) localStorage.setItem("sidebarWidthFraction", widthFraction);
      showResetBtn(true);
      requestAnimationFrame(() => { Object.values(charts).forEach(c => c.resize()); });
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
    e.preventDefault();
  });
}

function resetSidebarSize() {
  localStorage.removeItem("sidebarWidthFraction");
  const sidebar = document.getElementById("chatSidebar");
  sidebar.style.width = "";
  const btn = document.getElementById("resetSizeBtn");
  if (btn) btn.style.display = "none";
  requestAnimationFrame(() => { Object.values(charts).forEach(c => c.resize()); });
}

function populateCheckboxes() {
  const activeGrid = document.getElementById(mergedMode ? "mergedGrid" : "separateGrid");
  const ids = Object.keys(charts).filter(id => {
    const c = charts[id].canvas;
    return c && c.style.display !== "none" && activeGrid.contains(c);
  });
  const box = document.getElementById("chartCheckboxes");
  const checked = new Set([...box.querySelectorAll("input:checked")].map(i => i.value));
  box.innerHTML = ids.map(id => {
    const meta = CHART_META[id] || {};
    const label = currentLang === "zht" && meta.labelZht ? meta.labelZht : currentLang === "zh" && meta.labelZh ? meta.labelZh : (meta.label || id);
    const isChecked = checked.has(id) ? " checked" : "";
    return `<label><input type="checkbox" value="${id}"${isChecked} />${label}</label>`;
  }).join("");
}

function setAllCharts(checked) {
  document.querySelectorAll("#chartCheckboxes input[type=checkbox]").forEach(cb => cb.checked = checked);
}


function openSettings() {
  document.getElementById("settingUrl").value = localStorage.getItem("llm_url") || "http://localhost:6655/litellm";
  document.getElementById("settingKey").value = localStorage.getItem("llm_key") || "";
  const saved = localStorage.getItem("llm_model") || "";
  const sel = document.getElementById("settingModel");
  // If saved model not in list, add it so it shows as selected
  if (saved && ![...sel.options].some(o => o.value === saved)) {
    const opt = document.createElement("option");
    opt.value = saved;
    opt.textContent = saved;
    sel.appendChild(opt);
  }
  sel.value = saved;
  updateLoadModelsBtn();
  document.getElementById("settingsModal").style.display = "flex";
}

function updateLoadModelsBtn() {
  const url = document.getElementById("settingUrl").value.trim();
  const key = document.getElementById("settingKey").value.trim();
  document.getElementById("loadModelsBtn").disabled = !(url && key);
}

function closeSettings() {
  document.getElementById("settingsModal").style.display = "none";
}

function saveSettings() {
  const url   = document.getElementById("settingUrl").value.trim();
  const key   = document.getElementById("settingKey").value.trim();
  const model = document.getElementById("settingModel").value.trim();
  if (!model) { alert(t("selectModelFirst")); return; }
  localStorage.setItem("llm_url",   url);
  localStorage.setItem("llm_key",   key);
  localStorage.setItem("llm_model", model);
  closeSettings();
  updateChatReady();
}

async function loadModels() {
  const url = document.getElementById("settingUrl").value.trim();
  const key = document.getElementById("settingKey").value.trim();
  if (!url || !key) {
    alert(t("loadModelsAlert"));
    return;
  }
  const btn = document.getElementById("loadModelsBtn");
  btn.textContent = t("loading");
  btn.disabled = true;
  try {
    const res = await fetch("/api/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base_url: url, api_key: key }),
    });
    if (!res.ok) {
      const detail = await res.json().then(j => j.detail || JSON.stringify(j)).catch(() => res.statusText);
      throw new Error(`HTTP ${res.status}: ${detail}`);
    }
    const json = await res.json();
    const models = [...new Set((json.data || [])
      .filter(m => m.model_info && m.model_info.mode === "chat")
      .map(m => m.model_name || m.id)
      .filter(Boolean))].sort();
    const sel = document.getElementById("settingModel");
    const current = sel.value;
    sel.innerHTML = `<option value="">${t("selectModelHint")}</option>` +
      models.map(m => `<option value="${m}"${m === current ? " selected" : ""}>${m}</option>`).join("");
    if (!sel.value && current) sel.value = current;
  } catch (e) {
    alert(t("loadModelsFailed") + e.message);
  } finally {
    btn.textContent = t("load");
    btn.disabled = false;
  }
}

function updateChatReady() {
  const ready = !!(localStorage.getItem("llm_url") && localStorage.getItem("llm_key") && localStorage.getItem("llm_model"));
  const input = document.getElementById("chatInput");
  const btn   = document.getElementById("chatSendBtn");
  input.disabled = !ready;
  btn.disabled   = !ready;
  input.placeholder = ready ? t("chatPlaceholderReady") : t("chatPlaceholderNotReady");
}

// ── Chat ──────────────────────────────────────────────────────────────────────
const chatHistory = [];

function safeParse(text) {
  const html = typeof marked !== "undefined" ? marked.parse(text) : text;
  return typeof DOMPurify !== "undefined" ? DOMPurify.sanitize(html) : html;
}

function appendBubble(role, text) {
  const div = document.createElement("div");
  div.className = `chat-bubble ${role}`;
  if (role.includes("assistant") && typeof marked !== "undefined") {
    div.innerHTML = safeParse(text);
  } else {
    div.textContent = text;
  }
  document.getElementById("chatMessages").appendChild(div);
  document.getElementById("chatMessages").scrollTop = 999999;
  return div;
}

async function sendChat() {
  const input = document.getElementById("chatInput");
  const text  = input.value.trim();
  if (!text) return;

  input.value = "";
  appendBubble("user", text);

  // Collect selected chart data
  const checked = [...document.querySelectorAll("#chartCheckboxes input:checked")].map(c => c.value);
  if (checked.length === 0) {
    appendBubble("assistant", t("noChartsSelected"));
    input.value = text;
    return;
  }

  chatHistory.push({ role: "user", content: text });
  const data = checked.map(id => {
    const chart = charts[id];
    if (!chart) return null;
    const labels = chart.data.labels || [];
    // For merged charts with multiple datasets, send each dataset separately
    return chart.data.datasets.map(ds => ({
      pair: ds.label || (CHART_META[id] || {}).label || id,
      dates: labels,
      rates: ds.data,
    }));
  }).filter(Boolean).flat();

  const thinking = appendBubble("assistant thinking", t("thinking"));

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: chatHistory,
        data,
        from_date: document.getElementById("fromDate").value,
        to_date:   document.getElementById("toDate").value,
        base_url:  localStorage.getItem("llm_url"),
        api_key:   localStorage.getItem("llm_key"),
        model:     localStorage.getItem("llm_model"),
      }),
    });
    const json = await res.json();
    const reply = json.reply || json.detail || t("chatError") + res.status;
    thinking.className = "chat-bubble assistant";
    thinking.innerHTML = safeParse(reply);
    chatHistory.push({ role: "assistant", content: reply });
  } catch (e) {
    thinking.className = "chat-bubble assistant";
    thinking.textContent = t("chatError") + e.message;
  }
}

// ── Drag & drop chart reordering ──────────────────────────────────────────────
let dragSrc = null;

const DEFAULT_ORDER_SEPARATE = ["chartGBPCNY","chartEURCNY","chartUSDCNY","chartCNYJPY","chartCNYKRW","chartCNYTWD","chartCNYINR","chartCNYRUB","chartCNYHKD","chartCNYUAH","chartILSCNY","chartUSDTWD","chartGBPEUR","chartGBPUSD","chartEURUSD","chartUSDJPY","chartBTCUSD","chartBTCCNY","chartBTCEUR"];
const DEFAULT_ORDER_MERGED   = ["chartMergedCNY","chartMergedCross","chartMergedCNYOut"];

function saveCardOrder() {
  const grid = document.getElementById(mergedMode ? "mergedGrid" : "separateGrid");
  const order = [...grid.querySelectorAll(".chart-card")].map(card => {
    const canvas = card.querySelector("canvas[id]");
    return canvas ? canvas.id : null;
  }).filter(Boolean);
  localStorage.setItem("chartOrder_" + (mergedMode ? "merged" : "separate"), JSON.stringify(order));
  const btn = document.getElementById("resetOrderBtn");
  if (btn) { btn.style.display = ""; btn.setAttribute("data-i18n", "resetOrder"); btn.textContent = t("resetOrder"); }
}

function restoreCardOrder() {
  const grid = document.getElementById(mergedMode ? "mergedGrid" : "separateGrid");
  const key = "chartOrder_" + (mergedMode ? "merged" : "separate");
  let order;
  try { order = JSON.parse(localStorage.getItem(key)); } catch { return; }
  if (!order || !order.length) return;
  order.forEach(canvasId => {
    const card = grid.querySelector(`canvas#${canvasId}`)?.closest(".chart-card");
    if (card) grid.appendChild(card);
  });
  const btn = document.getElementById("resetOrderBtn");
  if (btn) { btn.style.display = ""; btn.setAttribute("data-i18n", "resetOrder"); btn.textContent = t("resetOrder"); }
}

function resetCardOrder() {
  localStorage.removeItem("chartOrder_separate");
  localStorage.removeItem("chartOrder_merged");
  const btn = document.getElementById("resetOrderBtn");
  if (btn) btn.style.display = "none";
  // Physically restore default DOM order for both grids
  [["separateGrid", DEFAULT_ORDER_SEPARATE], ["mergedGrid", DEFAULT_ORDER_MERGED]].forEach(([gridId, order]) => {
    const grid = document.getElementById(gridId);
    order.forEach(canvasId => {
      const card = grid.querySelector(`canvas#${canvasId}`)?.closest(".chart-card");
      if (card) grid.appendChild(card);
    });
  });
  loadAll();
}

function initDragAndDrop() {
  document.querySelectorAll(".chart-card").forEach(card => {
    // Collect live canvases (with Chart.js instances) before cloning
    const liveCanvases = {};
    card.querySelectorAll("canvas[id]").forEach(c => { liveCanvases[c.id] = c; });

    // Clone to wipe old listeners, then restore live canvases
    const fresh = card.cloneNode(true);
    fresh.querySelectorAll("canvas[id]").forEach(c => {
      if (liveCanvases[c.id]) c.replaceWith(liveCanvases[c.id]);
    });
    card.parentNode.replaceChild(fresh, card);
  });

  document.querySelectorAll(".chart-card").forEach(card => {
    let enterCount = 0;
    card.draggable = true;

    card.addEventListener("dragstart", e => {
      dragSrc = card;
      e.dataTransfer.effectAllowed = "move";
      setTimeout(() => card.classList.add("dragging"), 0);
    });
    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      document.querySelectorAll(".chart-card").forEach(c => {
        c.classList.remove("drag-over");
      });
      dragSrc = null;
    });
    card.addEventListener("dragenter", e => {
      e.preventDefault();
      enterCount++;
      if (card !== dragSrc) card.classList.add("drag-over");
    });
    card.addEventListener("dragleave", () => {
      enterCount--;
      if (enterCount === 0) card.classList.remove("drag-over");
    });
    card.addEventListener("dragover", e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    });
    card.addEventListener("drop", e => {
      e.preventDefault();
      enterCount = 0;
      card.classList.remove("drag-over");
      if (!dragSrc || dragSrc === card) return;
      const parent = card.parentNode;
      const srcNext = dragSrc.nextSibling;
      const tgtNext = card.nextSibling;
      if (tgtNext === dragSrc) {
        parent.insertBefore(dragSrc, card);
      } else {
        parent.insertBefore(card, srcNext);
        parent.insertBefore(dragSrc, tgtNext);
      }
      saveCardOrder();
    });
  });
}


document.addEventListener("keydown", e => {
  if (e.key === "Enter" && e.ctrlKey && document.activeElement.id === "chatInput") sendChat();
});

// ── V1 Theme ───────────────────────────────────────────────────────────────────
const V1_CHART_THEMES = {
  default:  { bg: "#ffffff", grid: "#e5e7eb", tick: "#9ca3af", tooltip: { bg: "#fff", border: "#e5e7eb", text: "#334155", title: "#1e293b" }, legend: "#64748b" },
  midnight: { bg: "#1a1d27", grid: "#2e3347", tick: "#64748b", tooltip: { bg: "#1a1d27", border: "#2e3347", text: "#e2e8f0", title: "#c7d2fe" }, legend: "#94a3b8" },
  rose:     { bg: "#ffffff", grid: "#fce7f3", tick: "#f9a8d4", tooltip: { bg: "#fff", border: "#fbcfe8", text: "#4a2030", title: "#db2777" }, legend: "#9d174d" },
};

function applyV1ChartTheme(name) {
  const T = V1_CHART_THEMES[name] || V1_CHART_THEMES.default;
  Chart.defaults.color       = T.tick;
  Chart.defaults.borderColor = T.grid;
  chartOptions.scales.x.grid  = { color: T.grid };
  chartOptions.scales.x.ticks = { maxTicksLimit: 8, color: T.tick };
  chartOptions.scales.y.grid  = { color: T.grid };
  chartOptions.scales.y.ticks = { callback: v => v.toFixed(2), color: T.tick };
  chartOptions.plugins.tooltip.backgroundColor = T.tooltip.bg;
  chartOptions.plugins.tooltip.borderColor     = T.tooltip.border;
  chartOptions.plugins.tooltip.borderWidth     = 1;
  chartOptions.plugins.tooltip.bodyColor       = T.tooltip.text;
  chartOptions.plugins.tooltip.titleColor      = T.tooltip.title;
}

function setTheme1(name) {
  document.body.className = document.body.className.replace(/\btheme-\w+\b/g, "").trim();
  if (name !== "default") document.body.classList.add("theme-" + name);
  localStorage.setItem("v1theme", name);
  document.querySelectorAll(".theme-opt1").forEach(b => b.classList.remove("active"));
  const id = { default: "themeDefault1", midnight: "themeMidnight1", rose: "themeRose1" }[name];
  const btn = document.getElementById(id);
  if (btn) btn.classList.add("active");
  document.getElementById("themeDropdown1").style.display = "none";
  applyV1ChartTheme(name);
  Object.values(charts).forEach(c => c.destroy());
  for (const k of Object.keys(charts)) delete charts[k];
  loadAll();
}

function toggleThemeMenu1() {
  const d = document.getElementById("themeDropdown1");
  d.style.display = d.style.display === "flex" ? "none" : "flex";
}

defaultDates();
setCols(3);
currentLang = localStorage.getItem("lang") || "en";
applyLang();
updateChatReady();
initSidebarResize();
// Restore v1 theme before first render
const _v1theme = localStorage.getItem("v1theme") || "default";
applyV1ChartTheme(_v1theme);
if (_v1theme !== "default") document.body.classList.add("theme-" + _v1theme);
const _v1themeId = { default: "themeDefault1", midnight: "themeMidnight1", rose: "themeRose1" }[_v1theme];
if (_v1themeId) { document.querySelectorAll(".theme-opt1").forEach(b => b.classList.remove("active")); document.getElementById(_v1themeId).classList.add("active"); }
document.getElementById("fromDate").addEventListener("change", clearQuickRange);
document.getElementById("toDate").addEventListener("change", clearQuickRange);
document.addEventListener("click", e => {
  if (!document.getElementById("exportMenu").contains(e.target))
    document.getElementById("exportDropdown").style.display = "none";
  if (document.getElementById("themeMenu") && !document.getElementById("themeMenu").contains(e.target))
    document.getElementById("themeDropdown1").style.display = "none";
});
loadAll();
