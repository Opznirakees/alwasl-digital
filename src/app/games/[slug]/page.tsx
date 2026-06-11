'use client';

import { useState, useEffect, use } from 'react';
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
import { games, levelDiscounts } from '@/data/mock-data';
import type { GamePackage } from '@/types';
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

export default function GamePage({ params }: GamePageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { t, language, dir, user, isAuthenticated, selectedCountry } = useApp();

  const [step, setStep] = useState<'package' | 'details' | 'payment' | 'confirm'>('package');
  const [selectedPackage, setSelectedPackage] = useState<GamePackage | null>(null);
  const [userId, setUserId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [verifiedUsername, setVerifiedUsername] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>('wallet');
  const [isProcessing, setIsProcessing] = useState(false);

  const game = games.find(g => g.slug === resolvedParams.slug);

  useEffect(() => {
    if (!game) {
      router.push('/');
    }
  }, [game, router]);

  if (!game) {
    return null;
  }

  const discount = user ? levelDiscounts[user.level] : 0;
  const locale = language === 'ar' ? 'ar-IQ' : language === 'zh' ? 'zh-CN' : 'en-IQ';

  const calculateFinalPrice = (pkg: GamePackage) => {
    const basePrice = pkg.salePrice || pkg.basePrice;
    const discountAmount = (basePrice * discount) / 100;
    return basePrice - discountAmount;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(locale).format(Math.round(price));
  };

  const handleVerifyUserId = async () => {
    if (!userId) {
      toast.error(t('Please enter your WAHO ID', 'الرجاء إدخال معرف WAHO'));
      return;
    }

    setIsVerifying(true);
    // Placeholder for the incoming WAHO account validation API.
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate a mock username
    const mockUsernames = ['AhmedLive', 'LaylaRoom', 'WahoHost', 'GiftQueen', 'VoiceStar', 'MoonParty'];
    const randomUsername = mockUsernames[Math.floor(Math.random() * mockUsernames.length)];

    setVerifiedUsername(randomUsername);
    setIsVerifying(false);
    toast.success(t('WAHO account verified!', 'تم التحقق من حساب WAHO!'));
  };

  const handleProceedToPayment = () => {
    if (!verifiedUsername && game.requiresUserId) {
      toast.error(t('Please verify the WAHO account first', 'الرجاء التحقق من حساب WAHO أولاً'));
      return;
    }
    if (game.zoneIdRequired && !zoneId) {
      toast.error(t('Please enter the WAHO Room ID', 'الرجاء إدخال معرف غرفة WAHO'));
      return;
    }
    setStep('payment');
  };

  const handleConfirmOrder = async () => {
    if (!isAuthenticated) {
      toast.error(t('Please login to continue', 'الرجاء تسجيل الدخول للمتابعة'));
      router.push('/auth');
      return;
    }

    setIsProcessing(true);
    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsProcessing(false);
    toast.success(t('Order placed successfully!', 'تم تأكيد الطلب بنجاح!'));
    router.push('/orders');
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

      <main className="container mx-auto px-4 py-6 md:py-8">
        <Link href="/" className="mb-5 inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-blue-600">
          <ArrowLeft className="w-4 h-4" />
          {t('Back', 'رجوع')}
        </Link>

        <section className="mb-8 grid gap-5 rounded-lg border border-black/10 bg-white p-5 md:grid-cols-[1fr_auto] md:p-6">
          <div className="flex items-start gap-4">
            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-black/10 bg-white">
              <Image src={game.image} alt="" fill className="object-contain p-1" priority />
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-blue-600">WAHO</p>
              <h1 className="mt-1 text-2xl font-semibold text-zinc-950 md:text-3xl">
                {t(game.name, game.nameAr)}
              </h1>
              <p className="mt-1 text-sm text-zinc-500">{t(game.publisher, game.publisher)}</p>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
                {t(game.description, game.descriptionAr)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 md:w-64">
            {[
              { label: t('Secure checkout', 'دفع آمن'), icon: Shield },
              { label: t('Fast fulfillment', 'إنجاز سريع'), icon: Zap },
              { label: t('API Roadmap', 'خطة API'), icon: Sparkles },
            ].map((item) => (
              <div key={item.label} className="rounded-md bg-zinc-100 p-3 text-center">
                <item.icon className="mx-auto h-4 w-4 text-blue-600" />
                <p className="mt-2 text-[11px] font-medium leading-4 text-zinc-600">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['package', 'details', 'payment', 'confirm'].map((s, i) => (
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {step === 'package' && (
              <div className="rounded-lg border border-black/10 bg-white p-6">
                <h2 className="mb-6 text-xl font-semibold text-zinc-950">
                  {t('Select WAHO Package', 'اختر باقة WAHO')}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {game.packages.filter(pkg => pkg.inStock).map((pkg) => (
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
                              {formatPrice(pkg.salePrice)}
                            </span>
                            <span className="text-sm text-zinc-400 line-through">
                              {formatPrice(pkg.basePrice)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-lg font-semibold text-zinc-950">
                            {formatPrice(pkg.basePrice)}
                          </span>
                        )}
                        <span className="ml-1 text-xs text-zinc-500">
                          {selectedCountry.currencySymbol}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <Button
                  onClick={() => setStep('details')}
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
                          placeholder={t('Enter WAHO Room ID', 'أدخل معرف غرفة WAHO')}
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
                      {t('This product will be delivered to your email after purchase', 'سيتم إرسال المنتج إلى بريدك الإلكتروني بعد الشراء')}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => setStep('package')}
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
                            {t('Balance:', 'الرصيد:')} {formatPrice(method.balance)} {selectedCountry.currencySymbol}
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
                    onClick={() => setStep('details')}
                    variant="outline"
                    className="border-black/10 bg-white text-zinc-700 hover:bg-zinc-50"
                  >
                    {t('Back', 'رجوع')}
                  </Button>
                  <Button
                    onClick={() => setStep('confirm')}
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
                      <Image src={game.image} alt="" fill className="object-contain p-1" />
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
                      <p className="mb-1 text-xs text-zinc-500">{t('Deliver to', 'التسليم إلى')}</p>
                      <p className="font-semibold text-zinc-950">{verifiedUsername}</p>
                      <p className="text-sm text-zinc-500">ID: {userId} {zoneId && `(${zoneId})`}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <Zap className="w-5 h-5 text-blue-600" />
                    <p className="text-xs text-blue-700">
                      {t('Prepared for automatic WAHO API delivery', 'جاهز للتسليم التلقائي عبر WAHO API')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => setStep('payment')}
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
                        {t('Confirm & Pay', 'تأكيد والدفع')}
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
                      <Image src={game.image} alt="" fill className="object-contain p-1" />
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
                        {formatPrice(selectedPackage.salePrice || selectedPackage.basePrice)} {selectedCountry.currencySymbol}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[#1f8f3a]">{t('Member Discount', 'خصم العضوية')} ({discount}%)</span>
                        <span className="text-[#1f8f3a]">
                          -{formatPrice(((selectedPackage.salePrice || selectedPackage.basePrice) * discount) / 100)} {selectedCountry.currencySymbol}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-black/10 pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-zinc-950">{t('Total', 'الإجمالي')}</span>
                      <span className="text-lg font-semibold text-zinc-950">
                        {formatPrice(calculateFinalPrice(selectedPackage))} {selectedCountry.currencySymbol}
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
                  {t('Select a package to see summary', 'اختر باقة لرؤية الملخص')}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
