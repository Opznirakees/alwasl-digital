'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '@/contexts/AppContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Game } from '@/types';
import { categoryLabels } from '@/data/mock-data';
import { Sparkles, TrendingUp, ShoppingCart, Heart } from 'lucide-react';

interface GameCardProps {
  game: Game;
  variant?: 'default' | 'compact';
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
        <div className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 hover:shadow-lg ${
          isLight
            ? 'bg-white border-purple-200/50 hover:border-purple-300 hover:shadow-purple-100'
            : 'bg-gradient-to-br from-[#1e1433] to-[#15102a] border-purple-500/10 hover:border-purple-500/30 hover:shadow-purple-500/10'
        }`}>
          <div className={`relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 ring-2 transition-all ${
            isLight ? 'ring-purple-200 group-hover:ring-purple-300' : 'ring-purple-500/20 group-hover:ring-purple-500/40'
          }`}>
            <Image
              src={game.image}
              alt={t(game.name, game.nameAr)}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-sm truncate transition-colors ${
              isLight ? 'text-slate-800 group-hover:text-purple-600' : 'text-white group-hover:text-purple-400'
            }`}>
              {t(game.name, game.nameAr)}
            </h3>
            <p className={`text-xs mt-0.5 ${isLight ? 'text-purple-600' : 'text-purple-400/60'}`}>
              {t('From', 'من')} {formatPrice(lowestPrice)} {selectedCountry.currencySymbol}
            </p>
          </div>
          {game.isPopular && (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/games/${game.slug}`}>
      <div className="group relative rounded-2xl overflow-hidden product-card card-hover">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={game.image}
            alt={t(game.name, game.nameAr)}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-700"
          />
          <div className={`absolute inset-0 ${
            isLight
              ? 'bg-gradient-to-t from-white via-white/40 to-transparent'
              : 'bg-gradient-to-t from-[#0d0a14] via-[#0d0a14]/40 to-transparent'
          }`} />

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

          {/* Favorite Button */}
          <button className={`absolute top-3 right-3 w-8 h-8 rounded-full backdrop-blur-sm flex items-center justify-center transition-all ${
            isLight
              ? 'bg-white/70 text-slate-500 hover:text-pink-500 hover:bg-white'
              : 'bg-black/30 text-white/70 hover:text-pink-400 hover:bg-black/50'
          }`}>
            <Heart className="w-4 h-4" />
          </button>

          {/* Category Badge */}
          <div className="absolute bottom-3 left-3">
            <Badge variant="outline" className={`text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm ${
              isLight
                ? 'bg-white/70 text-purple-600 border-purple-200'
                : 'bg-black/40 text-purple-300 border-purple-500/30'
            }`}>
              {t(categoryLabels[game.category].en, categoryLabels[game.category].ar)}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <h3 className={`font-bold text-base transition-colors line-clamp-1 ${
            isLight ? 'text-slate-800 group-hover:text-purple-600' : 'text-white group-hover:text-purple-400'
          }`}>
            {t(game.name, game.nameAr)}
          </h3>

          <div className="flex items-center justify-between">
            <div>
              <p className={`text-[10px] uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-purple-400/50'}`}>
                {t('Starting from', 'يبدأ من')}
              </p>
              <p className="text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                {formatPrice(lowestPrice)}
                <span className={`text-xs ml-1 ${isLight ? 'text-slate-500' : 'text-purple-400/60'}`}>
                  {selectedCountry.currencySymbol}
                </span>
              </p>
            </div>

            <Button
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl px-4 shadow-lg shadow-purple-500/25 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0"
            >
              <ShoppingCart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
