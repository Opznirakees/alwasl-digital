import { InfoPage } from '@/components/info/InfoPage';

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow={{ en: 'Privacy Policy', ar: 'سياسة الخصوصية' }}
      title={{ en: 'Customer data should stay minimal, useful, and protected.', ar: 'يجب أن تبقى بيانات العملاء قليلة ومفيدة ومحمية.' }}
      subtitle={{ en: 'This placeholder policy describes the intended data handling for the storefront.', ar: 'هذه السياسة المؤقتة تشرح طريقة التعامل المقصودة مع بيانات المتجر.' }}
      sections={[
        {
          title: { en: 'Data collected', ar: 'البيانات التي يتم جمعها' },
          body: { en: 'A production version may collect phone numbers, order details, wallet transactions, payment references, and game account identifiers.', ar: 'قد تجمع نسخة الإنتاج أرقام الهاتف وتفاصيل الطلبات ومعاملات المحفظة ومراجع الدفع ومعرفات حسابات الألعاب.' },
        },
        {
          title: { en: 'Why it is used', ar: 'سبب الاستخدام' },
          body: { en: 'Data is used to authenticate customers, process orders, provide support, and prevent fraud.', ar: 'تستخدم البيانات لتسجيل دخول العملاء وتنفيذ الطلبات وتقديم الدعم ومنع الاحتيال.' },
        },
        {
          title: { en: 'Sharing', ar: 'المشاركة' },
          body: { en: 'Order data may be shared with payment and fulfillment providers only where needed to complete the service.', ar: 'قد تتم مشاركة بيانات الطلب مع مزودي الدفع والتنفيذ فقط عند الحاجة لإتمام الخدمة.' },
        },
        {
          title: { en: 'Demo storage', ar: 'تخزين النسخة التجريبية' },
          body: { en: 'The current demo stores theme preferences in the browser and uses mock data for accounts, orders, and payments.', ar: 'النسخة التجريبية الحالية تخزن تفضيل الثيم في المتصفح وتستخدم بيانات محاكاة للحسابات والطلبات والدفع.' },
        },
      ]}
    />
  );
}
