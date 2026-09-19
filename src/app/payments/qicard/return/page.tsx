'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Clock3, Loader2, RotateCw, ShieldCheck, XCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import type { Order } from '@/types';

type ViewState = 'checking' | 'paid' | 'pending' | 'failed' | 'error' | 'unlinked';

const MAX_AUTOMATIC_STATUS_CHECKS = 8;

function QiCardReturnContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, dir, refreshAccount } = useApp();
  const orderId = searchParams.get('orderId') || '';
  const [state, setState] = useState<ViewState>(orderId ? 'checking' : 'unlinked');
  const [order, setOrder] = useState<Order | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const checkPayment = useCallback(async (showFinalError = true) => {
    if (!orderId) {
      setState('unlinked');
      return false;
    }

    try {
      const response = await fetch(`/api/payments/qicard/${encodeURIComponent(orderId)}/status`, {
        credentials: 'include',
        cache: 'no-store',
      });
      if (response.status === 401) {
        router.replace(`/auth?next=${encodeURIComponent(`/payments/qicard/return?orderId=${orderId}`)}`);
        return false;
      }
      const payload = await response.json();
      if (!response.ok || !payload.order) throw new Error('STATUS_FAILED');

      const current = payload.order as Order;
      setOrder(current);
      if (current.paymentStatus === 'completed') {
        setState('paid');
        await refreshAccount();
        return false;
      }
      if (current.paymentStatus === 'failed' || current.status === 'failed' || current.status === 'cancelled') {
        setState('failed');
        await refreshAccount();
        return false;
      }
      setState('pending');
      return true;
    } catch {
      if (showFinalError) {
        setState('error');
        return false;
      }
      setState('checking');
      return true;
    }
  }, [orderId, refreshAccount, router]);

  useEffect(() => {
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let checks = 0;

    async function poll() {
      if (!active) return;
      const isFinalCheck = checks === MAX_AUTOMATIC_STATUS_CHECKS - 1;
      const shouldContinue = await checkPayment(isFinalCheck);
      checks += 1;
      if (active && shouldContinue && checks < MAX_AUTOMATIC_STATUS_CHECKS) {
        timeoutId = setTimeout(poll, 2_000);
      }
    }

    void poll();
    return () => {
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [checkPayment]);

  const cancelPayment = async () => {
    if (!orderId) return;
    setIsCancelling(true);
    try {
      const response = await fetch(`/api/payments/qicard/${encodeURIComponent(orderId)}/cancel`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('CANCEL_FAILED');
      await checkPayment();
    } catch {
      setState('error');
    } finally {
      setIsCancelling(false);
    }
  };

  const presentation = {
    checking: {
      icon: Loader2,
      iconClass: 'animate-spin motion-reduce:animate-none text-[var(--v2-gold-deep)]',
      tileClass: 'v2-icon-tile-gold',
      statusClass: 'v2-status-warning',
      title: t('Checking your payment', 'جارٍ التحقق من الدفع', '正在检查付款'),
      description: t('Please wait while we securely confirm the result with QiCard.', 'يرجى الانتظار بينما نؤكد النتيجة بأمان مع QiCard.', '请稍候，我们正在通过 QiCard 安全确认结果。'),
    },
    paid: {
      icon: CheckCircle2,
      iconClass: 'text-[var(--v2-green)]',
      tileClass: 'v2-icon-tile-green',
      statusClass: 'v2-status-success',
      title: t('Payment confirmed', 'تم تأكيد الدفع', '付款已确认'),
      description: t('Your recharge order is now being processed. You can follow it in your orders.', 'تتم الآن معالجة طلب الشحن. يمكنك متابعته في طلباتك.', '您的充值订单正在处理中，可在订单中查看进度。'),
    },
    pending: {
      icon: Clock3,
      iconClass: 'text-[var(--v2-gold-deep)]',
      tileClass: 'v2-icon-tile-gold',
      statusClass: 'v2-status-warning',
      title: t('Payment is still being confirmed', 'لا يزال الدفع قيد التأكيد', '付款仍在确认中'),
      description: t('This can take a moment. Refresh the status or return to your orders.', 'قد يستغرق ذلك لحظات. حدّث الحالة أو عد إلى طلباتك.', '这可能需要一点时间。请刷新状态或返回订单。'),
    },
    failed: {
      icon: XCircle,
      iconClass: 'text-red-600',
      tileClass: 'bg-red-50',
      statusClass: 'v2-status-danger',
      title: t('Payment was not completed', 'لم يكتمل الدفع', '付款未完成'),
      description: t('No recharge was started. You can safely try again.', 'لم تبدأ عملية الشحن. يمكنك المحاولة مرة أخرى بأمان.', '充值尚未开始，您可以安全重试。'),
    },
    error: {
      icon: AlertCircle,
      iconClass: 'text-[var(--v2-gold-deep)]',
      tileClass: 'v2-icon-tile-gold',
      statusClass: 'v2-status-warning',
      title: t('We could not check the payment yet', 'تعذر التحقق من الدفع الآن', '暂时无法检查付款'),
      description: t('Your order is saved. Try checking again or view it in your orders.', 'تم حفظ طلبك. حاول التحقق مرة أخرى أو شاهده في طلباتك.', '您的订单已保存。请重试或在订单中查看。'),
    },
    unlinked: {
      icon: ShieldCheck,
      iconClass: 'text-[var(--v2-blue)]',
      tileClass: 'v2-icon-tile-blue',
      statusClass: 'v2-status-info',
      title: t('Open your order to check the payment', 'افتح طلبك للتحقق من الدفع', '打开订单以检查付款'),
      description: t(
        'Your payment status is securely linked to its order. Open your orders to continue.',
        'حالة الدفع مرتبطة بالطلب بشكل آمن. افتح طلباتك للمتابعة.',
        '付款状态已安全关联到对应订单。请打开订单继续。',
      ),
    },
  }[state];
  const StatusIcon = presentation.icon;

  return (
    <div className={`v2-page ${dir === 'rtl' ? 'rtl' : 'ltr'}`}>
      <Header />
      <main className="v2-container flex min-h-[70vh] max-w-2xl items-center py-10 pb-24 lg:pb-10">
        <section className="v2-surface w-full p-6 text-center sm:p-10" aria-live="polite">
          <div className={`v2-icon-tile mx-auto h-16 w-16 rounded-2xl ${presentation.tileClass}`}>
            <StatusIcon className={`h-8 w-8 ${presentation.iconClass}`} />
          </div>
          <p className={`v2-status mt-5 ${presentation.statusClass}`}>
            <ShieldCheck className="h-3.5 w-3.5" /> QiCard
          </p>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-[var(--v2-navy)] sm:text-3xl">{presentation.title}</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--v2-muted)]">{presentation.description}</p>
          {order && (
            <p className="mt-5 break-all rounded-xl bg-[var(--v2-surface-raised)] px-4 py-3 font-mono text-xs font-semibold text-[var(--v2-muted)]">
              {t('Order', 'الطلب', '订单')}: {order.id}
            </p>
          )}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {(state === 'pending' || state === 'error') && orderId && (
              <Button type="button" onClick={() => { setState('checking'); void checkPayment(); }} className="v2-primary-button">
                <RotateCw className="h-4 w-4" />
                {t('Check again', 'تحقق مرة أخرى', '再次检查')}
              </Button>
            )}
            <Button asChild variant={state === 'paid' ? 'default' : 'outline'} className={state === 'paid' ? 'v2-primary-button' : 'v2-secondary-button'}>
              <Link href="/orders">{t('View my orders', 'عرض طلباتي', '查看我的订单')}</Link>
            </Button>
            {state === 'failed' && (
              <Button asChild className="v2-primary-button">
                <Link href="/top-up/waho-top-up">{t('Try payment again', 'حاول الدفع مرة أخرى', '重新付款')}</Link>
              </Button>
            )}
          </div>

          {state === 'pending' && (
            <button
              type="button"
              onClick={() => void cancelPayment()}
              disabled={isCancelling}
              className="mt-5 min-h-11 rounded-full px-3 text-sm font-semibold text-[var(--v2-muted)] underline-offset-4 transition-colors hover:text-[var(--v2-navy)] hover:underline disabled:opacity-50"
            >
              {isCancelling ? t('Cancelling...', 'جارٍ الإلغاء...', '正在取消...') : t('Cancel this payment', 'إلغاء هذا الدفع', '取消此付款')}
            </button>
          )}
        </section>
      </main>
    </div>
  );
}

export default function QiCardReturnPage() {
  return (
    <Suspense fallback={<div className="v2-page min-h-screen" />}>
      <QiCardReturnContent />
    </Suspense>
  );
}
