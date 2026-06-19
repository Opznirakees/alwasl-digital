'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { levelLabels, levelDiscounts } from '@/data/mock-data';
import type { WalletTransactionType } from '@/types';
import { walletTopUpDialogCopy } from './wallet-dialog-copy';
import {
  ArrowLeft,
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  TrendingUp,
  Shield,
  Star,
  Sparkles,
  ChevronRight,
  CreditCard,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

export default function WalletPage() {
  const { t, language, dir, user, selectedCountry, walletTransactions, refreshAccount } = useApp();
  const [topUpAmount, setTopUpAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('zaincash');
  const [isLoading, setIsLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const currentUser = user;
  const locale = language === 'ar' ? 'ar-IQ' : language === 'zh' ? 'zh-CN' : 'en-IQ';
  const walletTopUpEnabled = false;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale).format(Math.abs(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type: WalletTransactionType) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4" />;
      case 'withdrawal':
      case 'purchase':
        return <ArrowUpRight className="w-4 h-4" />;
      case 'refund':
        return <RefreshCw className="w-4 h-4" />;
      case 'bonus':
      case 'cashback':
        return <Sparkles className="w-4 h-4" />;
      default:
        return <Wallet className="w-4 h-4" />;
    }
  };

  const getTransactionColor = (type: WalletTransactionType, amount: number) => {
    if (amount > 0) {
      return 'text-emerald-400';
    }
    return 'text-rose-400';
  };

  const getTransactionBg = (type: WalletTransactionType, amount: number) => {
    if (amount > 0) {
      return 'bg-emerald-500/10';
    }
    return 'bg-rose-500/10';
  };

  const handleTopUp = async () => {
    if (!topUpAmount || Number(topUpAmount) < 5000) {
      toast.error(t('Minimum top-up amount is 5,000 IQD', 'الحد الأدنى للشحن 5,000 د.ع'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/wallet/top-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: Number(topUpAmount),
          paymentMethod,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Wallet top-up failed');
      }

      await refreshAccount();
      setTopUpAmount('');
      setDialogOpen(false);
      toast.success(t('Top-up request submitted!', 'تم إرسال طلب الشحن!'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Top-up request failed', 'فشل طلب الشحن'));
    } finally {
      setIsLoading(false);
    }
  };

  const quickAmounts = [10000, 25000, 50000, 100000];

  const levelProgress = () => {
    if (!currentUser) return { progress: 0, remaining: 0, nextLevel: null };

    const levels = ['bronze', 'silver', 'gold', 'platinum', 'diamond'] as const;
    const currentLevelIndex = levels.indexOf(currentUser.level);
    const nextLevel = levels[currentLevelIndex + 1];

    if (!nextLevel) return { progress: 100, remaining: 0, nextLevel: null };

    const currentMin = levelLabels[currentUser.level].minSpent;
    const nextMin = levelLabels[nextLevel].minSpent;
    const progress = ((currentUser.totalSpent - currentMin) / (nextMin - currentMin)) * 100;
    const remaining = nextMin - currentUser.totalSpent;

    return { progress: Math.min(100, progress), remaining, nextLevel };
  };

  if (!currentUser) {
    return (
      <div className={`min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
        <Header />
        <main className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
          <Wallet className="mb-4 h-10 w-10 text-emerald-400" />
          <h1 className="text-2xl font-bold text-white">{t('Login required', 'تسجيل الدخول مطلوب', '需要登录')}</h1>
          <p className="mt-2 text-sm text-white/50">{t('Login to view your wallet balance and transactions.', 'سجل الدخول لعرض رصيد المحفظة والمعاملات.', '登录后查看钱包余额和交易记录。')}</p>
          <Link href="/auth">
            <Button className="mt-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              {t('Login', 'تسجيل الدخول', '登录')}
            </Button>
          </Link>
        </main>
      </div>
    );
  }

  const { progress, remaining, nextLevel } = levelProgress();

  return (
    <div className={`min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            {t('Back to Home', 'العودة للرئيسية')}
          </Link>
          <h1 className="text-3xl font-bold text-white">{t('My Wallet', 'محفظتي')}</h1>
        </div>

        <div className="grid min-w-0 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="min-w-0 lg:col-span-2 space-y-6">
            {/* Balance Card */}
            <Card className="min-w-0 bg-gradient-to-br from-emerald-900/50 via-teal-900/30 to-slate-900/50 border-emerald-500/30 p-5 md:p-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="min-w-0">
                  <p className="text-sm text-emerald-400/70">{t('Available Balance', 'الرصيد المتاح')}</p>
                  <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mt-1 break-words">
                    {formatCurrency(currentUser.walletBalance)}
                    <span className="text-lg text-white/50 ml-2">{selectedCountry.currencySymbol}</span>
                  </p>
                </div>
                <div className="flex-shrink-0 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30">
                  <Wallet className="w-6 h-6 text-emerald-400" />
                </div>
              </div>

              <div className="flex min-w-0 gap-3">
                <Dialog
                  open={walletTopUpEnabled ? dialogOpen : false}
                  onOpenChange={(open) => {
                    if (walletTopUpEnabled) setDialogOpen(open);
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      disabled={!walletTopUpEnabled}
                      className="min-w-0 flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 hover:from-emerald-600 hover:to-teal-700 disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700 disabled:text-white/50 disabled:shadow-none"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t('Top Up', 'شحن الرصيد')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900 border-emerald-800/30">
                    <DialogHeader>
                      <DialogTitle className="text-white">{t('Top Up Wallet', 'شحن المحفظة')}</DialogTitle>
                      <DialogDescription className="text-white/60">
                        {t(
                          walletTopUpDialogCopy.description.en,
                          walletTopUpDialogCopy.description.ar,
                          walletTopUpDialogCopy.description.zh
                        )}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                      <div className="space-y-2">
                        <Label className="text-white/70">{t('Amount', 'المبلغ')}</Label>
                        <Input
                          type="number"
                          value={topUpAmount}
                          onChange={(e) => setTopUpAmount(e.target.value)}
                          placeholder="0"
                          className="text-2xl font-bold bg-slate-800/50 border-emerald-800/30 text-white h-14"
                        />
                        <div className="flex flex-wrap gap-2">
                          {quickAmounts.map((amount) => (
                            <button
                              key={amount}
                              onClick={() => setTopUpAmount(amount.toString())}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                topUpAmount === amount.toString()
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-slate-800/50 text-white/70 hover:bg-slate-700/50'
                              }`}
                            >
                              {formatCurrency(amount)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white/70">{t('Payment Method', 'طريقة الدفع')}</Label>
                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-2">
                          {[
                            { id: 'zaincash', name: 'ZainCash' },
                            { id: 'asiahawala', name: 'AsiaHawala' },
                            { id: 'card', name: t('Credit Card', 'بطاقة ائتمان') },
                          ].map((method) => (
                            <label
                              key={method.id}
                              className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                                paymentMethod === method.id
                                  ? 'bg-emerald-500/20 border border-emerald-500'
                                  : 'bg-slate-800/50 border border-emerald-800/20'
                              }`}
                            >
                              <RadioGroupItem value={method.id} className="border-emerald-500 text-emerald-500" />
                              <CreditCard className="w-4 h-4 text-emerald-400" />
                              <span className="text-white">{method.name}</span>
                            </label>
                          ))}
                        </RadioGroup>
                      </div>

                      <Button
                        onClick={handleTopUp}
                        disabled={isLoading || !topUpAmount}
                        className="w-full bg-gradient-to-r from-emerald-500 to-teal-600"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            {t('Proceed to Payment', 'المتابعة للدفع')}
                            <ChevronRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              {!walletTopUpEnabled && (
                <p className="mt-3 text-xs text-white/50">
                  {t(
                    walletTopUpDialogCopy.unavailable.en,
                    walletTopUpDialogCopy.unavailable.ar,
                    walletTopUpDialogCopy.unavailable.zh
                  )}
                </p>
              )}
            </Card>

            {/* Transaction History */}
            <Card className="min-w-0 bg-slate-900/50 border-emerald-800/20 p-5 md:p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">{t('Transaction History', 'سجل المعاملات')}</h2>
                <Button variant="ghost" size="sm" className="text-emerald-400 hover:text-emerald-300">
                  {t('View All', 'عرض الكل')}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>

              <div className="space-y-3">
                {walletTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                  >
                    <div className={`p-2.5 rounded-xl ${getTransactionBg(tx.type, tx.amount)}`}>
                      {getTransactionIcon(tx.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {t(tx.description, tx.descriptionAr)}
                      </p>
                      <p className="text-xs text-white/50 mt-0.5">{formatDate(tx.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${getTransactionColor(tx.type, tx.amount)}`}>
                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)} {selectedCountry.currencySymbol}
                      </p>
                      <p className="text-xs text-white/50 mt-0.5">
                        {t('Balance:', 'الرصيد:')} {formatCurrency(tx.balance)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="min-w-0 space-y-6">
            {/* Membership Level */}
            <Card className="min-w-0 bg-slate-900/50 border-emerald-800/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${levelLabels[currentUser.level].color}20` }}
                >
                  <Star className="w-5 h-5" style={{ color: levelLabels[currentUser.level].color }} />
                </div>
                <div>
                  <p className="text-xs text-white/50">{t('Membership Level', 'مستوى العضوية')}</p>
                  <p className="font-bold" style={{ color: levelLabels[currentUser.level].color }}>
                    {t(levelLabels[currentUser.level].en, levelLabels[currentUser.level].ar)}
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">{t('Your Discount', 'خصمك')}</span>
                  <span className="font-bold text-emerald-400">{levelDiscounts[currentUser.level]}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">{t('Total Spent', 'إجمالي الإنفاق')}</span>
                  <span className="text-white">{formatCurrency(currentUser.totalSpent)} {selectedCountry.currencySymbol}</span>
                </div>
              </div>

              {nextLevel && (
                <div className="space-y-2 pt-4 border-t border-emerald-800/20">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/50">{t('Progress to', 'التقدم إلى')}</span>
                    <span style={{ color: levelLabels[nextLevel].color }}>
                      {t(levelLabels[nextLevel].en, levelLabels[nextLevel].ar)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: levelLabels[nextLevel].color,
                      }}
                    />
                  </div>
                  <p className="text-xs text-white/50">
                    {t('Spend', 'أنفق')} {formatCurrency(remaining)} {selectedCountry.currencySymbol} {t('more', 'إضافية')}
                  </p>
                </div>
              )}
            </Card>

            {/* Benefits */}
            <Card className="min-w-0 bg-slate-900/50 border-emerald-800/20 p-6">
              <h3 className="font-bold text-white mb-4">{t('Wallet Benefits', 'مزايا المحفظة')}</h3>
              <div className="space-y-3">
                {[
                  { icon: Shield, text: t('Secure transactions', 'معاملات آمنة') },
                  { icon: TrendingUp, text: t('Earn cashback', 'احصل على استرداد نقدي') },
                  { icon: Sparkles, text: t('Exclusive bonuses', 'مكافآت حصرية') },
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10">
                      <benefit.icon className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-sm text-white/70">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
