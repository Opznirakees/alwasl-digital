'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ShoppingCart, Trash2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { games } from '@/data/mock-data';
import { useApp } from '@/contexts/AppContext';

export default function CartPage() {
  const { t, language, dir, theme, cart, removeFromCart, clearCart, selectedCountry } = useApp();
  const isLight = theme === 'light';

  const rows = cart.map((item) => {
    const game = games.find((entry) => entry.id === item.gameId);
    const pkg = game?.packages.find((entry) => entry.id === item.packageId);
    const price = pkg ? (pkg.salePrice || pkg.basePrice) * item.quantity : 0;
    return { item, game, pkg, price };
  }).filter((row) => row.game && row.pkg);

  const total = rows.reduce((sum, row) => sum + row.price, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-IQ' : 'en-IQ').format(amount);
  };

  return (
    <div className={`min-h-screen ${isLight ? 'bg-slate-50' : 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950'} ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="container mx-auto px-4 py-8">
        <Link href="/games" className={`inline-flex items-center gap-2 text-sm mb-8 ${isLight ? 'text-slate-600 hover:text-purple-600' : 'text-white/70 hover:text-white'}`}>
          <ArrowLeft className="w-4 h-4" />
          {t('Continue shopping', 'متابعة التسوق')}
        </Link>

        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('Cart', 'السلة')}</h1>
            <p className={`text-sm mt-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
              {t('Saved demo items for follow-up checkout', 'عناصر تجريبية محفوظة للمتابعة')}
            </p>
          </div>
          {rows.length > 0 && (
            <Button onClick={clearCart} variant="outline" className={isLight ? 'border-purple-200 text-purple-700' : 'border-purple-500/30 text-purple-300'}>
              <Trash2 className="w-4 h-4 mr-2" />
              {t('Clear', 'مسح')}
            </Button>
          )}
        </div>

        {rows.length > 0 ? (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {rows.map(({ item, game, pkg, price }) => game && pkg && (
                <Card key={`${item.gameId}-${item.packageId}`} className={`p-5 ${isLight ? 'bg-white border-purple-100' : 'bg-slate-900/50 border-purple-500/15'}`}>
                  <div className="flex gap-4">
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      <Image src={game.image} alt={game.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {language === 'ar' ? game.nameAr : game.name}
                      </h2>
                      <p className="text-sm text-purple-400">
                        {language === 'ar' ? pkg.nameAr : pkg.name} x {item.quantity}
                      </p>
                      {item.gameUserId && (
                        <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-white/50'}`}>
                          {t('Account', 'الحساب')}: {item.gameUsername || item.gameUserId}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-4">
                        <Link href={`/games/${game.slug}`}>
                          <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                            {t('Checkout', 'الدفع')}
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromCart(item.gameId, item.packageId)}
                          className={isLight ? 'border-purple-200 text-purple-700' : 'border-purple-500/30 text-purple-300'}
                        >
                          {t('Remove', 'إزالة')}
                        </Button>
                      </div>
                    </div>
                    <p className="font-bold text-emerald-400 whitespace-nowrap">
                      {formatCurrency(price)} {selectedCountry.currencySymbol}
                    </p>
                  </div>
                </Card>
              ))}
            </div>

            <Card className={`h-fit p-6 ${isLight ? 'bg-white border-purple-100' : 'bg-slate-900/50 border-purple-500/15'}`}>
              <h2 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('Summary', 'الملخص')}</h2>
              <div className="flex justify-between border-t border-purple-500/15 mt-5 pt-5">
                <span className={isLight ? 'text-slate-600' : 'text-white/60'}>{t('Estimated total', 'الإجمالي التقريبي')}</span>
                <span className="font-bold text-emerald-400">{formatCurrency(total)} {selectedCountry.currencySymbol}</span>
              </div>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isLight ? 'bg-purple-100' : 'bg-purple-500/10'}`}>
              <ShoppingCart className={`w-10 h-10 ${isLight ? 'text-purple-500' : 'text-purple-300'}`} />
            </div>
            <h2 className={`text-xl font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{t('Your cart is empty', 'السلة فارغة')}</h2>
            <Link href="/games">
              <Button className="mt-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                {t('Browse products', 'تصفح المنتجات')}
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
