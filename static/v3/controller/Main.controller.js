sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/Theming",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageToast, Theming, Fragment) {
    "use strict";

    // ── Chart.js chart registry ─────────────────────────────────────────────────
    var _charts = {};
    var _mergedMode = false;
    var _cols = 3;
    var _chatHistory = [];
    var _dragSrc = null;

    // ── Chart metadata ──────────────────────────────────────────────────────────
    var CHART_META = {
        chartGBPCNY:       { en: "GBP -> CNY",  color: "#9333ea" },
        chartEURCNY:       { en: "EUR -> CNY",  color: "#06b6d4" },
        chartUSDCNY:       { en: "USD -> CNY",  color: "#2563eb" },
        chartGBPEUR:       { en: "GBP -> EUR",  color: "#2563eb" },
        chartGBPUSD:       { en: "GBP -> USD",  color: "#f472b6" },
        chartEURUSD:       { en: "EUR -> USD",  color: "#a78bfa" },
        chartCNYJPY:       { en: "CNY -> JPY",  color: "#2563eb" },
        chartCNYKRW:       { en: "CNY -> KRW",  color: "#f472b6" },
        chartCNYTWD:       { en: "CNY -> TWD",  color: "#06b6d4" },
        chartCNYINR:       { en: "CNY -> INR",  color: "#ea580c" },
        chartCNYRUB:       { en: "CNY -> RUB",  color: "#e879f9" },
        chartCNYHKD:       { en: "CNY -> HKD",  color: "#0891b2" },
        chartCNYUAH:       { en: "CNY -> UAH",  color: "#8b5cf6" },
        chartILSCNY:       { en: "ILS -> CNY",  color: "#d97706" },
        chartUSDJPY:       { en: "USD -> JPY",  color: "#9333ea" },
        chartUSDTWD:       { en: "USD -> TWD",  color: "#0891b2" },
        chartBTCUSD:       { en: "BTC -> USD",  color: "#2563eb" },
        chartBTCCNY:       { en: "BTC -> CNY",  color: "#fb923c" },
        chartBTCEUR:       { en: "BTC -> EUR",  color: "#a78bfa" },
        chartMergedCNY:    { en: "Western -> CNY",   color: "#2563eb" },
        chartMergedCross:  { en: "Cross Rates",       color: "#2563eb" },
        chartMergedCNYOut: { en: "CNY Outbound",      color: "#2563eb" }
    };

    var DEFAULT_ORDER_SEPARATE = [
        "chartGBPCNY","chartEURCNY","chartUSDCNY",
        "chartCNYJPY","chartCNYKRW","chartCNYTWD","chartCNYINR","chartCNYRUB","chartCNYHKD","chartCNYUAH","chartILSCNY",
        "chartUSDTWD",
        "chartGBPEUR","chartGBPUSD","chartEURUSD","chartUSDJPY",
        "chartBTCUSD","chartBTCCNY","chartBTCEUR"
    ];

    // ── Min/Max Chart.js plugin ──────────────────────────────────────────────────
    var minMaxPlugin = {
        id: "minMaxLabels",
        afterDatasetsDraw: function(chart) {
            var ctx = chart.ctx;
            chart.data.datasets.forEach(function(dataset, di) {
                var values = dataset.data.filter(function(v) { return v !== null && v !== undefined; });
                if (!values.length) return;
                var max = Math.max.apply(null, values);
                var min = Math.min.apply(null, values);
                var maxIdx = dataset.data.indexOf(max);
                var minIdx = dataset.data.indexOf(min);
                var meta = chart.getDatasetMeta(di);
                if (!meta.visible) return;
                [{idx: maxIdx, val: max, above: true}, {idx: minIdx, val: min, above: false}].forEach(function(pt) {
                    var point = meta.data[pt.idx];
                    if (!point) return;
                    var x = point.x, y = point.y;
                    var label = pt.val.toFixed(4);
                    var area = chart.chartArea;
                    ctx.save();
                    ctx.font = "bold 11px sans-serif";
                    ctx.textAlign = "center";
                    var tw = ctx.measureText(label).width;
                    var pad = 3, bw = tw + pad * 2, bh = 16;
                    var bx = Math.max(area.left, Math.min(x - bw / 2, area.right - bw));
                    var by = pt.above ? y - 24 : y + 6;
                    if (by < area.top) by = y + 6;
                    if (by + bh > area.bottom) by = y - 24;
                    ctx.fillStyle = pt.above ? "#16a34a" : "#dc2626";
                    ctx.fillRect(bx, by, bw, bh);
                    ctx.fillStyle = "#fff";
                    ctx.fillText(label, bx + bw / 2, by + 12);
                    ctx.restore();
                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(x, y, 4, 0, Math.PI * 2);
                    ctx.fillStyle = pt.above ? "#16a34a" : "#dc2626";
                    ctx.fill();
                    ctx.restore();
                });
            });
        }
    };

    // ── Helpers ──────────────────────────────────────────────────────────────────
    function toLocalDate(d) {
        return d.getFullYear() + "-" +
            String(d.getMonth() + 1).padStart(2, "0") + "-" +
            String(d.getDate()).padStart(2, "0");
    }

    function fetchRates(base, target, fromDate, toDate) {
        var url = "/api/rates?base=" + base + "&target=" + target;
        if (fromDate) url += "&from=" + fromDate;
        if (toDate)   url += "&to="   + toDate;
        return fetch(url).then(function(r) { return r.json(); });
    }

    return Controller.extend("cny.dashboard.controller.Main", {

        onInit: function () {
            var oView = this.getView();

            // Register Chart.js minMax plugin
            if (window.Chart) {
                Chart.register(minMaxPlugin);
            }

            // Restore lang
            var savedLang = localStorage.getItem("lang") || "en";
            this._setLang(savedLang);

            // Init dates (default 3M)
            var to = new Date(), from = new Date();
            from.setDate(from.getDate() - 90);
            oView.byId("fromDatePicker").setValue(toLocalDate(from));
            oView.byId("toDatePicker").setValue(toLocalDate(to));

            // Mark 3M button active
            this._setRangeActive("qr90");

            // Check chat ready
            this._updateChatReady();

            // Restore theme
            var savedTheme = localStorage.getItem("v3theme") || "sap_horizon";
            Theming.setTheme(savedTheme);

            // Initial load after Chart.js is ready
            var that = this;
            setTimeout(function() { that._loadAll(); }, 200);
        },

        // ── Language ──────────────────────────────────────────────────────────────
        _setLang: function(lang) {
            localStorage.setItem("lang", lang);
            var localeMap = { "en": "en", "zh_CN": "zh_CN", "zh_TW": "zh_TW" };
            var sLocale = localeMap[lang] || "en";
            sap.ui.getCore().getConfiguration().setLanguage(sLocale);

            var oSegBtn = this.getView().byId("langBtn");
            if (oSegBtn) {
                var items = oSegBtn.getItems();
                items.forEach(function(item) {
                    if (item.getKey() === lang) oSegBtn.setSelectedItem(item);
                });
            }
        },

        onLangChange: function(oEvent) {
            var key = oEvent.getParameter("item").getKey();
            this._setLang(key);
        },

        // ── Navigation ────────────────────────────────────────────────────────────
        onNavClassic: function() { window.location.href = "/"; },
        onNavTerminal: function() { window.location.href = "/v2"; },

        // ── Date helpers ──────────────────────────────────────────────────────────
        onDateChange: function() { this._loadAll(); },
        onRefresh: function() { this._loadAll(); },

        _getFromDate: function() { return this.getView().byId("fromDatePicker").getValue(); },
        _getToDate:   function() { return this.getView().byId("toDatePicker").getValue(); },

        _setDates: function(from, to) {
            this.getView().byId("fromDatePicker").setValue(toLocalDate(from));
            this.getView().byId("toDatePicker").setValue(toLocalDate(to));
        },

        // ── Quick ranges ──────────────────────────────────────────────────────────
        _rangeIds: ["qrAll","qr7","qr30","qr90","qr180","qr365",
                    "qrThisWeek","qrThisMonth","qrThisYear",
                    "qrLastWeek","qrLastMonth","qrLastYear"],

        _setRangeActive: function(activeId) {
            var oView = this.getView();
            this._rangeIds.forEach(function(id) {
                var btn = oView.byId(id);
                if (btn) btn.setType(id === activeId ? "Emphasized" : "Transparent");
            });
        },

        onSetAll: async function() {
            try {
                var res = await fetch("/api/date-range");
                var data = await res.json();
                if (!data.min || !data.max) { MessageToast.show("No data yet — run Update offline data first."); return; }
                this.getView().byId("fromDatePicker").setValue(data.min);
                this.getView().byId("toDatePicker").setValue(data.max);
                this._setRangeActive("qrAll");
                this._loadAll();
            } catch(e) { MessageToast.show("Error: " + e.message); }
        },

        onSetRange: function(oEvent) {
            var days = parseInt(oEvent.getSource().data("data"));
            var to = new Date(), from = new Date();
            from.setDate(from.getDate() - days);
            this._setDates(from, to);
            this._setRangeActive("qr" + days);
            this._loadAll();
        },

        onSetSince: function(oEvent) {
            var period = oEvent.getSource().data("data");
            var today = new Date(), from, to = today;
            if (period === "week") {
                from = new Date(today);
                from.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
            } else if (period === "month") {
                from = new Date(today.getFullYear(), today.getMonth(), 1);
            } else if (period === "year") {
                from = new Date(today.getFullYear(), 0, 1);
            } else if (period === "lastWeek") {
                var day = today.getDay() || 7;
                from = new Date(today); from.setDate(today.getDate() - day - 6);
                to = new Date(today); to.setDate(today.getDate() - day);
            } else if (period === "lastMonth") {
                from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                to = new Date(today.getFullYear(), today.getMonth(), 0);
            } else if (period === "lastYear") {
                from = new Date(today.getFullYear() - 1, 0, 1);
                to = new Date(today.getFullYear() - 1, 11, 31);
            }
            this._setDates(from, to);
            var idMap = {
                week: "qrThisWeek", month: "qrThisMonth", year: "qrThisYear",
                lastWeek: "qrLastWeek", lastMonth: "qrLastMonth", lastYear: "qrLastYear"
            };
            this._setRangeActive(idMap[period]);
            this._loadAll();
        },

        // ── Column picker ─────────────────────────────────────────────────────────
        onColChange: function(oEvent) {
            _cols = parseInt(oEvent.getParameter("item").getKey());
            this._reRenderCharts();
        },

        // ── View toggle ───────────────────────────────────────────────────────────
        onToggleMode: function() {
            var oView = this.getView();
            _mergedMode = !_mergedMode;
            oView.byId("separateGrid").setVisible(!_mergedMode);
            oView.byId("mergedGrid").setVisible(_mergedMode);
            var btn = oView.byId("toggleModeBtn");
            var i18n = oView.getModel("i18n").getResourceBundle();
            btn.setText(_mergedMode ? i18n.getText("separateView") : i18n.getText("mergedView"));
            this._destroyAllCharts();
            this._loadAll();
        },

        // ── Update offline data ───────────────────────────────────────────────────
        onUpdateData: async function() {
            var btn = this.getView().byId("updateBtn");
            var i18n = this.getView().getModel("i18n").getResourceBundle();
            btn.setText(i18n.getText("updating"));
            btn.setEnabled(false);
            btn.setType("Default");
            try {
                var fromDate = this._getFromDate() || null;
                var res = await fetch("/api/collect", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ from_date: fromDate })
                });
                var data = await res.json();
                btn.setText(data.ok ? i18n.getText("upToDate") : i18n.getText("failed"));
                btn.setType(data.ok ? "Success" : "Negative");
                if (data.ok) this._loadAll();
            } catch(e) {
                btn.setText(i18n.getText("failed"));
                btn.setType("Negative");
            } finally {
                var that = this;
                setTimeout(function() {
                    btn.setText(i18n.getText("updateOfflineData"));
                    btn.setType("Success");
                    btn.setEnabled(true);
                }, 2500);
            }
        },

        // ── Export ────────────────────────────────────────────────────────────────
        onExportSelected: function(oEvent) {
            var key = oEvent.getParameter("item").getKey();
            if (key === "separate") this._exportSeparate();
            else this._exportCombined();
        },

        _visibleCanvases: function() {
            var gridId = _mergedMode ? "mergedGrid" : "separateGrid";
            var grid = document.getElementById(this.getView().byId(gridId).getId());
            if (!grid) return [];
            return Array.from(grid.querySelectorAll("canvas[id]")).filter(function(c) {
                return c.style.display !== "none";
            });
        },

        _exportSeparate: function() {
            var titleH = 48;
            this._visibleCanvases().forEach(function(canvas) {
                var title = canvas.closest(".chartCard") ? canvas.closest(".chartCard").querySelector(".chartTitle").textContent.trim() : (canvas.id || "");
                var out = document.createElement("canvas");
                out.width = canvas.width; out.height = canvas.height + titleH;
                var ctx = out.getContext("2d");
                ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, out.width, out.height);
                ctx.fillStyle = "#555"; ctx.font = "bold 20px sans-serif";
                ctx.textAlign = "center"; ctx.textBaseline = "middle";
                ctx.fillText(title, out.width / 2, titleH / 2);
                ctx.drawImage(canvas, 0, titleH);
                var a = document.createElement("a");
                a.href = out.toDataURL("image/png");
                a.download = (canvas.id || "chart") + ".png";
                a.click();
            });
        },

        _exportCombined: function() {
            var canvases = this._visibleCanvases();
            if (!canvases.length) return;
            var gap = 24, pad = 24, titleH = 48;
            var cw = canvases[0].width, ch = canvases[0].height, cellH = titleH + ch;
            var rows = Math.ceil(canvases.length / _cols);
            var totalW = pad * 2 + cw * _cols + gap * (_cols - 1);
            var totalH = pad * 2 + cellH * rows + gap * (rows - 1);
            if (totalW > 16384 || totalH > 16384 || totalW * totalH > 268435456) {
                MessageToast.show("The combined image is too large. Try fewer columns or Merged View.");
                return;
            }
            var out = document.createElement("canvas");
            out.width = totalW; out.height = totalH;
            var ctx = out.getContext("2d");
            ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, totalW, totalH);
            ctx.font = "bold 20px sans-serif"; ctx.fillStyle = "#555";
            ctx.textAlign = "center"; ctx.textBaseline = "middle";
            canvases.forEach(function(c, i) {
                var col = i % _cols, row = Math.floor(i / _cols);
                var x = pad + col * (cw + gap), y = pad + row * (cellH + gap);
                var title = c.closest(".chartCard") ? c.closest(".chartCard").querySelector(".chartTitle").textContent.trim() : "";
                ctx.fillText(title, x + cw / 2, y + titleH / 2);
                ctx.drawImage(c, x, y + titleH);
            });
            var a = document.createElement("a");
            a.href = out.toDataURL("image/png");
            a.download = "charts.png";
            a.click();
        },

        // ── Theme ─────────────────────────────────────────────────────────────────
        onThemePress: function(oEvent) {
            var oPopover = this.getView().byId("themePopover");
            if (oPopover.isOpen()) { oPopover.close(); }
            else { oPopover.openBy(oEvent.getSource()); }
        },

        onThemeSelected: function(oEvent) {
            var key = oEvent.getParameter("listItem").getProperty("key") ||
                      oEvent.getParameter("listItem").data("key");
            // Fall back to parsing the title
            var title = oEvent.getParameter("listItem").getTitle();
            var themeMap = {
                "SAP Horizon": "sap_horizon",
                "Morning Horizon": "sap_horizon_dark",
                "High Contrast Black": "sap_horizon_hcb"
            };
            var theme = themeMap[title] || "sap_horizon";
            Theming.setTheme(theme);
            localStorage.setItem("v3theme", theme);
            this.getView().byId("themePopover").close();
        },

        // ── Reset order ───────────────────────────────────────────────────────────
        onResetOrder: function() {
            localStorage.removeItem("chartOrder_separate");
            localStorage.removeItem("chartOrder_merged");
            this.getView().byId("resetOrderBtn").setVisible(false);
            this._destroyAllCharts();
            this._loadAll();
        },

        // ── AI Chat sidebar ───────────────────────────────────────────────────────
        onToggleChat: function() {
            var right = this.getView().byId("chatSidebarRight");
            var left  = this.getView().byId("chatSidebarLeft");
            var active = right.getVisible() || left.getVisible();
            if (active) {
                right.setVisible(false);
                left.setVisible(false);
            } else {
                if (left._position === "left") left.setVisible(true);
                else right.setVisible(true);
                if (!right.getDomRef() || !right.getDomRef().querySelector("#chatContent")) {
                    this._renderChatSidebar();
                }
                right.setVisible(true);
            }
        },

        _renderChatSidebar: function() {
            var oView = this.getView();
            var i18n  = oView.getModel("i18n").getResourceBundle();
            var sidebar = document.getElementById(oView.byId("chatSidebarRight").getId());
            if (!sidebar || sidebar.querySelector("#chatContent")) return;

            sidebar.innerHTML = [
                '<div class="chatSidebarInner">',
                '  <div class="chatHeader">',
                '    <span class="chatTitle">' + i18n.getText("aiAssistant") + '</span>',
                '    <button class="chatHeaderBtn" onclick="sap.ui.getCore().byId(\'mainView--chatSidebarRight\').setVisible(false)">&times;</button>',
                '    <button class="chatHeaderBtn" id="resetSizeBtn" style="display:none">' + i18n.getText("resetSize") + '</button>',
                '    <button class="chatHeaderBtn" id="moveChatBtn">' + i18n.getText("moveToLeft") + '</button>',
                '    <button class="chatHeaderBtn" id="settingsBtn" onclick="sap.ui.getCore().getComponent(\'__component0\') && sap.ui.core.Fragment.load({name:\'cny.dashboard.view.Settings\'})">' + i18n.getText("settings") + '</button>',
                '  </div>',
                '  <div id="chatContent">',
                '    <div id="chatMessages" class="chatMessages"></div>',
                '    <div class="chatCheckboxes">',
                '      <label>' + i18n.getText("includeCharts") + '</label>',
                '      <button class="chartCheckBtn" id="chkAll">' + i18n.getText("selectAll") + '</button>',
                '      <button class="chartCheckBtn" id="chkNone">' + i18n.getText("deselectAll") + '</button>',
                '      <div id="chartCheckboxes" class="chartCheckboxList"></div>',
                '    </div>',
                '    <div class="chatInputRow">',
                '      <textarea id="chatInput" class="chatInput" rows="2" placeholder="' + i18n.getText("chatPlaceholderNotReady") + '" disabled></textarea>',
                '      <button id="chatSendBtn" class="chatSendBtn" disabled>' + i18n.getText("send") + '</button>',
                '    </div>',
                '  </div>',
                '</div>'
            ].join("");

            this._populateChatCheckboxes();
            this._updateChatReady();
            this._bindChatEvents();
        },

        _populateChatCheckboxes: function() {
            var container = document.getElementById("chartCheckboxes");
            if (!container) return;
            var i18n = this.getView().getModel("i18n").getResourceBundle();
            var ids = _mergedMode ? ["chartMergedCNY","chartMergedCross","chartMergedCNYOut"] : DEFAULT_ORDER_SEPARATE;
            container.innerHTML = ids.map(function(id) {
                return '<label class="chartCheckLabel"><input type="checkbox" value="' + id + '"> ' + i18n.getText(id) + '</label>';
            }).join("");
        },

        _bindChatEvents: function() {
            var that = this;
            var chkAll  = document.getElementById("chkAll");
            var chkNone = document.getElementById("chkNone");
            var sendBtn = document.getElementById("chatSendBtn");
            var input   = document.getElementById("chatInput");

            if (chkAll)  chkAll.onclick  = function() { document.querySelectorAll("#chartCheckboxes input").forEach(function(c){ c.checked = true; }); };
            if (chkNone) chkNone.onclick = function() { document.querySelectorAll("#chartCheckboxes input").forEach(function(c){ c.checked = false; }); };
            if (sendBtn) sendBtn.onclick  = function() { that._sendChat(); };
            if (input) {
                input.addEventListener("keydown", function(e) {
                    if (e.key === "Enter" && e.ctrlKey) that._sendChat();
                });
            }
        },

        _updateChatReady: function() {
            var ready = !!(localStorage.getItem("llm_url") && localStorage.getItem("llm_key") && localStorage.getItem("llm_model"));
            var input  = document.getElementById("chatInput");
            var sendBtn = document.getElementById("chatSendBtn");
            var i18n = this.getView().getModel("i18n").getResourceBundle();
            if (input) {
                input.disabled = !ready;
                input.placeholder = ready ? i18n.getText("chatPlaceholderReady") : i18n.getText("chatPlaceholderNotReady");
            }
            if (sendBtn) sendBtn.disabled = !ready;
        },

        _sendChat: async function() {
            var input = document.getElementById("chatInput");
            var text  = input ? input.value.trim() : "";
            if (!text) return;
            input.value = "";
            this._appendBubble("user", text);

            var checked = Array.from(document.querySelectorAll("#chartCheckboxes input:checked")).map(function(c){ return c.value; });
            if (!checked.length) {
                this._appendBubble("assistant", this.getView().getModel("i18n").getResourceBundle().getText("noChartsSelected"));
                input.value = text;
                return;
            }
            _chatHistory.push({ role: "user", content: text });

            var data = checked.map(function(id) {
                var chart = _charts[id];
                if (!chart) return null;
                var labels = chart.data.labels || [];
                return chart.data.datasets.map(function(ds) {
                    return { pair: ds.label || id, dates: labels, rates: ds.data };
                });
            }).filter(Boolean).flat();

            var thinking = this._appendBubble("assistant thinking", this.getView().getModel("i18n").getResourceBundle().getText("thinking"));
            try {
                var res = await fetch("/api/chat", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        messages: _chatHistory,
                        data: data,
                        from_date: this._getFromDate(),
                        to_date:   this._getToDate(),
                        base_url:  localStorage.getItem("llm_url"),
                        api_key:   localStorage.getItem("llm_key"),
                        model:     localStorage.getItem("llm_model")
                    })
                });
                var json = await res.json();
                var reply = json.reply || json.detail || ("Error: " + res.status);
                thinking.className = "chatBubble assistant";
                thinking.innerHTML = window.marked ? window.marked.parse(reply) : reply;
                _chatHistory.push({ role: "assistant", content: reply });
            } catch(e) {
                thinking.className = "chatBubble assistant";
                thinking.textContent = "Error: " + e.message;
            }
        },

        _appendBubble: function(role, text) {
            var container = document.getElementById("chatMessages");
            if (!container) return { className: "", textContent: "" };
            var div = document.createElement("div");
            div.className = "chatBubble " + role;
            if (role.includes("assistant") && window.marked) {
                div.innerHTML = window.marked.parse(text);
            } else {
                div.textContent = text;
            }
            container.appendChild(div);
            container.scrollTop = 999999;
            return div;
        },

        // ── Settings dialog ───────────────────────────────────────────────────────
        onSettingsPress: function() {
            var oDialog = this.getView().byId("settingsDialog");
            // Restore saved values
            this.getView().byId("settingUrl").setValue(localStorage.getItem("llm_url") || "http://localhost:6655/litellm");
            this.getView().byId("settingKey").setValue(localStorage.getItem("llm_key") || "");
            var savedModel = localStorage.getItem("llm_model") || "";
            var sel = this.getView().byId("settingModel");
            // Add saved model as option if not already there
            var existing = sel.getItems().find(function(i){ return i.getKey() === savedModel; });
            if (!existing && savedModel) {
                sel.addItem(new sap.ui.core.Item({ key: savedModel, text: savedModel }));
            }
            sel.setSelectedKey(savedModel);
            oDialog.open();
        },

        onLoadModels: async function() {
            var url   = this.getView().byId("settingUrl").getValue().trim();
            var key   = this.getView().byId("settingKey").getValue().trim();
            var btn   = this.getView().byId("loadModelsBtn");
            var i18n  = this.getView().getModel("i18n").getResourceBundle();
            if (!url || !key) { MessageToast.show(i18n.getText("loadModelsAlert")); return; }
            btn.setText(i18n.getText("loading")); btn.setEnabled(false);
            try {
                var res = await fetch("/api/models", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ base_url: url, api_key: key })
                });
                if (!res.ok) throw new Error("HTTP " + res.status);
                var json = await res.json();
                var models = [...new Set((json.data || [])
                    .filter(function(m){ return m.model_info && m.model_info.mode === "chat"; })
                    .map(function(m){ return m.model_name || m.id; })
                    .filter(Boolean))].sort();
                var sel = this.getView().byId("settingModel");
                var current = sel.getSelectedKey();
                sel.destroyItems();
                sel.addItem(new sap.ui.core.Item({ key: "", text: i18n.getText("selectModelHint") }));
                models.forEach(function(m) {
                    sel.addItem(new sap.ui.core.Item({ key: m, text: m }));
                });
                if (current) sel.setSelectedKey(current);
            } catch(e) {
                MessageToast.show(i18n.getText("loadModelsFailed") + " " + e.message);
            } finally {
                btn.setText(i18n.getText("load")); btn.setEnabled(true);
            }
        },

        onSaveSettings: function() {
            var url   = this.getView().byId("settingUrl").getValue().trim();
            var key   = this.getView().byId("settingKey").getValue().trim();
            var model = this.getView().byId("settingModel").getSelectedKey();
            var i18n  = this.getView().getModel("i18n").getResourceBundle();
            if (!model) { MessageToast.show(i18n.getText("selectModelFirst")); return; }
            localStorage.setItem("llm_url",   url);
            localStorage.setItem("llm_key",   key);
            localStorage.setItem("llm_model", model);
            this.getView().byId("settingsDialog").close();
            this._updateChatReady();
        },

        onCancelSettings: function() {
            this.getView().byId("settingsDialog").close();
        },

        // ── Chart rendering ───────────────────────────────────────────────────────
        _destroyAllCharts: function() {
            Object.values(_charts).forEach(function(c){ c.destroy(); });
            _charts = {};
        },

        _reRenderCharts: function() {
            this._destroyAllCharts();
            this._loadAll();
        },

        _getChartOptions: function() {
            return {
                responsive: true,
                maintainAspectRatio: true,
                animation: false,
                interaction: { mode: "index", intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return ctx.dataset.label + ": " + (ctx.parsed.y !== null ? ctx.parsed.y.toFixed(4) : "N/A");
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        type: "category",
                        grid: { color: "rgba(0,0,0,0.06)" },
                        ticks: { maxTicksLimit: 8, maxRotation: 0 }
                    },
                    y: {
                        grid: { color: "rgba(0,0,0,0.06)" },
                        ticks: { callback: function(v){ return v.toFixed(2); } }
                    }
                }
            };
        },

        _renderChart: function(canvasId, label, apiData, color) {
            var canvas = document.getElementById(canvasId);
            if (!canvas) return;
            if (_charts[canvasId]) { _charts[canvasId].destroy(); delete _charts[canvasId]; }
            var labels = (apiData.data || []).map(function(r){ return r.date; });
            var values = (apiData.data || []).map(function(r){ return r.rate; });
            var opts = this._getChartOptions();
            _charts[canvasId] = new Chart(canvas, {
                type: "line",
                data: {
                    labels: labels,
                    datasets: [{
                        label: label,
                        data: values,
                        borderColor: color,
                        borderWidth: 1.5,
                        pointRadius: 0,
                        tension: 0.1
                    }]
                },
                options: opts
            });
        },

        _renderMergedChart: function(canvasId, datasets) {
            var canvas = document.getElementById(canvasId);
            if (!canvas) return;
            if (_charts[canvasId]) { _charts[canvasId].destroy(); delete _charts[canvasId]; }
            var labels = datasets[0] && datasets[0].data ? (datasets[0].data.data || []).map(function(r){ return r.date; }) : [];
            var opts = this._getChartOptions();
            opts.plugins.legend = { display: true, position: "top", labels: { boxWidth: 12, font: { size: 11 } } };
            _charts[canvasId] = new Chart(canvas, {
                type: "line",
                data: {
                    labels: labels,
                    datasets: datasets.map(function(ds) {
                        return {
                            label: ds.label,
                            data: (ds.data.data || []).map(function(r){ return r.rate; }),
                            borderColor: ds.color,
                            borderWidth: 1.5,
                            pointRadius: 0,
                            tension: 0.1
                        };
                    })
                },
                options: opts
            });
        },

        _ensureCard: function(gridId, canvasId, title) {
            var gridDomId = this.getView().byId(gridId).getId();
            var grid = document.getElementById(gridDomId);
            if (!grid) return;
            if (!document.getElementById(canvasId)) {
                var card = document.createElement("div");
                card.className = "chartCard";
                card.style.width = (100 / _cols - 1) + "%";
                card.draggable = true;
                card.innerHTML = '<div class="chartCardHeader"><span class="chartTitle">' + title + '</span></div>' +
                                 '<div class="chartCanvasWrap"><canvas id="' + canvasId + '"></canvas></div>';
                grid.appendChild(card);
                this._bindDragDrop(card);
            } else {
                // Update width on col change
                var existing = document.getElementById(canvasId).closest(".chartCard");
                if (existing) existing.style.width = (100 / _cols - 1) + "%";
            }
        },

        _loadAll: async function() {
            var that = this;
            var from = this._getFromDate();
            var to   = this._getToDate();
            var i18n = this.getView().getModel("i18n").getResourceBundle();

            try {
                var results = await Promise.all([
                    fetchRates("GBP","CNY",from,to), fetchRates("EUR","CNY",from,to), fetchRates("USD","CNY",from,to),
                    fetchRates("GBP","EUR",from,to), fetchRates("GBP","USD",from,to), fetchRates("EUR","USD",from,to),
                    fetchRates("CNY","JPY",from,to), fetchRates("CNY","KRW",from,to), fetchRates("CNY","TWD",from,to),
                    fetchRates("CNY","INR",from,to), fetchRates("CNY","RUB",from,to), fetchRates("CNY","HKD",from,to),
                    fetchRates("CNY","UAH",from,to), fetchRates("ILS","CNY",from,to),
                    fetchRates("USD","JPY",from,to), fetchRates("USD","TWD",from,to),
                    fetchRates("BTC","USD",from,to), fetchRates("BTC","CNY",from,to), fetchRates("BTC","EUR",from,to)
                ]);

                var [ gbpCny,eurCny,usdCny,gbpEur,gbpUsd,eurUsd,
                      cnyJpy,cnyKrw,cnyTwd,cnyInr,cnyRub,cnyHkd,cnyUah,
                      ilsCny,usdJpy,usdTwd,btcUsd,btcCny,btcEur ] = results;

                if (_mergedMode) {
                    var mergedPairs = [
                        { canvasId: "chartMergedCNY",    title: i18n.getText("chartMergedCNY"),
                          datasets: [{label:"GBP->CNY",data:gbpCny,color:"#9333ea"},{label:"EUR->CNY",data:eurCny,color:"#06b6d4"},{label:"USD->CNY",data:usdCny,color:"#2563eb"}] },
                        { canvasId: "chartMergedCross",  title: i18n.getText("chartMergedCross"),
                          datasets: [{label:"GBP->EUR",data:gbpEur,color:"#2563eb"},{label:"GBP->USD",data:gbpUsd,color:"#f472b6"},{label:"EUR->USD",data:eurUsd,color:"#a78bfa"}] },
                        { canvasId: "chartMergedCNYOut", title: i18n.getText("chartMergedCNYOut"),
                          datasets: [{label:"CNY->JPY",data:cnyJpy,color:"#2563eb"},{label:"CNY->KRW",data:cnyKrw,color:"#f472b6"},{label:"CNY->TWD",data:cnyTwd,color:"#06b6d4"},{label:"CNY->INR",data:cnyInr,color:"#ea580c"},{label:"CNY->RUB",data:cnyRub,color:"#e879f9"},{label:"CNY->HKD",data:cnyHkd,color:"#0891b2"}] }
                    ];
                    mergedPairs.forEach(function(p) {
                        that._ensureCard("mergedGrid", p.canvasId, p.title);
                        that._renderMergedChart(p.canvasId, p.datasets);
                    });
                } else {
                    var pairs = [
                        {id:"chartGBPCNY",data:gbpCny}, {id:"chartEURCNY",data:eurCny}, {id:"chartUSDCNY",data:usdCny},
                        {id:"chartCNYJPY",data:cnyJpy}, {id:"chartCNYKRW",data:cnyKrw}, {id:"chartCNYTWD",data:cnyTwd},
                        {id:"chartCNYINR",data:cnyInr}, {id:"chartCNYRUB",data:cnyRub}, {id:"chartCNYHKD",data:cnyHkd},
                        {id:"chartCNYUAH",data:cnyUah}, {id:"chartILSCNY",data:ilsCny}, {id:"chartUSDTWD",data:usdTwd},
                        {id:"chartGBPEUR",data:gbpEur}, {id:"chartGBPUSD",data:gbpUsd}, {id:"chartEURUSD",data:eurUsd},
                        {id:"chartUSDJPY",data:usdJpy},
                        {id:"chartBTCUSD",data:btcUsd}, {id:"chartBTCCNY",data:btcCny}, {id:"chartBTCEUR",data:btcEur}
                    ];
                    pairs.forEach(function(p) {
                        var meta = CHART_META[p.id] || {};
                        var title = i18n.getText(p.id);
                        that._ensureCard("separateGrid", p.id, title);
                        that._renderChart(p.id, title, p.data, meta.color || "#2563eb");
                    });
                    that._restoreCardOrder();
                }
                that._populateChatCheckboxes();
            } catch(e) {
                console.error("loadAll failed:", e);
            }
        },

        // ── Drag & Drop ───────────────────────────────────────────────────────────
        _bindDragDrop: function(card) {
            var that = this;
            var enterCount = 0;
            card.addEventListener("dragstart", function(e) {
                _dragSrc = card;
                e.dataTransfer.effectAllowed = "move";
                setTimeout(function(){ card.classList.add("dragging"); }, 0);
            });
            card.addEventListener("dragend", function() {
                card.classList.remove("dragging");
                document.querySelectorAll(".chartCard").forEach(function(c){ c.classList.remove("dragOver"); });
                _dragSrc = null;
            });
            card.addEventListener("dragenter", function(e) {
                e.preventDefault(); enterCount++;
                if (card !== _dragSrc) card.classList.add("dragOver");
            });
            card.addEventListener("dragleave", function() {
                enterCount--;
                if (enterCount === 0) card.classList.remove("dragOver");
            });
            card.addEventListener("dragover", function(e) {
                e.preventDefault(); e.dataTransfer.dropEffect = "move";
            });
            card.addEventListener("drop", function(e) {
                e.preventDefault(); enterCount = 0;
                card.classList.remove("dragOver");
                if (!_dragSrc || _dragSrc === card) return;
                var parent = card.parentNode;
                var srcNext = _dragSrc.nextSibling;
                var tgtNext = card.nextSibling;
                if (tgtNext === _dragSrc) parent.insertBefore(_dragSrc, card);
                else { parent.insertBefore(card, srcNext); parent.insertBefore(_dragSrc, tgtNext); }
                that._saveCardOrder();
            });
        },

        _saveCardOrder: function() {
            var gridId = _mergedMode ? "mergedGrid" : "separateGrid";
            var gridDomId = this.getView().byId(gridId).getId();
            var grid = document.getElementById(gridDomId);
            if (!grid) return;
            var order = Array.from(grid.querySelectorAll("canvas[id]")).map(function(c){ return c.id; });
            localStorage.setItem("chartOrder_" + (_mergedMode ? "merged" : "separate"), JSON.stringify(order));
            this.getView().byId("resetOrderBtn").setVisible(true);
        },

        _restoreCardOrder: function() {
            var gridId = _mergedMode ? "mergedGrid" : "separateGrid";
            var gridDomId = this.getView().byId(gridId).getId();
            var grid = document.getElementById(gridDomId);
            if (!grid) return;
            var key = "chartOrder_" + (_mergedMode ? "merged" : "separate");
            var order;
            try { order = JSON.parse(localStorage.getItem(key)); } catch(e) { return; }
            if (!order || !order.length) return;
            order.forEach(function(canvasId) {
                var card = grid.querySelector("canvas#" + canvasId);
                if (card) grid.appendChild(card.closest(".chartCard"));
            });
            this.getView().byId("resetOrderBtn").setVisible(true);
        }

    });
});
