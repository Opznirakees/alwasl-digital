'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '@/contexts/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Game, GameCategory } from '@/types';
import { categoryLabels } from '@/data/mock-data';
import { Gift, Gamepad2, MessageCircle, Play, ShoppingCart, Sparkles, Ticket, TrendingUp } from 'lucide-react';

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
    <div className={`relative overflow-hidden bg-[#f5f5f7] border border-black/10 ${compact ? 'h-14 w-14 rounded-lg' : 'aspect-[4/3]'}`}>
      <div className="absolute inset-0 bg-white" />
      <div className="absolute left-3 top-3 flex items-center gap-2">
        <div className={`${compact ? 'h-6 w-6' : 'h-9 w-9'} relative rounded-md bg-white shadow-sm border border-black/10`}>
          <Image
            src="/brand/alwasl-mark.jpg"
            alt=""
            fill
            className="object-contain p-1"
            sizes={compact ? '24px' : '36px'}
          />
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`${compact ? 'h-8 w-8' : 'h-16 w-16'} rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center`}>
          <Icon className={compact ? 'h-4 w-4' : 'h-8 w-8'} />
        </div>
      </div>
      {!compact && (
        <div className="absolute bottom-3 left-3 right-3 h-1 rounded-full bg-blue-600 opacity-80" />
      )}
    </div>
  );
}

export function GameCard({ game, variant = 'default' }: GameCardProps) {
  const { t, language, selectedCountry, theme } = useApp();
  const isLight = theme === 'light';

  const lowestPrice = Math.min(...game.packages.filter(p => p.inStock).map(p => p.salePrice || p.basePrice));
  const hasSale = game.packages.some(p => p.salePrice);
  const locale = language === 'ar' ? 'ar-IQ' : language === 'zh' ? 'zh-CN' : 'en-IQ';

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale).format(price);
  };

  if (variant === 'compact') {
    return (
      <Link href={`/games/${game.slug}`}>
        <div className={`group relative flex items-center gap-4 rounded-lg border p-3 transition-all duration-200 ${
          isLight
            ? 'bg-white border-black/10 hover:border-blue-300 hover:shadow-sm'
            : 'bg-white border-black/10 hover:border-blue-300 hover:shadow-sm'
        }`}>
          <ServiceVisual game={game} compact />
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-sm truncate transition-colors ${
              isLight ? 'text-zinc-950 group-hover:text-blue-700' : 'text-zinc-950 group-hover:text-blue-700'
            }`}>
              {t(game.name, game.nameAr)}
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
              {t('From', 'من')} {formatPrice(lowestPrice)} {selectedCountry.currencySymbol}
            </p>
          </div>
          {game.isPopular && (
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/games/${game.slug}`}>
      <div className="group relative overflow-hidden product-card card-hover">
        {/* Image Container */}
        <div className="relative">
          <ServiceVisual game={game} />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {hasSale && (
              <span className="badge-sale flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {t('Sale', 'خصم')}
              </span>
            )}
            {game.isFeatured && (
              <span className="badge-popular">
                {t('Featured', 'مميز')}
              </span>
            )}
          </div>

          {/* Category Badge */}
          <div className="absolute bottom-3 left-3">
            <Badge variant="outline" className={`text-[10px] px-2 py-0.5 rounded-md backdrop-blur-sm ${
              isLight
                ? 'bg-white/90 text-zinc-700 border-black/10'
                : 'bg-white/90 text-zinc-700 border-black/10'
            }`}>
              {t(categoryLabels[game.category].en, categoryLabels[game.category].ar)}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <h3 className={`font-bold text-base transition-colors line-clamp-1 ${
            isLight ? 'text-zinc-950 group-hover:text-blue-700' : 'text-zinc-950 group-hover:text-blue-700'
          }`}>
            {t(game.name, game.nameAr)}
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <p className={`text-[10px] uppercase tracking-wider ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
                {t('Starting from', 'يبدأ من')}
              </p>
              <p className="text-xl font-semibold text-zinc-950">
                {formatPrice(lowestPrice)}
                <span className={`text-xs ml-1 ${isLight ? 'text-zinc-500' : 'text-zinc-500'}`}>
                  {selectedCountry.currencySymbol}
                </span>
              </p>
            </div>

            <Button
              size="sm"
              className="rounded-md bg-blue-600 px-4 text-white shadow-none transition-all duration-200 hover:bg-blue-700"
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
