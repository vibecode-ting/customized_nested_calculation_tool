import React, { useRef, useState, useEffect } from 'react';
import { Upload, CheckCircle, AlertCircle, Database, Trash2, Plus, X, Server, Settings2, CheckSquare, Square, ChevronDown, ChevronRight, Download, Cog } from 'lucide-react';
import { parseExcelFile } from '../utils/excel';
import { ProcessedData, SavedDataset } from '../types';
import { Language, translations } from '../utils/translations';

interface FileUploaderProps {
  onDataSaved: (data: SavedDataset) => void;
  savedDatasets: SavedDataset[];
  activeDatasetId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  lang: Language;
  isDark: boolean;
  onConfigModeChange?: (isConfig: boolean) => void;
}

const SERVER_FILES = [
  { label: 'data.xlsx', value: 'data.xlsx' },
  { label: 'sap_data.xlsx', value: 'sap_data.xlsx' }
];

const FileUploader: React.FC<FileUploaderProps> = ({ 
  onDataSaved, 
  savedDatasets, 
  activeDatasetId, 
  onSelect,
  onDelete,
  lang,
  isDark,
  onConfigModeChange
}) => {
  const t = translations[lang];
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [customName, setCustomName] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [showUpload, setShowUpload] = useState(savedDatasets.length === 0);
  const [showServerMenu, setShowServerMenu] = useState(false);
  
  // New state for Column Configuration
  const [pendingData, setPendingData] = useState<ProcessedData | null>(null);
  const [selectedSizeCols, setSelectedSizeCols] = useState<Set<string>>(new Set());
  const [selectedInfoCols, setSelectedInfoCols] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Notify parent of config mode changes
  useEffect(() => {
    if (onConfigModeChange) {
        onConfigModeChange(!!pendingData);
    }
  }, [pendingData, onConfigModeChange]);

  const generateId = () => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      try {
        return crypto.randomUUID();
      } catch (e) { }
    }
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  const handleFile = async (file: File) => {
    if (!file) return;
    
    if (!file.name.match(/\.xls(x)?$/i)) {
      setError(t.uploadValid);
      return;
    }

    setFileName(file.name);
    setError(null);
    setIsLoading(true);

    try {
      const data: ProcessedData = await parseExcelFile(file);
      
      // Initialize configuration state with heuristics
      setPendingData(data);
      setSelectedSizeCols(new Set(data.sizeColumns));

      // Auto-select Article, Model, and Color columns if detected
      const initialInfoCols = new Set<string>();
      if (data.articleHeader) initialInfoCols.add(data.articleHeader);
      if (data.modelHeader) initialInfoCols.add(data.modelHeader);
      if (data.colorHeader) initialInfoCols.add(data.colorHeader);
      
      setSelectedInfoCols(initialInfoCols);
      setEditingId(null); // New upload, not editing existing
      
      // Auto-populate custom name if empty, or overwrite if it was a file-based name
      const simpleName = file.name.replace(/\.xlsx?$/, '');
      setCustomName(simpleName);

    } catch (err) {
      console.error("Excel Parsing Error:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setFileName(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadServerFile = async (targetFileName: string) => {
    setIsLoading(true);
    setError(null);
    setShowServerMenu(false); // Close menu
    try {
        let response = await fetch(`/${targetFileName}`);
        
        // Try relative path if absolute fails (covers subdirectory deployments)
        if (!response.ok) {
            response = await fetch(`./${targetFileName}`);
        }

        if (!response.ok) {
            throw new Error(`File '${targetFileName}' not found. Please ensure it is placed in the 'public/' folder of your project.`);
        }

        const blob = await response.blob();
        const file = new File([blob], targetFileName, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        await handleFile(file);
    } catch (err) {
        console.error(err);
        const msg = err instanceof Error ? err.message : `Failed to load '${targetFileName}'.`;
        setError(msg);
        setIsLoading(false);
    }
  };

  const handleConfigureActive = () => {
    const activeDS = savedDatasets.find(d => d.id === activeDatasetId);
    if (!activeDS) return;

    setPendingData({
        headers: activeDS.headers,
        rows: activeDS.rows,
        sizeColumns: activeDS.sizeColumns,
        infoColumns: activeDS.infoColumns,
        soNumbers: activeDS.soNumbers,
        articleHeader: activeDS.articleHeader,
        modelHeader: activeDS.modelHeader,
        colorHeader: activeDS.colorHeader
    });
    setSelectedSizeCols(new Set(activeDS.sizeColumns));
    setSelectedInfoCols(new Set(activeDS.infoColumns));
    setCustomName(activeDS.name);
    setEditingId(activeDS.id);
  };

  const confirmDataset = () => {
    if (!pendingData) return;

    // Apply the user's configuration
    const finalData: ProcessedData = {
        ...pendingData,
        sizeColumns: Array.from(selectedSizeCols),
        infoColumns: Array.from(selectedInfoCols)
    };

    let finalName = customName.trim();
    if (!finalName) {
       finalName = editingId 
         ? savedDatasets.find(d => d.id === editingId)?.name || 'Dataset'
         : `DS-${String(savedDatasets.length + 1).padStart(2, '0')}`;
    }

    const newDataset: SavedDataset = {
      ...finalData,
      id: editingId || generateId(), // Reuse ID if editing, generate new if new
      name: finalName,
      createdAt: editingId ? (savedDatasets.find(d => d.id === editingId)?.createdAt || Date.now()) : Date.now()
    };

    onDataSaved(newDataset);
    
    // Reset State
    setFileName(null);
    setCustomName('');
    setPendingData(null);
    setShowUpload(false);
    setEditingId(null);
  };

  const cancelConfig = () => {
    setPendingData(null);
    setFileName(null);
    setError(null);
    setEditingId(null);
  };

  const toggleSizeCol = (col: string) => {
    const next = new Set(selectedSizeCols);
    if (next.has(col)) next.delete(col);
    else next.add(col);
    setSelectedSizeCols(next);
  };

  const toggleInfoCol = (col: string) => {
    const next = new Set(selectedInfoCols);
    if (next.has(col)) next.delete(col);
    else next.add(col);
    setSelectedInfoCols(next);
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  // Render the Column Configuration Mode
  if (pendingData) {
    return (
        <div className={`flex flex-col h-full transition-colors duration-300 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
            {/* Header */}
            <div className={`px-3 py-2 border-b flex-shrink-0 flex justify-between items-center ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-blue-50/50 border-gray-100'}`}>
                <h2 className={`text-xs font-bold uppercase tracking-wider flex items-center ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                    <Settings2 className="w-3.5 h-3.5 mr-1.5" />
                    {editingId ? 'Edit Columns' : 'Columns'}
                </h2>
                <button onClick={cancelConfig} className="text-gray-400 hover:text-gray-500">
                    <X className="w-4 h-4" />
                </button>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-3 min-h-0">
                 {!editingId && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-2 text-xs text-yellow-800 dark:text-yellow-200">
                        <p className="font-medium">Review:</p>
                        <p>1. Check Sizes.</p>
                        <p>2. Check Info.</p>
                    </div>
                 )}
                 
                 {/* Name Edit in Config Mode */}
                 <div>
                    <h3 className={`text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Name</h3>
                    <input 
                      type="text" 
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      placeholder={t.nameOptional}
                      className={`block w-full rounded text-xs shadow-sm p-1.5 border focus:ring-1 focus:ring-blue-500 outline-none ${
                        isDark 
                          ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                 </div>

                 {/* Size Columns Selection */}
                 <div>
                    <h3 className={`text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Sizes (Qty)</h3>
                    <div className="overflow-y-auto custom-scrollbar border rounded p-1 grid grid-cols-2 gap-1 bg-gray-50/50 dark:bg-slate-900/50 dark:border-slate-700 max-h-[200px]">
                        {pendingData.headers.filter(h => h !== 'SO_Number').map(h => {
                             const isChecked = selectedSizeCols.has(h);
                             return (
                                 <label key={`size-${h}`} className="flex items-center gap-1.5 cursor-pointer group p-0.5">
                                     <div onClick={() => toggleSizeCol(h)} className={`flex-shrink-0 ${isChecked ? 'text-blue-600' : 'text-gray-300 dark:text-slate-600'}`}>
                                         {isChecked ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                                     </div>
                                     <span className={`text-[11px] truncate select-none ${isChecked ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-slate-500' : 'text-gray-500')}`}>
                                        {h}
                                     </span>
                                 </label>
                             );
                        })}
                    </div>
                 </div>

                 {/* Info Columns Selection */}
                 <div>
                    <h3 className={`text-xs font-semibold mb-1 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Info</h3>
                    <div className="overflow-y-auto custom-scrollbar border rounded p-1 grid grid-cols-1 gap-1 bg-gray-50/50 dark:bg-slate-900/50 dark:border-slate-700 max-h-[150px]">
                        {pendingData.headers.filter(h => h !== 'SO_Number' && !selectedSizeCols.has(h)).map(h => {
                             const isChecked = selectedInfoCols.has(h);
                             const isAutoDetected = (pendingData.articleHeader === h || pendingData.modelHeader === h || pendingData.colorHeader === h);
                             
                             return (
                                 <label key={`info-${h}`} className="flex items-center gap-1.5 cursor-pointer group p-0.5">
                                     <div onClick={() => toggleInfoCol(h)} className={`flex-shrink-0 ${isChecked ? 'text-emerald-600' : 'text-gray-300 dark:text-slate-600'}`}>
                                         {isChecked ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                                     </div>
                                     <div className="flex items-center gap-1.5 min-w-0">
                                         <span className={`text-[11px] truncate select-none ${isChecked ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-slate-500' : 'text-gray-500')}`}>
                                            {h}
                                         </span>
                                         {isAutoDetected && (
                                            <span className="text-[9px] bg-blue-100 text-blue-700 px-1 rounded dark:bg-blue-900 dark:text-blue-300">Auto</span>
                                         )}
                                     </div>
                                 </label>
                             );
                        })}
                        {pendingData.headers.filter(h => h !== 'SO_Number' && !selectedSizeCols.has(h)).length === 0 && (
                            <span className="text-[10px] text-gray-400 italic text-center">No other columns available</span>
                        )}
                    </div>
                 </div>
            </div>

             {/* Footer Button */}
             <div className={`p-2 border-t mt-auto flex-shrink-0 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-100 bg-gray-50/50'}`}>
                 <button
                    onClick={confirmDataset}
                    className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors shadow-sm"
                 >
                    {editingId ? 'Update Configuration' : 'Save New Source'}
                 </button>
             </div>
        </div>
    );
  }

  return (
    <div className={`flex flex-col transition-colors duration-300 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
      {/* Compact Header */}
      <div className={`px-3 py-2 border-b flex justify-between items-center ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50/50 border-gray-100'}`}>
        <h2 className={`text-xs font-bold uppercase tracking-wider flex items-center ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
          <Database className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
          {t.dataSources}
        </h2>
        <div className="flex items-center gap-1">
            {/* Config Button (Only for active datasets, not in upload mode) */}
            {!showUpload && savedDatasets.length > 0 && activeDatasetId && (
                <button
                    onClick={handleConfigureActive}
                    className={`p-1 rounded-md transition-colors ${
                        isDark 
                        ? 'bg-slate-700 text-slate-400 hover:text-blue-300 hover:bg-slate-600' 
                        : 'bg-gray-200 text-gray-500 hover:text-blue-600 hover:bg-gray-300'
                    }`}
                    title="Configure Columns"
                >
                    <Settings2 className="w-3.5 h-3.5" />
                </button>
            )}

            <button 
              onClick={() => {
                  setShowUpload(!showUpload);
                  setEditingId(null);
                  setError(null);
                  setFileName(null);
              }}
              className={`p-1 rounded-md transition-colors ${
                showUpload 
                  ? (isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600') 
                  : (isDark ? 'bg-blue-900/40 text-blue-400 hover:bg-blue-900/60' : 'bg-blue-50 text-blue-600 hover:bg-blue-100')
              }`}
              title={showUpload ? t.cancel : t.newSource}
            >
              {showUpload ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
        </div>
      </div>

      <div className="p-2">
        {showUpload || savedDatasets.length === 0 ? (
          /* Upload View */
          <div className="space-y-2 animate-fadeIn">
            <input 
              type="text" 
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={t.nameOptional}
              className={`block w-full rounded text-xs shadow-sm p-1.5 border focus:ring-1 focus:ring-blue-500 outline-none ${
                isDark 
                  ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500' 
                  : 'bg-white border-gray-300 text-gray-900'
              }`}
            />

            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded p-3 text-center cursor-pointer transition-all duration-200
                ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}
                ${!isDragging && isDark ? 'border-slate-600 hover:border-slate-500 hover:bg-slate-700' : ''}
                ${!isDragging && !isDark ? 'border-gray-200 hover:border-blue-400 hover:bg-gray-50' : ''}
                ${fileName ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : ''}
              `}
            >
              <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx,.xls" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />

              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
              ) : fileName ? (
                <div className={`flex items-center justify-center ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  <span className="text-[10px] font-medium truncate max-w-[120px]">{fileName}</span>
                </div>
              ) : (
                <div className={`flex flex-col items-center ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>
                  <Upload className="w-4 h-4 mb-1" />
                  <span className="text-[10px]">{t.clickUpload}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
                <div className={`h-px flex-1 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
                <span className={`text-[9px] ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{t.or}</span>
                <div className={`h-px flex-1 ${isDark ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
            </div>

            {/* Server File Dropdown Menu */}
            <div className="relative">
                <button
                    onClick={() => setShowServerMenu(!showServerMenu)}
                    disabled={isLoading}
                    className={`w-full flex items-center justify-between px-3 py-1.5 border text-xs font-medium rounded shadow-sm transition-colors
                      ${isDark 
                        ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600' 
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                      }
                    `}
                >
                    <div className="flex items-center gap-2">
                         <Server className="w-3.5 h-3.5 text-blue-500" />
                         <span>Load Server Data</span>
                    </div>
                    {showServerMenu ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </button>
                
                {showServerMenu && (
                    <div className={`absolute top-full left-0 right-0 mt-1 rounded-md shadow-lg border z-50 overflow-hidden animate-fadeIn
                         ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-gray-200'}
                    `}>
                        {SERVER_FILES.map(file => (
                            <button
                                key={file.value}
                                onClick={() => handleLoadServerFile(file.value)}
                                className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2
                                    ${isDark 
                                        ? 'text-slate-300 hover:bg-slate-700 hover:text-white' 
                                        : 'text-gray-700 hover:bg-gray-50 hover:text-blue-600'
                                    }
                                `}
                            >
                                <Download className="w-3 h-3 opacity-50" />
                                {file.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            {error && (
              <div className={`flex items-start gap-1.5 text-[10px] p-2 rounded border animate-fadeIn
                ${isDark 
                    ? 'bg-red-900/20 border-red-800 text-red-300' 
                    : 'bg-red-50 border-red-100 text-red-700'
                }
              `}>
                <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <div className="flex-1 leading-snug break-words">
                    <span className="font-bold block mb-0.5">Error Loading File:</span>
                    {error}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* List View */
          <div className="space-y-1 max-h-[180px] overflow-y-auto custom-scrollbar pr-1">
             {savedDatasets.map(ds => {
               const isActive = ds.id === activeDatasetId;
               return (
                 <div 
                   key={ds.id}
                   onClick={() => onSelect(ds.id)}
                   className={`
                     group flex justify-between items-center p-1.5 rounded-md cursor-pointer transition-all border
                     ${isActive 
                        ? 'bg-blue-600 border-blue-600 shadow-sm' 
                        : (isDark ? 'bg-slate-700 border-transparent hover:bg-slate-600' : 'bg-white border-transparent hover:bg-gray-50 hover:border-gray-200')
                     }
                   `}
                 >
                   <div className="flex flex-col min-w-0">
                     <span className={`text-xs font-medium truncate ${isActive ? 'text-white' : (isDark ? 'text-slate-200' : 'text-gray-900')}`}>
                       {ds.name}
                     </span>
                     <span className={`text-[9px] truncate ${isActive ? 'text-blue-100' : (isDark ? 'text-slate-400' : 'text-gray-400')}`}>
                       {new Date(ds.createdAt).toLocaleDateString()} • {ds.soNumbers.length} Orders
                     </span>
                   </div>
                   
                   <button
                    onClick={(e) => { e.stopPropagation(); onDelete(ds.id); }}
                    className={`
                      p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity
                      ${isActive 
                        ? 'text-blue-100 hover:bg-blue-500 hover:text-white' 
                        : (isDark ? 'text-slate-400 hover:bg-red-900/50 hover:text-red-400' : 'text-gray-400 hover:bg-red-50 hover:text-red-600')
                      }
                    `}
                    title="Delete"
                   >
                     <Trash2 className="w-3 h-3" />
                   </button>
                 </div>
               );
             })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;