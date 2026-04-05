(function (global) {
  "use strict";

  var app = global.AgileMaturityApp;
  var getMaturityLabel = app.utils.score.getMaturityLabel;

  function createChartService() {
    var charts = {
      radar: null,
      bar: null,
      line: null,
    };

    function destroy(name) {
      if (charts[name]) {
        charts[name].destroy();
        charts[name] = null;
      }
    }

    function destroyAll() {
      destroy("radar");
      destroy("bar");
      destroy("line");
    }

    function isAvailable() {
      return typeof global.Chart === "function";
    }

    function createCommonTooltipOptions(axisKey) {
      return {
        callbacks: {
          label: function (context) {
            var parsed = context.parsed || {};
            var value = axisKey === "r" ? parsed.r : parsed.y;
            return context.dataset.label + ": " + value + " (" + getMaturityLabel(value) + ")";
          },
        },
      };
    }

    function createCommonLegendOptions() {
      return {
        display: true,
        position: "bottom",
        labels: {
          boxWidth: 12,
          usePointStyle: true,
          pointStyle: "circle",
          font: { size: 10 },
        },
      };
    }

    function renderCharts(viewModel) {
      if (!isAvailable()) {
        destroyAll();
        return;
      }

      var radarCanvas = document.getElementById("radar-chart");
      var barCanvas = document.getElementById("bar-chart");
      var lineCanvas = document.getElementById("line-chart");

      if (!radarCanvas || !barCanvas || !lineCanvas) {
        destroyAll();
        return;
      }

      destroyAll();

      charts.radar = new global.Chart(radarCanvas.getContext("2d"), {
        type: "radar",
        data: viewModel.radarData,
        options: {
          maintainAspectRatio: false,
          scales: {
            r: {
              min: 0,
              max: 5,
              ticks: { stepSize: 1, display: false },
              grid: { color: "rgba(28, 34, 44, 0.08)" },
              angleLines: { color: "rgba(28, 34, 44, 0.08)" },
            },
          },
          plugins: {
            tooltip: createCommonTooltipOptions("r"),
            legend: createCommonLegendOptions(),
          },
        },
      });

      charts.bar = new global.Chart(barCanvas.getContext("2d"), {
        type: "bar",
        data: viewModel.comparisonChartData,
        options: {
          maintainAspectRatio: false,
          responsive: true,
          scales: {
            y: { min: 0, max: 5 },
          },
          plugins: {
            tooltip: createCommonTooltipOptions("y"),
            legend: createCommonLegendOptions(),
          },
        },
      });

      charts.line = new global.Chart(lineCanvas.getContext("2d"), {
        type: "line",
        data: viewModel.comparisonChartData,
        options: {
          maintainAspectRatio: false,
          responsive: true,
          scales: {
            y: { min: 0, max: 5 },
          },
          plugins: {
            tooltip: createCommonTooltipOptions("y"),
            legend: createCommonLegendOptions(),
          },
        },
      });
    }

    function getChartImage(name) {
      return charts[name] ? charts[name].toBase64Image() : null;
    }

    function getChartImages() {
      return {
        radar: getChartImage("radar"),
        bar: getChartImage("bar"),
        line: getChartImage("line"),
      };
    }

    return {
      destroyAll: destroyAll,
      getChartImages: getChartImages,
      isAvailable: isAvailable,
      renderCharts: renderCharts,
    };
  }

  app.services.createChartService = createChartService;
})(window);
