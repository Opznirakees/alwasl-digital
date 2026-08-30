'use client';

import Link from 'next/link';
import { use, useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, ArrowRight, Gem, Globe2, Loader2, LockKeyhole } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PriceDisplay } from '@/components/pricing/PriceDisplay';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import type { CatalogCategory } from '@/types';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const { t, dir, language, selectedCountry, isAuthenticated, isAccountLoading } = useApp();
  const [category, setCategory] = useState<CatalogCategory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const locale = language === 'ar' ? 'ar-IQ' : language === 'zh' ? 'zh-CN' : 'en-IQ';

  useEffect(() => {
    if (isAccountLoading) return;

    let active = true;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    async function loadCategory() {
      setIsLoading(true);
      setHasError(false);
      try {
        const response = await fetch(`/api/categories/${slug}?country=${selectedCountry.id}`, {
          credentials: 'include',
          signal: controller.signal,
        });
        if (response.status === 401) {
          router.replace(`/auth?next=${encodeURIComponent(`/categories/${slug}`)}`);
          return;
        }
        if (!response.ok) throw new Error('CATEGORY_UNAVAILABLE');
        const payload = await response.json();
        if (active) setCategory(payload.category ?? null);
      } catch {
        if (active) {
          setCategory(null);
          setHasError(true);
        }
      } finally {
        window.clearTimeout(timeout);
        if (active) setIsLoading(false);
      }
    }
    void loadCategory();
    return () => {
      active = false;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [isAccountLoading, router, selectedCountry.id, slug]);

  const name = category
    ? language === 'ar' ? category.nameAr : language === 'zh' ? category.nameZh || category.name : category.name
    : '';
  const description = category
    ? language === 'ar' ? category.descriptionAr : language === 'zh' ? category.descriptionZh || category.description : category.description
    : '';

  if (isAccountLoading) {
    return (
      <div className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}><Header /><main className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-4"><div role="status" className="flex items-center gap-3 text-sm text-[#53627a]"><Loader2 className="h-5 w-5 animate-spin text-[#1769d2] motion-reduce:animate-none" />{t('Checking your account...', 'جارٍ التحقق من حسابك...', '正在检查您的账号...')}</div></main></div>
    );
  }

  return (
    <div className={`v2-page min-h-screen ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />
      <main className="mx-auto max-w-[1180px] px-3 py-5 pb-24 sm:px-4 sm:py-10 lg:pb-10">
        <Link href="/#categories" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#53627a] hover:text-[#1769d2]"><ArrowLeft className="h-4 w-4 rtl:rotate-180" />{t('All categories', 'كل الفئات', '所有分类')}</Link>

        {isLoading ? (
          <div className="mt-5" role="status"><div className="h-40 animate-pulse rounded-lg bg-[#eaf1f8]" /><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{[0,1,2,3].map((item) => <div key={item} className="h-56 animate-pulse rounded-lg bg-[#eaf1f8]" />)}</div></div>
        ) : hasError || !category ? (
          <section className="mx-auto flex min-h-[55vh] max-w-lg flex-col items-center justify-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#fff0f5] text-[#b73c69]"><AlertCircle className="h-6 w-6" /></span>
            <h1 className="mt-4 text-2xl font-bold text-[#07152e]">{t('This category is unavailable', 'هذه الفئة غير متاحة', '该分类不可用')}</h1>
            <p className="mt-2 text-sm leading-6 text-[#53627a]">{t('Go back and choose another recharge category.', 'ارجع واختر فئة شحن أخرى.', '返回并选择其他充值分类。')}</p>
            <Button asChild className="v2-primary-button mt-5"><Link href="/#categories">{t('View categories', 'عرض الفئات', '查看分类')}</Link></Button>
          </section>
        ) : (
          <>
            <header className="mt-3 grid min-h-[180px] gap-5 overflow-hidden rounded-lg border border-[#d9e1ec] bg-[linear-gradient(135deg,#ffffff_0%,#eef8ff_100%)] p-5 shadow-[0_18px_46px_rgba(28,55,92,0.10)] sm:grid-cols-[1fr_180px] sm:items-center sm:p-8" style={{ borderTopColor: category.accentColor, borderTopWidth: 4 }}>
              <div>
                <div className="inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-xs font-bold text-[#07152e]" style={{ backgroundColor: category.accentColor }}>
                  {category.priceVisibility === 'PUBLIC' ? <Globe2 className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}
                  {t('Prices for {{country}}', 'أسعار {{country}}', '{{country}} 的价格').replace('{{country}}', language === 'ar' ? selectedCountry.nameAr : language === 'zh' ? selectedCountry.nameZh : selectedCountry.name)}
                </div>
                <h1 className="mt-3 text-3xl font-bold text-[#07152e] sm:text-4xl">{name}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#53627a] sm:text-base">{description}</p>
              </div>
              <div className="mx-auto h-32 w-32 overflow-hidden rounded-lg border border-[#d9e1ec] bg-white p-3 shadow-[0_12px_30px_rgba(28,55,92,0.10)] sm:h-40 sm:w-40"><img src={category.image} alt="" className="h-full w-full object-contain" /></div>
            </header>

            <div className="mt-6 space-y-8">
              {(category.products ?? []).map((product) => {
                const productName = language === 'ar' ? product.nameAr : language === 'zh' ? product.nameZh || product.name : product.name;
                const productDescription = language === 'ar' ? product.descriptionAr : language === 'zh' ? product.descriptionZh || product.description : product.description;
                return (
                  <section key={product.id} aria-labelledby={`product-${product.id}`}>
                    <div className="flex items-start gap-3">
                      <span className="relative h-12 w-12 flex-none overflow-hidden rounded-lg border border-[#d9e1ec] bg-white p-1 shadow-[0_8px_20px_rgba(28,55,92,0.08)]"><img src={product.image} alt="" className="h-full w-full object-contain" /></span>
                      <div><h2 id={`product-${product.id}`} className="text-xl font-bold text-[#07152e]">{productName}</h2><p className="mt-1 text-xs leading-5 text-[#53627a] sm:text-sm">{productDescription}</p></div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {product.packages.filter((pkg) => pkg.inStock).map((pkg) => (
                        <Link key={pkg.id} href={isAuthenticated
                          ? `/top-up/${product.slug}?amount=${pkg.amount}`
                          : `/auth?next=${encodeURIComponent(`/top-up/${product.slug}?amount=${pkg.amount}`)}`
                        } className={`group flex min-h-[188px] flex-col rounded-lg border bg-white p-3 text-start shadow-[0_10px_28px_rgba(28,55,92,0.08)] transition-[border-color,background-color,box-shadow] hover:border-[var(--category-accent)] hover:bg-[#f8fbff] hover:shadow-[0_16px_34px_rgba(28,55,92,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--category-accent)] ${pkg.isPopular ? 'border-[var(--category-accent)]' : 'border-[#d9e1ec]'}`} style={{ '--category-accent': category.accentColor } as CSSProperties}>
                          {pkg.isPopular && <span className="mb-2 max-w-max rounded bg-[var(--category-accent)] px-2 py-1 text-[9px] font-bold text-[#07152e]">{t('Popular', 'الأكثر اختياراً', '热门')}</span>}
                          <span className="text-xl font-bold tabular-nums text-[#07152e]">{new Intl.NumberFormat(locale).format(pkg.amount)}</span>
                          <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-[#53627a]"><Gem className="h-3.5 w-3.5 text-[#1769d2]" />{language === 'ar' ? pkg.unitAr : pkg.unit}</span>
                          <span className="mt-4 text-[10px] text-[#6b778a]">{t('You pay', 'تدفع', '您支付')}</span>
                          <PriceDisplay amountIqd={pkg.salePrice || pkg.basePrice} compact primaryClassName="mt-1 text-sm font-bold text-[#9b6800]" secondaryClassName="text-[#53627a]" />
                          <span className="mt-auto flex min-h-10 items-center justify-center gap-1.5 rounded-md bg-[var(--category-accent)] px-2 text-xs font-bold text-[#07152e]">{isAuthenticated ? t('Choose', 'اختر', '选择') : t('Login to order', 'سجل الدخول للطلب', '登录下单')}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></span>
                        </Link>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
