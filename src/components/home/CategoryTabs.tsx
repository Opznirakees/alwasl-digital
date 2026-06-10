'use client';

import { useApp } from '@/contexts/AppContext';
import { categoryLabels } from '@/data/mock-data';
import type { GameCategory } from '@/types';
import {
  Gamepad2,
  Monitor,
  Gift,
  Play,
  MessageCircle,
  Ticket,
  LayoutGrid,
} from 'lucide-react';

interface CategoryTabsProps {
  selectedCategory: GameCategory | 'all';
  onSelectCategory: (category: GameCategory | 'all') => void;
}

const categoryIcons: Record<GameCategory | 'all', React.ReactNode> = {
  all: <LayoutGrid className="w-4 h-4" />,
  mobile_game: <Gamepad2 className="w-4 h-4" />,
  pc_game: <Monitor className="w-4 h-4" />,
  console: <Gamepad2 className="w-4 h-4" />,
  gift_card: <Gift className="w-4 h-4" />,
  streaming: <Play className="w-4 h-4" />,
  social_media: <MessageCircle className="w-4 h-4" />,
  voucher: <Ticket className="w-4 h-4" />,
};

export function CategoryTabs({ selectedCategory, onSelectCategory }: CategoryTabsProps) {
  const { t, theme } = useApp();
  const isLight = theme === 'light';

  const categories: (GameCategory | 'all')[] = [
    'all',
    'social_media',
    'gift_card',
    'streaming',
    'mobile_game',
    'voucher',
  ];

  const getCategoryLabel = (category: GameCategory | 'all') => {
    if (category === 'all') {
      return t('All', 'الكل');
    }
    return t(categoryLabels[category].en, categoryLabels[category].ar);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-300 ${
              selectedCategory === category
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                : isLight
                  ? 'bg-white/80 text-slate-600 hover:bg-white hover:text-slate-900 border border-purple-100 hover:border-purple-200'
                  : 'bg-[#1a1225]/80 text-white/70 hover:bg-[#1a1225] hover:text-white border border-purple-500/10 hover:border-purple-500/30'
            }`}
          >
            {categoryIcons[category]}
            <span>{getCategoryLabel(category)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
