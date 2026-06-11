'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { HeroBanner } from '@/components/home/HeroBanner';
import { GameCard } from '@/components/home/GameCard';
import { CategoryTabs } from '@/components/home/CategoryTabs';
import { SearchBar } from '@/components/home/SearchBar';
import { games } from '@/data/mock-data';
import type { GameCategory } from '@/types';
import {
  Zap,
  BadgeCheck,
  Gamepad2,
  Headphones,
  MessageCircle,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const { t, dir, selectedCountry } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredGames = useMemo(() => {
    return games.filter((game) => {
      if (!game.countries.includes(selectedCountry.id)) return false;
      if (selectedCategory !== 'all' && game.category !== selectedCategory) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = game.name.toLowerCase().includes(query) || game.nameAr.includes(query);
        return nameMatch;
      }
      return true;
    });
  }, [selectedCountry.id, selectedCategory, searchQuery]);

  return (
    <div className={`min-h-screen ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-10">
        {/* Hero Banner */}
        <HeroBanner />

        {/* Quick Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <BadgeCheck className="w-5 h-5" />, label: t('High Quality', 'جودة عالية'), value: t('Trusted', 'موثوق'), tone: 'bg-blue-50 text-blue-600' },
            { icon: <Zap className="w-5 h-5" />, label: t('Fast Fulfillment', 'إنجاز فوري'), value: t('Quick', 'سريع'), tone: 'bg-amber-50 text-amber-700' },
            { icon: <Sparkles className="w-5 h-5" />, label: t('Competitive Prices', 'أسعار تنافسية'), value: t('Fair', 'مناسبة'), tone: 'bg-zinc-100 text-zinc-700' },
            { icon: <Headphones className="w-5 h-5" />, label: t('Technical Support', 'دعم فني'), value: '24/7', tone: 'bg-emerald-50 text-emerald-700' },
          ].map((stat, i) => (
            <div key={i} className="rounded-lg border border-black/10 bg-white p-5 shadow-sm transition-colors hover:border-blue-200">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${stat.tone}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xs text-zinc-500">{stat.label}</p>
                  <p className="text-xl font-semibold mt-1 text-zinc-950">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Search & Filter Section */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-950">{t('All WAHO Services', 'جميع خدمات WAHO')}</h2>
              <p className="text-sm mt-1 text-zinc-500">{t('Find coins, gifts, room boosts, games, and VIP packages', 'اعثر على العملات والهدايا وتعزيز الغرف والألعاب والعضويات')}</p>
            </div>
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>

          <CategoryTabs selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

          {/* WAHO Services Grid */}
          {filteredGames.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {filteredGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-lg bg-zinc-100 flex items-center justify-center mb-4">
                <Gamepad2 className="w-10 h-10 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-950">{t('No WAHO services found', 'لم يتم العثور على خدمات WAHO')}</h3>
              <p className="text-sm mt-1 text-zinc-500">{t('Try another WAHO service or clear filters', 'جرب خدمة WAHO أخرى أو امسح الفلاتر')}</p>
            </div>
          )}
        </section>

        {/* WhatsApp Contact */}
        <section className="overflow-hidden rounded-lg border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-lg bg-emerald-600 flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-950">{t('Need WAHO Support?', 'تحتاج دعم WAHO؟')}</h3>
                <p className="text-sm text-zinc-600">{t('Contact us for WAHO recharge, API, or order support', 'تواصل معنا لدعم شحن WAHO أو API أو الطلبات')}</p>
              </div>
            </div>
            <a
              href="https://wa.me/9647812345678"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-md bg-emerald-600 text-white font-semibold transition-colors hover:bg-emerald-700"
            >
              {t('Chat on WhatsApp', 'تواصل عبر واتساب')}
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-black/10 bg-white mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-12 h-12 rounded-xl bg-white p-1 overflow-hidden ring-1 ring-blue-900/10">
                  <Image
                    src="/brand/alwasl-mark.jpg"
                    alt={t('Al-Wasl Digital Services', 'الوصل للخدمات الإلكترونية')}
                    fill
                    className="object-contain"
                    sizes="48px"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-zinc-950">{t('Al-Wasl Digital', 'الوصل')}</h3>
                  <p className="text-[10px] text-blue-700">{t('Electronic services', 'للخدمات الإلكترونية')}</p>
                </div>
              </div>
              <p className="text-sm text-zinc-500">
                {t('Digital services for social page promotion, app recharge, marketing solutions, and WAHO product delivery.', 'خدمات رقمية لترويج صفحات التواصل وشحن التطبيقات والحلول التسويقية وتسليم منتجات WAHO.')}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-zinc-950">{t('WAHO Links', 'روابط WAHO')}</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li><Link href="/games" className="transition-colors hover:text-blue-600">{t('WAHO Services', 'خدمات WAHO')}</Link></li>
                <li><Link href="/promotions" className="transition-colors hover:text-blue-600">{t('WAHO Offers', 'عروض WAHO')}</Link></li>
                <li><Link href="/about" className="transition-colors hover:text-blue-600">{t('API Roadmap', 'خطة API')}</Link></li>
                <li><Link href="/contact" className="transition-colors hover:text-blue-600">{t('Contact', 'اتصل بنا')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-zinc-950">{t('Support', 'الدعم')}</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li><Link href="/faq" className="transition-colors hover:text-blue-600">{t('FAQ', 'الأسئلة الشائعة')}</Link></li>
                <li><Link href="/help" className="transition-colors hover:text-blue-600">{t('Help Center', 'مركز المساعدة')}</Link></li>
                <li><Link href="/terms" className="transition-colors hover:text-blue-600">{t('Terms of Service', 'شروط الخدمة')}</Link></li>
                <li><Link href="/privacy" className="transition-colors hover:text-blue-600">{t('Privacy Policy', 'سياسة الخصوصية')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-zinc-950">{t('Payment Methods', 'طرق الدفع')}</h4>
              <div className="flex flex-wrap gap-2">
                {['ZainCash', 'AsiaHawala', 'Visa', 'Mastercard', 'USDT'].map((method) => (
                  <span key={method} className="px-3 py-1.5 rounded-md border border-black/10 bg-zinc-50 text-xs text-zinc-600">
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-black/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-zinc-400">
              © 2026 {t('Al-Wasl Digital Services', 'الوصل للخدمات الإلكترونية')}. {t('All rights reserved.', 'جميع الحقوق محفوظة.')}
            </p>
            <div className="flex items-center gap-4">
              {['Facebook', 'Twitter', 'Instagram', 'WhatsApp'].map((social) => (
                <Link key={social} href="#" className="transition-colors text-xs text-zinc-400 hover:text-blue-600">
                  {social}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/9647812345678"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 whatsapp-btn z-50"
      >
        <MessageCircle className="w-7 h-7" />
      </a>
    </div>
  );
}
