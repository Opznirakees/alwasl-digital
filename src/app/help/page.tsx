import { InfoPage } from '@/components/info/InfoPage';

export default function HelpPage() {
  return (
    <InfoPage
      eyebrow={{ en: 'Help Center', ar: 'مركز المساعدة' }}
      title={{ en: 'Everything needed to top up WAHO smoothly.', ar: 'كل ما تحتاجه لشحن WAHO بسهولة.' }}
      subtitle={{ en: 'Pick a package, confirm the WAHO details, pay securely, and track the order.', ar: 'اختر الباقة، أكد بيانات WAHO، ادفع بأمان، ثم تابع الطلب.' }}
      actions={[
        { label: { en: 'Contact support', ar: 'تواصل مع الدعم' }, href: '/contact' },
        { label: { en: 'My orders', ar: 'طلباتي' }, href: '/orders' },
      ]}
      sections={[
        {
          title: { en: 'Before ordering', ar: 'قبل الطلب' },
          items: [
            { en: 'Choose the WAHO package that matches what the customer needs.', ar: 'اختر باقة WAHO التي تناسب احتياج العميل.' },
            { en: 'Confirm the WAHO ID, room ID, or email before payment.', ar: 'تأكد من معرف WAHO أو معرف الغرفة أو البريد قبل الدفع.' },
          ],
        },
        {
          title: { en: 'During checkout', ar: 'أثناء الدفع' },
          items: [
            { en: 'Select a package, check the account details, then choose a payment method.', ar: 'اختر الباقة وتحقق من بيانات الحساب ثم اختر طريقة الدفع.' },
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
          body: { en: 'The admin dashboard keeps orders, products, promotions, wallets, and reporting in one place.', ar: 'تجمع لوحة الإدارة الطلبات والمنتجات والعروض والمحافظ والتقارير في مكان واحد.' },
        },
      ]}
    />
  );
}
