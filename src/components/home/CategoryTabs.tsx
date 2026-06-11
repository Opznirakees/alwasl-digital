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
  const { t } = useApp();

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
      <div className="-mx-4 overflow-x-auto px-4 pb-1 scrollbar-hide sm:mx-0 sm:px-0">
        <div className="inline-flex min-w-full items-center gap-1 rounded-lg bg-zinc-200/70 p-1">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? 'bg-white text-zinc-950 shadow-sm'
                : 'text-zinc-600 hover:bg-white/60 hover:text-zinc-950'
            }`}
          >
            {categoryIcons[category]}
            <span>{getCategoryLabel(category)}</span>
          </button>
        ))}
        </div>
      </div>
    </div>
  );
}
