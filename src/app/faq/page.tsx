import { InfoPage } from '@/components/info/InfoPage';

export default function FaqPage() {
  return (
    <InfoPage
      eyebrow={{ en: 'FAQ', ar: 'الأسئلة الشائعة' }}
      title={{ en: 'Quick answers before you place an order.', ar: 'إجابات سريعة قبل تنفيذ الطلب.' }}
      subtitle={{ en: 'Check the WAHO ID, payment method, currency, and order status before you continue.', ar: 'تحقق من معرف WAHO وطريقة الدفع والعملة وحالة الطلب قبل المتابعة.' }}
      actions={[{ label: { en: 'Start top-up', ar: 'ابدأ الشحن' }, href: '/top-up' }]}
      sections={[
        {
          title: { en: 'What do I need before ordering?', ar: 'ماذا أحتاج قبل الطلب؟' },
          body: { en: 'Have the correct WAHO ID ready. The recharge is tied to that account, so check it before payment.', ar: 'جهز معرف WAHO الصحيح. الشحن مرتبط بهذا الحساب، لذلك تحقق منه قبل الدفع.' },
        },
        {
          title: { en: 'How do I follow an order?', ar: 'كيف أتابع الطلب؟' },
          body: { en: 'Open My Orders to see whether the WAHO recharge is pending, processing, completed, failed, or refunded.', ar: 'افتح طلباتي لمعرفة ما إذا كان شحن WAHO قيد الانتظار أو المعالجة أو مكتمل أو فشل أو مسترد.' },
        },
        {
          title: { en: 'Which currency is used?', ar: 'ما العملة المستخدمة؟' },
          body: { en: 'WAHO top-up prices are shown clearly with IQD-first pricing in the current flow.', ar: 'تظهر أسعار شحن WAHO بوضوح مع اعتماد الدينار العراقي أولاً في المسار الحالي.' },
        },
        {
          title: { en: 'Can I use wallet balance?', ar: 'هل يمكن استخدام رصيد المحفظة؟' },
          body: { en: 'Yes. The wallet shows balance, transactions, and a clear way to request a top-up.', ar: 'نعم. تعرض المحفظة الرصيد والمعاملات وطريقة واضحة لطلب الشحن.' },
        },
      ]}
    />
  );
}
