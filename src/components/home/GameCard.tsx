'use client';

import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Game, GameCategory } from '@/types';
import { categoryLabels } from '@/data/mock-data';
import { ArrowRight, Gift, Gamepad2, MessageCircle, Play, Sparkles, Ticket, TrendingUp } from 'lucide-react';

interface GameCardProps {
  game: Game;
  variant?: 'default' | 'compact';
}

const categoryIcons: Record<GameCategory, React.ComponentType<{ className?: string }>> = {
  mobile_game: Gamepad2,
  pc_game: Gamepad2,
  console: Gamepad2,
  gift_card: Gift,
  streaming: Play,
  social_media: MessageCircle,
  voucher: Ticket,
};

function ServiceVisual({ game, compact = false }: { game: Game; compact?: boolean }) {
  const Icon = categoryIcons[game.category] || Sparkles;

  return (
    <div className={`relative overflow-hidden border border-black/10 bg-[#f5f5f7] ${compact ? 'h-12 w-12 rounded-lg' : 'aspect-[5/3]'}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`${compact ? 'h-8 w-8' : 'h-14 w-14'} flex items-center justify-center rounded-lg bg-white text-blue-600 ring-1 ring-black/10`}>
          <Icon className={compact ? 'h-4 w-4' : 'h-7 w-7'} />
        </div>
      </div>
      {!compact && (
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-medium uppercase text-zinc-400">
          <span>WAHO</span>
          <span>{game.publisher}</span>
        </div>
      )}
    </div>
  );
}

export function GameCard({ game, variant = 'default' }: GameCardProps) {
  const { t, language, selectedCountry } = useApp();

  const lowestPrice = Math.min(...game.packages.filter(p => p.inStock).map(p => p.salePrice || p.basePrice));
  const locale = language === 'ar' ? 'ar-IQ' : language === 'zh' ? 'zh-CN' : 'en-IQ';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale).format(price);
  };

  if (variant === 'compact') {
    return (
      <Link href={`/games/${game.slug}`}>
        <div className="group relative flex items-center gap-4 rounded-lg border border-black/10 bg-white p-3 transition-colors hover:border-blue-300">
          <ServiceVisual game={game} compact />
          <div className="flex-1 min-w-0">
            <h3 className="truncate text-sm font-semibold text-zinc-950 transition-colors group-hover:text-blue-700">
              {t(game.name, game.nameAr)}
            </h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              {t('From', 'من')} {formatPrice(lowestPrice)} {selectedCountry.currencySymbol}
            </p>
          </div>
          {game.isPopular && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/games/${game.slug}`}>
      <div className="group relative h-full overflow-hidden product-card">
        <div className="relative">
          <ServiceVisual game={game} />
        </div>

        <div className="p-4">
          <Badge variant="outline" className="mb-3 rounded-md border-black/10 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-600">
            {t(categoryLabels[game.category].en, categoryLabels[game.category].ar)}
          </Badge>

          <h3 className="line-clamp-1 text-base font-semibold text-zinc-950 transition-colors group-hover:text-blue-700">
            {t(game.name, game.nameAr)}
          </h3>

          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] uppercase text-zinc-500">
                {t('Starting from', 'يبدأ من')}
              </p>
              <p className="text-xl font-semibold text-zinc-950">
                {formatPrice(lowestPrice)}
                <span className="ml-1 text-xs text-zinc-500">
                  {selectedCountry.currencySymbol}
                </span>
              </p>
            </div>

            <Button
              size="sm"
              className="rounded-md bg-zinc-100 px-3 text-blue-600 shadow-none transition-colors hover:bg-blue-50"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
