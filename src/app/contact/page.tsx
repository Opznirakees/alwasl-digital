import { InfoPage } from '@/components/info/InfoPage';

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow={{ en: 'Contact', ar: 'تواصل معنا' }}
      title={{ en: 'Support is one message away.', ar: 'الدعم على بعد رسالة واحدة.' }}
      subtitle={{ en: 'Use WhatsApp for urgent top-up help, payment questions, or account checks.', ar: 'استخدم واتساب للمساعدة العاجلة في الشحن أو أسئلة الدفع أو فحص الحساب.' }}
      actions={[
        { label: { en: 'Open WhatsApp', ar: 'افتح واتساب' }, href: 'https://wa.me/9647812345678' },
        { label: { en: 'View FAQ', ar: 'عرض الأسئلة الشائعة' }, href: '/faq' },
      ]}
      sections={[
        {
          title: { en: 'WhatsApp support', ar: 'دعم واتساب' },
          body: { en: 'For fastest help, send your order ID and the phone number used during checkout.', ar: 'لأسرع مساعدة، أرسل رقم الطلب ورقم الهاتف المستخدم عند الشراء.' },
        },
        {
          title: { en: 'Order questions', ar: 'أسئلة الطلبات' },
          body: { en: 'Most demo orders complete instantly. Real production orders should show processing, completed, failed, or refunded states.', ar: 'معظم الطلبات التجريبية تكتمل فوراً. في الإنتاج ستظهر حالات المعالجة أو الاكتمال أو الفشل أو الاسترداد.' },
        },
        {
          title: { en: 'Payments', ar: 'الدفع' },
          body: { en: 'The storefront is prepared for wallet, ZainCash, AsiaHawala, card, and USDT style payment methods.', ar: 'الواجهة جاهزة لمسارات دفع مثل المحفظة وزين كاش وآسيا حوالة والبطاقات وUSDT.' },
        },
        {
          title: { en: 'Business hours', ar: 'ساعات العمل' },
          body: { en: 'Demo support content is always visible. Add real operating hours once the store is live.', ar: 'محتوى الدعم التجريبي ظاهر دائماً. أضف ساعات العمل الفعلية عند إطلاق المتجر.' },
        },
      ]}
    />
  );
}
