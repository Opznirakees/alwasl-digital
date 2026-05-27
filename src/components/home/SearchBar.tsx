'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ value, onChange }: SearchBarProps) {
  const { t, dir, theme } = useApp();
  const [isFocused, setIsFocused] = useState(false);
  const isLight = theme === 'light';

  return (
    <div className="relative w-full max-w-md">
      <div
        className={`relative flex items-center rounded-xl transition-all duration-300 ${
          isFocused
            ? isLight
              ? 'bg-white ring-2 ring-purple-400 shadow-lg shadow-purple-100'
              : 'bg-[#1e1433] ring-2 ring-purple-500/40 shadow-lg shadow-purple-500/10'
            : isLight
              ? 'bg-white/80 border border-purple-200 hover:border-purple-300'
              : 'bg-[#1a1225]/80 border border-purple-500/10 hover:border-purple-500/20'
        }`}
      >
        <Search className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} w-5 h-5 ${isLight ? 'text-purple-400' : 'text-purple-400/60'}`} />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={t('Search games, gift cards...', 'ابحث عن الألعاب، البطاقات...')}
          className={`w-full bg-transparent border-0 ${dir === 'rtl' ? 'pr-12 pl-10' : 'pl-12 pr-10'} py-3 focus-visible:ring-0 focus-visible:ring-offset-0 ${
            isLight ? 'text-slate-800 placeholder:text-slate-400' : 'text-white placeholder:text-white/30'
          }`}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className={`absolute ${dir === 'rtl' ? 'left-4' : 'right-4'} w-5 h-5 rounded-full flex items-center justify-center transition-colors ${
              isLight ? 'bg-purple-100 hover:bg-purple-200' : 'bg-purple-500/20 hover:bg-purple-500/30'
            }`}
          >
            <X className={`w-3 h-3 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
          </button>
        )}
      </div>
    </div>
  );
}
