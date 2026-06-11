import { InfoPage } from '@/components/info/InfoPage';

export default function HelpPage() {
  return (
    <InfoPage
      eyebrow={{ en: 'Help Center', ar: 'مركز المساعدة' }}
      title={{ en: 'Everything needed to top up WAHO smoothly.', ar: 'كل ما تحتاجه لشحن WAHO بسهولة.' }}
      subtitle={{ en: 'Choose the amount, confirm the WAHO ID, pay securely, and track the order.', ar: 'اختر المبلغ وتأكد من معرف WAHO وادفع بأمان ثم تابع الطلب.' }}
      actions={[
        { label: { en: 'Contact support', ar: 'تواصل مع الدعم' }, href: '/contact' },
        { label: { en: 'My orders', ar: 'طلباتي' }, href: '/orders' },
      ]}
      sections={[
        {
          title: { en: 'Before ordering', ar: 'قبل الطلب' },
          items: [
            { en: 'Choose the WAHO top-up amount that matches what the customer needs.', ar: 'اختر مبلغ شحن WAHO الذي يناسب احتياج العميل.' },
            { en: 'Confirm the WAHO ID before payment.', ar: 'تأكد من معرف WAHO قبل الدفع.' },
          ],
        },
        {
          title: { en: 'During checkout', ar: 'أثناء الدفع' },
          items: [
            { en: 'Select a top-up amount, check the account details, then choose a payment method.', ar: 'اختر مبلغ الشحن وتحقق من بيانات الحساب ثم اختر طريقة الدفع.' },
            { en: 'Checkout asks users to log in before creating the order.', ar: 'يطلب الدفع تسجيل الدخول قبل إنشاء الطلب.' },
          ],
        },
        {
          title: { en: 'After ordering', ar: 'بعد الطلب' },
          items: [
            { en: 'Use the order page to track status and copy the order ID.', ar: 'استخدم صفحة الطلبات لتتبع الحالة ونسخ رقم الطلب.' },
            { en: 'Send the order ID to WhatsApp support if something needs review.', ar: 'أرسل رقم الطلب لدعم واتساب إذا احتاج الأمر إلى مراجعة.' },
          ],
        },
        {
          title: { en: 'Admin checks', ar: 'فحوصات الإدارة' },
          body: { en: 'The admin dashboard keeps top-up orders, offers, wallets, providers, and reporting in one place.', ar: 'تجمع لوحة الإدارة طلبات الشحن والعروض والمحافظ والموردين والتقارير في مكان واحد.' },
        },
      ]}
    />
  );
}
