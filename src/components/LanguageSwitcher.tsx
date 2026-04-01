import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';

const languages = [
  { code: 'he', name: 'עברית', flag: '🇮🇱' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
    
    // Update document direction for RTL
    const isRTL = code === 'he' || code === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        title="שפה"
      >
        <Globe className="w-4 h-4 text-gray-400" />
        <span className="text-sm">{currentLanguage.flag}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-gray-800 rounded-xl shadow-xl border border-gray-700 py-2 min-w-[150px] z-50">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center justify-between px-4 py-2 hover:bg-gray-700 transition-colors ${
                i18n.language === lang.code ? 'text-cyan-400' : 'text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span className="text-sm">{lang.name}</span>
              </div>
              {i18n.language === lang.code && (
                <Check className="w-4 h-4" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
