import React, { useState, useMemo } from 'react';
import { Upload, Trash2, Eye, EyeOff, Phone, Mail, FileText, User, Moon, Sun, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import * as XLSX from 'xlsx';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function App() {
  // ---------------- State ----------------
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedSheet, setSelectedSheet] = useState(null);
  const [sheetData, setSheetData] = useState(null);
  const [showFiles, setShowFiles] = useState(true);
  const [showSheets, setShowSheets] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDashboard, setShowDashboard] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState({
    hovory: true,
    emaily: true,
    epodani: true,
    dpm: true,
  });
  const [timeChartType, setTimeChartType] = useState('line');
  const [selectedCumulativeMetrics, setSelectedCumulativeMetrics] = useState({
    hovory: true,
    emaily: true,
    epodani: true,
    dpm: true,
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [activePreset, setActivePreset] = useState(null);
  const [comparisonPeriod, setComparisonPeriod] = useState(null);

  // --------------- Helpers: dates ----------------
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const str = String(dateStr).trim();
    if (str.includes('X') || str.includes('x')) return null;

    const m1 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/); // M/D/YY
    if (m1) {
      return new Date(2000 + parseInt(m1[3]), parseInt(m1[1]) - 1, parseInt(m1[2]));
    }
    const m2 = str.match(/^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})$/); // D.M.YYYY or D/M/YYYY
    if (m2) {
      return new Date(parseInt(m2[3]), parseInt(m2[2]) - 1, parseInt(m2[1]));
    }
    // Excel serial
    if (!isNaN(dateStr) && Number(dateStr) > 40000) {
      return new Date(new Date(1899, 11, 30).getTime() + Number(dateStr) * 24 * 60 * 60 * 1000);
    }
    return null;
  };

  const formatDate = (date) => {
    if (!date) return '';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const formatExcelDate = (value) => {
    if (!value) return '-';
    const str = String(value).trim();
    if (str.includes('X') || str.includes('x')) return '-';

    const m1 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
    if (m1) {
      return `${m1[2].padStart(2, '0')}/${m1[1].padStart(2, '0')}/20${m1[3]}`;
    }
    const m2 = str.match(/^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})$/);
    if (m2) {
      return `${m2[1].padStart(2, '0')}/${m2[2].padStart(2, '0')}/${m2[3]}`;
    }
    if (!isNaN(value) && Number(value) > 40000) {
      const d = parseDate(value);
      return d ? formatDate(d) : str;
    }
    return str;
  };

  const fillYearInDates = (data) => {
    if (!data || data.length === 0) return data;
    let currentYear = null;
    const out = [];
    for (let i = 0; i < data.length; i++) {
      const row = { ...data[i] };
      const dateValue = row['B'];
      if (dateValue) {
        const dateStr = String(dateValue).trim();
        if (dateStr.includes('X') || dateStr.includes('x')) {
          out.push(row);
          continue;
        }
        const mShort = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
        if (mShort) {
          row['B'] = `${mShort[2].padStart(2, '0')}/${mShort[1].padStart(2, '0')}/20${mShort[3]}`;
          currentYear = '20' + mShort[3];
        } else {
          const mFull = dateStr.match(/^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})$/);
          if (mFull) {
            currentYear = mFull[3];
            row['B'] = `${mFull[1].padStart(2, '0')}/${mFull[2].padStart(2, '0')}/${mFull[3]}`;
          } else if (currentYear) {
            const mShortNoYear = dateStr.match(/^(\d{1,2})[\/\.](\d{1,2})$/);
            if (mShortNoYear) {
              row['B'] = `${mShortNoYear[1].padStart(2, '0')}/${mShortNoYear[2].padStart(2, '0')}/${currentYear}`;
            }
          } else if (!isNaN(dateValue) && Number(dateValue) > 40000) {
            const d = parseDate(dateValue);
            if (d) {
              row['B'] = formatDate(d);
              currentYear = String(d.getFullYear());
            }
          }
        }
      }
      out.push(row);
    }
    return out;
  };

  // --------------- File handling ----------------
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const workbook = XLSX.read(event.target.result, { type: 'array' });
        const newFile = {
          id: Date.now(),
          name: file.name,
          uploadDate: new Date().toLocaleDateString('cs-CZ'),
          sheetNames: workbook.SheetNames,
          workbook,
        };
        setFiles((prev) => [...prev, newFile]);
        if (!selectedFile) {
          setSelectedFile(newFile);
          loadSheet(workbook, workbook.SheetNames[0]);
        }
      } catch (err) {
        alert('Chyba při načítání souboru: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const loadSheet = (workbook, sheetName) => {
    const ws = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 'A', defval: '', raw: false });
    const cleaned = data.filter((row, idx) => {
      if (idx < 2) return false; // přeskočit hlavičky
      const dateStr = String(row['B'] ?? '').trim();
      return !dateStr.includes('X') && !dateStr.includes('x');
    });
    const processed = fillYearInDates(cleaned);
    setSheetData(processed);
    setSelectedSheet(sheetName);
    setDateFrom('');
    setDateTo('');
  };

  const handleSelectFile = (file) => {
    setSelectedFile(file);
    setSelectedSheet(null);
    setSheetData(null);
  };

  const handleDeleteFile = (id) => {
    const newFiles = files.filter((f) => f.id !== id);
    setFiles(newFiles);
    if (selectedFile?.id === id) {
      setSelectedFile(newFiles[0] ?? null);
      setSheetData(null);
    }
  };

  const toggleMetric = (metric) => setSelectedMetrics((p) => ({ ...p, [metric]: !p[metric] }));
  const toggleCumulativeMetric = (metric) => setSelectedCumulativeMetrics((p) => ({ ...p, [metric]: !p[metric] }));

  // --------------- Presets ----------------
  const setPresetRange = (preset) => {
    setActivePreset(preset);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let from, to, compFrom, compTo;

    switch (preset) {
      case 'today':
        from = new Date(today);
        to = new Date(today);
        compFrom = new Date(today);
        compFrom.setDate(today.getDate() - 1);
        compTo = new Date(compFrom);
        break;
      case 'yesterday':
        from = new Date(today);
        from.setDate(today.getDate() - 1);
        to = new Date(from);
        break;
      case 'thisWeek': {
        const day = today.getDay();
        const euro = day === 0 ? 6 : day - 1;
        from = new Date(today);
        from.setDate(today.getDate() - euro);
        to = new Date(today);
        compFrom = new Date(from);
        compFrom.setDate(from.getDate() - 7);
        compTo = new Date(compFrom);
        compTo.setDate(compFrom.getDate() + 4);
        break;
      }
      case 'lastWeek': {
        const day = today.getDay();
        const euro = day === 0 ? 6 : day - 1;
        from = new Date(today);
        from.setDate(today.getDate() - euro - 7);
        to = new Date(from);
        to.setDate(from.getDate() + 4);
        break;
      }
      case 'thisMonth':
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        to = new Date(today);
        compFrom = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        compTo = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'lastMonth':
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        to = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 'last3Months':
        from = new Date(today.getFullYear(), today.getMonth() - 2, 1);
        to = new Date(today);
        break;
      case 'thisYear':
        from = new Date(today.getFullYear(), 0, 1);
        to = new Date(today);
        break;
      default:
        return;
    }

    const fmt = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    setDateFrom(fmt(from));
    setDateTo(fmt(to));
    if (compFrom && compTo) {
      setComparisonPeriod({ from: fmt(compFrom), to: fmt(compTo) });
    } else {
      setComparisonPeriod(null);
    }
  };

  // --------------- Table sorting ----------------
  const sortTable = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getComparison = (current, previous) => {
    if (previous === 0 && current === 0) return null;
    if (previous === 0) {
      return { change: null, isPositive: current > 0, isNegative: false, showArrowOnly: true };
    }
    const change = ((current - previous) / previous) * 100;
    return { change: change.toFixed(1), isPositive: change > 0, isNegative: change < 0, showArrowOnly: false };
  };

  // --------------- useMemo calculations ----------------
  const dateRange = useMemo(() => {
    if (!sheetData || sheetData.length === 0) return { min: null, max: null };
    let minDate = null, maxDate = null;
    for (let i = 0; i < sheetData.length; i++) {
      const d = parseDate(sheetData[i]['B']);
      if (d) {
        if (!minDate || d < minDate) minDate = d;
        if (!maxDate || d > maxDate) maxDate = d;
      }
    }
    return { min: minDate, max: maxDate };
  }, [sheetData]);

  const filteredData = useMemo(() => {
    if (!sheetData || sheetData.length === 0) return [];
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;
    return sheetData.filter((row) => {
      const rowDate = parseDate(row['B']);
      if (!rowDate) return false;
      const rd = new Date(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate());
      const fd = fromDate ? new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()) : null;
      const td = toDate ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate()) : null;
      if (fd && rd < fd) return false;
      if (td && rd > td) return false;
      return true;
    });
  }, [sheetData, dateFrom, dateTo]);

  const totals = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return { hovory: 0, emaily: 0, epodani: 0, dpm: 0 };
    return filteredData.reduce((acc, row) => ({
      hovory: acc.hovory + (parseInt(row['C']) || 0),
      emaily: acc.emaily + (parseInt(row['D']) || 0),
      epodani: acc.epodani + (parseInt(row['E']) || 0),
      dpm: acc.dpm + (parseInt(row['F']) || 0),
    }), { hovory: 0, emaily: 0, epodani: 0, dpm: 0 });
  }, [filteredData]);

  const comparisonTotals = useMemo(() => {
    if (!comparisonPeriod || !sheetData || sheetData.length === 0) return null;
    const compFromDate = new Date(comparisonPeriod.from);
    const compToDate = new Date(comparisonPeriod.to);
    const compData = sheetData.filter((row) => {
      const rowDate = parseDate(row['B']);
      if (!rowDate) return false;
      const rd = new Date(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate());
      const fd = new Date(compFromDate.getFullYear(), compFromDate.getMonth(), compFromDate.getDate());
      const td = new Date(compToDate.getFullYear(), compToDate.getMonth(), compToDate.getDate());
      return rd >= fd && rd <= td;
    });
    return compData.reduce((acc, row) => ({
      hovory: acc.hovory + (parseInt(row['C']) || 0),
      emaily: acc.emaily + (parseInt(row['D']) || 0),
      epodani: acc.epodani + (parseInt(row['E']) || 0),
      dpm: acc.dpm + (parseInt(row['F']) || 0),
    }), { hovory: 0, emaily: 0, epodani: 0, dpm: 0 });
  }, [comparisonPeriod, sheetData]);

  const averages = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return { hovory: 0, emaily: 0, epodani: 0, dpm: 0 };
    const days = filteredData.length;
    return {
      hovory: (totals.hovory / days).toFixed(1),
      emaily: (totals.emaily / days).toFixed(1),
      epodani: (totals.epodani / days).toFixed(1),
      dpm: (totals.dpm / days).toFixed(1),
    };
  }, [filteredData, totals]);

  const extremeDays = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return { most: null };
    let most = { datum: '', total: -1 };
    filteredData.forEach((row) => {
      const total = (parseInt(row['C']) || 0) + (parseInt(row['D']) || 0) + (parseInt(row['E']) || 0) + (parseInt(row['F']) || 0);
      const datum = formatExcelDate(row['B']);
      if (total > most.total) most = { datum, total };
    });
    return { most };
  }, [filteredData]);

  const lineChartData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    return filteredData.map((row) => {
      const datum = formatExcelDate(row['B']);
      return {
        datum,
        Hovory: parseInt(row['C']) || 0,
        'E-maily': parseInt(row['D']) || 0,
        'E-podání': parseInt(row['E']) || 0,
        DPM: parseInt(row['F']) || 0,
        isExtreme: datum === extremeDays.most?.datum,
      };
    });
  }, [filteredData, extremeDays]);

  const pieChartData = useMemo(() => ([
    { name: 'Hovory', value: totals.hovory, color: '#3b82f6' },
    { name: 'E-maily', value: totals.emaily, color: '#10b981' },
    { name: 'E-podání', value: totals.epodani, color: '#f59e0b' },
    { name: 'DPM', value: totals.dpm, color: '#ef4444' },
  ]), [totals]);

  const cumulativeData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    const cum = { hovory: 0, emaily: 0, epodani: 0, dpm: 0 };
    return filteredData.map((row) => {
      cum.hovory += (parseInt(row['C']) || 0);
      cum.emaily += (parseInt(row['D']) || 0);
      cum.epodani += (parseInt(row['E']) || 0);
      cum.dpm += (parseInt(row['F']) || 0);
      return { datum: formatExcelDate(row['B']), Hovory: cum.hovory, 'E-maily': cum.emaily, 'E-podání': cum.epodani, DPM: cum.dpm };
    });
  }, [filteredData]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    const copy = [...filteredData];
    return copy.sort((a, b) => {
      let aVal, bVal;
      if (sortConfig.key === 'datum') {
        aVal = parseDate(a['B'])?.getTime() || 0;
        bVal = parseDate(b['B'])?.getTime() || 0;
      } else {
        const colMap = { hovory: 'C', emaily: 'D', epodani: 'E', dpm: 'F' };
        aVal = parseInt(a[colMap[sortConfig.key]]) || 0;
        bVal = parseInt(b[colMap[sortConfig.key]]) || 0;
      }
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  // --------------- Charts helpers ----------------
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    if (!payload || !extremeDays.most) return null;
    if (payload.isExtreme) {
      return <circle cx={cx} cy={cy} r={6} fill="#10b981" stroke="#fff" strokeWidth={2} />;
    }
    return null;
  };

  const tooltipStyle = darkMode
    ? { backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '12px' }
    : { backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '12px' };

  // ---------------- Render ----------------
  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      <div className="max-w-[1800px] mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className={`text-5xl font-black ${darkMode ? 'text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'} mb-3`}>
              Přehled komunikace IK
            </h1>
            <p className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} text-lg max-w-3xl leading-relaxed`}>
              Nahrajte Excel soubor a vyberte časové období pro zobrazení statistik a grafů
            </p>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 ${darkMode ? 'bg-gradient-to-br from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-yellow-400' : 'bg-white hover:shadow-2xl text-gray-800'} shadow-xl`}
          >
            {darkMode ? <Sun size={24} /> : <Moon size={24} />}
          </button>
        </div>

        {/* File Upload */}
        <div className={`${darkMode ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' : 'bg-white/70 backdrop-blur-xl border border-white'} rounded-2xl shadow-2xl p-6 mb-6 transition-all duration-300 hover:shadow-3xl`}>
          <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed ${darkMode ? 'border-indigo-400/50 hover:border-indigo-400 hover:bg-gray-700/50' : 'border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50/50'} rounded-xl cursor-pointer transition-all duration-300`}>
            <div className="flex flex-col items-center justify-center">
              <Upload className={`w-8 h-8 ${darkMode ? 'text-indigo-400' : 'text-indigo-600'} mb-1 transition-transform duration-300 hover:scale-110`} />
              <p className={`text-sm font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Nahrát Excel soubor</p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>.xlsx, .xls</p>
            </div>
            <input type="file" className="hidden" accept=".xlsx,.xls" onChange={handleFileUpload} />
          </label>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Files & Sheets */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 lg:self-start">
            {/* Files List */}
            <div className={`${darkMode ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' : 'bg-white/70 backdrop-blur-xl border border-white'} rounded-2xl shadow-2xl p-6 transition-all duration-300`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-800'}`}>Nahrané soubory ({files.length})</h2>
                <button onClick={() => setShowFiles(!showFiles)} className={`p-2 rounded-xl transition-all duration-300 transform hover:scale-110 ${showFiles ? 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg' : 'bg-gray-300 hover:bg-gray-400 text-white'}`}>
                  {showFiles ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>

              {showFiles && (
                <>
                  {files.length === 0 ? (
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-center py-8`}>Zatím žádné soubory</p>
                  ) : (
                    <div className="space-y-3">
                      {files.map((file) => (
                        <div
                          key={file.id}
                          onClick={() => handleSelectFile(file)}
                          className={`p-4 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${
                            selectedFile?.id === file.id
                              ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-2xl scale-[1.02]'
                              : darkMode
                              ? 'bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 border border-gray-600'
                              : 'bg-white/50 hover:bg-white border border-gray-200 text-gray-700 shadow-lg hover:shadow-xl'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-semibold text-sm break-words">{file.name}</p>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }}
                              className={`ml-2 p-1 rounded hover:bg-red-500 hover:text-white transition ${selectedFile?.id === file.id ? 'text-white' : 'text-gray-400'}`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          <p className={`text-xs ${selectedFile?.id === file.id ? 'text-indigo-100' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{file.uploadDate}</p>
                          <p className={`text-xs mt-2 ${selectedFile?.id === file.id ? 'text-indigo-100' : darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Listy: {file.sheetNames.join(', ')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Sheets List */}
            {selectedFile && (
              <div className={`${darkMode ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' : 'bg-white/70 backdrop-blur-xl border border-white'} rounded-2xl shadow-2xl p-6 transition-all duration-300`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-black ${darkMode ? 'text-white' : 'text-gray-800'}`}>Listy</h3>
                  <button onClick={() => setShowSheets(!showSheets)} className={`p-2 rounded-xl transition-all duration-300 transform hover:scale-110 ${showSheets ? 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg' : 'bg-gray-300 hover:bg-gray-400 text-white'}`}>
                    {showSheets ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                {showSheets && (
                  <div className="space-y-2">
                    {selectedFile.sheetNames.map((sheet) => (
                      <button
                        key={sheet}
                        onClick={() => loadSheet(selectedFile.workbook, sheet)}
                        className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 transform hover:scale-[1.02] font-semibold ${
                          selectedSheet === sheet
                            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                            : darkMode
                            ? 'bg-gray-700/50 text-gray-200 hover:bg-gray-600/50 border border-gray-600'
                            : 'bg-white/50 text-gray-700 hover:bg-white shadow hover:shadow-lg border border-gray-200'
                        }`}
                      >
                        {sheet}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {sheetData ? (
              <div className="space-y-6">
                {/* Date Filter */}
                <div className={`${darkMode ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' : 'bg-white/70 backdrop-blur-xl border border-white'} rounded-2xl shadow-2xl p-6 transition-all duration-300`}>
                  <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'} mb-6`}>Časové období</h3>

                  {dateRange.min && dateRange.max && (
                    <div className="space-y-3">
                      <div className={`p-4 ${darkMode ? 'bg-gradient-to-r from-blue-900/50 to-blue-800/50 border border-blue-700/50' : 'bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200'} rounded-xl backdrop-blur-sm`}>
                        <p className={`text-sm font-bold ${darkMode ? 'text-blue-300' : 'text-blue-700'} mb-1`}>Dostupný rozsah:</p>
                        <p className={`font-semibold ${darkMode ? 'text-blue-100' : 'text-blue-900'}`}>{formatDate(dateRange.min)} - {formatDate(dateRange.max)}</p>
                      </div>

                      {(dateFrom && dateTo) && (
                        <div className={`p-4 ${darkMode ? 'bg-gradient-to-r from-green-900/50 to-emerald-800/50 border border-green-700/50' : 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200'} rounded-xl backdrop-blur-sm`}>
                          <p className={`text-sm font-bold ${darkMode ? 'text-green-300' : 'text-green-700'} mb-1`}>Vybraný rozsah:</p>
                          <p className={`font-semibold ${darkMode ? 'text-green-100' : 'text-green-900'}`}>
                            {dateFrom ? formatDate(new Date(dateFrom)) : formatDate(dateRange.min)} - {dateTo ? formatDate(new Date(dateTo)) : formatDate(dateRange.max)}
                          </p>
                          <p className={`text-xs mt-2 ${darkMode ? 'text-green-200' : 'text-green-800'} font-semibold`}>
                            📊 Celkem {filteredData.length} {filteredData.length === 1 ? 'den' : filteredData.length < 5 ? 'dny' : 'dní'}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className={`block text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Od data</label>
                      <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} max="9999-12-31" className={`w-full px-3 py-2 border ${darkMode ? 'border-gray-600 bg-gray-700/50 text-white' : 'border-gray-300 bg-white/50 text-gray-900'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`} />
                    </div>
                    <div>
                      <label className={`block text-sm font-bold ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Do data</label>
                      <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} max="9999-12-31" className={`w-full px-3 py-2 border ${darkMode ? 'border-gray-600 bg-gray-700/50 text-white' : 'border-gray-300 bg-white/50 text-gray-900'} rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-4">
                    {[
                      { id: 'today', label: 'Dnes' },
                      { id: 'yesterday', label: 'Včera' },
                      { id: 'thisWeek', label: 'Tento týden' },
                      { id: 'lastWeek', label: 'Min. týden' },
                      { id: 'thisMonth', label: 'Tento měsíc' },
                      { id: 'lastMonth', label: 'Min. měsíc' },
                      { id: 'last3Months', label: 'Poslední 3 měsíce' },
                      { id: 'thisYear', label: 'Aktuální rok' },
                    ].map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => setPresetRange(preset.id)}
                        className={`px-3 py-2 rounded-lg text-sm font-bold transition-all duration-300 transform hover:scale-105 ${
                          activePreset === preset.id
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg ring-2 ring-indigo-400'
                            : darkMode
                            ? 'bg-indigo-900/50 hover:bg-indigo-800/50 text-indigo-200 border border-indigo-700/50'
                            : 'bg-gradient-to-r from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {(dateFrom && dateTo) && (
                    <button onClick={() => { setDateFrom(''); setDateTo(''); setActivePreset(null); setComparisonPeriod(null); }} className={`mt-4 text-sm ${darkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'} font-bold transition-all duration-300`}>
                      ↻ Resetovat filtr
                    </button>
                  )}
                </div>

                {/* Dashboard */}
                <div className={`${darkMode ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' : 'bg-white/70 backdrop-blur-xl border border-white'} rounded-2xl shadow-2xl p-6 transition-all duration-300`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-3xl font-black ${darkMode ? 'text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'}`}>Přehled komunikace</h3>
                    <button onClick={() => setShowDashboard(!showDashboard)} className={`p-2 rounded-xl transition-all duration-300 transform hover:scale-110 ${showDashboard ? 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg' : darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-white'}`}>
                      {showDashboard ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>

                  {showDashboard && (
                    <>
                      {/* Metrics Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {[
                          { icon: Phone, label: 'Hovory', value: totals.hovory, avg: averages.hovory, color: 'blue', key: 'hovory' },
                          { icon: Mail, label: 'E-maily', value: totals.emaily, avg: averages.emaily, color: 'green', key: 'emaily' },
                          { icon: FileText, label: 'E-podání', value: totals.epodani, avg: averages.epodani, color: 'yellow', key: 'epodani' },
                          { icon: User, label: 'DPM', value: totals.dpm, avg: averages.dpm, color: 'red', showMF: true, key: 'dpm' },
                        ].map((item) => {
                          const Icon = item.icon;
                          const comparison = comparisonTotals ? getComparison(item.value, comparisonTotals[item.key]) : null;
                          return (
                            <div key={item.label} className={`${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-white/80 border-gray-200'} backdrop-blur-sm rounded-2xl p-5 border shadow-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl`}>
                              <div className="flex items-center gap-3 mb-3">
                                {item.showMF ? (
                                  <div className="relative">
                                    <div className={`${darkMode ? 'bg-white/10' : 'bg-gray-100'} p-2 rounded-xl`}>
                                      <Icon className={darkMode ? 'text-red-300' : 'text-red-600'} size={24} />
                                    </div>
                                    <span className="absolute -bottom-1 -right-1 text-[8px] font-bold text-red-600 bg-white px-1 rounded">MF</span>
                                  </div>
                                ) : (
                                  <div className={`${darkMode ? 'bg-white/10' : 'bg-gray-100'} p-2 rounded-xl`}>
                                    <Icon className={darkMode ? `text-${item.color}-300` : `text-${item.color}-600`} size={24} />
                                  </div>
                                )}
                                <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-700'}`}>{item.label}</span>
                              </div>
                              <p className={`text-4xl font-black ${darkMode ? 'text-white' : `text-${item.color}-600`} mb-2`}>{item.value.toLocaleString()}</p>
                              <p className={`text-xs ${darkMode ? 'text-gray-300' : 'text-gray-600'} font-semibold mb-2`}>Ø {item.avg}/den</p>
                              {comparison && (
                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-300/30">
                                  {comparison.isPositive && (
                                    <>
                                      <TrendingUp className="text-green-500" size={18} />
                                      <span className={`text-sm font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                        {comparison.showArrowOnly ? 'V předchozím období 0 záznamů' : `+${comparison.change}%`}
                                      </span>
                                    </>
                                  )}
                                  {comparison.isNegative && (
                                    <>
                                      <TrendingDown className="text-red-500" size={18} />
                                      <span className={`text-sm font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                                        {comparison.change}%
                                      </span>
                                    </>
                                  )}
                                  {!comparison.isPositive && !comparison.isNegative && (
                                    <>
                                      <Minus className={darkMode ? 'text-gray-400' : 'text-gray-500'} size={18} />
                                      <span className={`text-sm font-bold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>0%</span>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Time Chart */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-800'}`}>Vývoj v čase</h4>
                          <div className="flex gap-2 items-center flex-wrap">
                            <div className="flex gap-2 mr-4">
                              <button onClick={() => setTimeChartType('line')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 ${timeChartType === 'line' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' : darkMode ? 'bg-gray-700/50 text-gray-400 border border-gray-600' : 'bg-gray-200 text-gray-600'}`}>Spojnicový</button>
                              <button onClick={() => setTimeChartType('bar')} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 ${timeChartType === 'bar' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg' : darkMode ? 'bg-gray-700/50 text-gray-400 border border-gray-600' : 'bg-gray-200 text-gray-600'}`}>Sloupcový</button>
                            </div>
                            {['hovory', 'emaily', 'epodani', 'dpm'].map((metric) => (
                              <button
                                key={metric}
                                onClick={() => toggleMetric(metric)}
                                className={`px-3 py-2 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 ${
                                  selectedMetrics[metric]
                                    ? metric === 'hovory' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                                    : metric === 'emaily' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                                    : metric === 'epodani' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                                    : 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg'
                                    : darkMode ? 'bg-gray-700/50 text-gray-400 border border-gray-600' : 'bg-gray-200 text-gray-600'
                                }`}
                              >
                                {metric === 'hovory' ? 'Hovory' : metric === 'emaily' ? 'E-maily' : metric === 'epodani' ? 'E-podání' : 'DPM'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className={`${darkMode ? 'bg-gray-900/30' : 'bg-white/50'} p-4 rounded-xl backdrop-blur-sm`}>
                          <ResponsiveContainer width="100%" height={350}>
                            {timeChartType === 'bar' ? (
                              <BarChart data={lineChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                                <XAxis dataKey="datum" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#374151' }} />
                                <YAxis tick={{ fill: darkMode ? '#9ca3af' : '#374151' }} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend />
                                {selectedMetrics.hovory && <Bar dataKey="Hovory" fill="#3b82f6" />}
                                {selectedMetrics.emaily && <Bar dataKey="E-maily" fill="#10b981" />}
                                {selectedMetrics.epodani && <Bar dataKey="E-podání" fill="#f59e0b" />}
                                {selectedMetrics.dpm && <Bar dataKey="DPM" fill="#ef4444" />}
                              </BarChart>
                            ) : (
                              <LineChart data={lineChartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                                <XAxis dataKey="datum" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#374151' }} />
                                <YAxis tick={{ fill: darkMode ? '#9ca3af' : '#374151' }} />
                                <Tooltip contentStyle={tooltipStyle} />
                                <Legend />
                                {selectedMetrics.hovory && <Line type="monotone" dataKey="Hovory" stroke="#3b82f6" strokeWidth={2} dot={<CustomDot />} />}
                                {selectedMetrics.emaily && <Line type="monotone" dataKey="E-maily" stroke="#10b981" strokeWidth={2} dot={<CustomDot />} />}
                                {selectedMetrics.epodani && <Line type="monotone" dataKey="E-podání" stroke="#f59e0b" strokeWidth={2} dot={<CustomDot />} />}
                                {selectedMetrics.dpm && <Line type="monotone" dataKey="DPM" stroke="#ef4444" strokeWidth={2} dot={<CustomDot />} />}
                              </LineChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Cumulative Chart */}
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-800'}`}>Vývoj v čase - Kumulativní</h4>
                          <div className="flex gap-2 flex-wrap">
                            {['hovory', 'emaily', 'epodani', 'dpm'].map((metric) => (
                              <button
                                key={metric}
                                onClick={() => toggleCumulativeMetric(metric)}
                                className={`px-3 py-2 rounded-xl text-sm font-bold transition-all duration-300 transform hover:scale-105 ${
                                  selectedCumulativeMetrics[metric]
                                    ? metric === 'hovory' ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                                    : metric === 'emaily' ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                                    : metric === 'epodani' ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                                    : 'bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg'
                                    : darkMode ? 'bg-gray-700/50 text-gray-400 border border-gray-600' : 'bg-gray-200 text-gray-600'
                                }`}
                              >
                                {metric === 'hovory' ? 'Hovory' : metric === 'emaily' ? 'E-maily' : metric === 'epodani' ? 'E-podání' : 'DPM'}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className={`${darkMode ? 'bg-gray-900/30' : 'bg-white/50'} p-4 rounded-xl backdrop-blur-sm`}>
                          <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={cumulativeData}>
                              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                              <XAxis dataKey="datum" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 10, fill: darkMode ? '#9ca3af' : '#374151' }} />
                              <YAxis tick={{ fill: darkMode ? '#9ca3af' : '#374151' }} />
                              <Tooltip contentStyle={tooltipStyle} />
                              <Legend />
                              {selectedCumulativeMetrics.hovory && <Line type="monotone" dataKey="Hovory" stroke="#3b82f6" strokeWidth={1.5} dot={false} />}
                              {selectedCumulativeMetrics.emaily && <Line type="monotone" dataKey="E-maily" stroke="#10b981" strokeWidth={1.5} dot={false} />}
                              {selectedCumulativeMetrics.epodani && <Line type="monotone" dataKey="E-podání" stroke="#f59e0b" strokeWidth={1.5} dot={false} />}
                              {selectedCumulativeMetrics.dpm && <Line type="monotone" dataKey="DPM" stroke="#ef4444" strokeWidth={1.5} dot={false} />}
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Pie Chart */}
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-800'}`}>Podíl jednotlivých segmentů</h4>
                        </div>
                        <div className={`${darkMode ? 'bg-gray-900/30' : 'bg-white/50'} p-4 rounded-xl backdrop-blur-sm`}>
                          <div className="flex items-center gap-8">
                            <div className="flex-1">
                              <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                  <Pie data={pieChartData} cx="50%" cy="50%" labelLine={false} label={false} outerRadius={100} innerRadius={60} dataKey="value">
                                    {pieChartData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(value) => value.toLocaleString()} contentStyle={tooltipStyle} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                            <div className="flex flex-col gap-3">
                              {pieChartData.map((entry, index) => {
                                const total = pieChartData.reduce((sum, item) => sum + item.value, 0);
                                const percent = total > 0 ? ((entry.value / total) * 100).toFixed(1) : 0;
                                return (
                                  <div key={index} className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded" style={{ backgroundColor: entry.color }}></div>
                                    <div>
                                      <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{entry.name}</p>
                                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {entry.value.toLocaleString()} ({percent}%)
                                      </p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Data Table */}
                <div className={`${darkMode ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' : 'bg-white/70 backdrop-blur-xl border border-white'} rounded-2xl shadow-2xl p-6 transition-all duration-300`}>
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-3xl font-black ${darkMode ? 'text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent'}`}>Přehled hovorů a podání - denně</h2>
                    <button onClick={() => setShowTable(!showTable)} className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 transform hover:scale-105 font-bold ${showTable ? 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg' : darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-300 hover:bg-gray-400 text-white'}`}>
                      {showTable ? <Eye size={18} /> : <EyeOff size={18} />}
                      {showTable ? 'Skrýt' : 'Zobrazit'}
                    </button>
                  </div>

                  {showTable && (
                    <>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className={`${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-gray-300'} border-b-2`}>
                              {[
                                { key: 'datum', label: 'Datum' },
                                { key: 'hovory', label: 'Hovory' },
                                { key: 'emaily', label: 'E-maily' },
                                { key: 'epodani', label: 'E-podání (EPD)' },
                                { key: 'dpm', label: 'DPM' },
                              ].map((col) => (
                                <th
                                  key={col.key}
                                  onClick={() => sortTable(col.key)}
                                  className={`px-4 py-3 text-left font-black ${darkMode ? 'text-gray-200 hover:bg-gray-600' : 'text-gray-700 hover:bg-indigo-100'} cursor-pointer transition-all duration-300`}
                                >
                                  {col.label} {sortConfig.key === col.key && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sortedData.map((row, rowIdx) => (
                              <tr key={rowIdx} className={`${darkMode ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-indigo-50/30'} border-b transition-all duration-300`}>
                                <td className={`px-4 py-3 font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{formatExcelDate(row['B'])}</td>
                                <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{row['C'] || '-'}</td>
                                <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{row['D'] || '-'}</td>
                                <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{row['E'] || '-'}</td>
                                <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{row['F'] || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {sortedData.length === 0 && (
                        <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'} py-8 font-semibold`}>Žádná data neodpovídají vybranému časovému rozsahu</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className={`${darkMode ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' : 'bg-white/70 backdrop-blur-xl border border-white'} rounded-2xl shadow-2xl p-12 text-center`}>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-500'} text-xl font-semibold`}>Vyberte soubor a list k zobrazení dat</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
