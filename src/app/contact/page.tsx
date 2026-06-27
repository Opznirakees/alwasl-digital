import { InfoPage } from '@/components/info/InfoPage';
import { supportWhatsAppHref } from '@/config/contact';

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow={{ en: 'Contact', ar: 'تواصل معنا' }}
      title={{ en: 'Support is one message away.', ar: 'الدعم على بعد رسالة واحدة.' }}
      subtitle={{ en: 'Use WhatsApp for urgent top-up help, payment questions, or account checks.', ar: 'استخدم واتساب للمساعدة العاجلة في الشحن أو أسئلة الدفع أو فحص الحساب.' }}
      actions={[
        { label: { en: 'Open WhatsApp', ar: 'افتح واتساب' }, href: supportWhatsAppHref },
        { label: { en: 'View FAQ', ar: 'عرض الأسئلة الشائعة' }, href: '/faq' },
      ]}
      sections={[
        {
          title: { en: 'WhatsApp support', ar: 'دعم واتساب' },
          body: { en: 'For fastest help, send your order ID and the phone number used during checkout.', ar: 'لأسرع مساعدة، أرسل رقم الطلب ورقم الهاتف المستخدم عند الشراء.' },
        },
        {
          title: { en: 'Order questions', ar: 'أسئلة الطلبات' },
          body: { en: 'Send the order ID if a WAHO recharge is pending, failed, refunded, or sent to the wrong account details.', ar: 'أرسل رقم الطلب إذا كان شحن WAHO قيد الانتظار أو فشل أو تم استرداده أو أُرسل إلى بيانات حساب غير صحيحة.' },
        },
        {
          title: { en: 'Payments', ar: 'الدفع' },
          body: { en: 'The storefront is prepared for wallet, ZainCash, AsiaHawala, card, and USDT style payment methods.', ar: 'الواجهة جاهزة لمسارات دفع مثل المحفظة وزين كاش وآسيا حوالة والبطاقات وUSDT.' },
        },
        {
          title: { en: 'Business hours', ar: 'ساعات العمل' },
          body: { en: 'WhatsApp is the fastest channel for urgent payment checks and WAHO ID corrections.', ar: 'واتساب هو أسرع قناة لفحص الدفع العاجل وتصحيح معرف WAHO.' },
        },
      ]}
    />
  );
}
