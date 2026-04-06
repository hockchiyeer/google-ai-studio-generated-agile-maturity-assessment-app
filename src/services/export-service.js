(function (global) {
  "use strict";

  var app = global.AgileMaturityApp;

  function createExportService() {
    function todayString() {
      return new Date().toISOString().split("T")[0];
    }

    function getQuestionExportRows(data) {
      return data.questions.map(function (question) {
        var discipline = data.disciplines.find(function (item) {
          return item.id === question.disciplineId;
        });

        return [
          discipline ? discipline.name : "Unknown",
          question.principle,
          question.question,
        ].concat(
          data.snapshots.map(function (snapshot) {
            return question.scores[snapshot.id] || 0;
          }),
          [question.targetScore]
        );
      });
    }

    function cleanQuestionTextSegment(value) {
      return String(value || "")
        .replace(/\r\n?/g, "\n")
        .split("\n")
        .map(function (line) {
          return line.trim();
        })
        .filter(Boolean)
        .join(" ")
        .trim();
    }

    function getQuestionTextSegments(questionText) {
      var segments = String(questionText || "")
        .replace(/\r\n?/g, "\n")
        .split(/\n\s*\n+/)
        .map(cleanQuestionTextSegment)
        .filter(Boolean);

      return segments.length ? segments : ["Imported question"];
    }

    function escapeQuestionTextSegment(value) {
      return cleanQuestionTextSegment(value);
    }

    function getExportPrincipleLabel(principle) {
      var normalized = String(principle || "").trim();
      return normalized.replace(/^[A-Z]\d{2}\s*-\s*/, "") || normalized || "General Principle";
    }

    function formatQuestionTextLine(question, disciplineName) {
      return [
        disciplineName || "Unknown",
        getExportPrincipleLabel(question.principle),
        getQuestionTextSegments(question.question)
          .map(function (segment) {
            return escapeQuestionTextSegment(segment);
          })
          .join(","),
      ].join(" | ");
    }

    function exportQuestionsText(data) {
      var lines = data.questions.map(function (question) {
        var discipline = data.disciplines.find(function (item) {
          return item.id === question.disciplineId;
        });
        return formatQuestionTextLine(question, discipline ? discipline.name : "Unknown");
      });

      app.utils.download.downloadText(
        lines.join("\n"),
        "agile-maturity-questions-" + todayString() + ".txt",
        "text/plain;charset=utf-8"
      );
    }

    function exportJson(data) {
      app.utils.download.downloadJson(data, "agile-maturity-" + todayString() + ".json");
    }

    function invokeAutoTable(doc, options) {
      if (typeof doc.autoTable === "function") {
        doc.autoTable(options);
        return true;
      }

      if (global.jspdfAutoTable && typeof global.jspdfAutoTable.default === "function") {
        global.jspdfAutoTable.default(doc, options);
        return true;
      }

      if (typeof global.autoTable === "function") {
        global.autoTable(doc, options);
        return true;
      }

      return false;
    }

    function exportPdf(data, viewModel, chartImages) {
      if (!global.jspdf || typeof global.jspdf.jsPDF !== "function") {
        throw new Error("PDF export library is unavailable.");
      }

      var jsPDF = global.jspdf.jsPDF;
      var isLandscape = data.snapshots.length > 2;
      var doc = new jsPDF({
        orientation: isLandscape ? "l" : "p",
        unit: "mm",
        format: "a4",
      });

      var pageWidth = doc.internal.pageSize.getWidth();
      var pageHeight = doc.internal.pageSize.getHeight();
      var chartWidth = pageWidth - 24;
      var chartHeight = Math.min(pageHeight - 42, chartWidth * 0.62);
      var chartX = (pageWidth - chartWidth) / 2;
      var chartY = 28;

      doc.setFontSize(20);
      doc.text("Agile Project Maturity Assessment", 14, 22);
      doc.setFontSize(12);
      doc.text("Snapshot: " + viewModel.activeSnapshotContext, 14, 30);
      doc.text("Overall Maturity: " + viewModel.overallAverage + " / 5.00", 14, 38);

      if (chartImages.radar) {
        doc.setFontSize(16);
        doc.text("Maturity Radar Diagram - " + viewModel.activeSnapshotTitle, 14, 50);
        var radarWidth = isLandscape ? 160 : 180;
        var radarHeight = isLandscape ? 120 : 180;
        var radarX = (pageWidth - radarWidth) / 2;
        doc.addImage(chartImages.radar, "PNG", radarX, 60, radarWidth, radarHeight);
      }

      function addTrendPage(title, image) {
        doc.addPage();
        doc.setFontSize(16);
        doc.text(title, 14, 20);
        if (image) {
          doc.addImage(image, "PNG", chartX, chartY, chartWidth, chartHeight);
        } else {
          doc.setFontSize(11);
          doc.text("Chart image unavailable in this browser session.", 14, 32);
        }
      }

      addTrendPage("Timeline Comparison (Bar) - " + viewModel.activeSnapshotTitle, chartImages.bar);
      addTrendPage("Timeline Comparison (Line) - " + viewModel.activeSnapshotTitle, chartImages.line);

      doc.addPage();
      doc.setFontSize(14);
      doc.text("Assessment Details - " + viewModel.activeSnapshotTitle, 14, 15);

      var didRenderTable = invokeAutoTable(doc, {
        startY: 20,
        head: [["Discipline", "Principle", "Question"].concat(viewModel.snapshotExportHeaders, ["Target"])],
        body: getQuestionExportRows(data),
        theme: "grid",
        headStyles: { fillColor: [26, 78, 125] },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: isLandscape ? 35 : 25 },
          1: { cellWidth: isLandscape ? 40 : 30 },
          2: { cellWidth: "auto" },
        },
      });

      if (!didRenderTable) {
        doc.setFontSize(10);
        doc.text("Table export plugin unavailable. Use XLSX export for full tabular data.", 14, 25);
      }

      doc.save("agile-maturity-report-" + viewModel.activeSnapshot.date + ".pdf");
    }

    function exportPptx(data, viewModel, chartImages) {
      if (typeof global.PptxGenJS !== "function") {
        throw new Error("PowerPoint export library is unavailable.");
      }

      var pptx = new global.PptxGenJS();
      pptx.layout = "LAYOUT_WIDE";

      function addTrendSlide(title, image) {
        var slide = pptx.addSlide();
        slide.addText(title, { x: 0.5, y: 0.3, fontSize: 20, bold: true, color: "1A4E7D" });
        if (image) {
          slide.addImage({ data: image, x: 0.5, y: 1.0, w: 12.2, h: 5.8 });
        } else {
          slide.addText("Chart image unavailable in this browser session.", {
            x: 0.7,
            y: 1.3,
            fontSize: 14,
            color: "64748B",
          });
        }
      }

      var overviewSlide = pptx.addSlide();
      overviewSlide.addText("Agile Maturity Assessment", {
        x: 0.5,
        y: 0.3,
        w: "90%",
        fontSize: 24,
        bold: true,
        color: "1A4E7D",
      });
      overviewSlide.addText("Snapshot: " + viewModel.activeSnapshotContext, {
        x: 0.5,
        y: 0.8,
        fontSize: 14,
        color: "64748B",
      });
      overviewSlide.addText("Overall Maturity: " + viewModel.overallAverage + " / 5.00", {
        x: 0.5,
        y: 1.1,
        fontSize: 14,
        bold: true,
      });

      if (chartImages.radar) {
        overviewSlide.addText("Maturity Radar Diagram - " + viewModel.activeSnapshotTitle, {
          x: 0.5,
          y: 1.6,
          fontSize: 18,
          bold: true,
        });
        overviewSlide.addImage({ data: chartImages.radar, x: 3.5, y: 2.0, w: 6, h: 4.5 });
      }

      addTrendSlide("Timeline Comparison (Bar) - " + viewModel.activeSnapshotTitle, chartImages.bar);
      addTrendSlide("Timeline Comparison (Line) - " + viewModel.activeSnapshotTitle, chartImages.line);

      var tableSlide = pptx.addSlide();
      tableSlide.addText("Assessment Details - " + viewModel.activeSnapshotTitle, {
        x: 0.5,
        y: 0.3,
        fontSize: 20,
        bold: true,
        color: "1A4E7D",
      });

      var snapshotHeaders = viewModel.snapshotExportHeaders.map(function (header) {
        return { text: header, options: { fill: "F3F4F6", bold: true, align: "center" } };
      });

      var tableRows = [
        [
          { text: "Discipline", options: { fill: "F3F4F6", bold: true } },
          { text: "Principle", options: { fill: "F3F4F6", bold: true } },
          { text: "Question", options: { fill: "F3F4F6", bold: true } },
        ].concat(snapshotHeaders, [{ text: "Target", options: { fill: "F3F4F6", bold: true, align: "center" } }]),
      ].concat(
        getQuestionExportRows(data).map(function (row) {
          return row.map(function (cell, index) {
            if (index >= 3) {
              return { text: String(cell), options: { align: "center" } };
            }
            return String(cell);
          });
        })
      );

      var totalWidth = 12.3;
      var fixedWidths = 1.5 + 2.0 + 1.0;
      var availableForContent = totalWidth - fixedWidths;
      var maxSnapshotsWidth = Math.min(4.0, data.snapshots.length * 1.0);
      var snapshotColWidth = maxSnapshotsWidth / data.snapshots.length;
      var questionWidth = availableForContent - maxSnapshotsWidth;
      var colW = [1.5, 2.0, questionWidth].concat(
        data.snapshots.map(function () {
          return snapshotColWidth;
        }),
        [1.0]
      );

      tableSlide.addTable(tableRows, {
        x: 0.5,
        y: 1.0,
        w: 12.3,
        fontSize: 8,
        autoPage: true,
        autoPageRepeatHeader: true,
        autoPageLineWeight: 0.5,
        colW: colW,
        border: { type: "solid", color: "E5E7EB", pt: 0.5 },
        valign: "middle",
      });

      pptx.writeFile({ fileName: "agile-maturity-" + viewModel.activeSnapshot.date + ".pptx" });
    }

    function exportXlsx(data, viewModel) {
      if (!global.XLSX || !global.XLSX.utils) {
        throw new Error("Excel export library is unavailable.");
      }

      var worksheetData = [
        ["Discipline", "Principle", "Question"].concat(viewModel.snapshotExportHeaders, ["Target"]),
      ].concat(getQuestionExportRows(data));

      var worksheet = global.XLSX.utils.aoa_to_sheet(worksheetData);
      worksheet["!cols"] = [
        { wch: 20 },
        { wch: 30 },
        { wch: 60 },
      ].concat(
        data.snapshots.map(function () {
          return { wch: 12 };
        }),
        [{ wch: 10 }]
      );

      var workbook = global.XLSX.utils.book_new();
      global.XLSX.utils.book_append_sheet(workbook, worksheet, "Assessment");

      var radarRows = [["Discipline", "Current Maturity", "Target Maturity"]].concat(viewModel.radarRows);
      var radarWorksheet = global.XLSX.utils.aoa_to_sheet(radarRows);
      global.XLSX.utils.book_append_sheet(workbook, radarWorksheet, "Radar Data");

      global.XLSX.writeFile(workbook, "agile-maturity-" + viewModel.activeSnapshot.date + ".xlsx");
    }

    return {
      exportJson: exportJson,
      exportPdf: exportPdf,
      exportPptx: exportPptx,
      exportQuestionsText: exportQuestionsText,
      exportXlsx: exportXlsx,
    };
  }

  app.services.createExportService = createExportService;
})(window);
