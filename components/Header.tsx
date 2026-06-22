import React, { useState } from 'react';
import { Moon, Sun, Globe, BookOpen } from 'lucide-react';
import { Language, translations } from '../utils/translations';
import TutorialModal from './TutorialModal';

interface HeaderProps {
  lang: Language;
  setLang: (l: Language) => void;
  isDark: boolean;
  setIsDark: (d: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ lang, setLang, isDark, setIsDark }) => {
  const t = translations[lang];
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);

  return (
    <>
      <header className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} shadow-sm border-b transition-colors duration-300`}>
        <div className="w-full px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src="/pma LOGO.ico"
              alt="PMA Logo"
              className="h-10 w-auto object-contain"
            />
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className={`text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.appTitle}</h1>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-700 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                  v2.6
                </span>
              </div>
              <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{t.appSubtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTutorialOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                ${isDark ? 'bg-slate-700 border-slate-600 text-blue-300 hover:bg-slate-600' : 'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100'}
              `}
            >
              <BookOpen className="w-3.5 h-3.5" />
              {t.tutorial}
            </button>

            <div className={`flex items-center rounded-lg p-1 border ${isDark ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
              <Globe className={`w-4 h-4 ml-1.5 mr-1 ${isDark ? 'text-slate-400' : 'text-gray-400'}`} />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value as Language)}
                className={`bg-transparent border-none text-xs font-medium focus:ring-0 cursor-pointer ${isDark ? 'text-slate-200' : 'text-gray-700'}`}
              >
                <option value="en">English</option>
                <option value="my">Burmese</option>
                <option value="tw">Chinese</option>
              </select>
            </div>

            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-700 text-yellow-400 hover:bg-slate-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>
      <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} lang={lang} isDark={isDark} />
    </>
  );
};

export default Header;