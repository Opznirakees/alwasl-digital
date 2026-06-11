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
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md border text-sm font-medium whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-white/80 text-zinc-600 border-black/10 hover:bg-white hover:text-zinc-950 hover:border-blue-200'
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
