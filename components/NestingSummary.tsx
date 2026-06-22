import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Download, Layers, PieChart, List, GripHorizontal, Upload, Settings2, Search, Zap, Loader } from 'lucide-react';
import { NestingResult } from '../types';
import { Language, translations } from '../utils/translations';
import { logUsage } from '../utils/telemetry';
import * as XLSX from 'xlsx';

interface NestingSummaryProps {
  result: NestingResult | null;
  lang: Language;
  isDark: boolean;
}

const NestingSummary: React.FC<NestingSummaryProps> = ({ result, lang, isDark }) => {
  const t = translations[lang];

  // 1. Identify Dynamic Columns (Additional Info Columns)
  // These are columns selected by the user that are NOT the standard Article/Model/Color
  const dynamicColumns = useMemo(() => {
    if (!result) return [];
    return result.infoColumns.filter(col => 
        col !== result.articleHeader && 
        col !== result.modelHeader && 
        col !== result.colorHeader
    );
  }, [result]);

  // 2. Column Width State
  const [colWidths, setColWidths] = useState<{ [key: string]: number }>({
    size: 80,
    qty: 70,
    orderDetails: 280, // Giving details significant width by default
    article: 120,
    model: 120,
    color: 140
  });

  // 3. Column Order State
  // Default: Size, Qty, Details, Article, Model, Color, ...Extras
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  
  // Export Loading State
  const [isExporting, setIsExporting] = useState(false);

  // Sync Column Order when result changes
  useEffect(() => {
    if (result) {
        const baseOrder = ['size', 'qty', 'orderDetails', 'article', 'model', 'color'];
        setColumnOrder([...baseOrder, ...dynamicColumns]);
    }
  }, [result, dynamicColumns]);

  const [draggedCol, setDraggedCol] = useState<string | null>(null);
  const resizingRef = useRef<{ col: string; startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current) return;
      const { col, startX, startWidth } = resizingRef.current;
      const diff = e.clientX - startX;
      setColWidths(prev => ({
        ...prev,
        [col]: Math.max(50, startWidth + diff) // Minimum width 50px
      }));
    };

    const handleMouseUp = () => {
      resizingRef.current = null;
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const startResize = (e: React.MouseEvent, col: string) => {
    e.preventDefault();
    e.stopPropagation(); 
    const currentWidth = colWidths[col] || (e.currentTarget.parentElement?.getBoundingClientRect().width || 100);
    resizingRef.current = { col, startX: e.clientX, startWidth: currentWidth };
    document.body.style.cursor = 'col-resize';
  };

  const handleDragStart = (e: React.DragEvent, col: string) => {
    setDraggedCol(col);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', col); 
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetCol: string) => {
    e.preventDefault();
    if (!draggedCol || draggedCol === targetCol) return;

    const newOrder = [...columnOrder];
    const dragIdx = newOrder.indexOf(draggedCol);
    const dropIdx = newOrder.indexOf(targetCol);

    if (dragIdx !== -1 && dropIdx !== -1) {
        newOrder.splice(dragIdx, 1);
        newOrder.splice(dropIdx, 0, draggedCol);
        setColumnOrder(newOrder);
    }
    setDraggedCol(null);
  };

  if (!result) {
    return (
        <div className="h-full flex flex-col items-center justify-center animate-fadeIn p-6">
            {/* Hero Card */}
            <div className={`
                w-full max-w-lg
                p-8 rounded-2xl shadow-sm border text-center transition-colors duration-300
                flex flex-col items-center justify-center
                ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}
            `}>
                <div className={`${isDark ? 'bg-slate-700' : 'bg-blue-50'} p-4 rounded-full mb-4`}>
                    <Layers className={`w-12 h-12 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                </div>
                <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.ready}</h3>
                <p className={`mt-3 text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                   {t.readyDesc}
                </p>
            </div>
        </div>
    );
  }

  const hasArticle = !!result.articleHeader;
  const hasModel = !!result.modelHeader;
  const hasColor = !!result.colorHeader;

  const visibleColumns = columnOrder.filter(col => {
      if (col === 'article') return hasArticle;
      if (col === 'model') return hasModel;
      if (col === 'color') return hasColor;
      return true;
  });

  const exportToExcel = async () => {
    if (!result) return;
    setIsExporting(true);
    
    // Give React time to render the loading state
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
        logUsage('EXPORT_EXCEL', { totalQty: result.totalQty, orderCount: result.orderTotals.length });

        const wb = XLSX.utils.book_new();
        
        // Header Row
        const headers = visibleColumns.map(col => {
            switch(col) {
                case 'size': return "Size";
                case 'qty': return "Total Qty";
                case 'article': return result.articleHeader!;
                case 'orderDetails': return "Order Details";
                case 'model': return result.modelHeader!;
                case 'color': return result.colorHeader!;
                default: return col; // Dynamic Header
            }
        });

        // Data Rows
        const wsData = [
        headers,
        ...result.breakdown.map(item => {
            return visibleColumns.map(col => {
                switch(col) {
                    case 'size': return item.size;
                    case 'qty': return item.qty;
                    case 'article': return item.articles.join('/');
                    case 'orderDetails': 
                        return item.orderBreakdown.map(b => `${b.orderNo}: ${b.qty}`).join(', ');
                    case 'model': return item.models.join('/');
                    case 'color': return item.colors.join('/');
                    default: 
                        // Dynamic Info Column: Join unique values found in this breakdown item
                        const vals = new Set<string>();
                        item.orderBreakdown.forEach(b => {
                            const v = b.extraInfo?.[col];
                            if (v) vals.add(String(v));
                        });
                        return Array.from(vals).join('/');
                }
            });
        }),
        // Footer Row
        visibleColumns.map(col => {
            switch(col) {
                case 'size': return "Grand Total";
                case 'qty': return result.totalQty;
                case 'article': return hasArticle ? result.summaryArticles.join('/') : "";
                case 'model': return hasModel ? result.summaryModels.join('/') : "";
                case 'color': return hasColor ? result.summaryColors.join('/') : "";
                case 'orderDetails': return "";
                default: return "";
            }
        })
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Auto-adjust width
        const wscols = visibleColumns.map(col => {
            if (col === 'orderDetails') return { wch: 80 };
            return { wch: 15 };
        });
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, "Nesting Breakdown");

        // Summary Sheet
        const summaryData = [
            ["Order Number", "Total Quantity"],
            ...result.orderTotals.map(ot => [ot.orderNo, ot.qty]),
            [],
            ["Grand Total", result.totalQty]
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        wsSummary['!cols'] = [{ wch: 25 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsSummary, "Order Summary");

        XLSX.writeFile(wb, "PMA_Nesting_Result.xlsx");
    } catch (e) {
        console.error("Export Error:", e);
        alert("An error occurred while exporting the Excel file.");
    } finally {
        setIsExporting(false);
    }
  };

  const borderColor = isDark ? 'border-slate-600' : 'border-gray-300';
  const headerBg = isDark ? 'bg-slate-700' : 'bg-gray-100';
  const orderCount = result.orderTotals.length;

  return (
    <div className="h-full flex flex-col">
      {/* Top Stats Bar */}
      <div className={`flex flex-col md:flex-row border-b flex-shrink-0 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
        {/* Qty Per Order List */}
        <div className={`flex-1 p-2 flex flex-col border-b md:border-b-0 md:border-r ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50/50 border-gray-100'}`}>
             <div className="flex items-center gap-2 mb-1">
                <List className={`w-3.5 h-3.5 ${isDark ? 'text-blue-400' : 'text-gray-400'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-300' : 'text-gray-500'}`}>
                    {t.perOrderQty}
                </span>
             </div>
             <div className="max-h-[80px] overflow-y-auto custom-scrollbar pr-1">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-0.5">
                  {result.orderTotals.map((ot) => (
                      <div key={ot.orderNo} className={`flex justify-between items-center text-[10px] border-b border-dashed pb-0.5 last:border-0 ${isDark ? 'border-slate-700' : 'border-gray-200/60'}`}>
                          <span className={`font-medium truncate mr-2 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{ot.orderNo}</span>
                          <span className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-gray-600'}`}>{ot.qty}</span>
                      </div>
                  ))}
                </div>
             </div>
        </div>

        {/* Grand Total */}
        <div className={`p-2 flex flex-col justify-center min-w-[140px] border-b md:border-b-0 md:border-r ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center gap-1.5 mb-0.5">
                <div className={`p-1 rounded ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                    <PieChart className="w-3.5 h-3.5" />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    {t.totalQty}
                </span>
            </div>
            <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {result.totalQty.toLocaleString()}
                </span>
                <span className={`text-[10px] font-medium ${isDark ? 'text-slate-400' : 'text-gray-400'}`}>{t.pairs}</span>
            </div>
        </div>

        {/* Action Button */}
        <div className={`p-2 md:w-auto w-full flex items-center justify-center ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
           <button 
             onClick={exportToExcel}
             disabled={isExporting}
             className={`w-full md:w-auto h-full min-h-[36px] px-4 flex items-center justify-center gap-2 rounded shadow-sm transition-all transform group
                ${isExporting 
                    ? 'bg-emerald-600/70 cursor-wait' 
                    : 'bg-emerald-600 hover:bg-emerald-700 hover:shadow active:scale-95'
                } text-white
             `}
           >
              {isExporting ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span className="font-bold text-xs whitespace-nowrap">
                {isExporting ? "Exporting..." : t.exportExcel}
              </span>
           </button>
        </div>
      </div>

      {/* Main Table Area */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-colors duration-300 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
        <div className={`px-4 py-1.5 border-b flex justify-between items-center ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50/50'}`}>
          <h3 className={`text-xs font-semibold flex items-center gap-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
             {t.summaryTitlePrefix} <span className="text-blue-600 dark:text-blue-400 mx-1 font-bold">{orderCount}</span> {t.summaryTitleSuffix}
          </h3>
        </div>
        
        <div className="flex-1 overflow-auto custom-scrollbar relative">
          <table className="table-fixed border-collapse min-w-full">
            <thead className={`sticky top-0 z-10 ${headerBg}`}>
              <tr>
                {visibleColumns.map(colKey => {
                    let label = colKey;
                    let align = "left";
                    
                    if(colKey === 'size') label = t.size;
                    else if(colKey === 'qty') { label = t.qty; align = "right"; }
                    else if(colKey === 'article') label = "Article";
                    else if(colKey === 'orderDetails') label = t.orderDetails;
                    else if(colKey === 'model') label = "Model";
                    else if(colKey === 'color') label = "Colour";

                    const widthVal = colWidths[colKey];
                    const widthStyle = widthVal ? { width: `${widthVal}px` } : { width: 'auto' };

                    return (
                        <th 
                            key={colKey}
                            draggable
                            onDragStart={(e) => handleDragStart(e, colKey)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, colKey)}
                            style={widthStyle}
                            className={`relative px-2 py-1.5 text-${align} text-[10px] font-bold uppercase tracking-wider border ${borderColor} ${isDark ? 'text-slate-300' : 'text-gray-600'} select-none bg-clip-padding cursor-move group hover:bg-black/5 dark:hover:bg-white/5 transition-colors`}
                        >
                            <div className="flex items-center gap-1">
                                {colKey !== 'size' && colKey !== 'qty' && <GripHorizontal className="w-3 h-3 opacity-30 group-hover:opacity-100" />}
                                {label}
                            </div>
                            <div 
                                className={`absolute right-0 top-0 bottom-0 w-4 cursor-col-resize z-10 group flex justify-center hover:bg-blue-500/10 transition-colors`}
                                onMouseDown={(e) => startResize(e, colKey)}
                            >
                                <div className="w-[1px] h-full bg-transparent group-hover:bg-blue-400 transition-colors"></div>
                            </div>
                        </th>
                    );
                })}
              </tr>
            </thead>
            <tbody className={`${isDark ? 'bg-slate-800' : 'bg-white'}`}>
              {result.breakdown.map((item) => {
                const articleColor = item.articles.length === 1 ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-red-400' : 'text-red-600');
                const modelColor = item.models.length === 1 ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-red-400' : 'text-red-600');
                const colorColor = item.colors.length === 1 ? (isDark ? 'text-green-400' : 'text-green-600') : (isDark ? 'text-red-400' : 'text-red-600');

                return (
                  <tr key={item.size} className={`transition-colors ${isDark ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'}`}>
                    {visibleColumns.map(colKey => {
                        // STANDARD COLUMNS
                        if(colKey === 'size') {
                            return (
                                <td key="size" className={`px-2 py-0.5 whitespace-nowrap text-xs font-medium border ${borderColor} ${isDark ? 'text-slate-200' : 'text-gray-900'}`}>
                                    {item.size}
                                </td>
                            );
                        }
                        if(colKey === 'qty') {
                            return (
                                <td key="qty" className={`px-2 py-0.5 whitespace-nowrap text-xs text-right font-mono font-semibold border ${borderColor} ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                                    {item.qty}
                                </td>
                            );
                        }
                        if(colKey === 'article') {
                            return (
                                <td key="article" className={`px-2 py-0.5 whitespace-nowrap text-[11px] font-semibold border ${borderColor} ${articleColor}`}>
                                    {item.articles.join('/')}
                                </td>
                            );
                        }
                        if(colKey === 'orderDetails') {
                            return (
                                <td key="details" className={`px-2 py-0.5 text-[10px] border ${borderColor}`}>
                                    <div className="flex flex-wrap gap-1">
                                    {item.orderBreakdown.map((detail, dIdx) => (
                                        <div key={dIdx} className={`inline-flex items-center px-1.5 py-0 rounded-sm font-medium border ${isDark ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-gray-100 border-gray-200 text-gray-700'}`}>
                                            <span className="opacity-70 mr-1">{detail.orderNo}:</span>
                                            <span className={`${isDark ? 'text-white' : 'text-black'} font-mono font-bold`}>{detail.qty}</span>
                                        </div>
                                    ))}
                                    </div>
                                </td>
                            );
                        }
                        if(colKey === 'model') {
                            return (
                                <td key="model" className={`px-2 py-0.5 whitespace-nowrap text-[11px] font-semibold border ${borderColor} ${modelColor} overflow-hidden text-ellipsis`} title={item.models.join('/')}>
                                    {item.models.join('/')}
                                </td>
                            );
                        }
                        if(colKey === 'color') {
                            return (
                                <td key="color" className={`px-2 py-0.5 whitespace-nowrap text-[11px] font-semibold border ${borderColor} ${colorColor} overflow-hidden text-ellipsis`} title={item.colors.join('/')}>
                                    {item.colors.join('/')}
                                </td>
                            );
                        }

                        // DYNAMIC INFO COLUMNS
                        const values = new Set<string>();
                        item.orderBreakdown.forEach(b => {
                            const val = b.extraInfo?.[colKey];
                            if(val) values.add(String(val));
                        });
                        const displayVal = Array.from(values).join('/');
                        
                        return (
                            <td key={colKey} className={`px-2 py-0.5 whitespace-nowrap text-[11px] border ${borderColor} ${isDark ? 'text-slate-400' : 'text-gray-500'} overflow-hidden text-ellipsis`} title={displayVal}>
                                {displayVal}
                            </td>
                        );
                    })}
                  </tr>
                );
              })}
            </tbody>
            <tfoot className={`sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] ${isDark ? 'bg-slate-700' : 'bg-gray-50'}`}>
                <tr>
                    {visibleColumns.map(colKey => {
                        const styleClass = `px-2 py-1 text-xs font-bold border ${borderColor} ${isDark ? 'text-white' : 'text-gray-900'}`;
                        if(colKey === 'size') return <td key="size" className={styleClass}>{t.grandTotal}</td>;
                        if(colKey === 'qty') return <td key="qty" className={`px-2 py-1 text-xs text-right font-mono font-bold border ${borderColor} ${isDark ? 'text-white' : 'text-gray-900'}`}>{result.totalQty}</td>;
                        if(colKey === 'article') return <td key="article" className={`px-2 py-1 text-[10px] font-semibold border ${borderColor} ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>{result.summaryArticles.join(' / ')}</td>;
                        if(colKey === 'model') return <td key="model" className={`px-2 py-1 text-[10px] font-semibold border ${borderColor} ${isDark ? 'text-slate-300' : 'text-gray-600'} overflow-hidden text-ellipsis`}>{result.summaryModels.join(' / ')}</td>;
                        if(colKey === 'color') return <td key="color" className={`px-2 py-1 text-[10px] font-semibold border ${borderColor} ${isDark ? 'text-slate-300' : 'text-gray-600'} overflow-hidden text-ellipsis`}>{result.summaryColors.join(' / ')}</td>;
                        
                        // For Order Details or Dynamic Columns, calculate unique values if possible or leave blank
                        if (colKey !== 'orderDetails') {
                             const allVals = new Set<string>();
                             result.breakdown.forEach(item => {
                                 item.orderBreakdown.forEach(b => {
                                     const v = b.extraInfo?.[colKey];
                                     if(v) allVals.add(String(v));
                                 });
                             });
                             return <td key={colKey} className={`px-2 py-1 text-[10px] font-semibold border ${borderColor} ${isDark ? 'text-slate-400' : 'text-gray-500'} overflow-hidden text-ellipsis`}>{Array.from(allVals).join(' / ')}</td>;
                        }

                        return <td key={colKey} className={`px-2 py-1 border ${borderColor}`}></td>;
                    })}
                </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NestingSummary;