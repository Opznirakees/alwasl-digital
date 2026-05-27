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
import type { GamePackage, PaymentMethod } from '@/types';
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
  const { t, language, dir, user, isAuthenticated, selectedCountry, addToCart, createDemoOrder } = useApp();

  const [step, setStep] = useState<'package' | 'details' | 'payment' | 'confirm'>('package');
  const [selectedPackage, setSelectedPackage] = useState<GamePackage | null>(null);
  const [userId, setUserId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [verifiedUsername, setVerifiedUsername] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('wallet');
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

  const calculateFinalPrice = (pkg: GamePackage) => {
    const basePrice = pkg.salePrice || pkg.basePrice;
    const discountAmount = (basePrice * discount) / 100;
    return basePrice - discountAmount;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-IQ' : 'en-IQ').format(Math.round(price));
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat(language === 'ar' ? 'ar-IQ' : 'en-IQ').format(value);
  };

  const handleVerifyUserId = async () => {
    if (!userId) {
      toast.error(t('Please enter your User ID', 'الرجاء إدخال معرف المستخدم'));
      return;
    }

    setIsVerifying(true);
    // Simulate API verification
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate a mock username
    const mockUsernames = ['ProGamer2026', 'BattleKing', 'ShadowHunter', 'DragonSlayer', 'NightRider', 'PhoenixRising'];
    const randomUsername = mockUsernames[Math.floor(Math.random() * mockUsernames.length)];

    setVerifiedUsername(randomUsername);
    setIsVerifying(false);
    toast.success(t('Account verified!', 'تم التحقق من الحساب!'));
  };

  const handleProceedToPayment = () => {
    if (game.zoneIdRequired && !zoneId) {
      toast.error(t('Please enter the server or zone ID', 'الرجاء إدخال معرف السيرفر'));
      return;
    }
    if (!verifiedUsername && game.requiresUserId) {
      toast.error(t('Please verify your account first', 'الرجاء التحقق من حسابك أولاً'));
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

    if (!selectedPackage) {
      toast.error(t('Please select a package', 'الرجاء اختيار باقة'));
      return;
    }

    setIsProcessing(true);
    // Simulate order processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const basePrice = selectedPackage.salePrice || selectedPackage.basePrice;
    const discountAmount = (basePrice * discount) / 100;
    const order = createDemoOrder({
      gameId: game.id,
      gameName: language === 'ar' ? game.nameAr : game.name,
      packageId: selectedPackage.id,
      packageName: language === 'ar' ? selectedPackage.nameAr : selectedPackage.name,
      gameUserId: game.requiresUserId ? userId : user?.email || 'demo-customer@example.com',
      gameUsername: verifiedUsername || undefined,
      zoneId: zoneId || undefined,
      quantity: 1,
      unitPrice: basePrice,
      totalPrice: basePrice,
      discount: discountAmount,
      finalPrice: calculateFinalPrice(selectedPackage),
      currency: selectedPackage.currency,
      paymentMethod,
    });

    setIsProcessing(false);
    toast.success(t(`Order ${order.id} placed successfully!`, `تم تأكيد الطلب ${order.id} بنجاح!`));
    router.push('/orders');
  };

  const fillDemoDetails = () => {
    if (game.zoneIdRequired) {
      setZoneId(game.id === 'genshin' ? 'os_asia' : '5234');
    }
    setUserId(game.id === 'roblox' ? 'DemoPlayer2026' : game.id === 'genshin' ? '800123456' : '123456789');
    setVerifiedUsername(game.id === 'roblox' ? 'DemoPlayer2026' : game.id === 'genshin' ? 'TravelerX' : 'ProGamer2026');
    toast.success(t('Demo account details filled', 'تمت تعبئة بيانات الحساب التجريبية'));
  };

  const addSelectedPackageToCart = () => {
    if (!selectedPackage) return;
    addToCart({
      gameId: game.id,
      packageId: selectedPackage.id,
      gameUserId: userId,
      gameUsername: verifiedUsername || undefined,
      zoneId: zoneId || undefined,
      quantity: 1,
    });
    toast.success(t('Added to cart', 'تمت الإضافة إلى السلة'));
  };

  const paymentMethods = [
    { id: 'wallet', name: t('Wallet', 'المحفظة'), icon: Wallet, balance: user?.walletBalance || 0 },
    { id: 'zaincash', name: 'ZainCash', icon: CreditCard },
    { id: 'asiahawala', name: 'AsiaHawala', icon: CreditCard },
    { id: 'card', name: t('Credit Card', 'بطاقة ائتمان'), icon: CreditCard },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      {/* Hero Banner */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src={game.banner || game.image}
          alt={language === 'ar' ? game.nameAr : game.name}
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="container mx-auto">
            <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4" />
              {t('Back', 'رجوع')}
            </Link>
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-emerald-500/30">
                <Image src={game.image} alt="" fill className="object-cover" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {language === 'ar' ? game.nameAr : game.name}
                </h1>
                <p className="text-sm text-white/50">{game.publisher}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {['package', 'details', 'payment', 'confirm'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step === s
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white'
                    : ['package', 'details', 'payment', 'confirm'].indexOf(step) > i
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800/50 text-white/30 border border-white/10'
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
                      ? 'bg-emerald-500'
                      : 'bg-slate-800'
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
              <div className="bg-slate-900/50 border border-emerald-800/20 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">
                  {t('Select Package', 'اختر الباقة')}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {game.packages.filter(pkg => pkg.inStock).map((pkg) => (
                    <button
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg)}
                      className={`relative p-4 rounded-xl text-start transition-all ${
                        selectedPackage?.id === pkg.id
                          ? 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-2 border-emerald-500 shadow-lg shadow-emerald-500/20'
                          : 'bg-slate-800/50 border border-emerald-800/20 hover:border-emerald-500/40'
                      }`}
                    >
                      {pkg.isPopular && (
                        <Badge className="absolute -top-2 -right-2 bg-amber-500 text-white text-[10px] px-2 py-0.5 border-0">
                          <Sparkles className="w-3 h-3 mr-1" />
                          {t('Popular', 'الأكثر شراءً')}
                        </Badge>
                      )}
                      {pkg.salePrice && (
                        <Badge className="absolute -top-2 left-2 bg-rose-500 text-white text-[10px] px-2 py-0.5 border-0">
                          {t('Sale', 'خصم')}
                        </Badge>
                      )}
                      <div className="text-2xl font-bold text-white mb-1">
                        {formatNumber(pkg.amount)}
                      </div>
                      <div className="text-sm text-emerald-400">
                        {language === 'ar' ? pkg.unitAr : pkg.unit}
                      </div>
                      <div className="mt-3 pt-3 border-t border-emerald-800/20">
                        {pkg.salePrice ? (
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-emerald-400">
                              {formatPrice(pkg.salePrice)}
                            </span>
                            <span className="text-sm text-white/30 line-through">
                              {formatPrice(pkg.basePrice)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-emerald-400">
                            {formatPrice(pkg.basePrice)}
                          </span>
                        )}
                        <span className="text-xs text-white/50 ml-1">
                          {selectedCountry.currencySymbol}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button
                    onClick={addSelectedPackageToCart}
                    disabled={!selectedPackage}
                    variant="outline"
                    className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    {t('Add to Cart', 'أضف للسلة')}
                  </Button>
                  <Button
                    onClick={() => setStep('details')}
                    disabled={!selectedPackage}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  >
                    {t('Continue', 'متابعة')}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === 'details' && (
              <div className="bg-slate-900/50 border border-emerald-800/20 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">
                  {t('Enter Account Details', 'أدخل بيانات الحساب')}
                </h2>

                {game.requiresUserId && (
                  <div className="space-y-4">
                    <div>
                        <Label className="text-white/70">
                          {language === 'ar' ? game.userIdLabelAr : game.userIdLabel}
                        </Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={userId}
                          onChange={(e) => {
                            setUserId(e.target.value);
                            setVerifiedUsername(null);
                          }}
                          placeholder={language === 'ar' ? game.userIdPlaceholderAr : game.userIdPlaceholder}
                          className="bg-slate-800/50 border-emerald-800/30 text-white"
                        />
                        <Button
                          onClick={handleVerifyUserId}
                          disabled={isVerifying || !userId}
                          variant="outline"
                          className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        >
                          {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : t('Verify', 'تحقق')}
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={fillDemoDetails}
                      variant="outline"
                      className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                    >
                      {t('Fill demo details', 'تعبئة بيانات تجريبية')}
                    </Button>

                    {game.zoneIdRequired && (
                      <div>
                        <Label className="text-white/70">
                          {language === 'ar' ? game.zoneIdLabelAr : game.zoneIdLabel}
                        </Label>
                        <Input
                          value={zoneId}
                          onChange={(e) => setZoneId(e.target.value)}
                          placeholder={t('Enter Zone/Server ID', 'أدخل معرف السيرفر')}
                          className="mt-2 bg-slate-800/50 border-emerald-800/30 text-white"
                        />
                      </div>
                    )}

                    {verifiedUsername && (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <Check className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm text-emerald-400 font-medium">
                            {t('Account Verified', 'تم التحقق من الحساب')}
                          </p>
                          <p className="text-white font-bold">{verifiedUsername}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!game.requiresUserId && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <AlertCircle className="w-5 h-5 text-amber-400" />
                    <p className="text-sm text-amber-400/70">
                      {t('This product will be delivered to your email after purchase', 'سيتم إرسال المنتج إلى بريدك الإلكتروني بعد الشراء')}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => setStep('package')}
                    variant="outline"
                    className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    {t('Back', 'رجوع')}
                  </Button>
                  <Button
                    onClick={handleProceedToPayment}
                    disabled={game.requiresUserId && !verifiedUsername}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  >
                    {t('Continue to Payment', 'متابعة للدفع')}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <div className="bg-slate-900/50 border border-emerald-800/20 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">
                  {t('Select Payment Method', 'اختر طريقة الدفع')}
                </h2>

                <RadioGroup value={paymentMethod} onValueChange={(value) => setPaymentMethod(value as PaymentMethod)} className="space-y-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${
                        paymentMethod === method.id
                          ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border-2 border-emerald-500'
                          : 'bg-slate-800/50 border border-emerald-800/20 hover:border-emerald-500/40'
                      }`}
                    >
                      <RadioGroupItem value={method.id} className="border-emerald-500 text-emerald-500" />
                      <method.icon className="w-5 h-5 text-emerald-400" />
                      <div className="flex-1">
                        <p className="font-medium text-white">{method.name}</p>
                        {'balance' in method && method.balance !== undefined && (
                          <p className="text-xs text-emerald-400/70">
                            {t('Balance:', 'الرصيد:')} {formatPrice(method.balance)} {selectedCountry.currencySymbol}
                          </p>
                        )}
                      </div>
                      {paymentMethod === method.id && (
                        <Check className="w-5 h-5 text-emerald-400" />
                      )}
                    </label>
                  ))}
                </RadioGroup>

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => setStep('details')}
                    variant="outline"
                    className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    {t('Back', 'رجوع')}
                  </Button>
                  <Button
                    onClick={() => setStep('confirm')}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
                  >
                    {t('Review Order', 'مراجعة الطلب')}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === 'confirm' && selectedPackage && (
              <div className="bg-slate-900/50 border border-emerald-800/20 rounded-2xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">
                  {t('Confirm Order', 'تأكيد الطلب')}
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50">
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden">
                      <Image src={game.image} alt="" fill className="object-cover" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white">
                        {language === 'ar' ? game.nameAr : game.name}
                      </h3>
                      <p className="text-sm text-emerald-400">
                        {formatNumber(selectedPackage.amount)} {language === 'ar' ? selectedPackage.unitAr : selectedPackage.unit}
                      </p>
                    </div>
                  </div>

                  {verifiedUsername && (
                    <div className="p-4 rounded-xl bg-slate-800/50">
                      <p className="text-xs text-white/50 mb-1">{t('Deliver to', 'التسليم إلى')}</p>
                      <p className="font-bold text-white">{verifiedUsername}</p>
                      <p className="text-sm text-emerald-400/70">ID: {userId} {zoneId && `(${zoneId})`}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <Zap className="w-5 h-5 text-emerald-400" />
                    <p className="text-xs text-emerald-400/70">
                      {t('Instant delivery within 30 seconds', 'التوصيل الفوري خلال 30 ثانية')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={() => setStep('payment')}
                    variant="outline"
                    className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                  >
                    {t('Back', 'رجوع')}
                  </Button>
                  <Button
                    onClick={handleConfirmOrder}
                    disabled={isProcessing}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
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
            <div className="sticky top-24 bg-slate-900/50 border border-emerald-800/20 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">
                {t('Order Summary', 'ملخص الطلب')}
              </h3>

              {selectedPackage ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                      <Image src={game.image} alt="" fill className="object-cover" />
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">
                        {language === 'ar' ? game.nameAr : game.name}
                      </p>
                      <p className="text-xs text-emerald-400">
                        {formatNumber(selectedPackage.amount)} {language === 'ar' ? selectedPackage.unitAr : selectedPackage.unit}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-emerald-800/20 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">{t('Subtotal', 'المجموع الفرعي')}</span>
                      <span className="text-white">
                        {formatPrice(selectedPackage.salePrice || selectedPackage.basePrice)} {selectedCountry.currencySymbol}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-emerald-400">{t('Member Discount', 'خصم العضوية')} ({discount}%)</span>
                        <span className="text-emerald-400">
                          -{formatPrice(((selectedPackage.salePrice || selectedPackage.basePrice) * discount) / 100)} {selectedCountry.currencySymbol}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-emerald-800/20 pt-4">
                    <div className="flex justify-between">
                      <span className="text-lg font-bold text-white">{t('Total', 'الإجمالي')}</span>
                      <span className="text-lg font-bold text-emerald-400">
                        {formatPrice(calculateFinalPrice(selectedPackage))} {selectedCountry.currencySymbol}
                      </span>
                    </div>
                  </div>

                  {isAuthenticated && user && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-2 text-xs text-emerald-400/70">
                        <Shield className="w-4 h-4" />
                        <span>{t('Secure checkout', 'دفع آمن')}</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-white/50 text-center py-8">
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
