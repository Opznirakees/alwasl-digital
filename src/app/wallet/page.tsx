'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Loader2,
  MessageCircle,
  Plus,
  RefreshCw,
  Sparkles,
  Star,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { AccountPageLoading } from '@/components/account/AccountPageLoading';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useApp } from '@/contexts/AppContext';
import { getNextMembershipLevel, resolveMembershipForSpend } from '@/lib/membership';
import type { WalletTransactionType } from '@/types';
import { walletTopUpDialogCopy } from './wallet-dialog-copy';

export default function WalletPage() {
  const { t, language, dir, user, isAccountLoading, walletTransactions, refreshAccount, formatLocalAmount } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('zaincash');
  const [transactionId, setTransactionId] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const locale = language === 'ar' ? 'ar-IQ' : language === 'zh' ? 'zh-CN' : 'en-IQ';
  const quickAmounts = [10000, 25000, 50000, 100000];

  const formatDate = (value: string) => new Date(value).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const transactionIcon = (type: WalletTransactionType) => {
    if (type === 'deposit') return ArrowDownLeft;
    if (type === 'refund') return RefreshCw;
    if (type === 'bonus' || type === 'cashback') return Sparkles;
    return ArrowUpRight;
  };

  const requestWalletOtp = async () => {
    setIsRequestingOtp(true);
    try {
      const response = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ purpose: 'WALLET_TOP_UP' }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error('OTP_REQUEST_FAILED');
      if (payload.debugOtp) setOtp(payload.debugOtp);
      toast.success(t('WhatsApp code sent', 'تم إرسال رمز واتساب', 'WhatsApp 验证码已发送'));
    } catch {
      toast.error(t('The code could not be sent. Try again.', 'تعذر إرسال الرمز. حاول مرة أخرى.', '验证码发送失败，请重试。'));
    } finally {
      setIsRequestingOtp(false);
    }
  };

  const handleTopUp = async () => {
    if (!topUpAmount || Number(topUpAmount) < 5000) {
      toast.error(t('Enter at least 5,000 IQD', 'أدخل 5,000 د.ع على الأقل', '请输入至少 5,000 IQD'));
      return;
    }
    if (!transactionId.trim()) {
      toast.error(t('Enter the payment transaction ID', 'أدخل رقم معاملة الدفع', '请输入付款交易 ID'));
      return;
    }
    if (!/^\d{6}$/.test(otp)) {
      toast.error(t('Enter the 6-digit WhatsApp code', 'أدخل رمز واتساب المكون من 6 أرقام', '请输入 6 位 WhatsApp 验证码'));
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/wallet/manual-deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          amount: Number(topUpAmount),
          paymentMethod,
          transactionId,
          otp,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'WALLET_TOP_UP_FAILED');

      await refreshAccount();
      setTopUpAmount('');
      setTransactionId('');
      setOtp('');
      setDialogOpen(false);
      toast.success(t('Deposit sent for review', 'تم إرسال الإيداع للمراجعة', '充值申请已提交审核'));
    } catch (error) {
      const message = error instanceof Error && !error.message.includes('_')
        ? error.message
        : t('The deposit could not be submitted. Try again.', 'تعذر إرسال الإيداع. حاول مرة أخرى.', '充值申请提交失败，请重试。');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isAccountLoading) return <AccountPageLoading />;

  if (!user) {
    return (
      <div className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
        <Header />
        <main className="v2-container flex min-h-[65vh] max-w-xl flex-col items-center justify-center py-10 text-center">
          <section className="v2-surface flex w-full flex-col items-center p-6 sm:p-8">
            <span className="v2-icon-tile v2-icon-tile-gold h-14 w-14 rounded-2xl"><Wallet className="h-7 w-7" /></span>
            <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-[var(--v2-navy)]">{t('Log in to see your wallet', 'سجل الدخول لرؤية محفظتك', '登录后查看钱包')}</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--v2-muted)]">{t('Your balance and wallet transactions are kept here.', 'تجد هنا رصيدك ومعاملات المحفظة.', '您的余额和钱包交易记录会显示在这里。')}</p>
            <Link href="/auth?next=%2Fwallet" className="v2-primary-button mt-6 w-full sm:w-auto">{t('Log in', 'تسجيل الدخول', '登录')}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></Link>
          </section>
        </main>
      </div>
    );
  }

  const currentLevel = resolveMembershipForSpend(user.totalSpent);
  const nextLevel = getNextMembershipLevel(currentLevel.level);
  const progress = nextLevel
    ? Math.max(0, Math.min(100, ((user.totalSpent - currentLevel.minSpent) / (nextLevel.minSpent - currentLevel.minSpent)) * 100))
    : 100;
  const remaining = nextLevel ? Math.max(0, nextLevel.minSpent - user.totalSpent) : 0;

  return (
    <div className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />
      <main className="v2-container max-w-5xl py-6 pb-24 sm:py-10 lg:pb-10">
        <Link href="/" className="v2-ghost-link">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {t('Back home', 'العودة للرئيسية', '返回首页')}
        </Link>

        <header className="v2-page-header mt-4">
          <p className="v2-kicker">{t('Your money', 'أموالك', '您的资金')}</p>
          <h1>{t('My wallet', 'محفظتي', '我的钱包')}</h1>
        </header>

        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0 space-y-5">
            <section className="relative overflow-hidden rounded-2xl bg-[var(--v2-navy)] p-6 text-white shadow-[var(--v2-shadow-md)] sm:p-8">
              <div className="relative flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--v2-gold)] rtl:tracking-normal">{t('Available balance', 'الرصيد المتاح', '可用余额')}</p>
                  <p className="mt-3 break-words text-3xl font-extrabold tabular-nums tracking-tight text-white sm:text-4xl">{formatLocalAmount(user.walletBalance)}</p>
                </div>
                <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white/10 text-[var(--v2-gold)] ring-1 ring-white/15"><Wallet className="h-6 w-6" /></span>
              </div>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="v2-primary-button relative mt-6 w-full sm:w-auto">
                    <Plus className="h-4 w-4" />
                    {t('Add wallet balance', 'أضف رصيداً للمحفظة', '充值钱包余额')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="grid max-h-[calc(100dvh-1.5rem)] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden rounded-2xl border-[var(--v2-border)] bg-white p-0 text-[var(--v2-navy)] shadow-[var(--v2-shadow-lg)] sm:max-h-[90vh] sm:max-w-lg">
                  <DialogHeader className="px-5 pb-4 pe-14 pt-5 sm:px-6 sm:pb-5 sm:pt-6">
                    <DialogTitle className="text-[var(--v2-navy)]">{t('Add wallet balance', 'أضف رصيداً للمحفظة', '充值钱包余额')}</DialogTitle>
                    <DialogDescription className="text-[var(--v2-muted)]">
                      {t(walletTopUpDialogCopy.description.en, walletTopUpDialogCopy.description.ar, walletTopUpDialogCopy.description.zh)}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="min-h-0 overflow-y-auto px-5 pb-5 sm:px-6">
                    <div className="rounded-xl bg-[var(--v2-blue-soft)] p-4 text-sm leading-6 text-[var(--v2-navy)]">
                      <ol className="space-y-1">
                        <li>{t('1. Make the payment with your chosen method.', '1. نفذ الدفع بالطريقة المختارة.', '1. 使用所选方式付款。')}</li>
                        <li>{t('2. Enter the transaction ID shown on the payment receipt.', '2. أدخل رقم المعاملة الظاهر في إيصال الدفع.', '2. 输入付款凭证上显示的交易 ID。')}</li>
                        <li>{t('3. We review it before adding the balance.', '3. نراجعه قبل إضافة الرصيد.', '3. 审核后余额才会到账。')}</li>
                      </ol>
                    </div>

                    <div className="mt-5 space-y-5">
                    <div>
                      <Label htmlFor="wallet-amount" className="font-semibold text-[var(--v2-navy)]">{t('Amount in IQD', 'المبلغ بالدينار', 'IQD 金额')}</Label>
                      <Input id="wallet-amount" type="number" inputMode="numeric" min={5000} value={topUpAmount} onChange={(event) => setTopUpAmount(event.target.value)} placeholder="5000" className="v2-input mt-2 h-12 text-lg font-semibold tabular-nums" />
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {quickAmounts.map((amount) => (
                          <button key={amount} type="button" aria-pressed={topUpAmount === String(amount)} onClick={() => setTopUpAmount(String(amount))} className={`min-h-11 rounded-full border px-2 text-xs font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--v2-gold)] ${topUpAmount === String(amount) ? 'border-[var(--v2-gold)] bg-[var(--v2-gold-soft)] text-[var(--v2-navy)]' : 'border-[var(--v2-border)] bg-white text-[var(--v2-muted)] hover:bg-[var(--v2-surface-raised)]'}`}>
                            {new Intl.NumberFormat(locale).format(amount)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="font-semibold text-[var(--v2-navy)]">{t('Payment method', 'طريقة الدفع', '付款方式')}</Label>
                      <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="mt-2 grid gap-2">
                        {[
                          { id: 'zaincash', name: 'ZainCash' },
                          { id: 'asiahawala', name: 'AsiaHawala' },
                          { id: 'card', name: t('Bank card', 'بطاقة مصرفية', '银行卡') },
                        ].map((method) => (
                          <label key={method.id} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${paymentMethod === method.id ? 'border-[var(--v2-gold)] bg-[var(--v2-gold-soft)]' : 'border-[var(--v2-border)] bg-white hover:bg-[var(--v2-surface-raised)]'}`}>
                            <RadioGroupItem value={method.id} className="border-[var(--v2-gold)] text-[var(--v2-gold-deep)]" />
                            <CreditCard className="h-4 w-4 text-[var(--v2-gold-deep)]" />
                            <span className="font-medium text-[var(--v2-navy)]">{method.name}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="wallet-transaction" className="font-semibold text-[var(--v2-navy)]">{t('Payment transaction ID', 'رقم معاملة الدفع', '付款交易 ID')}</Label>
                      <Input id="wallet-transaction" value={transactionId} onChange={(event) => setTransactionId(event.target.value)} placeholder="ZC-123456789" autoComplete="off" className="v2-input mt-2 h-12" />
                    </div>

                    <div>
                      <Label htmlFor="wallet-otp" className="font-semibold text-[var(--v2-navy)]">{t('WhatsApp verification code', 'رمز تحقق واتساب', 'WhatsApp 验证码')}</Label>
                      <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                        <Input id="wallet-otp" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" placeholder="000000" className="v2-input h-12 text-center font-semibold tracking-[0.2em] tabular-nums" />
                        <Button type="button" variant="outline" disabled={isRequestingOtp} onClick={() => void requestWalletOtp()} className="v2-secondary-button h-12 text-sm">
                          {isRequestingOtp ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                          {t('Send code', 'أرسل الرمز', '发送验证码')}
                        </Button>
                      </div>
                    </div>

                    </div>
                  </div>

                  <div className="border-t border-[var(--v2-border)] bg-[var(--v2-surface-raised)] p-4 sm:px-6">
                    <Button type="button" onClick={() => void handleTopUp()} disabled={isLoading || !topUpAmount || !transactionId || otp.length !== 6} className="v2-primary-button w-full">
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      {t('Send deposit for review', 'أرسل الإيداع للمراجعة', '提交充值审核')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </section>

            <section className="v2-surface p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="v2-icon-tile v2-icon-tile-blue"><RefreshCw className="h-5 w-5" /></span>
                <h2 className="text-base font-bold text-[var(--v2-navy)]">{t('Recent wallet activity', 'آخر معاملات المحفظة', '最近的钱包记录')}</h2>
              </div>
              {walletTransactions.length > 0 ? (
                <div className="mt-4 divide-y divide-[var(--v2-border)]">
                  {walletTransactions.map((transaction) => {
                    const TransactionIcon = transactionIcon(transaction.type);
                    const positive = transaction.amount >= 0;
                    return (
                      <div key={transaction.id} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
                        <span className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${positive ? 'bg-[var(--v2-green-soft)] text-[var(--v2-green)]' : 'bg-red-50 text-red-600'}`}><TransactionIcon className="h-4 w-4" /></span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-[var(--v2-navy)]">{t(transaction.description, transaction.descriptionAr, transaction.description)}</p>
                          <p className="mt-1 text-xs text-[var(--v2-muted)]">{formatDate(transaction.createdAt)}</p>
                        </div>
                        <div className="text-end">
                          <p className={`text-sm font-bold tabular-nums ${positive ? 'text-[var(--v2-green)]' : 'text-red-600'}`}>{positive ? '+' : '-'}{formatLocalAmount(transaction.amount, { absolute: true })}</p>
                          <p className="mt-1 text-xs tabular-nums text-[var(--v2-muted)]">{formatLocalAmount(transaction.balance)}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="v2-empty mt-4 min-h-40">
                  <span className="v2-icon-tile"><Wallet className="h-5 w-5" /></span>
                  <p className="mt-3 text-sm font-bold text-[var(--v2-navy)]">{t('No wallet activity yet', 'لا توجد معاملات بعد', '暂无钱包记录')}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--v2-muted)]">{t('Deposits, purchases and refunds will appear here.', 'ستظهر هنا الإيداعات والمشتريات والمبالغ المستردة.', '充值、消费和退款记录会显示在这里。')}</p>
                </div>
              )}
            </section>
          </div>

          <aside className="v2-surface p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="v2-icon-tile v2-icon-tile-gold"><Star className="h-5 w-5" /></span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[var(--v2-subtle)]">{t('Membership level', 'مستوى العضوية', '会员等级')}</p>
                <p className="truncate text-base font-bold text-[var(--v2-navy)]">{t(currentLevel.en, currentLevel.ar, currentLevel.zh)}</p>
              </div>
            </div>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-[var(--v2-muted)]">{t('Your discount', 'خصمك', '您的折扣')}</dt><dd className="font-bold text-[var(--v2-gold-deep)]">{currentLevel.discountPercentage}%</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-[var(--v2-muted)]">{t('Total spent', 'إجمالي الإنفاق', '累计消费')}</dt><dd className="font-semibold tabular-nums text-[var(--v2-navy)]">{formatLocalAmount(user.totalSpent)}</dd></div>
            </dl>
            {nextLevel && (
              <div className="mt-5 border-t border-[var(--v2-border)] pt-4">
                <div className="flex justify-between gap-3 text-xs"><span className="text-[var(--v2-muted)]">{t('Next level', 'المستوى التالي', '下一等级')}</span><span className="font-bold text-[var(--v2-navy)]">{t(nextLevel.en, nextLevel.ar, nextLevel.zh)}</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--v2-navy-soft)]"><div className="h-full rounded-full bg-[var(--v2-gold)]" style={{ width: `${progress}%` }} /></div>
                <p className="mt-2 text-xs leading-5 text-[var(--v2-muted)]">
                  {t('{{amount}} until the next level', '{{amount}} حتى المستوى التالي', '距离下一等级还差 {{amount}}').replace('{{amount}}', formatLocalAmount(remaining))}
                </p>
              </div>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
