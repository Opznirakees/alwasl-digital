'use client';

import Link from 'next/link';
import { Suspense, use, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  BadgeCheck,
  Check,
  CheckCircle2,
  Gem,
  Loader2,
  LockKeyhole,
  MessageCircle,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { PriceDisplay } from '@/components/pricing/PriceDisplay';
import { supportWhatsAppHref, supportWhatsAppNumber } from '@/config/contact';
import { useApp } from '@/contexts/AppContext';
import {
  checkoutSteps,
  getCheckoutStepState,
  getInitialPackageId,
  type CheckoutStep,
} from '@/lib/easy-use';
import type { Game, GamePackage } from '@/types';

interface TopUpPageProps {
  params: Promise<{ slug: string }>;
}

function createClientIdempotencyKey() {
  return globalThis.crypto?.randomUUID?.() ?? `order-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function TopUpDetailPageContent({ params }: TopUpPageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    t,
    language,
    dir,
    user,
    isAuthenticated,
    isAccountLoading,
    selectedCountry,
    refreshAccount,
    formatLocalAmount,
  } = useApp();
  const [game, setGame] = useState<Game | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [productError, setProductError] = useState(false);
  const [step, setStep] = useState<CheckoutStep>('package');
  const [selectedPackage, setSelectedPackage] = useState<GamePackage | null>(null);
  const [userId, setUserId] = useState('');
  const [wahoIdError, setWahoIdError] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [verifiedUsername, setVerifiedUsername] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [financialOtp, setFinancialOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const wizardRef = useRef<HTMLDivElement>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const shouldFocusStepRef = useRef(false);
  const hasRestoredCheckoutRef = useRef(false);
  const orderIdempotencyKeyRef = useRef<string | null>(null);
  const locale = language === 'ar' ? 'ar-IQ' : language === 'zh' ? 'zh-CN' : 'en-IQ';

  useEffect(() => {
    if (isAccountLoading) return;
    if (!isAuthenticated) {
      router.replace(`/auth?next=${encodeURIComponent(`/top-up/${slug}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`)}`);
      return;
    }

    let active = true;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);

    async function loadProduct() {
      setIsLoadingProduct(true);
      setProductError(false);
      try {
        const response = await fetch(`/api/products/${slug}?country=${selectedCountry.id}`, { credentials: 'include', signal: controller.signal });
        if (response.status === 401) {
          router.replace(`/auth?next=${encodeURIComponent(`/top-up/${slug}`)}`);
          return;
        }
        if (!response.ok) throw new Error('PRODUCT_UNAVAILABLE');
        const payload = await response.json();
        if (!payload?.product) throw new Error('PRODUCT_UNAVAILABLE');
        if (active) setGame(payload.product);
      } catch {
        if (active) {
          setGame(null);
          setProductError(true);
        }
      } finally {
        window.clearTimeout(timeoutId);
        if (active) setIsLoadingProduct(false);
      }
    }

    void loadProduct();
    return () => {
      active = false;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [isAccountLoading, isAuthenticated, router, searchParams, selectedCountry.id, slug]);

  useEffect(() => {
    if (!game) return;
    const packageId = getInitialPackageId(game.packages, searchParams.get('amount'));
    if (packageId) {
      const initialPackage = game.packages.find((item) => item.id === packageId) ?? null;
      setSelectedPackage(initialPackage);
    }

    if (searchParams.get('resume') !== '1' || hasRestoredCheckoutRef.current) return;
    hasRestoredCheckoutRef.current = true;
    try {
      const rawCheckout = sessionStorage.getItem('alwasl-pending-checkout');
      if (!rawCheckout) return;
      const pendingCheckout = JSON.parse(rawCheckout) as {
        slug?: string;
        userId?: string;
        zoneId?: string;
        paymentMethod?: string;
      };
      if (pendingCheckout.slug !== game.slug) return;

      setUserId(pendingCheckout.userId?.slice(0, 80) ?? '');
      setZoneId(pendingCheckout.zoneId?.slice(0, 80) ?? '');
      if (pendingCheckout.paymentMethod === 'cash') {
        setPaymentMethod(pendingCheckout.paymentMethod);
      }
      shouldFocusStepRef.current = true;
      setStep('details');
      sessionStorage.removeItem('alwasl-pending-checkout');
    } catch {
      try {
        sessionStorage.removeItem('alwasl-pending-checkout');
      } catch {
        // Checkout still opens at the selected amount if browser storage is unavailable.
      }
    }
  }, [game, searchParams]);

  useEffect(() => {
    orderIdempotencyKeyRef.current = null;
    setFinancialOtp('');
    setOtpRequested(false);
  }, [game?.slug, paymentMethod, selectedPackage?.id, userId, zoneId]);

  useEffect(() => {
    if (!shouldFocusStepRef.current) return;
    shouldFocusStepRef.current = false;

    window.requestAnimationFrame(() => {
      const top = (wizardRef.current?.getBoundingClientRect().top ?? 72) + window.scrollY - 72;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      window.setTimeout(() => stepHeadingRef.current?.focus({ preventScroll: true }), 180);
    });
  }, [step]);

  if (isAccountLoading || isLoadingProduct || !isAuthenticated) {
    return (
      <div className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
        <Header />
        <main className="container mx-auto max-w-5xl px-4 py-8">
          <div role="status" aria-live="polite" className="mx-auto max-w-3xl">
            <div className="mb-5 flex items-center gap-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600 motion-reduce:animate-none" />
              {t('Opening the available amounts...', 'جارٍ فتح المبالغ المتاحة...', '正在打开可用金额...')}
            </div>
            <div className="h-16 animate-pulse rounded-lg bg-white dark:bg-zinc-900" />
            <div className="mt-5 h-14 animate-pulse rounded-lg bg-white dark:bg-zinc-900" />
            <div className="mt-5 h-80 animate-pulse rounded-lg bg-white dark:bg-zinc-900" />
            <span className="sr-only">{t('Loading your recharge', 'جارٍ تحميل عملية الشحن', '正在加载充值')}</span>
          </div>
        </main>
      </div>
    );
  }

  if (productError || !game) {
    return (
      <div className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
        <Header />
        <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
          <section className="max-w-xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-zinc-950 dark:text-white">
              {t('This recharge is temporarily unavailable', 'عملية الشحن غير متاحة مؤقتاً', '该充值暂时不可用')}
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
              {t('We could not open the top-up page. Try again in a moment.', 'تعذر فتح صفحة الشحن. حاول مرة أخرى بعد قليل.', '无法打开充值页面，请稍后重试。')}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button onClick={() => window.location.reload()} className="bg-blue-600 text-white hover:bg-blue-700">
                {t('Try again', 'حاول مرة أخرى', '重试')}
              </Button>
              <Button asChild variant="outline">
                <Link href="/#categories">{t('Back to categories', 'العودة إلى الفئات', '返回分类')}</Link>
              </Button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const availablePackages = game.packages.filter((item) => item.inStock);
  const discount = user?.discountPercentage ?? 0;
  const formatAmount = (amount: number) => new Intl.NumberFormat(locale).format(amount);
  const calculateFinalPrice = (pkg: GamePackage) => {
    const price = pkg.salePrice || pkg.basePrice;
    return price - (price * discount) / 100;
  };
  const total = selectedPackage ? calculateFinalPrice(selectedPackage) : 0;

  const goToStep = (nextStep: CheckoutStep) => {
    shouldFocusStepRef.current = true;
    setStep(nextStep);
  };

  const handleVerifyUserId = async () => {
    if (game.fulfillmentMode !== 'waho_api') {
      setVerifiedUsername(t('Ready for manual handling', 'جاهز للمعالجة اليدوية', '可进行人工处理'));
      return;
    }
    if (!userId.trim()) {
      const message = t('Enter your WAHO ID first', 'أدخل معرف WAHO أولاً', '请先输入 WAHO ID');
      setWahoIdError(message);
      toast.error(message);
      return;
    }

    setWahoIdError('');
    setIsVerifying(true);
    try {
      const response = await fetch('/api/waho/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wahoId: userId.trim() }),
      });
      const payload = await response.json();

      if (!response.ok || !payload.account?.valid) {
        throw new Error(payload.error || 'INVALID_WAHO_ACCOUNT');
      }

      setVerifiedUsername(payload.account.username);
      setWahoIdError('');
    } catch {
      const message = t('We could not find this WAHO ID. Check it and try again.', 'لم نتمكن من العثور على معرف WAHO. تحقق منه وحاول مرة أخرى.', '找不到此 WAHO ID，请检查后重试。');
      setVerifiedUsername(null);
      setWahoIdError(message);
      toast.error(message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleProceedToPayment = () => {
    if (game.requiresUserId && !verifiedUsername) {
      toast.error(t('Check the WAHO ID before continuing', 'تحقق من معرف WAHO قبل المتابعة', '继续前请检查 WAHO ID'));
      return;
    }
    if (game.zoneIdRequired && !zoneId.trim()) {
      toast.error(t('Enter the required WAHO reference', 'أدخل مرجع WAHO المطلوب', '请输入所需的 WAHO 参考信息'));
      return;
    }
    goToStep('payment');
  };

  const loginReturnPath = `/top-up/${game.slug}?amount=${selectedPackage?.amount ?? ''}&resume=1`;
  const handleLoginForCheckout = () => {
    try {
      sessionStorage.setItem('alwasl-pending-checkout', JSON.stringify({
        slug: game.slug,
        userId,
        zoneId,
        paymentMethod,
      }));
    } catch {
      // Returning to the selected amount still works when storage is unavailable.
    }
    router.push(`/auth?next=${encodeURIComponent(loginReturnPath)}`);
  };

  const handleRequestOrderOtp = async () => {
    if (!isAuthenticated) {
      handleLoginForCheckout();
      return;
    }

    setIsRequestingOtp(true);
    try {
      const response = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ purpose: 'ORDER_CONFIRMATION' }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || 'OTP_REQUEST_FAILED');
      if (payload?.debugOtp) setFinancialOtp(payload.debugOtp);
      setOtpRequested(true);
    } catch {
      toast.error(t('The code could not be sent. Try again.', 'تعذر إرسال الرمز. حاول مرة أخرى.', '验证码发送失败，请重试。'));
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!isAuthenticated) {
      handleLoginForCheckout();
      return;
    }
    if (!selectedPackage) return;
    if (!/^\d{6}$/.test(financialOtp)) {
      toast.error(t('Enter the 6-digit WhatsApp code', 'أدخل رمز واتساب المكون من 6 أرقام', '请输入 6 位 WhatsApp 验证码'));
      return;
    }

    setIsProcessing(true);
    try {
      orderIdempotencyKeyRef.current ??= createClientIdempotencyKey();
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': orderIdempotencyKeyRef.current,
        },
        credentials: 'include',
        body: JSON.stringify({
          productSlug: game.slug,
          packageId: selectedPackage.id,
          wahoId: game.requiresUserId ? userId : '',
          zoneId,
          paymentMethod,
          otp: financialOtp,
        }),
      });
      const orderPayload = await orderResponse.json();
      if (!orderResponse.ok) throw new Error(orderPayload.error || 'ORDER_CREATION_FAILED');

      await refreshAccount();
      orderIdempotencyKeyRef.current = null;
      setFinancialOtp('');
      setOtpRequested(false);
      toast.success(t('Order placed', 'تم إرسال الطلب', '订单已提交'));
      router.push('/orders');
    } catch (error) {
      const message = error instanceof Error && !error.message.includes('_')
        ? error.message
        : t('The order could not be placed. Check the details and try again.', 'تعذر إرسال الطلب. تحقق من البيانات وحاول مرة أخرى.', '订单提交失败，请检查信息后重试。');
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    {
      id: 'cash',
      name: t('Cash payment', 'الدفع نقداً', '现金支付'),
      description: t(
        'Place your order, then arrange the cash payment with our team on WhatsApp.',
        'أرسل طلبك، ثم نسّق الدفع نقداً مع فريقنا عبر واتساب.',
        '提交订单后，请通过 WhatsApp 与客服安排现金付款。'
      ),
      icon: Banknote,
      disabled: false,
    },
  ];

  const selectedPayment = paymentMethods.find((item) => item.id === paymentMethod) ?? paymentMethods[0];
  const canReviewPayment = !selectedPayment.disabled;
  const selectedAmountText = selectedPackage ? formatAmount(selectedPackage.amount) : '';

  return (
    <div data-v2-wizard className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="container mx-auto max-w-6xl px-3 pb-40 pt-3 sm:px-4 sm:pt-8 lg:pb-8">
        <Link href="/#categories" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--v2-muted)] hover:text-[var(--v2-gold)]">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('All categories', 'كل الفئات', '所有分类')}
        </Link>

        <section data-v2-checkout-brand className="v2-surface mt-2 flex items-center gap-2.5 p-2.5 sm:mt-3 sm:gap-3 sm:p-4">
          <div className="relative h-11 w-11 flex-shrink-0 overflow-hidden rounded-md border border-black/10 bg-white dark:border-white/10 sm:h-12 sm:w-12 sm:rounded-lg">
            <img data-visual-required-image src={game.image} alt="" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-[var(--v2-gold)]">{t('Digital recharge', 'شحن رقمي', '数字充值')}</p>
            <h1 className="truncate text-base font-semibold text-zinc-950 dark:text-white sm:text-xl">
              {language === 'ar' ? game.nameAr : language === 'zh' ? game.nameZh || game.name : game.name}
            </h1>
            <p className="mt-0.5 hidden text-xs text-zinc-500 dark:text-zinc-400 sm:block">
              {t('Choose, check, confirm', 'اختر وتحقق ثم أكد', '选择、检查、确认')}
            </p>
          </div>
          <div className="hidden items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 sm:flex">
            <ShieldCheck className="h-4 w-4 text-[var(--v2-gold)]" />
            {game.requiresUserId ? t('Account checked before payment', 'فحص الحساب قبل الدفع', '付款前检查账号') : t('Delivery through WhatsApp', 'التسليم عبر واتساب', '通过 WhatsApp 交付')}
          </div>
        </section>

        <div ref={wizardRef} className="scroll-mt-20">
          <nav aria-label={t('Top-up progress', 'تقدم عملية الشحن', '充值进度')} className="v2-surface v2-wizard-progress mt-3 p-1.5 sm:mt-5 sm:p-3">
            <ol className="grid grid-cols-4 gap-1 sm:gap-2">
              {checkoutSteps.map((item, index) => {
                const state = getCheckoutStepState(step, item.id);
                const label = item.id === 'details' && !game.requiresUserId
                  ? t('Delivery', 'التسليم', '交付')
                  : item.label[language];
                const canReturn = state === 'complete';
                return (
                  <li key={item.id} className="min-w-0">
                    <button
                      type="button"
                      disabled={!canReturn}
                      onClick={() => canReturn && goToStep(item.id)}
                      aria-current={state === 'current' ? 'step' : undefined}
                      aria-label={t('Step {{number}}: {{label}}', 'الخطوة {{number}}: {{label}}', '第 {{number}} 步：{{label}}')
                        .replace('{{number}}', String(index + 1))
                        .replace('{{label}}', label)}
                      className={`flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-md px-1 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-gold)] sm:min-h-14 sm:gap-1 ${
                        state === 'current'
                          ? 'bg-[var(--v2-gold)] text-[#07152e]'
                          : state === 'complete'
                            ? 'bg-[var(--v2-surface-raised)] text-[var(--v2-gold)] hover:brightness-110'
                            : 'text-[var(--v2-muted)] opacity-55'
                      }`}
                    >
                      <span className="flex h-5 w-5 items-center justify-center text-xs font-semibold tabular-nums">
                        {state === 'complete' ? <Check className="h-4 w-4" /> : index + 1}
                      </span>
                      <span
                        data-checkout-step-label
                        className="min-h-6 max-w-full whitespace-normal break-words text-[9px] font-semibold leading-3 sm:min-h-0 sm:text-xs sm:leading-4"
                      >
                        {label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="mt-3 grid items-start gap-5 sm:mt-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <section className="v2-surface min-w-0 p-3 sm:p-7">
              {step === 'package' && (
                <>
                  <h2 ref={stepHeadingRef} tabIndex={-1} className="text-xl font-semibold text-zinc-950 outline-none dark:text-white sm:text-2xl">
                    {t('Choose your amount', 'اختر المبلغ', '选择金额')}
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-300 sm:mt-2 sm:text-sm sm:leading-6">
                    {t('Choose the balance or code value you want to order.', 'اختر قيمة الرصيد أو الرمز الذي تريد طلبه.', '选择您要订购的余额或充值码面值。')}
                  </p>

                  {availablePackages.length > 0 ? (
                    <div data-v2-mobile-wizard-packages className="mt-3 grid grid-cols-3 gap-2 sm:mt-5 sm:gap-3">
                      {availablePackages.map((pkg) => {
                        const isSelected = selectedPackage?.id === pkg.id;
                        return (
                          <button
                            key={pkg.id}
                            type="button"
                            aria-pressed={isSelected}
                            aria-label={`${formatAmount(pkg.amount)} ${language === 'ar' ? pkg.unitAr : pkg.unit}${pkg.isPopular ? `, ${t('Popular', 'الأكثر اختياراً', '热门')}` : ''}`}
                            onClick={() => setSelectedPackage(pkg)}
                            className={`v2-wizard-package v2-mobile-wizard-package relative flex min-h-[126px] flex-col justify-between rounded-lg border p-2 text-start transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-gold)] sm:min-h-40 sm:p-4 ${
                              isSelected
                                ? 'border-[var(--v2-gold)] bg-[color-mix(in_srgb,var(--v2-gold)_10%,var(--v2-surface))] ring-1 ring-[var(--v2-gold)]'
                                : 'border-[var(--v2-border)] bg-[var(--v2-surface-raised)] hover:border-[var(--v2-gold)]'
                            }`}
                          >
                            <span className={isSelected ? 'pe-7' : undefined}>
                              <span className="block text-[1.05rem] font-semibold leading-none tabular-nums text-zinc-950 dark:text-white sm:text-2xl">{formatAmount(pkg.amount)}</span>
                              <span className="mt-1.5 inline-flex items-center gap-1 text-[9px] font-bold leading-3 text-[var(--v2-gold)] sm:mt-2 sm:whitespace-nowrap sm:text-xs">
                                <Gem className="h-3 w-3 text-[var(--v2-blue)] sm:h-3.5 sm:w-3.5" />
                                <span>{language === 'ar' ? pkg.unitAr : pkg.unit}</span>
                              </span>
                              {pkg.isPopular && !isSelected && (
                                <span className="mt-1.5 block w-fit rounded bg-[#ffd33d] px-1.5 py-0.5 text-[8px] font-semibold text-[#071b46] sm:mt-2 sm:rounded-full sm:px-2 sm:py-1 sm:text-[10px]">
                                  {t('Popular', 'شائع', '热门')}
                                </span>
                              )}
                            </span>
                            {isSelected && (
                              <span
                                data-selected-package-check
                                className="absolute end-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--v2-gold)] text-[#07152e] sm:end-2 sm:top-2 sm:h-6 sm:w-6"
                              >
                                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              </span>
                            )}
                            <span className="mt-2 border-t border-black/10 pt-1.5 text-[9px] text-zinc-500 dark:border-white/10 dark:text-zinc-400 sm:mt-3 sm:pt-2 sm:text-[11px]">
                              {t('You pay', 'ستدفع', '需支付')}
                              <PriceDisplay
                                amountIqd={calculateFinalPrice(pkg)}
                                compact
                                primaryClassName="mt-0.5 text-[11px] text-zinc-950 dark:text-white sm:mt-1 sm:text-sm"
                                secondaryClassName="text-zinc-500 dark:text-zinc-300"
                              />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-5 rounded-lg bg-zinc-100 p-4 text-sm leading-6 text-zinc-600 dark:bg-zinc-950 dark:text-zinc-300">
                      {t('No recharge amounts are available right now. Please try again later.', 'لا توجد مبالغ شحن متاحة حالياً. يرجى المحاولة لاحقاً.', '目前没有可用的充值金额，请稍后重试。')}
                    </div>
                  )}

                  <Button
                    onClick={() => goToStep('details')}
                    disabled={!selectedPackage}
                    className="v2-primary-button mt-6 hidden w-full lg:flex"
                  >
                    {selectedPackage
                      ? t('Continue with {{amount}}', 'تابع مع {{amount}}', '继续选择 {{amount}}').replace('{{amount}}', selectedAmountText)
                      : t('Choose an amount to continue', 'اختر مبلغاً للمتابعة', '选择金额后继续')}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </Button>
                </>
              )}

              {step === 'details' && (
                <>
                  {game.requiresUserId ? (
                    <>
                      <h2 ref={stepHeadingRef} tabIndex={-1} className="text-2xl font-semibold text-zinc-950 outline-none dark:text-white">
                        {t(game.userIdLabel, game.userIdLabelAr, game.userIdLabel)}
                      </h2>
                      <p id="waho-id-help" className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {t('Enter the account ID and check it before payment.', 'أدخل معرف الحساب وتحقق منه قبل الدفع.', '输入账号 ID，并在付款前进行检查。')}
                      </p>
                      <div className="mt-6">
                        <Label htmlFor="waho-id" className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">{t(game.userIdLabel, game.userIdLabelAr, game.userIdLabel)}</Label>
                        <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                          <Input
                            id="waho-id"
                            aria-describedby={wahoIdError ? 'waho-id-help waho-id-error' : 'waho-id-help'}
                            aria-invalid={Boolean(wahoIdError)}
                            value={userId}
                            onChange={(event) => {
                              setUserId(event.target.value.trimStart());
                              setVerifiedUsername(null);
                              setWahoIdError('');
                            }}
                            autoComplete="off"
                            placeholder={t(game.userIdPlaceholder, game.userIdPlaceholderAr, game.userIdPlaceholder)}
                            className="v2-input h-12 text-base"
                          />
                          <Button type="button" onClick={handleVerifyUserId} disabled={isVerifying || userId.trim().length < 3} variant="outline" className="h-12 min-w-28">
                            {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                            {t('Check ID', 'تحقق من المعرف', '检查 ID')}
                          </Button>
                        </div>
                        {wahoIdError && <p id="waho-id-error" role="alert" className="mt-2 text-sm leading-6 text-red-600 dark:text-red-300">{wahoIdError}</p>}
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 ref={stepHeadingRef} tabIndex={-1} className="text-2xl font-semibold text-zinc-950 outline-none dark:text-white">{t('WhatsApp delivery', 'التسليم عبر واتساب', 'WhatsApp 交付')}</h2>
                      <div className="mt-4 flex items-start gap-3 rounded-lg border border-[#9bd8f2]/35 bg-[#9bd8f2]/10 p-4">
                        <MessageCircle className="mt-0.5 h-5 w-5 flex-none text-[#49b7e5]" />
                        <div><p className="text-sm font-semibold text-zinc-950 dark:text-white">{t('We use your login number', 'نستخدم رقم تسجيل الدخول', '我们使用您的登录号码')}</p><p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">{t('After payment, the purchased code is checked by the team and sent to you on WhatsApp.', 'بعد الدفع يتحقق الفريق من الرمز المشترى ويرسله إليك عبر واتساب.', '付款后，团队会核对购买的充值码并通过 WhatsApp 发送给您。')}</p></div>
                      </div>
                    </>
                  )}

                  {game.zoneIdRequired && (
                    <div className="mt-5">
                      <Label htmlFor="waho-reference" className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        {t(game.zoneIdLabel || 'WAHO reference', game.zoneIdLabelAr || 'مرجع WAHO', 'WAHO 参考信息')}
                      </Label>
                      <Input
                        id="waho-reference"
                        value={zoneId}
                        onChange={(event) => setZoneId(event.target.value)}
                        className="v2-input mt-2 h-12"
                      />
                    </div>
                  )}

                  {verifiedUsername && (
                    <div role="status" className="mt-5 flex items-center gap-3 rounded-lg border border-[#34c759]/30 bg-[#eaf8ee] p-4 dark:bg-[#34c759]/10">
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#1f8f3a] dark:bg-zinc-900 dark:text-[#52d273]">
                        <Check className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#1f8f3a] dark:text-[#52d273]">{t('Account found', 'تم العثور على الحساب', '已找到账号')}</p>
                        <p className="truncate font-semibold text-zinc-950 dark:text-white">{verifiedUsername}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 hidden grid-cols-[auto_minmax(0,1fr)] gap-3 lg:grid">
                    <Button type="button" variant="outline" onClick={() => goToStep('package')}>
                      <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                      <span className="hidden sm:inline">{t('Back', 'رجوع', '返回')}</span>
                    </Button>
                    <Button
                      type="button"
                      onClick={handleProceedToPayment}
                      disabled={game.requiresUserId && !verifiedUsername}
                      className="v2-primary-button"
                    >
                      {t('Continue to payment', 'تابع إلى الدفع', '继续付款')}
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </Button>
                  </div>
                </>
              )}

              {step === 'payment' && (
                <>
                  <h2 ref={stepHeadingRef} tabIndex={-1} className="text-2xl font-semibold text-zinc-950 outline-none dark:text-white">
                    {t('Cash payment', 'الدفع نقداً', '现金支付')}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    {t('Cash is currently available. We start your order after our team confirms receipt.', 'الدفع النقدي متاح حالياً. نبدأ طلبك بعد أن يؤكد فريقنا الاستلام.', '目前支持现金付款。客服确认收款后，我们会开始处理订单。')}
                  </p>

                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-5 grid gap-3">
                    {paymentMethods.map((method) => {
                      const isSelected = paymentMethod === method.id;
                      return (
                        <label
                          key={method.id}
                          aria-disabled={method.disabled}
                          className={`flex min-h-20 items-center gap-3 rounded-lg border p-4 transition-colors focus-within:ring-2 focus-within:ring-[var(--v2-gold)] ${
                            method.disabled
                              ? 'cursor-not-allowed border-[var(--v2-border)] bg-[var(--v2-surface-raised)] opacity-50'
                              : isSelected
                              ? 'border-[var(--v2-gold)] bg-[color-mix(in_srgb,var(--v2-gold)_10%,var(--v2-surface))]'
                              : 'cursor-pointer border-[var(--v2-border)] bg-[var(--v2-surface-raised)] hover:border-[var(--v2-gold)]'
                          }`}
                        >
                          <RadioGroupItem value={method.id} disabled={method.disabled} className="border-[var(--v2-gold)] text-[var(--v2-gold)]" />
                          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#eaf1f8] text-[#1769d2]">
                            <method.icon className="h-5 w-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold text-zinc-950 dark:text-white">{method.name}</span>
                            <span className="mt-0.5 block text-xs leading-5 text-zinc-500 dark:text-zinc-400">{method.description}</span>
                          </span>
                          {isSelected && !method.disabled && <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-[var(--v2-gold)]" />}
                        </label>
                      );
                    })}
                  </RadioGroup>

                  <a
                    href={supportWhatsAppHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 flex min-h-14 items-center gap-3 rounded-lg border border-[#52d273]/25 bg-[#52d273]/10 p-3 text-start transition-colors hover:bg-[#52d273]/15"
                  >
                    <MessageCircle className="h-5 w-5 flex-shrink-0 text-[#52d273]" />
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-zinc-950 dark:text-white">{t('Arrange cash payment on WhatsApp', 'نسّق الدفع النقدي عبر واتساب', '通过 WhatsApp 安排现金付款')}</span>
                      <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-300">{supportWhatsAppNumber}</span>
                    </span>
                    <ArrowRight className="ms-auto h-4 w-4 flex-shrink-0 text-[#52d273] rtl:rotate-180" />
                  </a>

                  <div className="mt-6 hidden grid-cols-[auto_minmax(0,1fr)] gap-3 lg:grid">
                    <Button type="button" variant="outline" onClick={() => goToStep('details')}>
                      <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                      <span className="hidden sm:inline">{t('Back', 'رجوع', '返回')}</span>
                    </Button>
                    <Button type="button" onClick={() => goToStep('confirm')} disabled={!canReviewPayment} className="v2-primary-button">
                      {t('Review order', 'راجع الطلب', '检查订单')}
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </Button>
                  </div>
                </>
              )}

              {step === 'confirm' && selectedPackage && (
                <>
                  <h2 ref={stepHeadingRef} tabIndex={-1} className="text-2xl font-semibold text-zinc-950 outline-none dark:text-white">
                    {t('Check everything once more', 'تحقق من كل شيء مرة أخيرة', '请再次核对信息')}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                    {game.requiresUserId
                      ? t('Make sure the amount and account are correct before you place the order.', 'تأكد من صحة المبلغ والحساب قبل إرسال الطلب.', '提交订单前，请确认金额和账号正确。')
                      : t('Make sure the amount and WhatsApp delivery number are correct.', 'تأكد من صحة المبلغ ورقم واتساب الخاص بالتسليم.', '请确认金额和 WhatsApp 收货号码正确。')}
                  </p>

                  <dl className="mt-5 divide-y divide-black/10 rounded-lg bg-zinc-100 px-4 dark:divide-white/10 dark:bg-zinc-950">
                    <div className="flex items-center justify-between gap-4 py-4">
                      <dt className="text-sm text-zinc-500 dark:text-zinc-400">{t('Amount', 'المبلغ', '金额')}</dt>
                      <dd className="text-sm font-semibold tabular-nums text-zinc-950 dark:text-white">{selectedAmountText} {language === 'ar' ? selectedPackage.unitAr : selectedPackage.unit}</dd>
                    </div>
                    {game.requiresUserId ? (
                      <div className="flex items-center justify-between gap-4 py-4">
                        <dt className="text-sm text-zinc-500 dark:text-zinc-400">{t('Account', 'الحساب', '账号')}</dt>
                        <dd className="min-w-0 text-end"><span className="block truncate text-sm font-semibold text-zinc-950 dark:text-white">{verifiedUsername}</span><span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">ID: {userId}</span></dd>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-4 py-4"><dt className="text-sm text-zinc-500 dark:text-zinc-400">{t('Delivery', 'التسليم', '交付')}</dt><dd className="text-sm font-semibold text-zinc-950 dark:text-white">{t('Your WhatsApp number', 'رقم واتساب الخاص بك', '您的 WhatsApp 号码')}</dd></div>
                    )}
                    <div className="flex items-center justify-between gap-4 py-4">
                      <dt className="text-sm text-zinc-500 dark:text-zinc-400">{t('Payment', 'الدفع', '付款')}</dt>
                      <dd className="text-sm font-semibold text-zinc-950 dark:text-white">{selectedPayment.name}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4 py-4">
                      <dt className="font-semibold text-zinc-950 dark:text-white">{t('Total', 'الإجمالي', '总计')}</dt>
                      <dd>
                        <PriceDisplay
                          amountIqd={total}
                          align="end"
                          primaryClassName="text-lg text-zinc-950 dark:text-white"
                          secondaryClassName="text-zinc-500 dark:text-zinc-300"
                        />
                      </dd>
                    </div>
                  </dl>

                  {!isAuthenticated ? (
                    <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-400/25 dark:bg-blue-500/10">
                      <div className="flex items-start gap-3">
                        <LockKeyhole className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-700 dark:text-blue-300" />
                        <div>
                          <h3 className="font-semibold text-zinc-950 dark:text-white">{t('Log in to finish', 'سجل الدخول لإكمال الطلب', '登录以完成订单')}</h3>
                          <p className="mt-1 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                            {t('We send a WhatsApp code to protect your order.', 'نرسل رمز واتساب لحماية طلبك.', '我们会发送 WhatsApp 验证码来保护您的订单。')}
                          </p>
                        </div>
                      </div>
                      <Button type="button" onClick={handleLoginForCheckout} className="v2-primary-button mt-4 w-full">
                        {t('Log in to continue', 'سجل الدخول للمتابعة', '登录后继续')}
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-lg border border-black/10 p-4 dark:border-white/10">
                      <div className="flex items-start gap-3">
                        <MessageCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#1f8f3a] dark:text-[#52d273]" />
                        <div>
                          <Label htmlFor="order-otp" className="font-semibold text-zinc-950 dark:text-white">
                            {t('WhatsApp verification code', 'رمز تحقق واتساب', 'WhatsApp 验证码')}
                          </Label>
                          <p className="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">
                            {t('Send the code, then enter all 6 digits below.', 'أرسل الرمز ثم أدخل الأرقام الستة أدناه.', '发送验证码后，在下方输入全部 6 位数字。')}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                        <Input
                          id="order-otp"
                          aria-label={t('6-digit verification code', 'رمز التحقق من 6 أرقام', '6 位验证码')}
                          value={financialOtp}
                          onChange={(event) => setFinancialOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          placeholder="000000"
                          className="v2-input h-12 text-center text-lg font-semibold tabular-nums"
                        />
                        <Button type="button" variant="outline" onClick={handleRequestOrderOtp} disabled={isRequestingOtp} className="h-12">
                          {isRequestingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                          {otpRequested ? t('Send again', 'أرسل مرة أخرى', '重新发送') : t('Send code', 'أرسل الرمز', '发送验证码')}
                        </Button>
                      </div>
                      {otpRequested && (
                        <p role="status" className="mt-3 flex items-center gap-1.5 text-xs font-medium text-[#1f8f3a] dark:text-[#52d273]">
                          <CheckCircle2 className="h-4 w-4" />
                          {t('Code sent to your WhatsApp number', 'تم إرسال الرمز إلى رقم واتساب الخاص بك', '验证码已发送到您的 WhatsApp 号码')}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-6 hidden grid-cols-[auto_minmax(0,1fr)] gap-3 lg:grid">
                    <Button type="button" variant="outline" onClick={() => goToStep('payment')}>
                      <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
                      <span className="hidden sm:inline">{t('Back', 'رجوع', '返回')}</span>
                    </Button>
                    <Button
                      type="button"
                      onClick={isAuthenticated ? handleConfirmOrder : handleLoginForCheckout}
                      disabled={isProcessing || (isAuthenticated && financialOtp.length !== 6)}
                      className="v2-primary-button"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      {isAuthenticated
                        ? t('Place cash order', 'إرسال طلب الدفع النقدي', '提交现金订单')
                        : t('Log in to continue', 'سجل الدخول للمتابعة', '登录后继续')}
                    </Button>
                  </div>
                </>
              )}

              {selectedPackage && step !== 'confirm' && (
                <div className="v2-surface-raised mt-6 flex items-center justify-between gap-4 p-3 lg:hidden">
                  <div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('Selected', 'المحدد', '已选择')}</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-950 dark:text-white">{selectedAmountText} {language === 'ar' ? selectedPackage.unitAr : selectedPackage.unit}</p>
                  </div>
                  <div className="text-end">
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{t('Total', 'الإجمالي', '总计')}</p>
                    <p className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-950 dark:text-white">{formatLocalAmount(total)}</p>
                  </div>
                </div>
              )}
            </section>

            <aside className="v2-surface sticky top-24 hidden p-5 lg:block">
              <h2 className="text-base font-semibold text-zinc-950 dark:text-white">{t('Your top-up', 'عملية الشحن', '您的充值')}</h2>
              {selectedPackage ? (
                <div className="mt-5">
                  <div className="flex items-center gap-3">
                    <div className="relative h-11 w-11 overflow-hidden rounded-lg border border-black/10 bg-white dark:border-white/10">
                      <img src={game.image} alt="" className="h-full w-full object-contain" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-950 dark:text-white">{language === 'ar' ? game.nameAr : language === 'zh' ? game.nameZh || game.name : game.name}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{selectedAmountText} {language === 'ar' ? selectedPackage.unitAr : selectedPackage.unit}</p>
                    </div>
                  </div>
                  <dl className="mt-5 space-y-3 border-t border-black/10 pt-4 text-sm dark:border-white/10">
                    <div className="flex justify-between gap-4">
                      <dt className="text-zinc-500 dark:text-zinc-400">{t('Amount', 'المبلغ', '金额')}</dt>
                      <dd className="font-medium tabular-nums text-zinc-950 dark:text-white">{formatLocalAmount(selectedPackage.salePrice || selectedPackage.basePrice)}</dd>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between gap-4 text-[#1f8f3a] dark:text-[#52d273]">
                        <dt>{t('Member discount', 'خصم العضوية', '会员折扣')} ({discount}%)</dt>
                        <dd>-{formatLocalAmount(((selectedPackage.salePrice || selectedPackage.basePrice) * discount) / 100, { absolute: true })}</dd>
                      </div>
                    )}
                    <div className="flex justify-between gap-4 border-t border-black/10 pt-3 text-base font-semibold dark:border-white/10">
                      <dt>{t('Total', 'الإجمالي', '总计')}</dt>
                      <dd className="tabular-nums">{formatLocalAmount(total)}</dd>
                    </div>
                  </dl>
                  {game.requiresUserId && verifiedUsername && (
                    <div className="mt-4 rounded-lg bg-[#eaf8ee] p-3 dark:bg-[#34c759]/10">
                      <p className="text-xs text-[#1f8f3a] dark:text-[#52d273]">{t('WAHO account', 'حساب WAHO', 'WAHO 账号')}</p>
                      <p className="mt-1 truncate text-sm font-semibold text-zinc-950 dark:text-white">{verifiedUsername}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-5 rounded-lg bg-zinc-100 p-4 text-center text-sm leading-6 text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                  {t('Choose an amount to see your total.', 'اختر مبلغاً لرؤية الإجمالي.', '选择金额后查看总计。')}
                </div>
              )}
            </aside>
          </div>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-[calc(68px+env(safe-area-inset-bottom))] z-[55] border-t border-[#d9e1ec] bg-white/95 p-3 shadow-[0_-14px_36px_rgba(28,55,92,0.12)] backdrop-blur-xl lg:hidden">
        <div className={`mx-auto grid max-w-xl gap-3 ${step === 'package' ? 'grid-cols-1' : 'grid-cols-[48px_minmax(0,1fr)]'}`}>
          {step !== 'package' && (
            <Button
              type="button"
              variant="outline"
              aria-label={t('Back to previous step', 'العودة إلى الخطوة السابقة', '返回上一步')}
              onClick={() => goToStep(step === 'details' ? 'package' : step === 'payment' ? 'details' : 'payment')}
              className="h-12 border-[#d9e1ec] bg-white px-0 text-[#07152e] hover:bg-[#eef4fa] hover:text-[#07152e]"
            >
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            </Button>
          )}

          {step === 'package' && (
            <Button type="button" onClick={() => goToStep('details')} disabled={!selectedPackage} className="v2-primary-button w-full">
              {selectedPackage
                ? t('Continue with {{amount}}', 'تابع مع {{amount}}', '继续选择 {{amount}}').replace('{{amount}}', selectedAmountText)
                : t('Choose an amount to continue', 'اختر مبلغاً للمتابعة', '选择金额后继续')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          )}

          {step === 'details' && (
            <Button type="button" onClick={handleProceedToPayment} disabled={game.requiresUserId && !verifiedUsername} className="v2-primary-button w-full">
              {t('Continue to payment', 'تابع إلى الدفع', '继续付款')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          )}

          {step === 'payment' && (
            <Button type="button" onClick={() => goToStep('confirm')} disabled={!canReviewPayment} className="v2-primary-button w-full">
              {t('Review order', 'راجع الطلب', '检查订单')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Button>
          )}

          {step === 'confirm' && (
            <Button
              type="button"
              onClick={isAuthenticated ? handleConfirmOrder : handleLoginForCheckout}
              disabled={isProcessing || (isAuthenticated && financialOtp.length !== 6)}
              className="v2-primary-button w-full"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {isAuthenticated
                ? t('Place cash order', 'إرسال طلب الدفع النقدي', '提交现金订单')
                : t('Log in to continue', 'سجل الدخول للمتابعة', '登录后继续')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function TopUpDetailFallback() {
  const { t, dir } = useApp();

  return (
    <div className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />
      <main className="container mx-auto max-w-5xl px-4 py-8" role="status" aria-live="polite">
        <div className="flex items-center gap-3 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 motion-reduce:animate-none" />
          {t('Opening your recharge...', 'جارٍ فتح عملية الشحن...', '正在打开充值...')}
        </div>
        <div className="mt-5 h-16 animate-pulse rounded-lg bg-white motion-reduce:animate-none dark:bg-zinc-900" />
        <div className="mt-5 h-80 animate-pulse rounded-lg bg-white motion-reduce:animate-none dark:bg-zinc-900" />
      </main>
    </div>
  );
}

export default function TopUpDetailPage(props: TopUpPageProps) {
  return (
    <Suspense fallback={<TopUpDetailFallback />}>
      <TopUpDetailPageContent {...props} />
    </Suspense>
  );
}
