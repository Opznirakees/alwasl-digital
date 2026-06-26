'use client';

import { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Game, GamePackage } from '@/types';
import {
  ArrowLeft,
  Check,
  Loader2,
  Sparkles,
  Shield,
  Zap,
  Wallet,
  CreditCard,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

interface GamePageProps {
  params: Promise<{ slug: string }>;
}

type CheckoutStep = 'package' | 'details' | 'payment' | 'confirm';

function createClientIdempotencyKey() {
  return globalThis.crypto?.randomUUID?.() ?? `order-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function GamePage({ params }: GamePageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { t, language, dir, user, isAuthenticated, selectedCountry, refreshAccount, formatLocalAmount } = useApp();

  const [game, setGame] = useState<Game | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [productError, setProductError] = useState(false);
  const [step, setStep] = useState<CheckoutStep>('package');
  const [selectedPackage, setSelectedPackage] = useState<GamePackage | null>(null);
  const [userId, setUserId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [verifiedUsername, setVerifiedUsername] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('wallet');
  const [isProcessing, setIsProcessing] = useState(false);
  const [financialOtp, setFinancialOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const wizardRef = useRef<HTMLDivElement>(null);
  const orderIdempotencyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadProduct() {
      setIsLoadingProduct(true);
      setProductError(false);
      try {
        const response = await fetch(`/api/products/${resolvedParams.slug}?country=${selectedCountry.id}`);
        if (!response.ok) throw new Error('PRODUCT_UNAVAILABLE');

        const payload = await response.json();
        if (!payload?.product) throw new Error('PRODUCT_UNAVAILABLE');

        if (active) {
          setGame(payload.product);
        }
      } catch {
        if (active) {
          setGame(null);
          setProductError(true);
        }
      } finally {
        if (active) setIsLoadingProduct(false);
      }
    }

    void loadProduct();

    return () => {
      active = false;
    };
  }, [resolvedParams.slug, router, selectedCountry.id]);

  useEffect(() => {
    orderIdempotencyKeyRef.current = null;
    setFinancialOtp('');
    setOtpRequested(false);
  }, [game?.slug, selectedPackage?.id, userId, zoneId, paymentMethod]);

  if (isLoadingProduct) {
    return (
      <div className={`min-h-screen bg-[#f5f5f7] ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
        <Header />
        <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </main>
      </div>
    );
  }

  if (productError || !game) {
    return (
      <div className={`min-h-screen bg-[#f5f5f7] ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
        <Header />
        <main className="container mx-auto flex min-h-[60vh] items-center justify-center px-4">
          <section className="max-w-xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-200">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-zinc-950 dark:text-white">
              {t('WAHO top-up is temporarily unavailable', 'شحن WAHO غير متاح مؤقتاً', 'WAHO 充值暂时不可用')}
            </h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
              {t(
                'The recharge flow could not be loaded. Try again or return to the WAHO overview.',
                'تعذر تحميل مسار الشحن. حاول مرة أخرى أو عد إلى صفحة WAHO.',
                '无法加载充值流程。请重试或返回 WAHO 概览。'
              )}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Button onClick={() => window.location.reload()} className="bg-blue-600 text-white shadow-none hover:bg-blue-700">
                {t('Try again', 'حاول مرة أخرى', '重试')}
              </Button>
              <Button asChild variant="outline" className="border-black/10 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800">
                <Link href="/top-up">{t('Back to WAHO Top-Up', 'العودة إلى شحن WAHO', '返回 WAHO 充值')}</Link>
              </Button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  const discount = user ? user.discountPercentage : 0;
  const locale = language === 'ar' ? 'ar-IQ' : language === 'zh' ? 'zh-CN' : 'en-IQ';
  const topUpIconSrc = '/brand/alwasl-mark.jpg';
  const topUpSignals = [
    { label: t('Secure checkout', 'دفع آمن', '安全结账'), icon: Shield },
    { label: t('Fast top-up', 'شحن سريع', '快速充值'), icon: Zap },
    { label: t('Simple steps', 'خطوات بسيطة', '简单步骤'), icon: Sparkles },
  ];
  const availablePackages = game.packages.filter((pkg) => pkg.inStock);

  const calculateFinalPrice = (pkg: GamePackage) => {
    const basePrice = pkg.salePrice || pkg.basePrice;
    const discountAmount = (basePrice * discount) / 100;
    return basePrice - discountAmount;
  };

  const goToStep = (nextStep: CheckoutStep) => {
    setStep(nextStep);
    window.requestAnimationFrame(() => {
      wizardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const handleVerifyUserId = async () => {
    if (!userId) {
      toast.error(t('Please enter your WAHO ID', 'الرجاء إدخال معرف WAHO'));
      return;
    }

    setIsVerifying(true);
    try {
      const response = await fetch('/api/waho/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wahoId: userId }),
      });
      const payload = await response.json();

      if (!response.ok) {
        toast.error(payload.error || t('Verification failed', 'فشل في التحقق', '验证失败'));
        return;
      }

      if (!payload.account?.valid) {
        toast.error(t('Invalid WAHO account', 'حساب WAHO غير صحيح', 'WAHO 账号无效'));
        return;
      }

      setVerifiedUsername(payload.account.username);
      toast.success(t('WAHO account verified!', 'تم التحقق من حساب WAHO!'));
    } catch {
      toast.error(t('Verification failed', 'فشل في التحقق', '验证失败'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleProceedToPayment = () => {
    if (!verifiedUsername && game.requiresUserId) {
      toast.error(t('Please verify the WAHO account first', 'الرجاء التحقق من حساب WAHO أولاً'));
      return;
    }
    if (game.zoneIdRequired && !zoneId) {
      toast.error(t('Please enter the required WAHO reference', 'الرجاء إدخال مرجع WAHO المطلوب', '请输入所需的 WAHO 参考信息'));
      return;
    }
    goToStep('payment');
  };

  const handleRequestOrderOtp = async () => {
    if (!isAuthenticated) {
      toast.error(t('Please login to continue', 'الرجاء تسجيل الدخول للمتابعة', '请登录后继续'));
      router.push('/auth');
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

      if (!response.ok) {
        throw new Error(payload?.error || t('Verification failed', 'فشل في التحقق', '验证失败'));
      }

      if (payload?.debugOtp) {
        console.info(`Al-Wasl order OTP: ${payload.debugOtp}`);
      }

      setOtpRequested(true);
      toast.success(t(
        'Verification code sent via WhatsApp',
        'تم إرسال رمز التحقق عبر واتساب',
        '验证码已通过 WhatsApp 发送'
      ));
    } catch (error) {
      const message = error instanceof Error ? error.message : t('Verification failed', 'فشل في التحقق', '验证失败');
      toast.error(message);
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleConfirmOrder = async () => {
    if (!isAuthenticated) {
      toast.error(t('Please login to continue', 'الرجاء تسجيل الدخول للمتابعة'));
      router.push('/auth');
      return;
    }

    if (!selectedPackage) return;

    if (!/^\d{6}$/.test(financialOtp)) {
      toast.error(t(
        'Enter the 6-digit WhatsApp verification code',
        'أدخل رمز التحقق من واتساب المكون من 6 أرقام',
        '请输入 6 位 WhatsApp 验证码'
      ));
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
          wahoId: userId,
          zoneId,
          paymentMethod,
          otp: financialOtp,
        }),
      });
      const orderPayload = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderPayload.error || 'Order creation failed');
      }

      await refreshAccount();
      orderIdempotencyKeyRef.current = null;
      setFinancialOtp('');
      setOtpRequested(false);
      toast.success(t(
        'Order submitted. We will confirm payment before processing.',
        'تم إرسال الطلب. سنؤكد الدفع قبل المعالجة.',
        '订单已提交。我们会在处理前确认付款。'
      ));
      router.push('/orders');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Order failed';
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentMethods = [
    { id: 'wallet', name: t('Wallet', 'المحفظة'), icon: Wallet, balance: user?.walletBalance || 0 },
    { id: 'zaincash', name: 'ZainCash', icon: CreditCard },
    { id: 'asiahawala', name: 'AsiaHawala', icon: CreditCard },
    { id: 'card', name: t('Credit Card', 'بطاقة ائتمان'), icon: CreditCard },
  ];

  return (
    <div className={`min-h-screen bg-[#f5f5f7] ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="container mx-auto px-4 py-5 md:py-6">
        <Link href="/" className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-blue-600">
          <ArrowLeft className="w-4 h-4" />
          {t('Back', 'رجوع')}
        </Link>

        <section className="mb-5 grid gap-4 rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-zinc-900 md:grid-cols-[1fr_auto] md:p-5">
          <div className="flex items-start gap-4">
            <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg border border-black/10 bg-white">
              <Image src={topUpIconSrc} alt="" fill className="object-contain p-1" priority />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase text-blue-600">WAHO</p>
              <h1 className="mt-1 text-2xl font-semibold leading-tight text-zinc-950 dark:text-white">
                {t(game.name, game.nameAr)}
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{t(game.publisher, game.publisher)}</p>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                {t(game.description, game.descriptionAr)}
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <div className="w-44 rounded-lg border border-black/10 bg-zinc-50 p-3 dark:border-white/10 dark:bg-zinc-950">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {t('Top-up route', 'مسار الشحن', '充值流程')}
              </p>
              <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-white">
                <span>WAHO ID</span>
                <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                <span>IQD</span>
                <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                <span>{t('Pay', 'ادفع', '付款')}</span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {topUpSignals.map((item) => (
                <div key={item.label} className="w-20 rounded-md bg-zinc-100 p-2 text-center dark:bg-zinc-950">
                  <item.icon className="mx-auto h-4 w-4 text-blue-600" />
                  <p className="mt-1.5 text-[11px] font-medium leading-4 text-zinc-600 dark:text-zinc-300">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div ref={wizardRef} id="top-up-wizard" className="scroll-mt-24">
          {/* Progress Steps */}
          <div className="mb-5 flex items-center justify-center gap-2">
            {(['package', 'details', 'payment', 'confirm'] as CheckoutStep[]).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    step === s
                      ? 'bg-blue-600 text-white'
                      : ['package', 'details', 'payment', 'confirm'].indexOf(step) > i
                      ? 'border border-blue-200 bg-blue-50 text-blue-600'
                      : 'border border-black/10 bg-white text-zinc-400'
                  }`}
                >
                  {['package', 'details', 'payment', 'confirm'].indexOf(step) > i ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 3 && (
                  <div
                    className={`w-12 h-0.5 ${
                      ['package', 'details', 'payment', 'confirm'].indexOf(step) > i
                        ? 'bg-blue-500'
                        : 'bg-zinc-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {step === 'package' && (
              <div className="rounded-lg border border-black/10 bg-white p-5">
                <h2 className="mb-4 text-xl font-semibold text-zinc-950">
                  {t('Select top-up amount', 'اختر مبلغ الشحن', '选择充值金额')}
                </h2>
                {availablePackages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {availablePackages.map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`relative rounded-lg p-4 text-start transition-colors ${
                        selectedPackage?.id === pkg.id
                          ? 'border border-blue-500 bg-blue-50 ring-2 ring-inset ring-blue-500'
                          : 'border border-black/10 bg-white hover:border-blue-200 hover:bg-zinc-50'
                      }`}
                    >
                      {pkg.isPopular && (
                        <Badge className="absolute -top-2 -right-2 border-0 bg-blue-600 px-2 py-0.5 text-[10px] text-white">
                          <Sparkles className="w-3 h-3 mr-1" />
                          {t('Popular', 'الأكثر شراءً')}
                        </Badge>
                      )}
                      {pkg.salePrice && (
                        <Badge className="absolute -top-2 left-2 border border-black/10 bg-white px-2 py-0.5 text-[10px] text-zinc-600">
                          {t('Sale', 'خصم')}
                        </Badge>
                      )}
                      <div className="mb-1 text-2xl font-semibold text-zinc-950">
                        {pkg.amount.toLocaleString(locale)}
                      </div>
                      <div className="text-sm text-blue-600">
                        {t(pkg.unit, pkg.unitAr)}
                      </div>
                      <div className="mt-3 border-t border-black/10 pt-3">
                        {pkg.salePrice ? (
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-semibold text-zinc-950">
                              {formatLocalAmount(pkg.salePrice)}
                            </span>
                            <span className="text-sm text-zinc-400 line-through">
                              {formatLocalAmount(pkg.basePrice)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-lg font-semibold text-zinc-950">
                            {formatLocalAmount(pkg.basePrice)}
                          </span>
                        )}
                      </div>
                    </button>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-black/10 bg-zinc-50 p-4 text-sm leading-6 text-zinc-500">
                    {t(
                      'No WAHO top-up amounts are available right now. Please try again later.',
                      'لا توجد مبالغ شحن WAHO متاحة حالياً. يرجى المحاولة لاحقاً.',
                      '目前没有可用的 WAHO 充值金额。请稍后再试。'
                    )}
                  </div>
                )}

                <Button
                  onClick={() => goToStep('details')}
                  disabled={!selectedPackage}
                  className="mt-6 w-full bg-blue-600 text-white shadow-none hover:bg-blue-700"
                >
                  {t('Continue', 'متابعة')}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {step === 'details' && (
              <div className="rounded-lg border border-black/10 bg-white p-6">
                <h2 className="mb-6 text-xl font-semibold text-zinc-950">
                  {t('Enter WAHO Account Details', 'أدخل بيانات حساب WAHO')}
                </h2>

                {game.requiresUserId && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-zinc-700">
                        {t(game.userIdLabel, game.userIdLabelAr)}
                      </Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={userId}
                          onChange={(e) => {
                            setUserId(e.target.value);
                            setVerifiedUsername(null);
                          }}
                          placeholder={t(game.userIdPlaceholder, game.userIdPlaceholderAr)}
                          className="border-black/10 bg-white text-zinc-950"
                        />
                        <Button
                          onClick={handleVerifyUserId}
                          disabled={isVerifying || !userId}
                          variant="outline"
                          className="border-black/10 bg-white text-blue-600 hover:bg-blue-50"
                        >
                          {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : t('Verify', 'تحقق')}
                        </Button>
                      </div>
                    </div>

                    {game.zoneIdRequired && (
                      <div>
                        <Label className="text-zinc-700">
                          {t(game.zoneIdLabel || 'Room ID', game.zoneIdLabelAr || 'معرف الغرفة')}
                        </Label>
                        <Input
                          value={zoneId}
                          onChange={(e) => setZoneId(e.target.value)}
                          placeholder={t('Enter WAHO reference', 'أدخل مرجع WAHO', '输入 WAHO 参考信息')}
                          className="mt-2 border-black/10 bg-white text-zinc-950"
                        />
                      </div>
                    )}

                    {verifiedUsername && (
                      <div className="flex items-center gap-3 rounded-lg border border-[#34c759]/25 bg-[#34c759]/10 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
                          <Check className="w-5 h-5 text-[#34c759]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1f8f3a]">
                            {t('WAHO Account Verified', 'تم التحقق من حساب WAHO')}
                          </p>
                          <p className="font-semibold text-zinc-950">{verifiedUsername}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!game.requiresUserId && (
                  <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                    <p className="text-sm text-amber-800">
                      {t('This top-up will be prepared after purchase', 'سيتم تجهيز عملية الشحن بعد الشراء', '购买后将准备充值')}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => goToStep('package')}
                    variant="outline"
                    className="border-black/10 bg-white text-zinc-700 hover:bg-zinc-50"
                  >
                    {t('Back', 'رجوع')}
                  </Button>
                  <Button
                    onClick={handleProceedToPayment}
                    disabled={game.requiresUserId && !verifiedUsername}
                    className="flex-1 bg-blue-600 text-white shadow-none hover:bg-blue-700"
                  >
                    {t('Continue to Payment', 'متابعة للدفع')}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className="rounded-lg border border-black/10 bg-white p-6">
                <h2 className="mb-6 text-xl font-semibold text-zinc-950">
                  {t('Select Payment Method', 'اختر طريقة الدفع')}
                </h2>

                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex cursor-pointer items-center gap-4 rounded-lg p-4 transition-colors ${
                        paymentMethod === method.id
                          ? 'border border-blue-500 bg-blue-50 ring-2 ring-inset ring-blue-500'
                          : 'border border-black/10 bg-white hover:border-blue-200 hover:bg-zinc-50'
                      }`}
                    >
                      <RadioGroupItem value={method.id} className="border-blue-500 text-blue-500" />
                      <method.icon className="w-5 h-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium text-zinc-950">{method.name}</p>
                        {'balance' in method && method.balance !== undefined && (
                          <p className="text-xs text-zinc-500">
                            {t('Balance:', 'الرصيد:')} {formatLocalAmount(method.balance)}
                          </p>
                        )}
                      </div>
                      {paymentMethod === method.id && (
                        <Check className="w-5 h-5 text-blue-600" />
                      )}
                    </label>
                  ))}
                </RadioGroup>

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => goToStep('details')}
                    variant="outline"
                    className="border-black/10 bg-white text-zinc-700 hover:bg-zinc-50"
                  >
                    {t('Back', 'رجوع')}
                  </Button>
                  <Button
                    onClick={() => goToStep('confirm')}
                    className="flex-1 bg-blue-600 text-white shadow-none hover:bg-blue-700"
                  >
                    {t('Review WAHO Order', 'مراجعة طلب WAHO')}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === 'confirm' && selectedPackage && (
              <div className="rounded-lg border border-black/10 bg-white p-6">
                <h2 className="mb-6 text-xl font-semibold text-zinc-950">
                  {t('Confirm WAHO Order', 'تأكيد طلب WAHO')}
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 rounded-lg bg-zinc-100 p-4">
                    <div className="relative w-16 h-16 overflow-hidden rounded-lg bg-white ring-1 ring-black/10">
                      <Image src={topUpIconSrc} alt="" fill className="object-contain p-1" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-zinc-950">
                        {t(game.name, game.nameAr)}
                      </h3>
                      <p className="text-sm text-blue-600">
                        {selectedPackage.amount.toLocaleString(locale)} {t(selectedPackage.unit, selectedPackage.unitAr)}
                      </p>
                    </div>
                  </div>

                  {verifiedUsername && (
                    <div className="rounded-lg bg-zinc-100 p-4">
                      <p className="mb-1 text-xs text-zinc-500">{t('Top up for', 'الشحن إلى', '充值给')}</p>
                      <p className="font-semibold text-zinc-950">{verifiedUsername}</p>
                      <p className="text-sm text-zinc-500">ID: {userId} {zoneId && `(${zoneId})`}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <p className="text-xs text-blue-700">
                      {t('After payment is confirmed, this amount will be sent to the WAHO ID shown above.', 'بعد تأكيد الدفع سيتم إرسال هذا المبلغ إلى معرف WAHO الظاهر أعلاه.', '付款确认后，此金额将充值到上方显示的 WAHO ID。')}
                    </p>
                  </div>

                  <div className="rounded-lg border border-black/10 bg-white p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <Label className="text-zinc-700">
                          {t('WhatsApp verification code', 'رمز تحقق واتساب', 'WhatsApp 验证码')}
                        </Label>
                        <Input
                          value={financialOtp}
                          onChange={(event) => setFinancialOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          placeholder="123456"
                          className="mt-2 border-black/10 bg-white text-zinc-950"
                        />
                      </div>
                      <Button
                        type="button"
                        onClick={handleRequestOrderOtp}
                        disabled={isRequestingOtp}
                        variant="outline"
                        className="border-black/10 bg-white text-blue-600 hover:bg-blue-50"
                      >
                        {isRequestingOtp ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : otpRequested ? (
                          t('Resend code', 'إعادة إرسال الرمز', '重新发送验证码')
                        ) : (
                          t('Send code', 'إرسال الرمز', '发送验证码')
                        )}
                      </Button>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-zinc-500">
                      {t(
                        'For your wallet and payment safety, confirm this order with the code sent to your WhatsApp.',
                        'لحماية محفظتك وعمليات الدفع، أكد هذا الطلب بالرمز المرسل إلى واتساب.',
                        '为了保护钱包和支付安全，请使用发送到 WhatsApp 的验证码确认此订单。'
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => goToStep('payment')}
                    variant="outline"
                    className="border-black/10 bg-white text-zinc-700 hover:bg-zinc-50"
                  >
                    {t('Back', 'رجوع')}
                  </Button>
                  <Button
                    onClick={handleConfirmOrder}
                    disabled={isProcessing}
                    className="flex-1 bg-blue-600 text-white shadow-none hover:bg-blue-700"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Shield className="w-4 h-4 mr-2" />
                        {t('Submit order', 'إرسال الطلب', '提交订单')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-lg border border-black/10 bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-zinc-950">
                {t('WAHO Order Summary', 'ملخص طلب WAHO')}
              </h3>

              {selectedPackage ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-black/10">
                      <Image src={topUpIconSrc} alt="" fill className="object-contain p-1" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-950">
                        {t(game.name, game.nameAr)}
                      </p>
                      <p className="text-xs text-blue-600">
                        {selectedPackage.amount.toLocaleString(locale)} {t(selectedPackage.unit, selectedPackage.unitAr)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 border-t border-black/10 pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">{t('Subtotal', 'المجموع الفرعي')}</span>
                      <span className="text-zinc-950">
                        {formatLocalAmount(selectedPackage.salePrice || selectedPackage.basePrice)}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#1f8f3a]">{t('Member Discount', 'خصم العضوية')} ({discount}%)</span>
                        <span className="text-[#1f8f3a]">
                          -{formatLocalAmount(((selectedPackage.salePrice || selectedPackage.basePrice) * discount) / 100, { absolute: true })}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-black/10 pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-zinc-950">{t('Total', 'الإجمالي')}</span>
                      <span className="text-lg font-semibold text-zinc-950">
                        {formatLocalAmount(calculateFinalPrice(selectedPackage))}
                      </span>
                    </div>
                  </div>

                  {isAuthenticated && user && (
                    <div className="rounded-lg border border-[#34c759]/25 bg-[#34c759]/10 p-3">
                      <div className="flex items-center gap-2 text-xs text-[#1f8f3a]">
                        <Shield className="w-4 h-4" />
                        <span>{t('Secure checkout', 'دفع آمن')}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-zinc-500">
                  {t('Select a top-up amount to see summary', 'اختر مبلغ شحن لرؤية الملخص', '选择充值金额以查看摘要')}
                </p>
              )}
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
