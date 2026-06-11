'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { GameCard } from '@/components/home/GameCard';
import { CategoryTabs } from '@/components/home/CategoryTabs';
import { SearchBar } from '@/components/home/SearchBar';
import { games } from '@/data/mock-data';
import type { GameCategory } from '@/types';
import { ArrowLeft, Filter, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function GamesPage() {
  const { t, dir, selectedCountry } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');

  const filteredGames = useMemo(() => {
    let result = games.filter((game) => {
      if (!game.countries.includes(selectedCountry.id)) return false;
      if (selectedCategory !== 'all' && game.category !== selectedCategory) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = game.name.toLowerCase().includes(query) ||
                         game.nameAr.includes(query);
        return nameMatch;
      }
      return true;
    });

    // Sort
    if (sortBy === 'popular') {
      result = result.sort((a, b) => (b.isPopular ? 1 : 0) - (a.isPopular ? 1 : 0));
    } else if (sortBy === 'name') {
      result = result.sort((a, b) =>
        t(a.name, a.nameAr).localeCompare(t(b.name, b.nameAr))
      );
    } else if (sortBy === 'price-low') {
      result = result.sort((a, b) => {
        const aPrice = Math.min(...a.packages.map(p => p.salePrice || p.basePrice));
        const bPrice = Math.min(...b.packages.map(p => p.salePrice || p.basePrice));
        return aPrice - bPrice;
      });
    } else if (sortBy === 'price-high') {
      result = result.sort((a, b) => {
        const aPrice = Math.min(...a.packages.map(p => p.salePrice || p.basePrice));
        const bPrice = Math.min(...b.packages.map(p => p.salePrice || p.basePrice));
        return bPrice - aPrice;
      });
    }

    return result;
  }, [selectedCountry.id, selectedCategory, searchQuery, sortBy, t]);

  return (
    <div className={`min-h-screen bg-[#f5f5f7] ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-blue-600 mb-4">
            <ArrowLeft className="w-4 h-4" />
            {t('Back to Home', 'العودة للرئيسية')}
          </Link>
          <h1 className="text-3xl font-semibold text-zinc-950">{t('WAHO Top-Up', 'شحن WAHO', 'WAHO 充值')}</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {t('Choose the WAHO top-up amount, confirm the account ID, and continue to payment.', 'اختر مبلغ شحن WAHO وتأكد من معرف الحساب ثم تابع للدفع.', '选择 WAHO 充值金额，确认账号 ID，然后继续支付。')}
          </p>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col lg:flex-row gap-4 mb-8">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <div className="flex items-center gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48 bg-white border-black/10 text-zinc-950">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                <SelectValue placeholder={t('Sort by', 'ترتيب حسب')} />
              </SelectTrigger>
              <SelectContent className="bg-white border-black/10">
                <SelectItem value="popular">{t('Most Popular', 'الأكثر شيوعاً')}</SelectItem>
                <SelectItem value="name">{t('Name A-Z', 'الاسم أ-ي')}</SelectItem>
                <SelectItem value="price-low">{t('Price: Low to High', 'السعر: من الأقل للأعلى')}</SelectItem>
                <SelectItem value="price-high">{t('Price: High to Low', 'السعر: من الأعلى للأقل')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mb-8">
          <CategoryTabs selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-zinc-500">
            {t('Showing', 'عرض')} <span className="text-zinc-950 font-medium">{filteredGames.length}</span> {t('results', 'نتيجة')}
          </p>
        </div>

        {/* WAHO top-up grid */}
        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {filteredGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-lg bg-zinc-100 flex items-center justify-center mb-4">
              <Filter className="w-10 h-10 text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold text-zinc-950">{t('No WAHO top-up found', 'لم يتم العثور على شحن WAHO', '未找到 WAHO 充值')}</h3>
            <p className="text-sm text-zinc-500 mt-1">{t('Try adjusting your search or filters', 'جرب تعديل البحث أو الفلاتر')}</p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              variant="outline"
              className="mt-4 border-black/10 bg-white text-blue-600 hover:bg-blue-50"
            >
              {t('Clear Filters', 'مسح الفلاتر')}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
