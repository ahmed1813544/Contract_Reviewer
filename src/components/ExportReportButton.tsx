"use client";

import { useState, useCallback } from "react";
import { Download, FileText, File } from "lucide-react";
import type { ContractAnalysis } from "@/types";

interface ExportReportButtonProps {
  analysis: ContractAnalysis;
  fileName?: string;
}

function getRiskColor(score: number): string {
  if (score <= 3) return "#10b981";
  if (score <= 5) return "#f59e0b";
  if (score <= 7) return "#f97316";
  return "#ef4444";
}

function getRiskLabel(score: number): string {
  if (score <= 3) return "Low";
  if (score <= 5) return "Medium";
  if (score <= 7) return "High";
  return "Critical";
}

function getRiskLevelHex(level: string): string {
  switch (level) {
    case "low": return "#10b981";
    case "medium": return "#f59e0b";
    case "high": return "#f97316";
    case "critical": return "#ef4444";
    default: return "#888888";
  }
}

async function exportPDF(analysis: ContractAnalysis, fileName: string) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Contract Analysis Report", pageWidth / 2, y, { align: "center" });
  y += 10;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(128);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: "center" });
  y += 5;
  doc.text(`Contract: ${fileName}`, pageWidth / 2, y, { align: "center" });
  y += 12;

  // Risk Score
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0);
  doc.text("Overall Risk Assessment", 14, y);
  y += 8;

  const riskColor = getRiskColor(analysis.overallRiskScore);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(
    parseInt(riskColor.slice(1, 3), 16),
    parseInt(riskColor.slice(3, 5), 16),
    parseInt(riskColor.slice(5, 7), 16)
  );
  doc.text(`${analysis.overallRiskScore}/10`, 14, y);
  y += 6;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0);
  doc.text(`Risk Level: ${getRiskLabel(analysis.overallRiskScore)}`, 14, y);
  y += 10;

  // Contract Info
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Contract Information", 14, y);
  y += 7;

  const infoData = [
    ["Contract Type", analysis.contractType || "N/A"],
    ["Parties", (analysis.parties || []).join(", ") || "N/A"],
    ["Effective Date", analysis.effectiveDate || "N/A"],
    ["Jurisdiction", analysis.jurisdiction || "Not Specified"],
  ];

  autoTable(doc, {
    startY: y,
    head: [],
    body: infoData,
    theme: "plain",
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 40 } },
  });
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // Summary
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Summary", 14, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const summaryLines = doc.splitTextToSize(analysis.summary || "", pageWidth - 28);
  doc.text(summaryLines, 14, y);
  y += summaryLines.length * 4.5 + 10;

  // Key Findings
  if (analysis.keyFindings?.length) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Key Findings", 14, y);
    y += 7;

    analysis.keyFindings.forEach((finding, i) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(`${i + 1}. ${finding}`, pageWidth - 28);
      doc.text(lines, 14, y);
      y += lines.length * 4 + 3;
    });
    y += 5;
  }

  // Risk Distribution
  if (analysis.clauses?.length) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Risk Distribution", 14, y);
    y += 7;

    const counts = { low: 0, medium: 0, high: 0, critical: 0 };
    analysis.clauses.forEach((c) => { counts[c.riskLevel]++; });

    autoTable(doc, {
      startY: y,
      head: [["Risk Level", "Count", "Percentage"]],
      body: [
        ["Low", String(counts.low), `${((counts.low / analysis.clauses.length) * 100).toFixed(0)}%`],
        ["Medium", String(counts.medium), `${((counts.medium / analysis.clauses.length) * 100).toFixed(0)}%`],
        ["High", String(counts.high), `${((counts.high / analysis.clauses.length) * 100).toFixed(0)}%`],
        ["Critical", String(counts.critical), `${((counts.critical / analysis.clauses.length) * 100).toFixed(0)}%`],
      ],
      theme: "striped",
      styles: { fontSize: 9, cellPadding: 3 },
    });
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Clause Analysis
  if (analysis.clauses?.length) {
    analysis.clauses.forEach((clause, i) => {
      if (y > 240) { doc.addPage(); y = 20; }

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(`${i + 1}. ${clause.title}`, 14, y);
      y += 5;

      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      const clauseColorHex = getRiskLevelHex(clause.riskLevel);
      doc.setTextColor(
        parseInt(clauseColorHex.slice(1, 3), 16),
        parseInt(clauseColorHex.slice(3, 5), 16),
        parseInt(clauseColorHex.slice(5, 7), 16)
      );
      doc.text(`Risk: ${clause.riskLevel.toUpperCase()}${clause.clauseScore ? ` | Score: ${clause.clauseScore}/10` : ""}`, 14, y);
      y += 4;

      doc.setTextColor(0);
      doc.setFont("helvetica", "normal");
      const expLines = doc.splitTextToSize(`Analysis: ${clause.explanation}`, pageWidth - 28);
      doc.text(expLines, 14, y);
      y += expLines.length * 3.5 + 2;

      const recLines = doc.splitTextToSize(`Recommendation: ${clause.recommendation}`, pageWidth - 28);
      doc.text(recLines, 14, y);
      y += recLines.length * 3.5 + 6;
    });
  }

  // Negotiation Tips
  if (analysis.negotiationTips?.length) {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Negotiation Tips", 14, y);
    y += 7;

    analysis.negotiationTips
      .sort((a, b) => b.priority - a.priority)
      .forEach((tip, i) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(`${i + 1}. [${tip.riskLevel.toUpperCase()}] ${tip.tip}`, pageWidth - 28);
        doc.text(lines, 14, y);
        y += lines.length * 4 + 3;
      });
  }

  // Disclaimer
  const lastPage = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  doc.setPage(lastPage);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(128);
  doc.text(
    "DISCLAIMER: This report is AI-generated for informational purposes only and does not constitute legal advice. Always consult a qualified attorney.",
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: "center" }
  );

  doc.save(`contract-analysis-${fileName.replace(/\.pdf$/i, "")}.pdf`);
}

async function exportDOCX(analysis: ContractAnalysis, fileName: string) {
  const docx = await import("docx");
  const {
    Document, Packer, Paragraph, TextRun,
    AlignmentType,
  } = docx;

  const children: InstanceType<typeof Paragraph>[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Contract Analysis Report", bold: true, size: 32 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Generated: ${new Date().toLocaleDateString()}`, size: 18, color: "808080" }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Contract: ${fileName}`, size: 18, color: "808080" }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  );

  // Risk Score
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Overall Risk Assessment", bold: true, size: 24 })],
      spacing: { before: 200, after: 100 },
    })
  );

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Score: ${analysis.overallRiskScore}/10`, bold: true, size: 28, color: getRiskColor(analysis.overallRiskScore).slice(1) }),
        new TextRun({ text: ` (${getRiskLabel(analysis.overallRiskScore)} Risk)`, size: 22 }),
      ],
      spacing: { after: 200 },
    })
  );

  // Contract Info
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Contract Information", bold: true, size: 24 })],
      spacing: { before: 200, after: 100 },
    })
  );

  const infoItems = [
    ["Contract Type", analysis.contractType || "N/A"],
    ["Parties", (analysis.parties || []).join(", ") || "N/A"],
    ["Effective Date", analysis.effectiveDate || "N/A"],
    ["Jurisdiction", analysis.jurisdiction || "Not Specified"],
  ];

  infoItems.forEach(([label, value]) => {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${label}: `, bold: true, size: 20 }),
          new TextRun({ text: value, size: 20 }),
        ],
        spacing: { after: 50 },
      })
    );
  });

  // Summary
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Summary", bold: true, size: 24 })],
      spacing: { before: 200, after: 100 },
    })
  );

  children.push(
    new Paragraph({
      children: [new TextRun({ text: analysis.summary || "", size: 20 })],
      spacing: { after: 200 },
    })
  );

  // Key Findings
  if (analysis.keyFindings?.length) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Key Findings", bold: true, size: 24 })],
        spacing: { before: 200, after: 100 },
      })
    );

    analysis.keyFindings.forEach((finding, i) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${i + 1}. `, bold: true, size: 20 }),
            new TextRun({ text: finding, size: 20 }),
          ],
          spacing: { after: 50 },
        })
      );
    });
  }

  // Clause Analysis
  if (analysis.clauses?.length) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Clause-by-Clause Analysis", bold: true, size: 24 })],
        spacing: { before: 300, after: 100 },
      })
    );

    analysis.clauses.forEach((clause, i) => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${i + 1}. ${clause.title}`, bold: true, size: 22 }),
            new TextRun({ text: ` [${clause.riskLevel.toUpperCase()}]`, bold: true, size: 18, color: getRiskLevelHex(clause.riskLevel).slice(1) }),
            ...(clause.clauseScore ? [new TextRun({ text: ` (Score: ${clause.clauseScore}/10)`, size: 18, color: "808080" })] : []),
          ],
          spacing: { before: 150, after: 50 },
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Analysis: ", bold: true, size: 18 }),
            new TextRun({ text: clause.explanation, size: 18 }),
          ],
          spacing: { after: 30 },
        })
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Recommendation: ", bold: true, size: 18 }),
            new TextRun({ text: clause.recommendation, size: 18 }),
          ],
          spacing: { after: 100 },
        })
      );
    });
  }

  // Negotiation Tips
  if (analysis.negotiationTips?.length) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "Negotiation Tips", bold: true, size: 24 })],
        spacing: { before: 300, after: 100 },
      })
    );

    analysis.negotiationTips
      .sort((a, b) => b.priority - a.priority)
      .forEach((tip, i) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${i + 1}. `, bold: true, size: 20 }),
              new TextRun({ text: `[${tip.riskLevel.toUpperCase()}] `, bold: true, size: 18, color: getRiskLevelHex(tip.riskLevel).slice(1) }),
              new TextRun({ text: tip.tip, size: 20 }),
            ],
            spacing: { after: 50 },
          })
        );
      });
  }

  // Disclaimer
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "DISCLAIMER: This report is AI-generated for informational purposes only and does not constitute legal advice. Always consult a qualified attorney.",
          italics: true,
          size: 16,
          color: "808080",
        }),
      ],
      spacing: { before: 400 },
      alignment: AlignmentType.CENTER,
    })
  );

  const doc = new Document({
    sections: [{ children }],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `contract-analysis-${fileName.replace(/\.pdf$/i, "")}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportReportButton({ analysis, fileName = "contract" }: ExportReportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);

  const handleExportPDF = useCallback(async () => {
    setExporting("pdf");
    try {
      await exportPDF(analysis, fileName);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExporting(null);
      setIsOpen(false);
    }
  }, [analysis, fileName]);

  const handleExportDOCX = useCallback(async () => {
    setExporting("docx");
    try {
      await exportDOCX(analysis, fileName);
    } catch (err) {
      console.error("DOCX export failed:", err);
    } finally {
      setExporting(null);
      setIsOpen(false);
    }
  }, [analysis, fileName]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <Download className="h-3.5 w-3.5" />
        Export Report
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-zinc-200 bg-white p-1 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <button
              onClick={handleExportPDF}
              disabled={exporting !== null}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 disabled:opacity-50"
            >
              <FileText className="h-4 w-4 text-red-500" />
              {exporting === "pdf" ? "Exporting..." : "Export as PDF"}
            </button>
            <button
              onClick={handleExportDOCX}
              disabled={exporting !== null}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 disabled:opacity-50"
            >
              <File className="h-4 w-4 text-blue-500" />
              {exporting === "docx" ? "Exporting..." : "Export as Word"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
