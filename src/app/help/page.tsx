import { InfoPage } from '@/components/info/InfoPage';

export default function HelpPage() {
  return (
    <InfoPage
      eyebrow={{ en: 'Help Center', ar: 'مركز المساعدة' }}
      title={{ en: 'Everything needed to complete a top-up smoothly.', ar: 'كل ما تحتاجه لإتمام الشحن بسهولة.' }}
      subtitle={{ en: 'Follow these steps when testing the storefront or helping a customer.', ar: 'اتبع هذه الخطوات عند اختبار المتجر أو مساعدة عميل.' }}
      actions={[
        { label: { en: 'Contact support', ar: 'تواصل مع الدعم' }, href: '/contact' },
        { label: { en: 'My orders', ar: 'طلباتي' }, href: '/orders' },
      ]}
      sections={[
        {
          title: { en: 'Before ordering', ar: 'قبل الطلب' },
          items: [
            { en: 'Pick the correct country so prices and currency match the customer.', ar: 'اختر الدولة الصحيحة حتى تطابق الأسعار والعملة العميل.' },
            { en: 'Confirm the player ID, server, or email before payment.', ar: 'تأكد من معرف اللاعب أو السيرفر أو البريد قبل الدفع.' },
          ],
        },
        {
          title: { en: 'During checkout', ar: 'أثناء الدفع' },
          items: [
            { en: 'Select a package, verify the account, then choose a payment method.', ar: 'اختر الباقة وتحقق من الحساب ثم اختر طريقة الدفع.' },
            { en: 'Demo checkout asks users to log in before creating the order.', ar: 'الدفع التجريبي يطلب تسجيل الدخول قبل إنشاء الطلب.' },
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
          body: { en: 'The admin dashboard includes demo revenue, orders, providers, products, promotions, wallets, and reporting tabs.', ar: 'لوحة الإدارة تتضمن إيرادات وطلبات ومزودين ومنتجات وعروض ومحافظ وتقارير تجريبية.' },
        },
      ]}
    />
  );
}
