'use client';

import Link from 'next/link';
import { use, useEffect, useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, ArrowRight, Gem, Globe2, Loader2, LockKeyhole } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { PriceDisplay } from '@/components/pricing/PriceDisplay';
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
      <div className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}><Header /><main className="mx-auto flex min-h-[60vh] max-w-5xl items-center justify-center px-4"><div role="status" className="flex items-center gap-3 text-sm text-[var(--v2-muted)]"><Loader2 className="h-5 w-5 animate-spin text-[var(--v2-gold-deep)] motion-reduce:animate-none" />{t('Checking your account...', 'جارٍ التحقق من حسابك...', '正在检查您的账号...')}</div></main></div>
    );
  }

  return (
    <div className={`v2-page min-h-screen ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />
      <main className="v2-container py-5 pb-24 sm:py-10 lg:pb-16">
        <Link href="/#categories" className="v2-ghost-link"><ArrowLeft className="h-4 w-4 rtl:rotate-180" />{t('All categories', 'كل الفئات', '所有分类')}</Link>

        {isLoading ? (
          <div className="mt-5" role="status"><div className="v2-skeleton h-44" /><div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{[0,1,2,3].map((item) => <div key={item} className="v2-skeleton h-56" />)}</div></div>
        ) : hasError || !category ? (
          <section className="v2-empty mx-auto mt-6 min-h-[50vh] max-w-lg">
            <span className="v2-icon-tile h-12 w-12 bg-[#fff0f5] text-[#b73c69]"><AlertCircle className="h-6 w-6" /></span>
            <h1 className="v2-title mt-4 text-2xl">{t('This category is unavailable', 'هذه الفئة غير متاحة', '该分类不可用')}</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--v2-muted)]">{t('Go back and choose another recharge category.', 'ارجع واختر فئة شحن أخرى.', '返回并选择其他充值分类。')}</p>
            <Link href="/#categories" className="v2-primary-button mt-5">{t('View categories', 'عرض الفئات', '查看分类')}</Link>
          </section>
        ) : (
          <>
            <header className="v2-surface relative mt-3 grid min-h-[180px] gap-5 overflow-hidden p-5 sm:grid-cols-[1fr_180px] sm:items-center sm:p-8" style={{ '--category-accent': category.accentColor } as CSSProperties}>
              <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[var(--category-accent)]" />
              <div>
                <div className="v2-chip relative">
                  <span className="h-2 w-2 rounded-full bg-[var(--category-accent)]" />
                  {category.priceVisibility === 'PUBLIC' ? <Globe2 className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}
                  {t('Prices for {{country}}', 'أسعار {{country}}', '{{country}} 的价格').replace('{{country}}', language === 'ar' ? selectedCountry.nameAr : language === 'zh' ? selectedCountry.nameZh : selectedCountry.name)}
                </div>
                <h1 className="v2-title relative mt-4 text-3xl sm:text-[2.6rem]">{name}</h1>
                <p className="relative mt-3 max-w-2xl text-[15px] leading-7 text-[var(--v2-muted)] sm:text-base">{description}</p>
              </div>
              <div className="v2-category-art relative mx-auto h-32 w-32 sm:h-40 sm:w-40"><img src={category.image} alt="" className="h-full w-full object-contain" /></div>
            </header>

            <div className="mt-6 space-y-8">
              {(category.products ?? []).map((product) => {
                const productName = language === 'ar' ? product.nameAr : language === 'zh' ? product.nameZh || product.name : product.name;
                const productDescription = language === 'ar' ? product.descriptionAr : language === 'zh' ? product.descriptionZh || product.description : product.description;
                return (
                  <section key={product.id} aria-labelledby={`product-${product.id}`}>
                    <div className="flex items-start gap-3">
                      <span className="relative h-12 w-12 flex-none overflow-hidden rounded-xl border border-[var(--v2-border)] bg-white p-1 shadow-[var(--v2-shadow-sm)]"><img src={product.image} alt="" className="h-full w-full object-contain" /></span>
                      <div><h2 id={`product-${product.id}`} className="text-xl font-bold tracking-tight text-[var(--v2-navy)]">{productName}</h2><p className="mt-1 text-xs leading-5 text-[var(--v2-muted)] sm:text-sm">{productDescription}</p></div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {product.packages.filter((pkg) => pkg.inStock).map((pkg) => (
                        <Link key={pkg.id} href={isAuthenticated
                          ? `/top-up/${product.slug}?amount=${pkg.amount}`
                          : `/auth?next=${encodeURIComponent(`/top-up/${product.slug}?amount=${pkg.amount}`)}`
                        } className={`v2-package-card group flex min-h-[196px] flex-col p-3.5 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--category-accent)] ${pkg.isPopular ? 'border-[var(--category-accent)] bg-[color-mix(in_srgb,var(--category-accent)_8%,#ffffff)]' : ''}`} style={{ '--category-accent': category.accentColor } as CSSProperties}>
                          {pkg.isPopular && <span className="v2-chip v2-chip-gold mb-2 max-w-max px-2 py-0.5 text-[10px]">{t('Popular', 'الأكثر اختياراً', '热门')}</span>}
                          <span className="text-2xl font-extrabold tabular-nums tracking-tight text-[var(--v2-navy)]">{new Intl.NumberFormat(locale).format(pkg.amount)}</span>
                          <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--v2-muted)]"><Gem className="h-3.5 w-3.5 text-[var(--v2-blue)]" />{language === 'ar' ? pkg.unitAr : pkg.unit}</span>
                          <span className="mt-4 text-[10px] font-semibold uppercase tracking-wide text-[var(--v2-subtle)]">{t('You pay', 'تدفع', '您支付')}</span>
                          <PriceDisplay amountIqd={pkg.salePrice || pkg.basePrice} compact primaryClassName="mt-1 text-base font-bold text-[var(--v2-gold-deep)]" secondaryClassName="text-[var(--v2-muted)]" />
                          <span className="mt-auto flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-[var(--v2-navy)] px-2 text-xs font-bold text-white transition-colors group-hover:bg-[var(--v2-navy-700)]">{isAuthenticated ? t('Choose', 'اختر', '选择') : t('Login to order', 'سجل الدخول للطلب', '登录下单')}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></span>
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
