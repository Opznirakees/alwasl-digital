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
import { wahoShowcaseImages } from '@/data/waho-images';
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

      <main className="container mx-auto px-4 py-5 md:py-8 space-y-9 md:space-y-12">
        {/* Hero Banner */}
        <HeroBanner />

        {/* Quick Stats */}
        <section className="grid grid-cols-2 overflow-hidden rounded-lg border border-black/10 bg-white md:grid-cols-4">
          {[
            { icon: <BadgeCheck className="w-4 h-4" />, label: t('High Quality', 'جودة عالية'), value: t('Trusted', 'موثوق') },
            { icon: <Zap className="w-4 h-4" />, label: t('Fast top-up', 'شحن سريع'), value: t('Quick', 'سريع') },
            { icon: <Sparkles className="w-4 h-4" />, label: t('Competitive Prices', 'أسعار تنافسية'), value: t('Fair', 'مناسبة') },
            { icon: <Headphones className="w-4 h-4" />, label: t('Technical Support', 'دعم فني'), value: '24/7' },
          ].map((stat, i) => (
            <div
              key={i}
              className={`border-black/10 p-4 ${i % 2 === 1 ? 'border-l' : ''} ${i > 1 ? 'border-t' : ''} ${i > 0 ? 'md:border-l' : ''} md:border-t-0`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-50 text-blue-600">
                  {stat.icon}
                </div>
                <div>
                  <p className="text-xs text-zinc-500">{stat.label}</p>
                  <p className="mt-0.5 text-lg font-semibold text-zinc-950">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="space-y-5">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-semibold text-zinc-950">
              {t('WAHO inside the app', 'WAHO داخل التطبيق', 'WAHO 应用内场景')}
            </h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">
              {t(
                'Live rooms, gifts, games, and private chats give each top-up clear context.',
                'الغرف المباشرة والهدايا والألعاب والدردشة الخاصة تجعل كل شحن أوضح.',
                '直播房间、礼物、游戏和私聊让每次充值都有清晰场景。'
              )}
            </p>
          </div>

          <div className="-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:overflow-visible md:px-0">
            <div className="grid auto-cols-[148px] grid-flow-col gap-3 md:grid-flow-row md:grid-cols-7 md:auto-cols-auto">
              {wahoShowcaseImages.map((item) => (
                <article key={item.src} className="rounded-lg border border-black/10 bg-white p-1.5">
                  <div className="relative aspect-[750/1624] overflow-hidden rounded-md bg-zinc-100">
                    <Image
                      src={item.src}
                      alt={`WAHO ${item.label.en}`}
                      fill
                      className="object-cover"
                      sizes="(min-width: 768px) 14vw, 148px"
                    />
                  </div>
                  <p className="truncate px-1.5 py-2 text-center text-xs font-medium text-zinc-700">
                    {t(item.label.en, item.label.ar, item.label.zh)}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Search & Filter Section */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-zinc-950">{t('Top up WAHO services', 'اشحن خدمات WAHO')}</h2>
              <p className="text-sm mt-1 text-zinc-500">{t('Pick coins, gifts, rooms, games, or VIP upgrades and top up quickly.', 'اختر العملات أو الهدايا أو الغرف أو الألعاب أو VIP واشحن بسرعة.')}</p>
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
        <section className="overflow-hidden rounded-lg border border-black/10 bg-white p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-50 text-[#1f8f3a]">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-950">{t('Need WAHO Support?', 'تحتاج دعم WAHO؟')}</h3>
                <p className="text-sm text-zinc-600">{t('Contact us for WAHO top-ups, orders, or account help.', 'تواصل معنا لدعم شحن WAHO أو الطلبات أو الحساب.')}</p>
              </div>
            </div>
            <a
              href="https://wa.me/9647812345678"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-black/10 bg-white px-6 py-3 font-semibold text-zinc-800 transition-colors hover:bg-zinc-50"
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
                {t('Fast WAHO top-ups with digital services for promotion, recharge, and customer support.', 'شحن WAHO سريع مع خدمات رقمية للترويج والشحن ودعم العملاء.')}
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-zinc-950">{t('WAHO Links', 'روابط WAHO')}</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li><Link href="/games" className="transition-colors hover:text-blue-600">{t('WAHO Services', 'خدمات WAHO')}</Link></li>
                <li><Link href="/promotions" className="transition-colors hover:text-blue-600">{t('WAHO Offers', 'عروض WAHO')}</Link></li>
                <li><Link href="/help" className="transition-colors hover:text-blue-600">{t('How it works', 'كيف تعمل الخدمة')}</Link></li>
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
