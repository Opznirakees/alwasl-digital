'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { banners, games } from '@/data/mock-data';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export function HeroBanner() {
  const { t, dir, theme } = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);
  const activeBanners = banners.filter(b => b.isActive);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  if (activeBanners.length === 0) return null;

  const currentBanner = activeBanners[currentIndex];
  const linkedGame = currentBanner.gameId
    ? games.find((game) => game.id === currentBanner.gameId)
    : null;

  const isLight = theme === 'light';
  const overlayFrom = isLight ? 'rgba(248, 246, 252, 0.95)' : 'rgba(13, 10, 20, 0.95)';
  const overlayVia = isLight ? 'rgba(248, 246, 252, 0.7)' : 'rgba(13, 10, 20, 0.7)';
  const overlayBottom = isLight ? 'rgba(248, 246, 252, 0.9)' : 'rgba(13, 10, 20, 0.9)';

  return (
    <div className="relative w-full overflow-hidden rounded-3xl">
      <div className="relative aspect-[21/9] sm:aspect-[21/7] md:aspect-[21/6]">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-700"
          style={{ backgroundImage: `url(${currentBanner.image})` }}
        />

        {/* Overlay Gradient - Theme aware */}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to right, ${overlayFrom}, ${overlayVia}, transparent)` }}
        />
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to top, ${overlayBottom}, transparent, transparent)` }}
        />

        {/* Decorative Elements */}
        <div className={`absolute top-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl ${isLight ? 'bg-purple-400/15' : 'bg-purple-500/20'}`} />
        <div className={`absolute bottom-0 left-1/3 w-48 h-48 rounded-full blur-3xl ${isLight ? 'bg-pink-400/15' : 'bg-pink-500/20'}`} />

        {/* Content */}
        <div className="absolute inset-0 flex items-center">
          <div className={`container mx-auto px-6 md:px-12 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
            <div className="max-w-xl space-y-4">
              <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border backdrop-blur-sm ${
                isLight
                  ? 'bg-purple-500/10 border-purple-500/30'
                  : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-500/30'
              }`}>
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                <span className={`text-xs font-medium ${isLight ? 'text-purple-600' : 'text-purple-300'}`}>
                  {t('Flash Sale', 'عرض خاص')}
                </span>
              </div>
              <h2 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight ${
                isLight ? 'text-slate-900' : 'text-white'
              }`}>
                {t(currentBanner.title, currentBanner.titleAr)}
              </h2>
              {currentBanner.subtitle && (
                <p className={`text-sm sm:text-base md:text-lg ${isLight ? 'text-slate-600' : 'text-white/70'}`}>
                  {t(currentBanner.subtitle, currentBanner.subtitleAr || '')}
                </p>
              )}
              {linkedGame && (
                <Link href={`/games/${linkedGame.slug}`}>
                  <Button
                    size="lg"
                    className="mt-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg shadow-purple-500/30 text-sm sm:text-base rounded-xl"
                  >
                    {t('Top Up Now', 'اشحن الآن')}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {activeBanners.length > 1 && (
          <>
            <button
              onClick={goToPrev}
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-colors ${
                isLight
                  ? 'bg-white/60 border-purple-200 text-slate-700 hover:bg-white/80'
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className={`absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-colors ${
                isLight
                  ? 'bg-white/60 border-purple-200 text-slate-700 hover:bg-white/80'
                  : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
              }`}
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dots */}
        {activeBanners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
            {activeBanners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'w-8 bg-gradient-to-r from-purple-400 to-pink-400'
                    : isLight ? 'w-2 bg-slate-400/50 hover:bg-slate-400/70' : 'w-2 bg-white/30 hover:bg-white/50'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
