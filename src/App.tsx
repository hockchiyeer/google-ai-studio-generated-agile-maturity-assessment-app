/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, 
  Download, 
  Upload, 
  Link as LinkIcon, 
  FileText, 
  Presentation, 
  History, 
  Filter, 
  ChevronRight, 
  ChevronDown,
  Trash2,
  Edit3,
  Save,
  X,
  Check,
  Calendar,
  BarChart3,
  LineChart,
  Radar,
  Info,
  Zap,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Radar as RadarChart, Bar, Line } from 'react-chartjs-2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import PptxGenJS from 'pptxgenjs';
import * as XLSX from 'xlsx';

import { AssessmentData, Snapshot, Question, Discipline, AuditEntry } from './types';
import { INITIAL_DATA } from './constants';
import { formatQuestionTextRecord, parseQuestionTextRecords } from './questionTextParser';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

const GENERIC_SNAPSHOT_LABEL_PATTERN = /^snapshot\s+\d+$/i;

function formatSnapshotDate(date: string) {
  const [year, month, day] = date.split('-').map(Number);
  if (!year || !month || !day) return date;

  return new Intl.DateTimeFormat(undefined, {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function isSnapshotLabelDateLike(label: string, date: string) {
  const trimmed = label.trim();
  if (!trimmed) return false;
  return trimmed === date || trimmed === formatSnapshotDate(date);
}

function hasMeaningfulSnapshotLabel(snapshot: Snapshot) {
  const trimmed = snapshot.label.trim();
  if (!trimmed) return false;
  if (GENERIC_SNAPSHOT_LABEL_PATTERN.test(trimmed)) return false;
  if (isSnapshotLabelDateLike(trimmed, snapshot.date)) return false;
  return true;
}

function getSnapshotTitle(snapshot: Snapshot) {
  return hasMeaningfulSnapshotLabel(snapshot)
    ? snapshot.label.trim()
    : formatSnapshotDate(snapshot.date);
}

function getSnapshotContext(snapshot: Snapshot) {
  const title = getSnapshotTitle(snapshot);
  return hasMeaningfulSnapshotLabel(snapshot)
    ? `${title} - ${formatSnapshotDate(snapshot.date)}`
    : title;
}

function getSnapshotAnnotation(snapshot: Snapshot, index: number) {
  const trimmed = snapshot.label.trim();
  if (trimmed && !isSnapshotLabelDateLike(trimmed, snapshot.date)) {
    return trimmed;
  }

  return `Snapshot ${index + 1}`;
}

export default function App() {
  const [data, setData] = useState<AssessmentData>(INITIAL_DATA);
  const [filterDiscipline, setFilterDiscipline] = useState<string>('all');
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [isRecoverQuestionsOpen, setIsRecoverQuestionsOpen] = useState(false);
  const [isAddDisciplineOpen, setIsAddDisciplineOpen] = useState(false);
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [isSnapshotManagerOpen, setIsSnapshotManagerOpen] = useState(false);
  const [isConfirmClearBinOpen, setIsConfirmClearBinOpen] = useState(false);
  const [comparisonType, setComparisonType] = useState<'bar' | 'line'>('bar');
  const [editingCell, setEditingCell] = useState<{ id: string, field: 'principle' | 'question' } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [fileHandle, setFileHandle] = useState<FileSystemFileHandle | null>(null);
  const [isInitialLoadReady, setIsInitialLoadReady] = useState(false);
  const radarChartRef = useRef<any>(null);
  const barChartRef = useRef<any>(null);
  const lineChartRef = useRef<any>(null);
  const lastSavedPayload = useRef<string | null>(null);

  // Persistence: Fetch from server on load
  useEffect(() => {
    let isActive = true;

    const fetchData = async () => {
      try {
        const response = await fetch('/api/data');
        if (response.ok) {
          const serverData = await response.json();
          if (!isActive) return;
          lastSavedPayload.current = JSON.stringify(serverData);
          setData(serverData);
        }
      } catch (err) {
        console.error("Failed to fetch data from server:", err);
      } finally {
        if (isActive) {
          setIsInitialLoadReady(true);
        }
      }
    };

    fetchData();

    return () => {
      isActive = false;
    };
  }, []);

  // Persistence: Save to server on change
  useEffect(() => {
    if (!isInitialLoadReady) {
      return;
    }

    const serializedData = JSON.stringify(data);
    if (serializedData === lastSavedPayload.current) {
      return;
    }

    const saveData = async () => {
      try {
        await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: serializedData,
        });
        lastSavedPayload.current = serializedData;
      } catch (err) {
        console.error("Failed to save data to server:", err);
      }
    };

    // Debounce save
    const timeout = setTimeout(saveData, 1000);
    return () => clearTimeout(timeout);
  }, [data, isInitialLoadReady]);

  // Persistence: Autosave if linked
  useEffect(() => {
    if (fileHandle) {
      const save = async () => {
        try {
          const writable = await fileHandle.createWritable();
          await writable.write(JSON.stringify(data, null, 2));
          await writable.close();
        } catch (err) {
          console.error("Autosave failed:", err);
        }
      };
      save();
    }
  }, [data, fileHandle]);

  // Audit Log Helper
  const addAuditEntry = (action: string, details: string) => {
    const entry: AuditEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action,
      details
    };
    setData(prev => ({
      ...prev,
      auditLog: [entry, ...prev.auditLog].slice(0, 100),
      lastModified: new Date().toISOString()
    }));
  };

  // Calculations
  const activeSnapshot = useMemo(() => 
    data.snapshots.find(s => s.id === data.activeSnapshotId) || data.snapshots[0]
  , [data.snapshots, data.activeSnapshotId]);

  const comparisonChartLabels = useMemo<(string | string[])[]>(() => {
    return data.snapshots.map((snapshot, index) => {
      const dateLabel = formatSnapshotDate(snapshot.date);
      const annotation = getSnapshotAnnotation(snapshot, index);
      return [dateLabel, annotation];
    });
  }, [data.snapshots]);

  const snapshotExportHeaders = useMemo(() => {
    return data.snapshots.map((snapshot, index) => {
      const dateLabel = formatSnapshotDate(snapshot.date);
      const annotation = getSnapshotAnnotation(snapshot, index);
      return `${dateLabel} (${annotation})`;
    });
  }, [data.snapshots]);

  const activeSnapshotTitle = getSnapshotTitle(activeSnapshot);
  const activeSnapshotContext = getSnapshotContext(activeSnapshot);
  const activeSnapshotDateLabel = formatSnapshotDate(activeSnapshot.date);
  const showActiveSnapshotDate = hasMeaningfulSnapshotLabel(activeSnapshot);

  const scoresByDiscipline = useMemo(() => {
    const result: Record<string, { total: number; count: number; targetTotal: number }> = {};
    data.questions.forEach(q => {
      if (!result[q.disciplineId]) {
        result[q.disciplineId] = { total: 0, count: 0, targetTotal: 0 };
      }
      result[q.disciplineId].total += q.scores[data.activeSnapshotId] || 0;
      result[q.disciplineId].targetTotal += q.targetScore;
      result[q.disciplineId].count += 1;
    });
    return result;
  }, [data.questions, data.activeSnapshotId]);

  const overallAverage = useMemo(() => {
    let total = 0;
    let count = 0;
    Object.values(scoresByDiscipline).forEach((d: { total: number; count: number; targetTotal: number }) => {
      total += d.total;
      count += d.count;
    });
    return count > 0 ? (total / count).toFixed(2) : "0.00";
  }, [scoresByDiscipline]);

  const overallTargetAverage = useMemo(() => {
    let total = 0;
    let count = 0;
    Object.values(scoresByDiscipline).forEach((d: { total: number; count: number; targetTotal: number }) => {
      total += d.targetTotal;
      count += d.count;
    });
    return count > 0 ? (total / count).toFixed(2) : "0.00";
  }, [scoresByDiscipline]);

  // Chart Data
  const radarData = {
    labels: data.disciplines.map(d => d.name),
    datasets: [
      {
        label: 'Current Maturity',
        data: data.disciplines.map(d => {
          const stats = scoresByDiscipline[d.id];
          return stats ? (stats.total / stats.count).toFixed(2) : 0;
        }),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
      {
        label: 'Target Maturity',
        data: data.disciplines.map(d => {
          const stats = scoresByDiscipline[d.id];
          return stats ? (stats.targetTotal / stats.count).toFixed(2) : 0;
        }),
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 0.5)',
        borderWidth: 1,
        borderDash: [5, 5],
      }
    ],
  };

  const comparisonChartData = {
    labels: comparisonChartLabels,
    datasets: [
      {
        label: 'Overall Maturity',
        data: data.snapshots.map(s => {
          let total = 0;
          let count = 0;
          data.questions.forEach(q => {
            if (q.scores[s.id] !== undefined) {
              total += q.scores[s.id];
              count++;
            }
          });
          return count > 0 ? (total / count).toFixed(2) : 0;
        }),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 3,
        tension: 0.3,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      ...data.disciplines.map((d, idx) => {
        const colors = [
          'rgba(239, 68, 68, 0.5)',  // Red
          'rgba(245, 158, 11, 0.5)', // Amber
          'rgba(16, 185, 129, 0.5)', // Emerald
          'rgba(6, 182, 212, 0.5)',  // Cyan
          'rgba(139, 92, 246, 0.5)', // Violet
          'rgba(236, 72, 153, 0.5)', // Pink
          'rgba(107, 114, 128, 0.5)', // Gray
        ];
        const borderColors = [
          'rgba(239, 68, 68, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(6, 182, 212, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)',
          'rgba(107, 114, 128, 1)',
        ];
        return {
          label: d.name,
          data: data.snapshots.map(s => {
            let total = 0;
            let count = 0;
            data.questions.filter(q => q.disciplineId === d.id).forEach(q => {
              if (q.scores[s.id] !== undefined) {
                total += q.scores[s.id];
                count++;
              }
            });
            return count > 0 ? (total / count).toFixed(2) : 0;
          }),
          backgroundColor: colors[idx % colors.length],
          borderColor: borderColors[idx % borderColors.length],
          borderWidth: 1.5,
          tension: 0.3,
          pointRadius: 3,
        };
      })
    ]
  };

  // Handlers
  const getMaturityLabel = (score: number) => {
    const s = Math.round(score);
    if (s <= 1) return 'Adhoc';
    if (s === 2) return 'Defined';
    if (s === 3) return 'Consistent';
    if (s === 4) return 'Managed';
    return 'Optimizing';
  };

  const handleScoreChange = (qId: string, score: number) => {
    setData(prev => ({
      ...prev,
      questions: prev.questions.map(q => 
        q.id === qId ? { ...q, scores: { ...q.scores, [prev.activeSnapshotId]: score } } : q
      ),
      lastModified: new Date().toISOString()
    }));
  };

  const handleEditQuestion = (id: string, field: 'principle' | 'question', newValue: string) => {
    const question = data.questions.find(q => q.id === id);
    if (!question || question[field] === newValue) {
      setEditingCell(null);
      return;
    }

    const oldValue = question[field];
    setData(prev => ({
      ...prev,
      questions: prev.questions.map(q => q.id === id ? { ...q, [field]: newValue } : q),
      lastModified: new Date().toISOString()
    }));
    
    addAuditEntry("Question Edit", `Updated ${field} for "${question.principle}": "${oldValue}" -> "${newValue}"`);
    setEditingCell(null);
  };

  const handleAddSnapshot = (label: string, date: string) => {
    const newId = `snapshot-${Date.now()}`;
    const trimmedLabel = label.trim();
    const newSnapshot: Snapshot = { id: newId, label: trimmedLabel, date };
    setData(prev => ({
      ...prev,
      snapshots: [...prev.snapshots, newSnapshot].slice(-12),
      activeSnapshotId: newId,
      lastModified: new Date().toISOString()
    }));
    addAuditEntry("Snapshot", `Added new snapshot: ${getSnapshotContext(newSnapshot)}`);
  };

  const handleBulkAddSnapshots = (newSnapshots: { label: string, date: string }[]) => {
    setData(prev => {
      const updatedSnapshots = [...prev.snapshots];
      const addedIds: string[] = [];
      
      newSnapshots.forEach(s => {
        const newId = `snapshot-${Math.random().toString(36).substr(2, 9)}`;
        updatedSnapshots.push({ id: newId, ...s, label: s.label.trim() });
        addedIds.push(newId);
      });

      const finalSnapshots = updatedSnapshots.slice(-12);
      const lastAddedId = addedIds[addedIds.length - 1];
      
      return {
        ...prev,
        snapshots: finalSnapshots,
        activeSnapshotId: finalSnapshots.find(s => s.id === lastAddedId) ? lastAddedId : finalSnapshots[finalSnapshots.length - 1].id,
        lastModified: new Date().toISOString()
      };
    });
    addAuditEntry("Snapshot", `Bulk added ${newSnapshots.length} snapshots.`);
  };

  const handleAddQuestion = (principle: string, question: string, disciplineId: string) => {
    const newId = `q-${Date.now()}`;
    const newQuestion: Question = {
      id: newId,
      disciplineId,
      principle,
      question,
      scores: { [data.activeSnapshotId]: 2 },
      targetScore: 4
    };
    setData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
      lastModified: new Date().toISOString()
    }));
    addAuditEntry("Question", `Added question to ${data.disciplines.find(d => d.id === disciplineId)?.name}`);
  };

  const handleDeleteQuestion = (id: string) => {
    const questionToDelete = data.questions.find(q => q.id === id);
    if (!questionToDelete) return;

    const deletedAt = new Date().toISOString();
    setData(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id),
      deletedQuestions: [...prev.deletedQuestions, { ...questionToDelete, deletedAt }],
      lastModified: deletedAt
    }));
    addAuditEntry("Question", `Deleted question: ${questionToDelete.principle}`);
  };

  const handleRecoverQuestion = (id: string) => {
    const questionToRecover = data.deletedQuestions.find(q => q.id === id);
    if (!questionToRecover) return;

    // Remove deletedAt when recovering
    const { deletedAt, ...recoveredQuestion } = questionToRecover;

    setData(prev => ({
      ...prev,
      deletedQuestions: prev.deletedQuestions.filter(q => q.id !== id),
      questions: [...prev.questions, recoveredQuestion as Question],
      lastModified: new Date().toISOString()
    }));
    addAuditEntry("Question", `Recovered question: ${questionToRecover.principle}`);
  };

  const handleAddDiscipline = (name: string) => {
    const newId = `disc-${Date.now()}`;
    setData(prev => ({
      ...prev,
      disciplines: [...prev.disciplines, { id: newId, name }],
      lastModified: new Date().toISOString()
    }));
    addAuditEntry("Discipline", `Added new discipline: ${name}`);
  };

  const handleRenameDiscipline = (id: string, newName: string) => {
    setData(prev => ({
      ...prev,
      disciplines: prev.disciplines.map(d => d.id === id ? { ...d, name: newName } : d),
      lastModified: new Date().toISOString()
    }));
    addAuditEntry("Discipline", `Renamed discipline to: ${newName}`);
  };

  const handleClearAllQuestions = () => {
    const deletedAt = new Date().toISOString();
    const questionsToMove = data.questions.map(q => ({ ...q, deletedAt }));
    
    setData(prev => ({
      ...prev,
      questions: [],
      deletedQuestions: [...prev.deletedQuestions, ...questionsToMove],
      lastModified: deletedAt
    }));
    addAuditEntry("Bulk Action", `Cleared all questions (${questionsToMove.length}) and moved to recovery.`);
  };

  const handleExportQuestions = () => {
    const text = data.questions
      .map((question) => {
        const disciplineName = data.disciplines.find((discipline) => discipline.id === question.disciplineId)?.name || 'Unknown';
        return formatQuestionTextRecord({
          disciplineName,
          principle: question.principle,
          question: question.question,
        });
      })
      .join('\n');
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agile-maturity-questions-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    addAuditEntry("Export", "Exported questions to text format.");
  };

  const handleBulkImport = (rawText: string, defaultDisciplineId: string) => {
    const importedRecords = parseQuestionTextRecords(rawText);
    const importTimestamp = Date.now();

    const newQuestions: Question[] = importedRecords.map((record, index) => {
      let disciplineId = defaultDisciplineId;
      let principle = "General Principle";
      const question = record.question;

      if (record.disciplineName) {
        const foundDisc = data.disciplines.find(
          d => d.name.toLowerCase() === record.disciplineName!.toLowerCase()
        );

        if (foundDisc) {
          disciplineId = foundDisc.id;
          if (!record.principle) {
            principle = foundDisc.name;
          }
        }
      }

      if (record.principle) {
        principle = record.principle;
      }

      return {
        id: `q-bulk-${importTimestamp}-${index}`,
        disciplineId,
        principle,
        question,
        scores: { [data.activeSnapshotId]: 2 },
        targetScore: 4
      };
    });

    setData(prev => ({
      ...prev,
      questions: [...prev.questions, ...newQuestions],
      lastModified: new Date().toISOString()
    }));
    addAuditEntry("Bulk Action", `Imported ${newQuestions.length} questions.`);
  };

  // File Handlers
  const handleDownloadJSON = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agile-maturity-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addAuditEntry("Export", "Downloaded JSON data.");
  };

  const handleOpenJSON = async () => {
    try {
      // @ts-ignore
      const [handle] = await window.showOpenFilePicker({
        types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
      });
      const file = await handle.getFile();
      const content = await file.text();
      const imported = JSON.parse(content);
      setData(imported);
      setFileHandle(handle);
      addAuditEntry("Import", "Opened JSON file.");
    } catch (err) {
      console.error("Failed to open file:", err);
    }
  };

  const handleLinkJSON = async () => {
    try {
      // @ts-ignore
      const handle = await window.showSaveFilePicker({
        suggestedName: `agile-maturity-linked.json`,
        types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
      });
      setFileHandle(handle);
      addAuditEntry("System", "Linked JSON file for autosave.");
    } catch (err) {
      console.error("Failed to link file:", err);
    }
  };

  // Export PDF
  const handleExportPDF = () => {
    const isLandscape = data.snapshots.length > 2;
    const doc = new jsPDF({
      orientation: isLandscape ? 'l' : 'p',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const chartWidth = pageWidth - 24;
    const chartHeight = Math.min(pageHeight - 42, chartWidth * 0.62);
    const chartX = (pageWidth - chartWidth) / 2;
    const chartY = 28;

    const addTrendPage = (title: string, chartRef: React.RefObject<any>) => {
      doc.addPage();
      doc.setFontSize(16);
      doc.text(title, 14, 20);

      if (chartRef.current) {
        const chartImg = chartRef.current.toBase64Image();
        doc.addImage(chartImg, 'PNG', chartX, chartY, chartWidth, chartHeight);
      }
    };
    
    // Page 1: Overview & Radar
    doc.setFontSize(20);
    doc.text("Agile Project Maturity Assessment", 14, 22);
    doc.setFontSize(12);
    doc.text(`Snapshot: ${activeSnapshotContext}`, 14, 30);
    doc.text(`Overall Maturity: ${overallAverage} / 5.00`, 14, 38);

    if (radarChartRef.current) {
      const chartImg = radarChartRef.current.toBase64Image();
      doc.setFontSize(16);
      doc.text(`Maturity Radar Diagram - ${activeSnapshotTitle}`, 14, 50);
      
      // Center the image
      const imgWidth = isLandscape ? 160 : 180;
      const imgHeight = isLandscape ? 120 : 180;
      const xPos = (pageWidth - imgWidth) / 2;
      doc.addImage(chartImg, 'PNG', xPos, 60, imgWidth, imgHeight);
    }

    // Page 2: Timeline Comparison (Bar)
    addTrendPage(`Timeline Comparison (Bar) - ${activeSnapshotTitle}`, barChartRef);

    // Page 3: Timeline Comparison (Line)
    addTrendPage(`Timeline Comparison (Line) - ${activeSnapshotTitle}`, lineChartRef);

    // Page 4+: Table
    doc.addPage();
    doc.setFontSize(14);
    doc.text(`Assessment Details - ${activeSnapshotTitle}`, 14, 15);

    const tableData = data.questions.map(q => [
      data.disciplines.find(d => d.id === q.disciplineId)?.name || '',
      q.principle,
      q.question,
      ...data.snapshots.map(s => q.scores[s.id] || 0),
      q.targetScore
    ]);

    autoTable(doc, {
      startY: 20,
      head: [['Discipline', 'Principle', 'Question', ...snapshotExportHeaders, 'Target']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: isLandscape ? 35 : 25 },
        1: { cellWidth: isLandscape ? 40 : 30 },
        2: { cellWidth: 'auto' }
      }
    });

    doc.save(`agile-maturity-report-${activeSnapshot.date}.pdf`);
    addAuditEntry("Export", "Exported PDF report.");
  };

  // Export PPTX
  const handleExportPPTX = () => {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';

    const addTrendSlide = (title: string, chartRef: React.RefObject<any>) => {
      const slide = pptx.addSlide();
      slide.addText(title, { x: 0.5, y: 0.3, fontSize: 20, bold: true, color: '3B82F6' });

      if (chartRef.current) {
        const chartImg = chartRef.current.toBase64Image();
        slide.addImage({ data: chartImg, x: 0.5, y: 1.0, w: 12.2, h: 5.8 });
      }
    };
    
    // Slide 1: Overview & Radar
    const radarSlide = pptx.addSlide();
    radarSlide.addText("Agile Maturity Assessment", { x: 0.5, y: 0.3, w: '90%', fontSize: 24, bold: true, color: '3B82F6' });
    radarSlide.addText(`Snapshot: ${activeSnapshotContext}`, { x: 0.5, y: 0.8, fontSize: 14, color: '6B7280' });
    radarSlide.addText(`Overall Maturity: ${overallAverage} / 5.00`, { x: 0.5, y: 1.1, fontSize: 14, bold: true });

    if (radarChartRef.current) {
      radarSlide.addText(`Maturity Radar Diagram - ${activeSnapshotTitle}`, { x: 0.5, y: 1.6, fontSize: 18, bold: true });
      const chartImg = radarChartRef.current.toBase64Image();
      radarSlide.addImage({ data: chartImg, x: 3.5, y: 2.0, w: 6, h: 4.5 });
    }

    // Slide 2: Timeline Comparison (Bar)
    addTrendSlide(`Timeline Comparison (Bar) - ${activeSnapshotTitle}`, barChartRef);

    // Slide 3: Timeline Comparison (Line)
    addTrendSlide(`Timeline Comparison (Line) - ${activeSnapshotTitle}`, lineChartRef);

    // Slide 4+: Table
    const tableSlide = pptx.addSlide();
    tableSlide.addText(`Assessment Details - ${activeSnapshotTitle}`, { x: 0.5, y: 0.3, fontSize: 20, bold: true, color: '3B82F6' });

    const snapshotHeaders = snapshotExportHeaders.map(header => ({ text: header, options: { fill: 'F3F4F6', bold: true, align: 'center' } }));
    const tableRows = [
      [
        { text: 'Discipline', options: { fill: 'F3F4F6', bold: true } },
        { text: 'Principle', options: { fill: 'F3F4F6', bold: true } },
        { text: 'Question', options: { fill: 'F3F4F6', bold: true } },
        ...snapshotHeaders,
        { text: 'Target', options: { fill: 'F3F4F6', bold: true, align: 'center' } }
      ],
      ...data.questions.map(q => [
        data.disciplines.find(d => d.id === q.disciplineId)?.name || '',
        q.principle,
        q.question,
        ...data.snapshots.map(s => ({ text: (q.scores[s.id] || 0).toString(), options: { align: 'center' } })),
        { text: q.targetScore.toString(), options: { align: 'center' } }
      ])
    ];

    // Calculate column widths to fit w: 12.3
    const totalWidth = 12.3;
    const fixedWidths = 1.5 + 2.0 + 1.0; // Discipline, Principle, Target
    const availableForContent = totalWidth - fixedWidths;
    
    // Allocate at most 4.0 for snapshots, or less if few snapshots
    const maxSnapshotsWidth = Math.min(4.0, data.snapshots.length * 1.0);
    const snapshotColWidth = maxSnapshotsWidth / data.snapshots.length;
    const questionWidth = availableForContent - maxSnapshotsWidth;
    
    const colW = [1.5, 2.0, questionWidth, ...data.snapshots.map(() => snapshotColWidth), 1.0];

    tableSlide.addTable(tableRows, { 
      x: 0.5, 
      y: 1.0, 
      w: 12.3, 
      fontSize: 8,
      autoPage: true,
      autoPageRepeatHeader: true,
      autoPageLineWeight: 0.5,
      colW: colW,
      border: { type: 'solid', color: 'E5E7EB', pt: 0.5 },
      valign: 'middle'
    });

    pptx.writeFile({ fileName: `agile-maturity-${activeSnapshot.date}.pptx` });
    addAuditEntry("Export", "Exported PPTX report.");
  };

  // Export XLSX
  const handleExportXLSX = () => {
    const worksheetData = [
      ['Discipline', 'Principle', 'Question', ...snapshotExportHeaders, 'Target'],
      ...data.questions.map(q => [
        data.disciplines.find(d => d.id === q.disciplineId)?.name || '',
        q.principle,
        q.question,
        ...data.snapshots.map(s => q.scores[s.id] || 0),
        q.targetScore
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Assessment");

    // Add Radar Data sheet
    const radarSheetData = [
      ['Discipline', 'Current Maturity', 'Target Maturity'],
      ...data.disciplines.map(d => {
        const stats = scoresByDiscipline[d.id];
        return [
          d.name,
          stats ? (stats.total / stats.count).toFixed(2) : 0,
          stats ? (stats.targetTotal / stats.count).toFixed(2) : 0
        ];
      })
    ];
    const radarWorksheet = XLSX.utils.aoa_to_sheet(radarSheetData);
    XLSX.utils.book_append_sheet(workbook, radarWorksheet, "Radar Data");

    // Auto-size columns
    const colWidths = [
      { wch: 20 }, // Discipline
      { wch: 30 }, // Principle
      { wch: 60 }, // Question
      ...data.snapshots.map(() => ({ wch: 12 })), // Snapshot scores
      { wch: 10 }, // Target
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `agile-maturity-${activeSnapshot.date}.xlsx`);
    addAuditEntry("Export", "Exported Excel report.");
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 py-3 sm:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white" title="Agile Maturity Assessment Logo">
            <BarChart3 size={24} aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Agile Maturity</h1>
            <p className="text-xs text-gray-500 font-mono uppercase tracking-widest">Assessment Dashboard</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2">
          <button onClick={handleOpenJSON} title="Open assessment data from a JSON file" aria-label="Open JSON" className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <Upload size={16} /> <span className="hidden sm:inline">Open JSON</span>
          </button>
          <button onClick={handleLinkJSON} title="Link a local JSON file for automatic saving" aria-label={fileHandle ? 'JSON file linked' : 'Link JSON file'} className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-md transition-colors ${fileHandle ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-300 hover:bg-gray-50'}`}>
            <LinkIcon size={16} /> <span className="hidden sm:inline">{fileHandle ? 'Linked' : 'Link JSON'}</span>
          </button>
          <div className="h-8 w-px bg-gray-200 mx-1 hidden sm:block"></div>
          <button onClick={handleExportPDF} title="Export current assessment to a PDF report" aria-label="Export PDF" className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <FileText size={16} /> <span className="hidden sm:inline">PDF</span>
          </button>
          <button onClick={handleExportPPTX} title="Export current assessment to a PowerPoint presentation" aria-label="Export PPTX" className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <Presentation size={16} /> <span className="hidden sm:inline">PPTX</span>
          </button>
          <button onClick={handleExportXLSX} title="Export current assessment to an Excel spreadsheet" aria-label="Export Excel" className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <FileSpreadsheet size={16} /> <span className="hidden sm:inline">Excel</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Top Stats & Timeline */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-sm font-mono text-gray-400 uppercase tracking-widest mb-1">Active Assessment</h2>
                <h3 className="text-2xl font-bold">{activeSnapshotTitle}</h3>
                {showActiveSnapshotDate && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <Calendar size={14} title="Snapshot Date" /> {activeSnapshotDateLabel}
                  </p>
                )}
              </div>
              <button 
                onClick={() => setIsSnapshotManagerOpen(true)}
                title="Manage assessment snapshots and history"
                aria-label="Manage Snapshots"
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
              >
                <History size={20} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Overall Score</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-blue-900">{overallAverage}</p>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">({getMaturityLabel(Number(overallAverage))})</span>
                </div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">Target Score</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-bold text-emerald-900">{overallTargetAverage}</p>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">({getMaturityLabel(Number(overallTargetAverage))})</span>
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Disciplines</p>
                <p className="text-3xl font-bold text-gray-900">{data.disciplines.length}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs font-semibold text-gray-600 uppercase mb-1">Total Questions</p>
                <p className="text-3xl font-bold text-gray-900">{data.questions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-mono text-gray-400 uppercase tracking-widest">Maturity Radar</h2>
              <Radar size={18} className="text-gray-400" title="Radar chart showing maturity across disciplines" aria-label="Maturity Radar Icon" />
            </div>
            <div className="aspect-square">
              <RadarChart 
                ref={radarChartRef}
                data={radarData} 
                options={{
                  scales: {
                    r: {
                      min: 0,
                      max: 5,
                      ticks: { stepSize: 1, display: false },
                      grid: { color: 'rgba(0,0,0,0.05)' },
                      angleLines: { color: 'rgba(0,0,0,0.05)' }
                    }
                  },
                  plugins: {
                    tooltip: {
                      callbacks: {
                        label: (context: any) => {
                          const value = context.parsed.r;
                          return `${context.dataset.label}: ${value} (${getMaturityLabel(value)})`;
                        }
                      }
                    },
                    legend: { 
                      display: true,
                      position: 'bottom',
                      labels: {
                        boxWidth: 12,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { size: 10 }
                      }
                    }
                  }
                }} 
              />
            </div>
          </div>
        </section>

        {/* Maturity Level Legend */}
        <section className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3 min-w-[180px]">
              <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 border border-gray-100">
                <Info size={20} />
              </div>
              <div>
                <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Maturity Levels</h2>
                <p className="text-[10px] text-gray-400 font-medium">CMMI-based scoring model</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 w-full">
              {[
                { score: 1, label: 'Adhoc', color: 'bg-red-50 text-red-700 border-red-100' },
                { score: 2, label: 'Defined', color: 'bg-orange-50 text-orange-700 border-orange-100' },
                { score: 3, label: 'Consistent', color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
                { score: 4, label: 'Managed', color: 'bg-blue-50 text-blue-700 border-blue-100' },
                { score: 5, label: 'Optimizing', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
              ].map((level) => (
                <div key={level.score} className={`flex flex-col items-center p-3 rounded-xl border ${level.color} transition-all hover:shadow-md hover:-translate-y-0.5 group`}>
                  <span className="text-2xl font-black leading-none mb-1 group-hover:scale-110 transition-transform">{level.score}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">{level.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold">Timeline Comparison</h2>
              <p className="text-sm text-gray-500">Tracking progress across {data.snapshots.length} dated snapshots</p>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => setComparisonType('bar')}
                title="Switch to bar chart view"
                aria-label="Bar Chart View"
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${comparisonType === 'bar' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <BarChart3 size={16} className="inline mr-1" /> Bar
              </button>
              <button 
                onClick={() => setComparisonType('line')}
                title="Switch to line chart view"
                aria-label="Line Chart View"
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${comparisonType === 'line' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <LineChart size={16} className="inline mr-1" /> Line
              </button>
            </div>
          </div>
          <div className="h-64 sm:h-80 relative">
            <div className={comparisonType === 'bar' ? 'h-full w-full' : 'absolute inset-0 opacity-0 pointer-events-none'}>
              <Bar 
                ref={barChartRef}
                data={comparisonChartData} 
                options={{ 
                  maintainAspectRatio: false,
                  scales: { y: { min: 0, max: 5 } },
                  plugins: { 
                    tooltip: {
                      callbacks: {
                        label: (context: any) => {
                          const value = context.parsed.y;
                          return `${context.dataset.label}: ${value} (${getMaturityLabel(value)})`;
                        }
                      }
                    },
                    legend: { 
                      display: true,
                      position: 'top',
                      labels: {
                        boxWidth: 12,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { size: 10 }
                      }
                    } 
                  }
                }} 
              />
            </div>
            <div className={comparisonType === 'line' ? 'h-full w-full' : 'absolute inset-0 opacity-0 pointer-events-none'}>
              <Line 
                ref={lineChartRef}
                data={comparisonChartData} 
                options={{ 
                  maintainAspectRatio: false,
                  scales: { y: { min: 0, max: 5 } },
                  plugins: { 
                    tooltip: {
                      callbacks: {
                        label: (context: any) => {
                          const value = context.parsed.y;
                          return `${context.dataset.label}: ${value} (${getMaturityLabel(value)})`;
                        }
                      }
                    },
                    legend: { 
                      display: true,
                      position: 'top',
                      labels: {
                        boxWidth: 12,
                        usePointStyle: true,
                        pointStyle: 'circle',
                        font: { size: 10 }
                      }
                    } 
                  }
                }} 
              />
            </div>
          </div>
        </section>

        {/* Assessment Table */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Showing {data.questions.filter(q => filterDiscipline === 'all' || q.disciplineId === filterDiscipline).length} of {data.questions.length} Questions
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:flex-none">
                    <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" title="Filter icon" />
                    <select 
                      value={filterDiscipline}
                      onChange={(e) => setFilterDiscipline(e.target.value)}
                      title="Filter questions by discipline"
                      aria-label="Filter by Discipline"
                      className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full"
                    >
                      <option value="all">All Disciplines</option>
                      {data.disciplines.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <button 
                    onClick={() => setIsAddDisciplineOpen(true)}
                    className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
                    title="Manage Disciplines"
                    aria-label="Manage Disciplines"
                  >
                    <Edit3 size={18} />
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={() => setIsBulkActionsOpen(true)}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600"
                title="Bulk Actions"
                aria-label="Bulk Actions"
              >
                <Zap size={18} />
              </button>
              <button 
                onClick={() => setIsRecoverQuestionsOpen(true)}
                title="View and recover deleted questions"
                aria-label="Recover Questions"
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-semibold flex-1 sm:flex-none justify-center"
              >
                <History size={18} /> Recover
              </button>
              <button 
                onClick={() => setIsAddQuestionOpen(true)}
                title="Add a new assessment question"
                aria-label="Add Question"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold flex-1 sm:flex-none justify-center"
              >
                <Plus size={18} /> Add Question
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-mono text-gray-400 uppercase tracking-widest">Discipline</th>
                    <th className="px-6 py-4 text-xs font-mono text-gray-400 uppercase tracking-widest">Principle</th>
                    <th className="px-6 py-4 text-xs font-mono text-gray-400 uppercase tracking-widest">Question</th>
                    <th className="px-6 py-4 text-xs font-mono text-gray-400 uppercase tracking-widest text-center">Score (1-5)</th>
                    <th className="px-6 py-4 text-xs font-mono text-gray-400 uppercase tracking-widest text-center">Target</th>
                    <th className="px-6 py-4 text-xs font-mono text-gray-400 uppercase tracking-widest text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.questions
                    .filter(q => filterDiscipline === 'all' || q.disciplineId === filterDiscipline)
                    .map(q => (
                      <tr key={q.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded text-gray-600">
                            {data.disciplines.find(d => d.id === q.disciplineId)?.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                          {editingCell?.id === q.id && editingCell?.field === 'principle' ? (
                            <div className="flex items-center gap-2">
                              <input 
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleEditQuestion(q.id, 'principle', editValue);
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                className="w-full p-1 border border-blue-500 rounded outline-none focus:ring-2 focus:ring-blue-200"
                              />
                              <button onClick={() => handleEditQuestion(q.id, 'principle', editValue)} className="text-blue-600 hover:text-blue-800"><Save size={14} /></button>
                              <button onClick={() => setEditingCell(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between group/cell">
                              <span>{q.principle}</span>
                              <button 
                                onClick={() => { setEditingCell({ id: q.id, field: 'principle' }); setEditValue(q.principle); }}
                                className="opacity-0 group-hover/cell:opacity-100 p-1 text-gray-400 hover:text-blue-600 transition-all"
                                title="Edit Principle"
                              >
                                <Edit3 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 max-w-md">
                          {editingCell?.id === q.id && editingCell?.field === 'question' ? (
                            <div className="flex items-center gap-2">
                              <textarea 
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleEditQuestion(q.id, 'question', editValue);
                                  }
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                                className="w-full p-1 border border-blue-500 rounded outline-none focus:ring-2 focus:ring-blue-200 min-h-[60px] resize-none"
                              />
                              <div className="flex flex-col gap-1">
                                <button onClick={() => handleEditQuestion(q.id, 'question', editValue)} className="text-blue-600 hover:text-blue-800"><Save size={14} /></button>
                                <button onClick={() => setEditingCell(null)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between group/cell">
                              <span>{q.question}</span>
                              <button 
                                onClick={() => { setEditingCell({ id: q.id, field: 'question' }); setEditValue(q.question); }}
                                className="opacity-0 group-hover/cell:opacity-100 p-1 text-gray-400 hover:text-blue-600 transition-all ml-2"
                                title="Edit Question"
                              >
                                <Edit3 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center items-center gap-1">
                            {[1, 2, 3, 4, 5].map(score => (
                              <button
                                key={score}
                                onClick={() => handleScoreChange(q.id, score)}
                                title={`Set score to ${score} (${getMaturityLabel(score)})`}
                                aria-label={`Set score to ${score} (${getMaturityLabel(score)})`}
                                className={`w-8 h-8 rounded-md text-xs font-bold transition-all ${
                                  (q.scores[data.activeSnapshotId] || 0) === score
                                    ? 'bg-blue-600 text-white shadow-md scale-110'
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                              >
                                {score}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                            {q.targetScore}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                            title="Delete Question"
                            aria-label={`Delete question: ${q.principle}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Controls */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 px-4 py-3 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsAuditLogOpen(true)} title="View system audit log" aria-label="View Audit Log" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
              <History size={16} /> <span className="hidden sm:inline">Audit Log</span>
            </button>
            <div className="text-xs text-gray-400 font-mono hidden md:block">
              Last modified: {new Date(data.lastModified).toLocaleString()}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleDownloadJSON} title="Download current data as a JSON file" aria-label="Download JSON" className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors text-sm font-semibold shadow-lg">
              <Download size={18} /> Download JSON
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {isRecoverQuestionsOpen && (
          <Modal title="Recover Deleted Questions" onClose={() => { setIsRecoverQuestionsOpen(false); setIsConfirmClearBinOpen(false); }}>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-blue-50 p-3 rounded-xl border border-blue-100 mb-4">
                <p className="text-xs text-blue-700 font-medium">
                  Traceable history of deleted questions. You can restore them to any snapshot.
                </p>
                {data.deletedQuestions.length > 0 && (
                  <div className="flex items-center gap-2">
                    {isConfirmClearBinOpen ? (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setData(prev => ({ ...prev, deletedQuestions: [] }));
                            addAuditEntry("Bulk Action", "Cleared recovery bin.");
                            setIsConfirmClearBinOpen(false);
                          }}
                          className="text-[10px] font-bold text-red-600 hover:text-red-700 uppercase"
                        >
                          Confirm Clear
                        </button>
                        <button 
                          onClick={() => setIsConfirmClearBinOpen(false)}
                          className="text-[10px] font-bold text-gray-400 hover:text-gray-600 uppercase"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setIsConfirmClearBinOpen(true)}
                        className="text-[10px] font-bold text-red-600 hover:text-red-700 uppercase"
                        title="Permanently clear the recovery bin"
                        aria-label="Clear Bin"
                      >
                        Clear Bin
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                {data.deletedQuestions.length === 0 ? (
                  <div className="text-center py-12">
                    <History size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-500 font-medium">No deleted questions found.</p>
                  </div>
                ) : (
                  [...data.deletedQuestions].reverse().map(q => (
                    <div key={q.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-between items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold text-blue-600 uppercase">
                            {data.disciplines.find(d => d.id === q.disciplineId)?.name || 'Unknown Discipline'}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {q.deletedAt ? new Date(q.deletedAt).toLocaleString() : 'Unknown date'}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-gray-900">{q.principle}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{q.question}</p>
                      </div>
                      <button 
                        onClick={() => handleRecoverQuestion(q.id)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                      >
                        <Plus size={14} /> Recover
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Modal>
        )}

        {isAddQuestionOpen && (
          <Modal title="Add New Question" onClose={() => setIsAddQuestionOpen(false)}>
            <AddQuestionForm 
              disciplines={data.disciplines} 
              onAdd={(principle, question, discId) => {
                handleAddQuestion(principle, question, discId);
                setIsAddQuestionOpen(false);
              }} 
            />
          </Modal>
        )}

        {isAddDisciplineOpen && (
          <Modal title="Manage Disciplines" onClose={() => setIsAddDisciplineOpen(false)}>
            <ManageDisciplinesForm 
              disciplines={data.disciplines}
              onAdd={handleAddDiscipline}
              onRename={handleRenameDiscipline}
              onDelete={(id) => {
                const deletedAt = new Date().toISOString();
                const questionsToDelete = data.questions
                  .filter(q => q.disciplineId === id)
                  .map(q => ({ ...q, deletedAt }));
                
                setData(prev => ({
                  ...prev,
                  disciplines: prev.disciplines.filter(d => d.id !== id),
                  questions: prev.questions.filter(q => q.disciplineId !== id),
                  deletedQuestions: [...prev.deletedQuestions, ...questionsToDelete],
                  lastModified: deletedAt
                }));
                addAuditEntry("Discipline", `Deleted discipline and moved ${questionsToDelete.length} questions to recovery.`);
              }}
            />
          </Modal>
        )}

        {isAuditLogOpen && (
          <Modal title="Audit Trail" onClose={() => setIsAuditLogOpen(false)}>
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {data.auditLog.map(entry => (
                <div key={entry.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-blue-600 uppercase">{entry.action}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-700">{entry.details}</p>
                </div>
              ))}
            </div>
          </Modal>
        )}

        {isSnapshotManagerOpen && (
          <Modal title="Assessment Timeline" onClose={() => setIsSnapshotManagerOpen(false)}>
            <SnapshotManager 
              snapshots={data.snapshots}
              activeId={data.activeSnapshotId}
              onSelect={(id) => setData(prev => ({ ...prev, activeSnapshotId: id }))}
              onAdd={handleAddSnapshot}
              onBulkAdd={handleBulkAddSnapshots}
              onDelete={(id) => {
                if (data.snapshots.length <= 1) return;
                setData(prev => ({
                  ...prev,
                  snapshots: prev.snapshots.filter(s => s.id !== id),
                  activeSnapshotId: prev.activeSnapshotId === id ? prev.snapshots[0].id : prev.activeSnapshotId
                }));
                addAuditEntry("Snapshot", "Deleted snapshot.");
              }}
            />
          </Modal>
        )}

        {isBulkActionsOpen && (
          <Modal title="Bulk Actions" onClose={() => setIsBulkActionsOpen(false)}>
            <BulkActionsForm 
              disciplines={data.disciplines}
              onClear={handleClearAllQuestions}
              onExport={handleExportQuestions}
              onImport={(text, discId) => {
                handleBulkImport(text, discId);
                setIsBulkActionsOpen(false);
              }}
            />
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper Components
function Modal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} title="Close modal" aria-label="Close" className="p-1 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

function AddQuestionForm({ disciplines, onAdd }: { disciplines: Discipline[], onAdd: (principle: string, question: string, discId: string) => void }) {
  const [principle, setPrinciple] = useState('');
  const [question, setQuestion] = useState('');
  const [discId, setDiscId] = useState(disciplines[0]?.id || '');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Discipline</label>
        <select 
          value={discId}
          onChange={(e) => setDiscId(e.target.value)}
          className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        >
          {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Principle</label>
        <input 
          type="text"
          value={principle}
          onChange={(e) => setPrinciple(e.target.value)}
          placeholder="e.g. Daily Standups"
          className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Question Text (Max 500 chars)</label>
        <textarea 
          value={question}
          onChange={(e) => setQuestion(e.target.value.slice(0, 500))}
          placeholder="Enter the detailed question..."
          className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 h-24 resize-none"
        />
        <p className="text-[10px] text-right text-gray-400 mt-1">{question.length}/500</p>
      </div>
      <button 
        onClick={() => principle && question && onAdd(principle, question, discId)}
        title="Create and add the new question to the assessment"
        aria-label="Create Question"
        className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors"
      >
        Create Question
      </button>
    </div>
  );
}

function ManageDisciplinesForm({ disciplines, onAdd, onRename, onDelete }: { 
  disciplines: Discipline[], 
  onAdd: (name: string) => void,
  onRename: (id: string, name: string) => void,
  onDelete: (id: string) => void
}) {
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <input 
          type="text" 
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New discipline name..."
          className="flex-1 p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          onClick={() => { if(newName) { onAdd(newName); setNewName(''); } }}
          title="Add a new discipline category"
          aria-label="Add Discipline"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
        >
          Add
        </button>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto">
        {disciplines.map(d => (
          <div key={d.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group">
            {editingId === d.id ? (
              <input 
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => { onRename(d.id, editValue); setEditingId(null); }}
                onKeyDown={(e) => { if(e.key === 'Enter') { onRename(d.id, editValue); setEditingId(null); } }}
                className="flex-1 p-1 border border-blue-300 rounded outline-none"
              />
            ) : (
              <span className="text-sm font-medium">{d.name}</span>
            )}
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => { setEditingId(d.id); setEditValue(d.name); }}
                title="Rename this discipline"
                aria-label={`Rename ${d.name}`}
                className="p-1 text-gray-400 hover:text-blue-600"
              >
                <Edit3 size={14} />
              </button>
              <button 
                onClick={() => onDelete(d.id)}
                title="Delete this discipline and move its questions to recovery"
                aria-label={`Delete ${d.name}`}
                className="p-1 text-gray-400 hover:text-red-600"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SnapshotManager({ snapshots, activeId, onSelect, onAdd, onBulkAdd, onDelete }: {
  snapshots: Snapshot[],
  activeId: string,
  onSelect: (id: string) => void,
  onAdd: (label: string, date: string) => void,
  onBulkAdd: (newSnapshots: { label: string, date: string }[]) => void,
  onDelete: (id: string) => void
}) {
  const [label, setLabel] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isBulkMode, setIsBulkMode] = useState(true);
  const [frequency, setFrequency] = useState('Weekly');
  const [count, setCount] = useState(4);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleBulkGenerate = () => {
    const newSnapshots: { label: string, date: string }[] = [];
    let currentDate = new Date(date);
    
    for (let i = 0; i < count; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const trimmedLabel = label.trim();
      const currentLabel = trimmedLabel ? `${trimmedLabel} ${i + 1}` : '';
      
      newSnapshots.push({ label: currentLabel, date: dateStr });

      if (frequency === 'Random') {
        const randomDays = Math.floor(Math.random() * 14) + 1;
        currentDate.setDate(currentDate.getDate() + randomDays);
      } else if (frequency === 'Weekly') {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (frequency === 'Biweekly') {
        currentDate.setDate(currentDate.getDate() + 14);
      } else if (frequency === 'Monthly') {
        currentDate.setMonth(currentDate.getMonth() + 1);
      } else if (frequency === 'Quarterly') {
        currentDate.setMonth(currentDate.getMonth() + 3);
      } else if (frequency === 'Half Yearly') {
        currentDate.setMonth(currentDate.getMonth() + 6);
      }
    }
    
    onBulkAdd(newSnapshots);
    setLabel('');
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-3">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-blue-600 uppercase">
            {isBulkMode ? 'Bulk Generate Snapshots' : 'Add New Snapshot'}
          </h4>
          <button 
            onClick={() => setIsBulkMode(!isBulkMode)}
            title={isBulkMode ? 'Switch to Single Snapshot Mode' : 'Switch to Bulk Generation Mode'}
            className="text-[10px] font-bold text-blue-500 hover:underline"
          >
            {isBulkMode ? 'Switch to Single' : 'Switch to Bulk'}
          </button>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-blue-400 uppercase ml-1">Base Label</label>
              <input 
                type="text" 
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={isBulkMode ? "e.g. Review" : "e.g. Q1 Review"}
                className="w-full p-2 border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-blue-400 uppercase ml-1">
                {isBulkMode ? 'Start Date' : 'Date'}
              </label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {isBulkMode && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-blue-400 uppercase ml-1">Frequency</label>
                <select 
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full p-2 border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                >
                  <option>Weekly</option>
                  <option>Biweekly</option>
                  <option>Monthly</option>
                  <option>Quarterly</option>
                  <option>Half Yearly</option>
                  <option>Random</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-blue-400 uppercase ml-1">Count (Max 12)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="12"
                  value={count}
                  onChange={(e) => setCount(Math.min(12, parseInt(e.target.value) || 1))}
                  className="w-full p-2 border border-blue-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          )}

          <button 
            onClick={() => { 
              if(isBulkMode) {
                handleBulkGenerate();
              } else {
                onAdd(label.trim(), date); 
                setLabel(''); 
              }
            }}
            title={isBulkMode ? "Generate multiple snapshots" : "Generate a new snapshot"}
            aria-label={isBulkMode ? "Generate Snapshots" : "Generate Snapshot"}
            className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors text-sm shadow-sm"
          >
            {isBulkMode ? 'Generate Snapshots' : 'Generate Snapshot'}
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-bold text-gray-400 uppercase">History (Max 12)</h4>
        <div className="space-y-2">
          {snapshots.map((s, index) => (
            <div 
              key={s.id} 
              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                activeId === s.id ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-gray-100 hover:border-blue-200'
              }`}
              onClick={() => onSelect(s.id)}
            >
              <div>
                <p className="text-sm font-bold">{formatSnapshotDate(s.date)}</p>
                <p className={`text-[10px] ${activeId === s.id ? 'text-blue-100' : 'text-gray-400'}`}>
                  {getSnapshotAnnotation(s, index)}
                </p>
              </div>
              {snapshots.length > 1 && (
                <div className="flex items-center gap-1">
                  {confirmDeleteId === s.id ? (
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          onDelete(s.id); 
                          setConfirmDeleteId(null); 
                        }}
                        title="Confirm deletion"
                        className={`p-1 rounded-md ${activeId === s.id ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-red-100 hover:bg-red-200 text-red-600'}`}
                      >
                        <Check size={14} />
                      </button>
                      <button 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setConfirmDeleteId(null); 
                        }}
                        title="Cancel deletion"
                        className={`p-1 rounded-md ${activeId === s.id ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(s.id); }}
                      title="Delete this snapshot"
                      aria-label={`Delete snapshot ${formatSnapshotDate(s.date)} (${getSnapshotAnnotation(s, index)})`}
                      className={`p-1 rounded-md transition-colors ${activeId === s.id ? 'hover:bg-blue-500 text-blue-100' : 'hover:bg-red-50 text-gray-300 hover:text-red-500'}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BulkActionsForm({ disciplines, onClear, onImport, onExport }: { 
  disciplines: Discipline[], 
  onClear: () => void,
  onImport: (text: string, discId: string) => void,
  onExport: () => void
}) {
  const [importText, setImportText] = useState('');
  const [defaultDiscId, setDefaultDiscId] = useState(disciplines[0]?.id || '');
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  return (
    <div className="space-y-8">
      {/* Clear All */}
      <div className="p-4 bg-red-50 rounded-xl border border-red-100">
        <h4 className="text-xs font-bold text-red-600 uppercase mb-2">Danger Zone</h4>
        <p className="text-sm text-red-700 mb-4">This will permanently delete all questions and their scores in all snapshots.</p>
        
        {showConfirmClear ? (
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={() => { onClear(); setShowConfirmClear(false); }}
              className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700"
            >
              Yes, Delete Everything
            </button>
            <button 
              type="button"
              onClick={() => setShowConfirmClear(false)}
              className="flex-1 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button 
            type="button"
            onClick={() => setShowConfirmClear(true)}
            title="Clear all questions and move them to the recovery bin"
            aria-label="Clear All Questions"
            className="w-full py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50 flex items-center justify-center gap-2"
          >
            <Trash2 size={16} /> Clear All Questions
          </button>
        )}
      </div>

      {/* Bulk Import */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-gray-400 uppercase">Bulk Actions</h4>
          <button 
            type="button"
            onClick={onExport}
            title="Export all current questions to a text file"
            aria-label="Export Questions"
            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase flex items-center gap-1"
          >
            <Download size={12} /> Export Questions
          </button>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-3">
            Paste one question per line, or paste a previously exported question text file directly. <br/>
            Format: <code className="bg-gray-100 px-1 rounded">Question Text</code> <br/>
            Or: <code className="bg-gray-100 px-1 rounded">Discipline | Question Text</code> <br/>
            Or: <code className="bg-gray-100 px-1 rounded">Discipline | Principle | Question Text</code>
            <br/>
            Quoted legacy fields and empty-line paragraphs are also supported.
          </p>
          
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Default Discipline</label>
          <select 
            value={defaultDiscId}
            onChange={(e) => setDefaultDiscId(e.target.value)}
            className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm mb-3"
          >
            {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>

          <textarea 
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder={`Agility | Customer Satisfaction | Our highest priority is to satisfy the customer through early and continuous delivery of valuable software,,The needs of our customer is at the center of our work.\n"Overall Process" | "Transparent Planning" | "The plan should be ""experiencable"" on all levels of the project."\nArchitecture | System is modular | Is the system designed with modularity in mind?`}
            className="w-full p-3 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 h-40 resize-none text-sm font-mono"
          />
        </div>
        <button 
          type="button"
          onClick={() => { if(importText) onImport(importText, defaultDiscId); }}
          title="Import all questions from the text area above"
          aria-label="Import Questions"
          className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <Upload size={18} /> Import Questions
        </button>
      </div>
    </div>
  );
}
