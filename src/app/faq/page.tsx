import { InfoPage } from '@/components/info/InfoPage';

export default function FaqPage() {
  return (
    <InfoPage
      eyebrow={{ en: 'FAQ', ar: 'الأسئلة الشائعة' }}
      title={{ en: 'Quick answers before you place an order.', ar: 'إجابات سريعة قبل تنفيذ الطلب.' }}
      subtitle={{ en: 'These answers describe the current demo behavior and the intended production flow.', ar: 'هذه الإجابات تشرح سلوك النسخة التجريبية والمسار المتوقع في الإنتاج.' }}
      actions={[{ label: { en: 'Start shopping', ar: 'ابدأ التسوق' }, href: '/games' }]}
      sections={[
        {
          title: { en: 'How do I log in?', ar: 'كيف أسجل الدخول؟' },
          body: { en: 'Enter any phone number and use OTP 123456 in demo mode.', ar: 'أدخل أي رقم هاتف واستخدم رمز 123456 في وضع التجربة.' },
        },
        {
          title: { en: 'Are orders real?', ar: 'هل الطلبات حقيقية؟' },
          body: { en: 'Orders are simulated in the demo. Live orders will move through pending, processing, completed, failed, or refunded states.', ar: 'الطلبات محاكاة في النسخة التجريبية. في التشغيل الفعلي ستنتقل الطلبات بين حالات الانتظار والمعالجة والاكتمال أو الفشل أو الاسترداد.' },
        },
        {
          title: { en: 'Which countries are supported?', ar: 'ما الدول المدعومة؟' },
          body: { en: 'The interface currently includes Iraq, Saudi Arabia, UAE, Egypt, Jordan, and Kuwait.', ar: 'الواجهة الحالية تشمل العراق والسعودية والإمارات ومصر والأردن والكويت.' },
        },
        {
          title: { en: 'Can I use wallet balance?', ar: 'هل يمكن استخدام رصيد المحفظة؟' },
          body: { en: 'Yes. The wallet shows balance, transactions, and a clear way to request a top-up.', ar: 'نعم. تعرض المحفظة الرصيد والمعاملات وطريقة واضحة لطلب الشحن.' },
        },
      ]}
    />
  );
}
