import React from 'react';
import { X, BookOpen, Upload, Settings2, Search, Download, Info, AlertTriangle, Code2, Link, Github, HardDrive } from 'lucide-react';
import { Language, translations } from '../utils/translations';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
  isDark: boolean;
}

const TutorialModal: React.FC<TutorialModalProps> = ({ isOpen, onClose, lang, isDark }) => {
  if (!isOpen) return null;
  const t = translations[lang];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className={`relative w-full max-w-3xl rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col ${isDark ? 'bg-slate-800 text-white' : 'bg-white text-gray-900'}`}>
        
        {/* Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center sticky top-0 z-20 shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
               <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{t.tutorialTitle}</h2>
              <p className={`text-xs font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                {t.appVersion} • {t.releaseDate}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-full hover:bg-opacity-80 transition-colors ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8 overflow-y-auto">
          
          {/* What is Section */}
          <div className={`p-5 rounded-lg border ${isDark ? 'bg-slate-700/30 border-slate-700' : 'bg-blue-50/50 border-blue-100'}`}>
            <h3 className="text-base font-bold mb-2 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                <Info className="w-4 h-4" />
                {t.whatIsTitle}
            </h3>
            <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                {t.whatIsDesc}
            </p>
          </div>

          {/* Steps */}
          <div>
             <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 border-b pb-2 ${isDark ? 'border-slate-700 text-slate-200' : 'border-gray-100 text-gray-800'}`}>
                {t.howToTitle}
             </h3>
             
             <div className="space-y-6 relative">
                 {/* Connecting Line */}
                <div className={`absolute left-4 top-4 bottom-4 w-0.5 ${isDark ? 'bg-slate-700' : 'bg-gray-100'}`}></div>

                {/* Step 1 */}
                <div className="flex gap-4 relative">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 border-4 ${isDark ? 'bg-slate-800 border-slate-700 text-blue-400' : 'bg-white border-blue-50 text-blue-600 shadow-sm'}`}>1</div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-sm flex items-center gap-2">{t.step1} <Upload className="w-3.5 h-3.5 opacity-40"/></h4>
                        <p className={`text-sm mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t.step1Desc}</p>
                    </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 relative">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 border-4 ${isDark ? 'bg-slate-800 border-slate-700 text-blue-400' : 'bg-white border-blue-50 text-blue-600 shadow-sm'}`}>2</div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-sm flex items-center gap-2">{t.step2} <Settings2 className="w-3.5 h-3.5 opacity-40"/></h4>
                        <p className={`text-sm mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t.step2Desc}</p>
                    </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 relative">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 border-4 ${isDark ? 'bg-slate-800 border-slate-700 text-blue-400' : 'bg-white border-blue-50 text-blue-600 shadow-sm'}`}>3</div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-sm flex items-center gap-2">{t.step3} <Search className="w-3.5 h-3.5 opacity-40"/></h4>
                        <p className={`text-sm mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t.step3Desc}</p>
                    </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4 relative">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm z-10 border-4 ${isDark ? 'bg-slate-800 border-slate-700 text-blue-400' : 'bg-white border-blue-50 text-blue-600 shadow-sm'}`}>4</div>
                    <div className="flex-1">
                        <h4 className="font-semibold text-sm flex items-center gap-2">{t.step4} <Download className="w-3.5 h-3.5 opacity-40"/></h4>
                        <p className={`text-sm mt-1 leading-relaxed ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t.step4Desc}</p>
                    </div>
                </div>
             </div>
          </div>

          {/* Notes / Troubleshooting */}
          <div className={`p-4 rounded-lg border ${isDark ? 'bg-amber-900/10 border-amber-900/30' : 'bg-amber-50 border-amber-100'}`}>
            <h3 className={`text-sm font-bold flex items-center gap-2 mb-2 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                <AlertTriangle className="w-4 h-4" />
                {t.notesTitle}
            </h3>
            <ul className={`list-disc list-inside space-y-1 text-sm ${isDark ? 'text-amber-200/80' : 'text-amber-800/80'}`}>
                {t.notesList.map((note, idx) => (
                    <li key={idx} className="leading-snug">{note}</li>
                ))}
            </ul>
          </div>
          
          {/* Version Control & Source Code Section */}
          <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 border-b pb-2 ${isDark ? 'border-slate-700 text-slate-200' : 'border-gray-100 text-gray-800'}`}>
                <Link className="w-4 h-4 inline-block mr-2" />
                {t.versionControlTitle}
              </h3>
              <div className="grid grid-cols-1 gap-4">
                  {/* Local Archive */}
                  <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <HardDrive className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                        <h4 className="text-sm font-bold">{t.localArchiveTitle}</h4>
                      </div>
                      <p className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{t.localArchiveDesc}</p>
                      <a href={t.localArchiveUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline break-all font-mono">
                          {t.localArchiveUrl}
                      </a>
                  </div>

                  {/* Global Repo 1 */}
                  <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Github className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-900'}`} />
                        <h4 className="text-sm font-bold">{t.globalRepoTitle}</h4>
                      </div>
                      <p className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{t.globalRepoDesc}</p>
                      <a href={t.globalRepoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline break-all font-mono">
                          {t.globalRepoUrl}
                      </a>
                  </div>

                  {/* Global Repo 2 */}
                  <div className={`p-4 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Github className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-900'}`} />
                        <h4 className="text-sm font-bold">{t.globalRepo2Title}</h4>
                      </div>
                      <p className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{t.globalRepo2Desc}</p>
                      <a href={t.globalRepo2Url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline break-all font-mono">
                          {t.globalRepo2Url}
                      </a>
                  </div>
              </div>
          </div>

          {/* Developer Note */}
          <div className={`mt-4 pt-6 border-t ${isDark ? 'border-slate-700' : 'border-gray-200'}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  <Code2 className="w-3.5 h-3.5" />
                  {t.devNoteTitle}
              </h3>
              <div className={`text-xs font-mono space-y-3 p-5 rounded-lg border ${isDark ? 'bg-slate-900/50 border-slate-700 text-slate-400' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                  <p className="whitespace-pre-line leading-relaxed">
                    {t.devNoteContent}
                  </p>
              </div>
          </div>

        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex justify-end sticky bottom-0 z-20 ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
            <button 
                onClick={onClose}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm ${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700'}`}
            >
                {t.close}
            </button>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;