import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, Minus, Search, Trash2, ArrowRight, AlertTriangle, AlertCircle, Layers, Check, Eraser } from 'lucide-react';
import { ProcessedData } from '../types';
import { Language, translations } from '../utils/translations';

interface OrderSelectorProps {
  data: ProcessedData | null;
  onGenerate: (selectedOrders: string[]) => void;
  onClear: () => void;
  hasResult: boolean;
  lang: Language;
  isDark: boolean;
  isArticleFilterActive?: boolean;
}

const OrderSelector: React.FC<OrderSelectorProps> = ({ data, onGenerate, onClear, hasResult, lang, isDark, isArticleFilterActive = false }) => {
  const t = translations[lang];
  const [inputs, setInputs] = useState<string[]>(Array(3).fill(''));
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const prevLengthRef = useRef(inputs.length);

  // Focus the new input only when a field is ADDED
  useEffect(() => {
    if (inputs.length > prevLengthRef.current) {
      const lastIndex = inputs.length - 1;
      inputRefs.current[lastIndex]?.focus();
      setFocusedIndex(lastIndex);
    }
    prevLengthRef.current = inputs.length;
  }, [inputs.length]);
  
  // Validation Logic
  const validOrdersSet = useMemo(() => {
    return data ? new Set(data.soNumbers.map(s => String(s).trim())) : new Set();
  }, [data]);

  const trimmedInputs = inputs.map(val => val.trim());
  const filledInputs = trimmedInputs.filter(val => val !== '');

  // Check validity against dataset
  const invalidValues = filledInputs.filter(val => !validOrdersSet.has(val));
  const uniqueInvalidValues = Array.from(new Set(invalidValues));
  const hasInvalidErrors = uniqueInvalidValues.length > 0;

  // Check duplicates
  const duplicateValues = filledInputs.filter((item, index) => filledInputs.indexOf(item) !== index);
  const uniqueDuplicateValues = Array.from(new Set(duplicateValues));
  const hasDuplicateErrors = uniqueDuplicateValues.length > 0;

  const hasErrors = hasInvalidErrors || hasDuplicateErrors;
  const hasEmptySelection = inputs.every(i => i.trim() === '');
  
  // Bulk Mode: If inputs are empty but filter is active, we can generate all
  const isBulkMode = isArticleFilterActive && hasEmptySelection && data && data.soNumbers.length > 0;

  const addInput = () => {
    setInputs([...inputs, '']);
  };

  const removeInput = () => {
    if (inputs.length <= 1) return;

    // Remove the currently focused index, or the last one if nothing is focused
    const indexToRemove = focusedIndex !== null && focusedIndex < inputs.length 
        ? focusedIndex 
        : inputs.length - 1;

    const newInputs = inputs.filter((_, i) => i !== indexToRemove);
    setInputs(newInputs);
    
    // Adjust focus
    const nextFocus = indexToRemove >= newInputs.length ? newInputs.length - 1 : indexToRemove;
    setFocusedIndex(nextFocus);
    
    // Defer focus to allow render
    setTimeout(() => {
        inputRefs.current[nextFocus]?.focus();
    }, 0);
  };

  const handleAddAll = () => {
    if (data && data.soNumbers.length > 0) {
      setInputs([...data.soNumbers]);
      setFocusedIndex(data.soNumbers.length - 1);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  };

  const clearAll = () => {
      setInputs(Array(3).fill(''));
      setFocusedIndex(0);
  };

  const handleGenerate = () => {
    if (hasErrors) return;
    
    let validOrders: string[] = [];
    
    if (isBulkMode && data) {
       // If in bulk mode (Filtered but no specific manual input), use ALL orders from the filtered dataset
       validOrders = data.soNumbers;
    } else {
       validOrders = inputs.map(i => i.trim()).filter(Boolean);
    }

    if (validOrders.length > 0) {
      onGenerate(validOrders);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (index < inputs.length - 1) {
        inputRefs.current[index + 1]?.focus();
      } else {
        addInput();
      }
    }
  };

  const totalOrders = data?.soNumbers.length || 0;
  const isButtonDisabled = !data || hasErrors || (hasEmptySelection && !isBulkMode);

  return (
    <div className={`flex flex-col h-full overflow-hidden transition-colors duration-300 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
      {/* Header - Fixed */}
      <div className={`px-3 py-2 border-b flex justify-between items-center flex-shrink-0 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-100 bg-gray-50/50'}`}>
        <h2 className={`text-xs font-bold uppercase tracking-wider flex items-center ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
          <Search className={`w-3.5 h-3.5 mr-1.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`} />
          {t.selectOrders}
        </h2>
        {data && (
           <div className="flex items-center gap-1.5">
             <button
               onClick={handleAddAll}
               className={`text-[9px] px-1.5 py-0.5 rounded border transition-colors font-medium
                 ${isDark
                   ? 'border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
                   : 'border-blue-200 text-blue-600 hover:bg-blue-50'
                 }`}
               title="Add all available orders"
             >
               Add All
             </button>
             <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600'}`}>
               {totalOrders} {t.avail}
             </span>
           </div>
        )}
      </div>

      {/* Content Container - Flex-1 to fill space */}
      <div className="p-3 flex flex-col gap-3 flex-1 min-h-0">
        
        {/* Input List - Flex-1 to scroll independently and push buttons down */}
        <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar pr-1 min-h-0">
            {inputs.map((value, index) => {
                const valTrim = value.trim();
                // Is Valid?
                const isValid = data && valTrim !== '' && validOrdersSet.has(valTrim);
                
                // Is Error?
                const isInvalid = data && valTrim !== '' && !validOrdersSet.has(valTrim);
                const count = inputs.filter(v => v.trim() === valTrim && valTrim !== '').length;
                const isDuplicate = count > 1;
                const isError = isInvalid || isDuplicate;

                const isFocused = focusedIndex === index;

                return (
                    <div 
                        key={index} 
                        className={`
                            flex items-center gap-1.5 p-0.5 rounded transition-colors duration-200
                            ${isFocused 
                                ? (isDark ? 'bg-blue-900/20 ring-1 ring-blue-500/50' : 'bg-blue-50 ring-1 ring-blue-400/50') 
                                : ''
                            }
                        `}
                    >
                        <span className={`text-[9px] font-mono w-4 text-right flex-shrink-0 transition-colors ${isError ? 'text-red-500 font-bold' : (isFocused ? 'text-blue-500 font-bold' : 'text-gray-400')}`}>
                            {index + 1}
                        </span>
                        
                        <div className="relative w-full">
                            <input
                            ref={el => { inputRefs.current[index] = el; }}
                            type="text"
                            value={value}
                            disabled={!data}
                            // autoFocus prevents the black box on some browsers, onClick selects text
                            autoComplete="off"
                            onFocus={() => setFocusedIndex(index)}
                            onClick={(e) => e.currentTarget.select()}
                            onChange={(e) => handleInputChange(index, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            placeholder={data ? "SO Number..." : "-"}
                            className={`
                                block w-full rounded shadow-sm text-xs py-1.5 px-2.5 border outline-none
                                transition-all duration-200
                                ${isError 
                                    ? (isDark ? 'bg-red-900/20 border-red-500 text-red-200' : 'bg-red-50 border-red-300 text-red-900')
                                    : isValid
                                        ? (isDark ? 'bg-emerald-900/20 border-emerald-500/50 text-emerald-400 font-bold' : 'bg-emerald-50 border-emerald-400 text-emerald-800 font-bold')
                                        : (isDark ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900')
                                }
                                placeholder-gray-400
                                focus:ring-0
                                ${isValid ? 'pr-7' : ''}
                            `}
                            list={value.length < 2 ? undefined : "so-options"} 
                            />
                            {isValid && (
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none animate-fadeIn">
                                    <Check className={`w-3 h-3 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
            {data && (
                <datalist id="so-options">
                    {data.soNumbers.map(so => <option key={so} value={so} />)}
                </datalist>
            )}
        </div>

        {/* Buttons Section - Fixed at the bottom of the card via flex layout */}
        <div className="flex-shrink-0 space-y-3 pt-2">
            <div className={`flex space-x-1.5 pt-2 border-t ${isDark ? 'border-slate-700' : 'border-gray-100'}`}>
            <button
                onClick={addInput}
                disabled={!data}
                className={`flex-1 inline-flex items-center justify-center px-2 py-1 border shadow-sm text-[10px] font-medium rounded focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50
                    ${isDark 
                        ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600' 
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }
                `}
            >
                <Plus className="w-3 h-3 mr-1" /> {t.add}
            </button>
            <button
                onClick={removeInput}
                disabled={!data || inputs.length <= 1}
                className={`flex-1 inline-flex items-center justify-center px-2 py-1 border shadow-sm text-[10px] font-medium rounded focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50 transition-all
                    ${isDark 
                        ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-red-900/30 hover:border-red-800 hover:text-red-300' 
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700'
                    }
                `}
                title={focusedIndex !== null ? "Remove Selected" : "Remove Last"}
            >
                <Minus className="w-3 h-3 mr-1" /> 
                {focusedIndex !== null && inputs[focusedIndex] !== '' ? t.remove : t.remove}
            </button>
            <button
                onClick={clearAll}
                disabled={!data}
                className={`inline-flex items-center justify-center px-2 py-1 border shadow-sm text-[10px] font-medium rounded disabled:opacity-50
                    ${isDark 
                        ? 'bg-slate-700 border-slate-600 text-slate-400 hover:text-red-400 hover:bg-slate-600' 
                        : 'bg-white border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50'
                    }
                `}
                title="Clear All"
            >
                <Trash2 className="w-3 h-3" />
            </button>
            </div>

            {hasInvalidErrors && (
            <div className={`mt-1 p-2 rounded-md text-[10px] flex gap-2 items-start border ${isDark ? 'bg-red-900/20 border-red-800 text-red-200' : 'bg-red-50 border-red-100 text-red-700'} animate-fadeIn`}>
                <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <div>
                <p className="font-bold">{t.invalidOrderTitle}</p>
                <div className="opacity-90 leading-tight mt-0.5">
                    <p>
                    Check: <span className="font-mono font-semibold underline decoration-red-400/50">{uniqueInvalidValues.join(', ')}</span>.
                    </p>
                </div>
                </div>
            </div>
            )}

            {hasDuplicateErrors && (
            <div className={`mt-1 p-2 rounded-md text-[10px] flex gap-2 items-start border ${isDark ? 'bg-orange-900/20 border-orange-800 text-orange-200' : 'bg-orange-50 border-orange-100 text-orange-700'} animate-fadeIn`}>
                <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <div>
                <p className="font-bold">{t.duplicateOrderTitle}</p>
                <div className="opacity-90 leading-tight mt-0.5">
                    <p>
                    Check: <span className="font-mono font-semibold underline decoration-orange-400/50">{uniqueDuplicateValues.join(', ')}</span>.
                    </p>
                </div>
                </div>
            </div>
            )}

            <button
            onClick={handleGenerate}
            disabled={isButtonDisabled}
            className={`
                w-full flex items-center justify-center px-4 py-2 border border-transparent 
                text-sm font-medium rounded-md text-white shadow-sm
                transition-all duration-200 mt-0.5
                ${isButtonDisabled
                ? (isDark ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed')
                : (isBulkMode 
                    ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-md active:translate-y-0.5' 
                    : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md active:translate-y-0.5')
                }
            `}
            >
            {isBulkMode ? (
                <>
                    <Layers className="w-3.5 h-3.5 mr-1.5" />
                    Generate All ({totalOrders})
                </>
            ) : (
                <>
                    {t.generate}
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </>
            )}
            </button>

            {hasResult && (
                <button
                    onClick={onClear}
                    className={`w-full flex items-center justify-center px-4 py-1.5 mt-1 border text-xs font-medium rounded-md shadow-sm transition-colors duration-200
                        ${isDark 
                            ? 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-red-400' 
                            : 'border-gray-300 text-gray-600 bg-white hover:bg-gray-50 hover:text-red-600'
                        }
                    `}
                >
                    <Eraser className="w-3.5 h-3.5 mr-1.5" />
                    {t.clearResult}
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default OrderSelector;