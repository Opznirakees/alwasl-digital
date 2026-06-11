'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { banners } from '@/data/mock-data';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export function HeroBanner() {
  const { t, dir } = useApp();
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
  const isBrandBanner = currentBanner.id === 'banner-1';

  const overlayFrom = 'rgba(255, 255, 255, 1)';
  const overlayVia = 'rgba(255, 255, 255, 0.94)';
  const overlayTo = 'rgba(255, 255, 255, 0.5)';
  const overlayBottom = 'rgba(255, 255, 255, 0.92)';

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-black/10 bg-white shadow-sm">
      <div className="relative min-h-[360px] sm:aspect-[21/7] md:aspect-[21/6]">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-center bg-no-repeat transition-all duration-700"
          style={{
            backgroundImage: `url(${currentBanner.image})`,
            backgroundColor: '#ffffff',
            backgroundPosition: isBrandBanner ? 'right center' : 'center',
            backgroundSize: isBrandBanner ? 'clamp(900px, 78vw, 1120px) auto' : 'cover',
          }}
        />

        {/* Overlay Gradient - Theme aware */}
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to right, ${overlayFrom} 0%, ${overlayVia} 58%, ${overlayTo} 100%)` }}
        />
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(to top, ${overlayBottom}, transparent, transparent)` }}
        />

        {/* Content */}
        <div className="absolute inset-0 flex items-center">
          <div className={`container mx-auto px-6 md:px-12 ${dir === 'rtl' ? 'text-right' : 'text-left'}`}>
            <div className="max-w-xl space-y-5">
              <div className="inline-flex items-center gap-2 rounded-md border border-black/10 bg-white/85 px-3 py-1.5 text-xs font-medium text-zinc-600 backdrop-blur">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {isBrandBanner ? t('Al-Wasl Digital', 'الوصل') : t('WAHO Recharge', 'شحن WAHO')}
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight leading-tight text-zinc-950">
                {t(currentBanner.title, currentBanner.titleAr)}
              </h2>
              {currentBanner.subtitle && (
                <p className="max-w-lg text-sm sm:text-base md:text-lg leading-7 text-zinc-600">
                  {t(currentBanner.subtitle, currentBanner.subtitleAr || '')}
                </p>
              )}
              {currentBanner.gameId && (
                <Link href={`/games/${currentBanner.gameId}`}>
                  <Button
                    size="lg"
                    className="mt-2 rounded-md bg-blue-600 px-5 text-sm sm:text-base font-semibold text-white shadow-none hover:bg-blue-700"
                  >
                    {isBrandBanner ? t('Explore Services', 'استعرض الخدمات') : t('Recharge WAHO', 'اشحن WAHO')}
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
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full backdrop-blur-md border hidden sm:flex items-center justify-center transition-colors bg-white/80 border-black/10 text-zinc-700 hover:bg-white"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full backdrop-blur-md border hidden sm:flex items-center justify-center transition-colors bg-white/80 border-black/10 text-zinc-700 hover:bg-white"
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
                    ? 'w-8 bg-blue-600'
                    : 'w-2 bg-zinc-300 hover:bg-zinc-400'
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
