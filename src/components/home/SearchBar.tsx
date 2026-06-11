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
  const { t, dir } = useApp();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative w-full max-w-md">
      <div
        className={`relative flex items-center rounded-lg transition-colors ${
          isFocused
            ? 'bg-white ring-2 ring-blue-500/25 border border-blue-300'
            : 'bg-white/80 border border-black/10 hover:border-blue-200'
        }`}
      >
        <Search className={`absolute ${dir === 'rtl' ? 'right-4' : 'left-4'} w-5 h-5 text-zinc-400`} />
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={t('Search WAHO top-up amounts...', 'ابحث عن مبالغ شحن WAHO...', '搜索 WAHO 充值金额...')}
          className={`w-full bg-transparent border-0 ${dir === 'rtl' ? 'pr-12 pl-10' : 'pl-12 pr-10'} py-3 text-zinc-950 placeholder:text-zinc-400 focus-visible:ring-0 focus-visible:ring-offset-0`}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className={`absolute ${dir === 'rtl' ? 'left-4' : 'right-4'} w-5 h-5 rounded-full flex items-center justify-center bg-zinc-100 transition-colors hover:bg-zinc-200`}
          >
            <X className="w-3 h-3 text-zinc-600" />
          </button>
        )}
      </div>
    </div>
  );
}
