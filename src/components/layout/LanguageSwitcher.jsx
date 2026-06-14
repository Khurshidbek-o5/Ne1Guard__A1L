import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const languages = ['uz', 'ru', 'en'];
  const labels = {
    uz: 'UZB',
    ru: 'RUS',
    en: 'ENG'
  };

  const toggleLanguage = () => {
    const currentIndex = languages.indexOf(i18n.language);
    const nextIndex = (currentIndex + 1) % languages.length;
    const newLang = languages[nextIndex];
    i18n.changeLanguage(newLang);
    localStorage.setItem('i18nextLng', newLang);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className={cn(
        "flex items-center gap-2 h-8 px-3 rounded-full border border-border/50 bg-secondary/30 hover:bg-secondary/50 transition-all",
        "font-mono text-[10px] font-bold tracking-wider"
      )}
    >
      <Globe className="h-3 w-3 text-primary" />
      <span className="uppercase">{labels[i18n.language] || labels[i18n.fallbackLng] || 'UZB'}</span>
    </Button>
  );
}
