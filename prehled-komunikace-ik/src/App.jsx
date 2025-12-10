import React, { useState, useMemo, useRef } from 'react';
import { Upload, Download, Trash2, Eye, EyeOff, Phone, Mail, FileText, User, Moon, Sun, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import * as XLSX from 'xlsx';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function App() {
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
    dpm: true
  });
  const [timeChartType, setTimeChartType] = useState('line');
  const [selectedCumulativeMetrics, setSelectedCumulativeMetrics] = useState({
    hovory: true,
    emaily: true,
    epodani: true,
    dpm: true
  });
  const [chartType, setChartType] = useState('donut');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [activePreset, setActivePreset] = useState(null);
  const [comparisonPeriod, setComparisonPeriod] = useState(null);

  const [showLayoutEditor, setShowLayoutEditor] = useState(false);
  const [dashboardLayout, setDashboardLayout] = useState([
    { id: 'metrics', visible: true, order: 1 },
    { id: 'extremeDays', visible: true, order: 2 },
    { id: 'timeChart', visible: true, order: 3 },
    { id: 'cumulativeChart', visible: true, order: 4 },
    { id: 'pieChart', visible: true, order: 5 }
  ]);
  const [draggedItem, setDraggedItem] = useState(null);
  const dashboardRef = useRef(null);

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const str = String(dateStr).trim();
    if (str.includes('X') || str.includes('x')) return null;
    
    const match1 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
    if (match1) {
      return new Date(2000 + parseInt(match1[3]), parseInt(match1[1]) - 1, parseInt(match1[2]));
    }
    
    const match2 = str.match(/^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})$/);
    if (match2) {
      return new Date(parseInt(match2[3]), parseInt(match2[2]) - 1, parseInt(match2[1]));
    }
    
    if (!isNaN(dateStr) && dateStr > 40000) {
      return new Date(new Date(1899, 11, 30).getTime() + dateStr * 24 * 60 * 60 * 1000);
    }
    return null;
  };

  const formatDate = (date) => {
    if (!date) return '';
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  const formatExcelDate = (value) => {
    if (!value) return '-';
    const str = String(value).trim();
    if (str.includes('X') || str.includes('x')) return '-';
    
    const match1 = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
    if (match1) {
      return `${match1[2].padStart(2, '0')}/${match1[1].padStart(2, '0')}/20${match1[3]}`;
    }
    
    const match2 = str.match(/^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})$/);
    if (match2) {
      return `${match2[1].padStart(2, '0')}/${match2[2].padStart(2, '0')}/${match2[3]}`;
    }
    
    if (!isNaN(value) && value > 40000) {
      const date = parseDate(value);
      return date ? formatDate(date) : str;
    }
    return str;
  };

  const fillYearInDates = (data) => {
    if (!data || data.length === 0) return data;
    let currentYear = null;
    const processedData = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = { ...data[i] };
      const dateValue = row['B'];
      
      if (dateValue) {
        const dateStr = String(dateValue).trim();
        if (dateStr.includes('X') || dateStr.includes('x')) continue;
        
        const formatMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
        if (formatMatch) {
          row['B'] = `${formatMatch[2].padStart(2, '0')}/${formatMatch[1].padStart(2, '0')}/20${formatMatch[3]}`;
          currentYear = '20' + formatMatch[3];
        } else {
          const fullDateMatch = dateStr.match(/^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})$/);
          if (fullDateMatch) {
            currentYear = fullDateMatch[3];
            row['B'] = `${fullDateMatch[1].padStart(2, '0')}/${fullDateMatch[2].padStart(2, '0')}/${fullDateMatch[3]}`;
          } else if (currentYear) {
            const shortDateMatch = dateStr.match(/^(\d{1,2})[\/\.](\d{1,2})$/);
            if (shortDateMatch) {
              row['B'] = `${shortDateMatch[1].padStart(2, '0')}/${shortDateMatch[2].padStart(2, '0')}/${currentYear}`;
            }
          } else if (!isNaN(dateValue) && dateValue > 40000) {
            const date = parseDate(dateValue);
            if (date) {
              row['B'] = formatDate(date);
              currentYear = date.getFullYear().toString();
            }
          }
        }
      }
      processedData.push(row);
    }
    return processedData;
  };

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
          workbook: workbook
        };
        setFiles([...files, newFile]);
        if (!selectedFile) {
          setSelectedFile(newFile);
          loadSheet(workbook, workbook.SheetNames[0]);
        }
      } catch (error) {
        alert('Chyba při načítání souboru: ' + error.message);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const loadSheet = (workbook, sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 'A', defval: '', raw: false });
    const cleanedData = data.filter((row, index) => {
      if (index < 2) return false;
      const dateStr = String(row['B'] || '').trim();
      return !dateStr.includes('X') && !dateStr.includes('x');
    });
    const processedData = fillYearInDates(cleanedData);
    setSheetData(processedData);
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
    const newFiles = files.filter(f => f.id !== id);
    setFiles(newFiles);
    if (selectedFile?.id === id) {
      setSelectedFile(newFiles[0] || null);
      setSheetData(null);
    }
  };

  const toggleMetric = (metric) => {
    setSelectedMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  };

  const toggleCumulativeMetric = (metric) => {
    setSelectedCumulativeMetrics(prev => ({ ...prev, [metric]: !prev[metric] }));
  };

  const setPresetRange = (preset) => {
    setActivePreset(preset);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const today = new Date(year, month, date);
    let from, to, compFrom, compTo;

    switch (preset) {
      case 'today':
        from = new Date(year, month, date);
        to = new Date(year, month, date);
        
        compFrom = new Date(today);
        compFrom.setDate(today.getDate() - 1);
        compTo = new Date(compFrom);
        break;
        
      case 'yesterday':
        from = to = new Date(today);
        from.setDate(today.getDate() - 1);
        to = new Date(from);
        break;
        
      case 'thisWeek':
        const todayDayOfWeek = today.getDay();
        const europeanDay = todayDayOfWeek === 0 ? 6 : todayDayOfWeek - 1;
        from = new Date(today);
        from.setDate(today.getDate() - europeanDay);
        to = new Date(today);
        
        compFrom = new Date(from);
        compFrom.setDate(from.getDate() - 7);
        compTo = new Date(compFrom);
        compTo.setDate(compFrom.getDate() + 4);
        break;
        
      case 'lastWeek':
        const lastWeekDay = today.getDay();
        const europeanLastWeekDay = lastWeekDay === 0 ? 6 : lastWeekDay - 1;
        from = new Date(today);
        from.setDate(today.getDate() - europeanLastWeekDay - 7);
        to = new Date(from);
        to.setDate(from.getDate() + 4);
        break;
        
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

    const formatForInput = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setDateFrom(formatForInput(from));
    setDateTo(formatForInput(to));
    
    if (compFrom && compTo) {
      setComparisonPeriod({
        from: formatForInput(compFrom),
        to: formatForInput(compTo)
      });
    } else {
      setComparisonPeriod(null);
    }
  };

  const sortTable = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const dateRange = useMemo(() => {
    if (!sheetData || sheetData.length === 0) return { min: null, max: null };
    let minDate = null, maxDate = null;
    for (let i = 0; i < sheetData.length; i++) {
      const date = parseDate(sheetData[i]['B']);
      if (date) {
        if (!minDate || date < minDate) minDate = date;
        if (!maxDate || date > maxDate) maxDate = date;
      }
    }
    return { min: minDate, max: maxDate };
  }, [sheetData]);

  const filteredData = useMemo(() => {
    if (!sheetData || sheetData.length === 0) return [];
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo ? new Date(dateTo) : null;
    
    return sheetData.filter(row => {
      const rowDate = parseDate(row['B']);
      if (!rowDate) return false;
      const rowDateOnly = new Date(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate());
      const fromDateOnly = fromDate ? new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate()) : null;
      const toDateOnly = toDate ? new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate()) : null;
      if (fromDateOnly && rowDateOnly < fromDateOnly) return false;
      if (toDateOnly && rowDateOnly > toDateOnly) return false;
      return true;
    });
  }, [sheetData, dateFrom, dateTo]);

  const totals = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return { hovory: 0, emaily: 0, epodani: 0, dpm: 0 };
    }
    return filteredData.reduce((acc, row) => ({
      hovory: acc.hovory + (parseInt(row['C']) || 0),
      emaily: acc.emaily + (parseInt(row['D']) || 0),
      epodani: acc.epodani + (parseInt(row['E']) || 0),
      dpm: acc.dpm + (parseInt(row['F']) || 0)
    }), { hovory: 0, emaily: 0, epodani: 0, dpm: 0 });
  }, [filteredData]);

  const comparisonTotals = useMemo(() => {
    if (!comparisonPeriod || !sheetData || sheetData.length === 0) {
      return null;
    }
    
    const compFromDate = new Date(comparisonPeriod.from);
    const compToDate = new Date(comparisonPeriod.to);
    
    const compData = sheetData.filter(row => {
      const rowDate = parseDate(row['B']);
      if (!rowDate) return false;
      const rowDateOnly = new Date(rowDate.getFullYear(), rowDate.getMonth(), rowDate.getDate());
      const fromDateOnly = new Date(compFromDate.getFullYear(), compFromDate.getMonth(), compFromDate.getDate());
      const toDateOnly = new Date(compToDate.getFullYear(), compToDate.getMonth(), compToDate.getDate());
      return rowDateOnly >= fromDateOnly && rowDateOnly <= toDateOnly;
    });
    
    return compData.reduce((acc, row) => ({
      hovory: acc.hovory + (parseInt(row['C']) || 0),
      emaily: acc.emaily + (parseInt(row['D']) || 0),
      epodani: acc.epodani + (parseInt(row['E']) || 0),
      dpm: acc.dpm + (parseInt(row['F']) || 0)
    }), { hovory: 0, emaily: 0, epodani: 0, dpm: 0 });
  }, [comparisonPeriod, sheetData]);

  const getComparison = (current, previous) => {
    if (previous === 0 && current === 0) return null;
    
    if (previous === 0) {
      return {
        change: null,
        isPositive: current > 0,
        isNegative: false,
        showArrowOnly: true
      };
    }
    
    const change = ((current - previous) / previous) * 100;
    return {
      change: change.toFixed(1),
      isPositive: change > 0,
      isNegative: change < 0,
      showArrowOnly: false
    };
  };

  const averages = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return { hovory: 0, emaily: 0, epodani: 0, dpm: 0 };
    }
    const days = filteredData.length;
    return {
      hovory: (totals.hovory / days).toFixed(1),
      emaily: (totals.emaily / days).toFixed(1),
      epodani: (totals.epodani / days).toFixed(1),
      dpm: (totals.dpm / days).toFixed(1)
    };
  }, [filteredData, totals]);

  const prediction = useMemo(() => {
    return null;
  }, []);

  const extremeDays = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return { most: null };
    let mostActiveDay = { datum: '', total: -1 };
    filteredData.forEach(row => {
      const total = (parseInt(row['C']) || 0) + (parseInt(row['D']) || 0) + (parseInt(row['E']) || 0) + (parseInt(row['F']) || 0);
      const datum = formatExcelDate(row['B']);
      if (total > mostActiveDay.total) {
        mostActiveDay = { datum, total };
      }
    });
    return { most: mostActiveDay };
  }, [filteredData]);

  const lineChartData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    return filteredData.map(row => {
      const datum = formatExcelDate(row['B']);
      return {
        datum,
        Hovory: parseInt(row['C']) || 0,
        'E-maily': parseInt(row['D']) || 0,
        'E-podání': parseInt(row['E']) || 0,
        DPM: parseInt(row['F']) || 0,
        isExtreme: datum === extremeDays.most?.datum
      };
    });
  }, [filteredData, extremeDays]);

  const pieChartData = useMemo(() => [
    { name: 'Hovory', value: totals.hovory, color: '#3b82f6' },
    { name: 'E-maily', value: totals.emaily, color: '#10b981' },
    { name: 'E-podání', value: totals.epodani, color: '#f59e0b' },
    { name: 'DPM', value: totals.dpm, color: '#ef4444' }
  ], [totals]);

  const cumulativeData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];
    let cumulative = { hovory: 0, emaily: 0, epodani: 0, dpm: 0 };
    return filteredData.map(row => {
      cumulative.hovory += parseInt(row['C']) || 0;
      cumulative.emaily += parseInt(row['D']) || 0;
      cumulative.epodani += parseInt(row['E']) || 0;
      cumulative.dpm += parseInt(row['F']) || 0;
      return {
        datum: formatExcelDate(row['B']),
        Hovory: cumulative.hovory,
        'E-maily': cumulative.emaily,
        'E-podání': cumulative.epodani,
        DPM: cumulative.dpm
      };
    });
  }, [filteredData]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    return [...filteredData].sort((a, b) => {
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

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'}`}>
      <div className="max-w-[1800px] mx-auto p-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 lg:self-start">
            <div className={`${darkMode ? 'bg-gray-800/50 backdrop-blur-xl border border-gray-700' : 'bg-white/70 backdrop-blur-xl border border-white'} rounded-2xl shadow-2xl p-6 transition-all duration-300`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-xl font-black ${darkMode ? 'text-white' : 'text-gray-800'}`}>Nahrané soubory ({files.length})</h2>
                <button onClick={() => setShowFiles(!showFiles)} className={`p-2 rounded-xl transition-all duration-300 transform hover:scale-110 ${showFiles ? 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg' : 'bg-gray-300 hover:bg-gray-400 text-white'}`}>
                  {showFiles ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </div>
              {/* Zbytek komponenty... */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}