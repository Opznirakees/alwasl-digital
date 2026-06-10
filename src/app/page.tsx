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
  TrendingUp,
  Sparkles,
  Zap,
  ChevronRight,
  BadgeCheck,
  BarChart3,
  Gamepad2,
  Gift,
  Headphones,
  Megaphone,
  Play,
  Smartphone,
  MessageCircle,
  Shield,
} from 'lucide-react';

// Category icons with colors
const categoryIcons = [
  { id: 'social_media', icon: MessageCircle, from: '#14b8a6', to: '#22c55e', label: { en: 'WAHO Coins', ar: 'عملات WAHO' } },
  { id: 'gift_card', icon: Gift, from: '#ec4899', to: '#f472b6', label: { en: 'Gift Bundles', ar: 'باقات الهدايا' } },
  { id: 'streaming', icon: Play, from: '#f59e0b', to: '#fbbf24', label: { en: 'Live Rooms', ar: 'الغرف المباشرة' } },
  { id: 'mobile_game', icon: Gamepad2, from: '#8b5cf6', to: '#a855f7', label: { en: 'Party Games', ar: 'ألعاب جماعية' } },
  { id: 'voucher', icon: Sparkles, from: '#3b82f6', to: '#6366f1', label: { en: 'VIP & Medals', ar: 'العضوية' } },
];

export default function HomePage() {
  const { t, language, dir, selectedCountry, theme } = useApp();
  const isLight = theme === 'light';
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

  const popularGames = games.filter(g => g.isPopular && g.countries.includes(selectedCountry.id)).slice(0, 6);
  const featuredGames = games.filter(g => g.isFeatured && g.countries.includes(selectedCountry.id));

  return (
    <div className={`min-h-screen ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      {/* Background Glow Effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className={`absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl ${isLight ? 'bg-purple-400/8' : 'bg-purple-500/10'}`} />
        <div className={`absolute top-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl ${isLight ? 'bg-pink-400/8' : 'bg-pink-500/10'}`} />
      </div>

      <main className="container mx-auto px-4 py-6 space-y-12 relative z-10">
        {/* Hero Banner */}
        <HeroBanner />

        {/* Category Icons Grid */}
        <section className="py-4">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {categoryIcons.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as GameCategory)}
                className={`group flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 hover:scale-105 ${
                  selectedCategory === cat.id
                    ? 'scale-105'
                    : isLight ? 'bg-white/50 hover:bg-white/80' : 'bg-[#1a1225]/50 hover:bg-[#1a1225]'
                }`}
                style={selectedCategory === cat.id ? { background: `linear-gradient(135deg, ${cat.from}20, ${cat.to}20)` } : {}}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{ background: `linear-gradient(135deg, ${cat.from}, ${cat.to})`, boxShadow: `0 10px 30px -5px ${cat.from}50` }}
                >
                  <cat.icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-xs font-medium transition-colors ${
                  isLight ? 'text-slate-600 group-hover:text-slate-900' : 'text-white/80 group-hover:text-white'
                }`}>
                  {t(cat.label.en, cat.label.ar)}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <BadgeCheck className="w-5 h-5" />, label: t('High Quality', 'جودة عالية'), value: t('Trusted', 'موثوق'), color: 'from-blue-600 to-blue-800' },
            { icon: <Zap className="w-5 h-5" />, label: t('Fast Fulfillment', 'إنجاز فوري'), value: t('Quick', 'سريع'), color: 'from-amber-500 to-yellow-600' },
            { icon: <Sparkles className="w-5 h-5" />, label: t('Competitive Prices', 'أسعار تنافسية'), value: t('Fair', 'مناسبة'), color: 'from-cyan-500 to-blue-600' },
            { icon: <Headphones className="w-5 h-5" />, label: t('Technical Support', 'دعم فني'), value: '24/7', color: 'from-emerald-500 to-teal-600' },
          ].map((stat, i) => (
            <div key={i} className={`relative overflow-hidden rounded-2xl p-5 group hover:scale-[1.02] transition-all duration-300 ${
              isLight ? 'bg-white/80 border border-purple-100 shadow-sm' : 'glass-light'
            }`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg text-white`}>
                  {stat.icon}
                </div>
                <div>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{stat.label}</p>
                  <p className={`text-xl font-bold mt-1 ${isLight ? 'text-slate-800' : 'text-white'}`}>{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Al-Wasl Services Banner */}
        <section className={`grid lg:grid-cols-[1.15fr_0.85fr] gap-6 items-stretch rounded-3xl overflow-hidden border ${
          isLight ? 'bg-white/80 border-blue-100 shadow-sm' : 'bg-[#111827]/70 border-blue-500/15'
        }`}>
          <div className="relative min-h-[220px] lg:min-h-[320px]">
            <Image
              src="/brand/alwasl-banner.jpg"
              alt={t('Al-Wasl digital services banner', 'بانر الوصل للخدمات الإلكترونية')}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 58vw, 100vw"
            />
          </div>
          <div className="p-6 md:p-8 flex flex-col justify-center">
            <div className={`inline-flex w-fit items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
              isLight ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-blue-500/10 text-amber-200 border-blue-400/20'
            }`}>
              <Shield className="w-3.5 h-3.5" />
              {t('Secure digital service', 'خدمة آمنة موثوقة')}
            </div>
            <h2 className={`mt-4 text-2xl md:text-3xl font-bold leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {t('Al-Wasl helps you reach better results', 'الوصل يساعدك على الوصول لأفضل النتائج')}
            </h2>
            <p className={`mt-3 text-sm leading-6 ${isLight ? 'text-slate-600' : 'text-white/65'}`}>
              {t(
                'Digital solutions for page promotion, app recharge, marketing services, and WAHO product delivery with continuous technical support.',
                'حلول رقمية لترويج الصفحات وشحن التطبيقات والخدمات التسويقية وتسليم منتجات WAHO مع دعم فني مستمر.'
              )}
            </p>
            <div className="grid sm:grid-cols-3 gap-3 mt-6">
              {[
                { icon: <Megaphone className="w-4 h-4" />, label: t('Page Promotion', 'ترويج صفحات') },
                { icon: <Smartphone className="w-4 h-4" />, label: t('App Recharge', 'شحن تطبيقات') },
                { icon: <BarChart3 className="w-4 h-4" />, label: t('Marketing Solutions', 'حلول تسويقية') },
              ].map((item) => (
                <div key={item.label} className={`flex items-center gap-2 rounded-xl px-3 py-3 text-sm ${
                  isLight ? 'bg-slate-50 text-slate-700' : 'bg-white/5 text-white/80'
                }`}>
                  <span className="text-amber-400">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular WAHO Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{t('Popular WAHO Products', 'منتجات WAHO الشائعة')}</h2>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{t('Most requested for rooms, gifts, and live chats', 'الأكثر طلباً للغرف والهدايا والدردشة المباشرة')}</p>
              </div>
            </div>
            <Link href="/games" className={`flex items-center gap-1 text-sm transition-colors group ${isLight ? 'text-purple-600 hover:text-purple-700' : 'text-purple-400 hover:text-purple-300'}`}>
              {t('View WAHO Services', 'عرض خدمات WAHO')}
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularGames.map((game) => (
              <GameCard key={game.id} game={game} variant="compact" />
            ))}
          </div>
        </section>

        {/* Search & Filter Section */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h2 className={`text-2xl font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{t('All WAHO Services', 'جميع خدمات WAHO')}</h2>
              <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{t('Find coins, gifts, room boosts, games, and VIP packages', 'اعثر على العملات والهدايا وتعزيز الغرف والألعاب والعضويات')}</p>
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
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isLight ? 'bg-purple-100' : 'bg-purple-500/10'}`}>
                <Gamepad2 className={`w-10 h-10 ${isLight ? 'text-purple-400' : 'text-purple-400/40'}`} />
              </div>
              <h3 className={`text-lg font-semibold ${isLight ? 'text-slate-800' : 'text-white'}`}>{t('No WAHO services found', 'لم يتم العثور على خدمات WAHO')}</h3>
              <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>{t('Try another WAHO service or clear filters', 'جرب خدمة WAHO أخرى أو امسح الفلاتر')}</p>
            </div>
          )}
        </section>

        {/* Featured Games Banner */}
        {featuredGames.length > 0 && (
          <section className={`relative overflow-hidden rounded-3xl border p-8 ${
            isLight
              ? 'bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50 border-purple-200'
              : 'bg-gradient-to-r from-purple-900/30 via-pink-900/20 to-purple-900/30 border-purple-500/20'
          }`}>
            <div className="absolute inset-0 bg-gradient-glow" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{t('WAHO API-Ready Catalog', 'كتالوج WAHO جاهز للـ API')}</h2>
                  <p className={`text-xs ${isLight ? 'text-purple-600' : 'text-purple-400/70'}`}>{t('Products are structured for account validation and automatic fulfillment', 'المنتجات منظمة للتحقق من الحساب والتسليم التلقائي')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {featuredGames.slice(0, 4).map((game) => (
                  <GameCard key={game.id} game={game} variant="compact" />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* WhatsApp Contact */}
        <section className={`relative overflow-hidden rounded-3xl border p-6 ${
          isLight
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
            : 'bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-500/20'
        }`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/25">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{t('Need WAHO Support?', 'تحتاج دعم WAHO؟')}</h3>
                <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-white/60'}`}>{t('Contact us for WAHO recharge, API, or order support', 'تواصل معنا لدعم شحن WAHO أو API أو الطلبات')}</p>
              </div>
            </div>
            <a
              href="https://wa.me/9647812345678"
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold shadow-lg shadow-green-500/25 hover:shadow-green-500/40 transition-all hover:scale-105"
            >
              {t('Chat on WhatsApp', 'تواصل عبر واتساب')}
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={`border-t mt-20 ${isLight ? 'border-purple-200 bg-purple-50/50' : 'border-purple-500/10 bg-[#0a0812]/80'}`}>
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
                  <h3 className={`font-bold ${isLight ? 'text-slate-800' : 'text-white'}`}>{t('Al-Wasl Digital', 'الوصل')}</h3>
                  <p className={`text-[10px] ${isLight ? 'text-blue-700' : 'text-amber-300/80'}`}>{t('Electronic services', 'للخدمات الإلكترونية')}</p>
                </div>
              </div>
              <p className={`text-sm ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                {t('Digital services for social page promotion, app recharge, marketing solutions, and WAHO product delivery.', 'خدمات رقمية لترويج صفحات التواصل وشحن التطبيقات والحلول التسويقية وتسليم منتجات WAHO.')}
              </p>
            </div>

            <div>
              <h4 className={`font-semibold mb-4 ${isLight ? 'text-slate-800' : 'text-white'}`}>{t('WAHO Links', 'روابط WAHO')}</h4>
              <ul className={`space-y-2 text-sm ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                <li><Link href="/games" className={`transition-colors ${isLight ? 'hover:text-purple-600' : 'hover:text-purple-400'}`}>{t('WAHO Services', 'خدمات WAHO')}</Link></li>
                <li><Link href="/promotions" className={`transition-colors ${isLight ? 'hover:text-purple-600' : 'hover:text-purple-400'}`}>{t('WAHO Offers', 'عروض WAHO')}</Link></li>
                <li><Link href="/about" className={`transition-colors ${isLight ? 'hover:text-purple-600' : 'hover:text-purple-400'}`}>{t('API Roadmap', 'خطة API')}</Link></li>
                <li><Link href="/contact" className={`transition-colors ${isLight ? 'hover:text-purple-600' : 'hover:text-purple-400'}`}>{t('Contact', 'اتصل بنا')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className={`font-semibold mb-4 ${isLight ? 'text-slate-800' : 'text-white'}`}>{t('Support', 'الدعم')}</h4>
              <ul className={`space-y-2 text-sm ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                <li><Link href="/faq" className={`transition-colors ${isLight ? 'hover:text-purple-600' : 'hover:text-purple-400'}`}>{t('FAQ', 'الأسئلة الشائعة')}</Link></li>
                <li><Link href="/help" className={`transition-colors ${isLight ? 'hover:text-purple-600' : 'hover:text-purple-400'}`}>{t('Help Center', 'مركز المساعدة')}</Link></li>
                <li><Link href="/terms" className={`transition-colors ${isLight ? 'hover:text-purple-600' : 'hover:text-purple-400'}`}>{t('Terms of Service', 'شروط الخدمة')}</Link></li>
                <li><Link href="/privacy" className={`transition-colors ${isLight ? 'hover:text-purple-600' : 'hover:text-purple-400'}`}>{t('Privacy Policy', 'سياسة الخصوصية')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className={`font-semibold mb-4 ${isLight ? 'text-slate-800' : 'text-white'}`}>{t('Payment Methods', 'طرق الدفع')}</h4>
              <div className="flex flex-wrap gap-2">
                {['ZainCash', 'AsiaHawala', 'Visa', 'Mastercard', 'USDT'].map((method) => (
                  <span key={method} className={`px-3 py-1.5 rounded-lg border text-xs ${
                    isLight ? 'bg-white border-purple-200 text-slate-600' : 'bg-[#1a1225] border-purple-500/20 text-white/70'
                  }`}>
                    {method}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className={`border-t mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 ${isLight ? 'border-purple-200' : 'border-purple-500/10'}`}>
            <p className={`text-xs ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
              © 2026 {t('Al-Wasl Digital Services', 'الوصل للخدمات الإلكترونية')}. {t('All rights reserved.', 'جميع الحقوق محفوظة.')}
            </p>
            <div className="flex items-center gap-4">
              {['Facebook', 'Twitter', 'Instagram', 'WhatsApp'].map((social) => (
                <Link key={social} href="#" className={`transition-colors text-xs ${isLight ? 'text-slate-400 hover:text-purple-600' : 'text-white/30 hover:text-purple-400'}`}>
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
