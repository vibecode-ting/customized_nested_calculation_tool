import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import FileUploader from './components/FileUploader';
import OrderSelector from './components/OrderSelector';
import ArticleFilter from './components/ArticleFilter';
import NestingSummary from './components/NestingSummary';
import LockScreen from './components/LockScreen';
import { SavedDataset, NestingResult } from './types';
import { Language } from './utils/translations';
import { logUsage } from './utils/telemetry';

const STORAGE_KEY = 'pma_nesting_datasets_v1';
const LANG_KEY = 'pma_lang_pref';
const THEME_KEY = 'pma_theme_dark';

const App: React.FC = () => {
  const [savedDatasets, setSavedDatasets] = useState<SavedDataset[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [nestingResult, setNestingResult] = useState<NestingResult | null>(null);

  // UI State
  const [language, setLanguage] = useState<Language>('en');
  const [isDark, setIsDark] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);

  // Security & Admin State
  const [isLocked, setIsLocked] = useState(true);

  // Filter State
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);

  // Initialize UI preferences
  useEffect(() => {
    const savedLang = localStorage.getItem(LANG_KEY) as Language;
    if (savedLang) setLanguage(savedLang);

    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) setIsDark(savedTheme === 'true');

    // Telemetry: Log App Opening
    logUsage('APP_OPEN');

    // Auto-Lock Timer
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      // Lock after 5 minutes (300000 ms) of inactivity
      inactivityTimer = setTimeout(() => {
        setIsLocked(true);
      }, 300000);
    };

    // Listen for user activity
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('click', resetTimer);
    window.addEventListener('scroll', resetTimer);

    // Start initial timer
    resetTimer();

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('click', resetTimer);
      window.removeEventListener('scroll', resetTimer);
      clearTimeout(inactivityTimer);
    };
  }, []);

  // Persist UI preferences
  useEffect(() => {
    localStorage.setItem(LANG_KEY, language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem(THEME_KEY, String(isDark));
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: SavedDataset[] = JSON.parse(stored);
        setSavedDatasets(parsed);
        if (parsed.length > 0) setActiveDatasetId(parsed[0].id);
      }
    } catch (e) { }
  }, []);

  useEffect(() => {
    try {
      if (savedDatasets.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDatasets));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) { }
  }, [savedDatasets]);

  // Reset article selection when dataset changes
  useEffect(() => {
    setSelectedArticles([]);
  }, [activeDatasetId]);

  const activeDataset = savedDatasets.find(d => d.id === activeDatasetId) || null;

  // Extract available articles from the active dataset
  const availableArticles = useMemo(() => {
    if (!activeDataset || !activeDataset.articleHeader) return [];
    const articles = new Set<string>();
    activeDataset.rows.forEach(row => {
      const val = row[activeDataset.articleHeader!];
      if (val) articles.add(String(val).trim());
    });
    return Array.from(articles).sort();
  }, [activeDataset]);

  // Compute a filtered version of the dataset based on selected articles
  const filteredDataset = useMemo(() => {
    if (!activeDataset) return null;
    if (selectedArticles.length === 0) return activeDataset;

    if (!activeDataset.articleHeader) return activeDataset;

    // Filter rows
    const filteredRows = activeDataset.rows.filter(row => {
      const val = String(row[activeDataset.articleHeader!] || '').trim();
      return selectedArticles.includes(val);
    });

    // Get unique SOs from filtered rows
    const filteredSOs = Array.from(new Set(filteredRows.map(r => String(r['SO_Number']).trim()).filter(Boolean)));

    return {
      ...activeDataset,
      soNumbers: filteredSOs,
      rows: filteredRows
    };
  }, [activeDataset, selectedArticles]);

  const handleDatasetLoaded = (dataset: SavedDataset) => {
    setSavedDatasets(prev => {
      // Check if updating existing dataset
      const index = prev.findIndex(d => d.id === dataset.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = dataset;
        return updated;
      }
      // Else add new
      return [dataset, ...prev];
    });
    setActiveDatasetId(dataset.id);
    setNestingResult(null);
  };

  const handleDatasetSelect = (id: string) => {
    setActiveDatasetId(id);
    setNestingResult(null);
  };

  const handleDatasetDelete = (id: string) => {
    const newDatasets = savedDatasets.filter(d => d.id !== id);
    setSavedDatasets(newDatasets);
    if (activeDatasetId === id) {
      setActiveDatasetId(newDatasets.length > 0 ? newDatasets[0].id : null);
      setNestingResult(null);
    }
  };

  const handleGenerate = (selectedOrders: string[]) => {
    if (!filteredDataset) return;
    const data = filteredDataset; // Use the filtered dataset for generation

    // Filter rows
    const filteredRows = data.rows.filter(row => {
      const rowSO = String(row['SO_Number'] || '').trim();
      return selectedOrders.some(order => order === rowSO);
    });

    // Initialize map structure
    const sizeDataMap = new Map<string, {
      total: number,
      orders: Map<string, { qty: number, extras: Record<string, string | number> }>,
      articles: Set<string>,
      models: Set<string>,
      colors: Set<string>
    }>();

    data.sizeColumns.forEach(size => {
      sizeDataMap.set(size, { total: 0, orders: new Map(), articles: new Set(), models: new Set(), colors: new Set() });
    });

    const globalArticles = new Set<string>();
    const globalModels = new Set<string>();
    const globalColors = new Set<string>();
    const orderTotalsMap = new Map<string, number>();

    filteredRows.forEach(row => {
      const soNum = String(row['SO_Number'] || 'Unknown').trim();
      const rowExtras: Record<string, string | number> = {};
      if (data.infoColumns) {
        data.infoColumns.forEach(col => {
          const val = row[col];
          if (val !== undefined && val !== null) rowExtras[col] = String(val);
        });
      }

      const rowArticle = data.articleHeader ? String(row[data.articleHeader] || '').trim() : '';
      const rowModel = data.modelHeader ? String(row[data.modelHeader] || '').trim() : '';
      const rowColor = data.colorHeader ? String(row[data.colorHeader] || '').trim() : '';

      if (rowArticle) globalArticles.add(rowArticle);
      if (rowModel) globalModels.add(rowModel);
      if (rowColor) globalColors.add(rowColor);

      data.sizeColumns.forEach(size => {
        const val = row[size];
        let numVal = 0;
        if (typeof val === 'number') numVal = val;
        else if (typeof val === 'string') numVal = parseFloat(val);

        if (!isNaN(numVal) && numVal > 0) {
          const entry = sizeDataMap.get(size);
          if (entry) {
            entry.total += numVal;
            const currentOrderData = entry.orders.get(soNum) || { qty: 0, extras: {} };
            currentOrderData.qty += numVal;
            currentOrderData.extras = { ...currentOrderData.extras, ...rowExtras };
            entry.orders.set(soNum, currentOrderData);
            if (rowArticle) entry.articles.add(rowArticle);
            if (rowModel) entry.models.add(rowModel);
            if (rowColor) entry.colors.add(rowColor);
          }
          const currentOrderTotal = orderTotalsMap.get(soNum) || 0;
          orderTotalsMap.set(soNum, currentOrderTotal + numVal);
        }
      });
    });

    const breakdown = data.sizeColumns.map(size => {
      const entry = sizeDataMap.get(size)!;
      const orderBreakdown = Array.from(entry.orders.entries()).map(([orderNo, data]) => ({
        orderNo,
        qty: data.qty,
        extraInfo: data.extras
      })).sort((a, b) => b.qty - a.qty);

      return {
        size,
        qty: entry.total,
        orderBreakdown,
        articles: Array.from(entry.articles),
        models: Array.from(entry.models),
        colors: Array.from(entry.colors)
      };
    }).filter(item => item.qty > 0);

    const totalQty = breakdown.reduce((acc, curr) => acc + curr.qty, 0);

    const orderTotals = Array.from(orderTotalsMap.entries())
      .map(([orderNo, qty]) => ({ orderNo, qty }))
      .sort((a, b) => b.qty - a.qty);

    // Telemetry: Log Generation Event
    logUsage('GENERATE_NESTING', {
      selectedOrders,
      totalQty,
      orderCount: orderTotals.length,
      datasetName: data.name
    });

    setNestingResult({
      totalQty,
      orderTotals,
      breakdown,
      infoColumns: data.infoColumns || [],
      articleHeader: data.articleHeader,
      modelHeader: data.modelHeader,
      colorHeader: data.colorHeader,
      summaryArticles: Array.from(globalArticles),
      summaryModels: Array.from(globalModels),
      summaryColors: Array.from(globalColors)
    });
  };

  const handleClearResult = () => {
    setNestingResult(null);
  };

  return (
    <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${isDark ? 'bg-slate-900' : 'bg-white'}`}>
      <Header lang={language} setLang={setLanguage} isDark={isDark} setIsDark={setIsDark} />

      {/* Main Content Area: Fixed height, Zero Gap Layout */}
      <main className="flex-1 w-full overflow-y-auto lg:overflow-hidden min-h-0">
        <div className={`flex flex-col lg:flex-row h-full items-start lg:items-stretch divide-y lg:divide-y-0 lg:divide-x ${isDark ? 'divide-slate-700' : 'divide-gray-200'}`}>

          {/* Left Column: Data Sources & Filters - Reduced Width ~176px (11rem) */}
          <div className="w-full lg:w-44 flex-shrink-0 flex flex-col h-auto lg:h-full transition-all duration-300">
            {/* FileUploader Container: Added z-30 to ensure it sits on top of ArticleFilter */}
            <div className={`${isConfiguring ? 'flex-1 h-full' : 'flex-shrink-0'} relative z-30`}>
              <FileUploader
                onDataSaved={handleDatasetLoaded}
                savedDatasets={savedDatasets}
                activeDatasetId={activeDatasetId}
                onSelect={handleDatasetSelect}
                onDelete={handleDatasetDelete}
                lang={language}
                isDark={isDark}
                onConfigModeChange={setIsConfiguring}
              />
            </div>

            {/* Filter Container: z-20 (lower than uploader) */}
            {!isConfiguring && activeDataset && availableArticles.length > 0 && (
              <div className={`flex-1 min-h-0 flex flex-col border-t ${isDark ? 'border-slate-700' : 'border-gray-200'} animate-fadeIn relative z-20`}>
                <ArticleFilter
                  articles={availableArticles}
                  selectedArticles={selectedArticles}
                  onChange={setSelectedArticles}
                  lang={language}
                  isDark={isDark}
                />
              </div>
            )}
          </div>

          {/* Middle Column: Order Selection - Reduced Width ~224px (14rem) */}
          <div className="w-full lg:w-56 flex-shrink-0 h-auto lg:h-full flex flex-col">
            <OrderSelector
              data={filteredDataset}
              onGenerate={handleGenerate}
              onClear={handleClearResult}
              hasResult={!!nestingResult}
              lang={language}
              isDark={isDark}
              isArticleFilterActive={selectedArticles.length > 0}
            />
          </div>

          {/* Right Column: Results/Guide - Flexible */}
          <div className="w-full flex-1 min-w-0 h-auto lg:h-full flex flex-col">
            <NestingSummary result={nestingResult} lang={language} isDark={isDark} />
          </div>

        </div>
      </main>

      <footer className={`flex-shrink-0 border-t ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="w-full px-4 py-1 flex flex-col items-center justify-center text-center">
          <span className={`text-[10px] font-bold uppercase tracking-wider leading-tight ${isDark ? 'text-yellow-500' : 'text-red-600'}`}>
            Internal Use Only
          </span>
          <span className={`text-[9px] font-bold leading-tight ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
            &copy; 2025 Pou Chen Corporation
          </span>
          <span className={`text-[9px] italic leading-tight ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
            Developed by Htet Aung Hlaing ( ting ) @ PCM PCAG IT Team
          </span>
        </div>
      </footer>

      {isLocked && <LockScreen onUnlock={() => setIsLocked(false)} />}
    </div>
  );
};

export default App;