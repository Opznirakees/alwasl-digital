import { InfoPage } from '@/components/info/InfoPage';

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow={{ en: 'Privacy Policy', ar: 'سياسة الخصوصية' }}
      title={{ en: 'Customer data should stay minimal, useful, and protected.', ar: 'يجب أن تبقى بيانات العملاء قليلة ومفيدة ومحمية.' }}
      subtitle={{ en: 'We only ask for the details needed to log in, process a WAHO recharge, verify payment, and support the order.', ar: 'نطلب فقط البيانات اللازمة لتسجيل الدخول وتنفيذ شحن WAHO والتحقق من الدفع ودعم الطلب.' }}
      sections={[
        {
          title: { en: 'Data collected', ar: 'البيانات التي يتم جمعها' },
          body: { en: 'We may collect phone numbers, WAHO account identifiers, order details, wallet transactions, and payment references.', ar: 'قد نجمع أرقام الهاتف ومعرفات حساب WAHO وتفاصيل الطلب ومعاملات المحفظة ومراجع الدفع.' },
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
          title: { en: 'Local preferences', ar: 'التفضيلات المحلية' },
          body: { en: 'Language and theme choices can be stored in the browser so the site opens the way you prefer next time.', ar: 'يمكن تخزين اختيار اللغة والثيم في المتصفح حتى يفتح الموقع بالطريقة التي تفضلها في المرة القادمة.' },
        },
      ]}
    />
  );
}
