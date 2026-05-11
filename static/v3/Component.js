sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
    "use strict";

    return UIComponent.extend("cny.dashboard.Component", {
        metadata: {
            manifest: "json"
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);

            // App state model
            var oModel = new JSONModel({
                mergedMode: false,
                cols: 3,
                sidebarOpen: false,
                sidebarLeft: false,
                fromDate: "",
                toDate: "",
                charts: {},
                llmUrl: localStorage.getItem("llm_url") || "http://localhost:6655/litellm",
                llmKey: localStorage.getItem("llm_key") || "",
                llmModel: localStorage.getItem("llm_model") || "",
                chatMessages: [],
                availableModels: [],
                chatReady: false,
                updating: false,
                theme: localStorage.getItem("v3theme") || "sap_horizon"
            });
            this.setModel(oModel, "app");
        }
    });
});
