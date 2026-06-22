import React, { useState, useMemo } from 'react';
import { Filter, Search, CheckSquare, Square } from 'lucide-react';
import { Language, translations } from '../utils/translations';

interface ArticleFilterProps {
  articles: string[];
  selectedArticles: string[];
  onChange: (articles: string[]) => void;
  lang: Language;
  isDark: boolean;
  disabled?: boolean;
}

const ArticleFilter: React.FC<ArticleFilterProps> = ({ 
  articles, 
  selectedArticles, 
  onChange, 
  lang, 
  isDark,
  disabled 
}) => {
  const t = translations[lang];
  const [searchTerm, setSearchTerm] = useState('');

  const filteredArticles = useMemo(() => {
    return articles.filter(a => a.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [articles, searchTerm]);

  const toggleArticle = (article: string) => {
    const newSelection = selectedArticles.includes(article)
      ? selectedArticles.filter(a => a !== article)
      : [...selectedArticles, article];
    onChange(newSelection);
  };

  const clearSelection = () => onChange([]);
  
  if (articles.length === 0) return null;

  return (
    <div className={`flex flex-col h-full transition-colors duration-300 ${isDark ? 'bg-slate-800' : 'bg-white'}`}>
      {/* Header - Fixed */}
      <div className={`px-3 py-2 border-b flex justify-between items-center flex-shrink-0 ${isDark ? 'border-slate-700 bg-slate-800' : 'border-gray-100 bg-gray-50/50'}`}>
         <h2 className={`text-xs font-bold uppercase tracking-wider flex items-center ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
           <Filter className={`w-3.5 h-3.5 mr-1.5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
           {t.filterArticle || "Filter"}
         </h2>
         {selectedArticles.length > 0 && (
             <button onClick={clearSelection} className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${isDark ? 'text-red-400 border-transparent hover:bg-red-900/30' : 'text-gray-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200 border-transparent'}`}>
                 {t.clearFilter} ({selectedArticles.length})
             </button>
         )}
      </div>
      
      {/* Content Area - Fills remaining space */}
      <div className="flex-1 flex flex-col min-h-0">
          {!disabled ? (
              <div className="flex flex-col h-full p-2">
                {articles.length > 5 && (
                    <div className="relative mb-2 flex-shrink-0">
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder={t.searchArticle} 
                            className={`w-full text-xs rounded border px-2 py-1 pl-6 outline-none focus:ring-1 focus:ring-blue-500 ${isDark ? 'bg-slate-900 border-slate-600 text-white placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                        />
                        <Search className={`absolute left-1.5 top-1.5 w-3 h-3 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                    </div>
                )}
                
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-0.5 min-h-0">
                    {filteredArticles.map(article => {
                        const isSelected = selectedArticles.includes(article);
                        return (
                            <div 
                                key={article} 
                                onClick={() => toggleArticle(article)}
                                className={`flex items-center gap-2 px-1.5 py-1 rounded cursor-pointer select-none transition-colors ${
                                    isSelected 
                                    ? (isDark ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-50 text-blue-800') 
                                    : (isDark ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-gray-50 text-gray-600')
                                }`}
                            >
                                {isSelected 
                                    ? <CheckSquare className="w-3 h-3 text-blue-500 flex-shrink-0" /> 
                                    : <Square className="w-3 h-3 text-gray-300 dark:text-slate-600 flex-shrink-0" />
                                }
                                <span className="text-xs truncate" title={article}>{article}</span>
                            </div>
                        );
                    })}
                    {filteredArticles.length === 0 && (
                        <div className="text-xs text-center text-gray-400 py-1">{t.noArticles}</div>
                    )}
                </div>
              </div>
          ) : (
            <div className="p-3 text-center text-xs text-gray-400">
               Select a data source first.
            </div>
          )}
      </div>
    </div>
  );
};

export default ArticleFilter;