import { InfoPage } from '@/components/info/InfoPage';

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow={{ en: 'Terms of Service', ar: 'شروط الخدمة' }}
      title={{ en: 'Clear rules for using Al-Wasl Digital.', ar: 'قواعد واضحة لاستخدام الوصل الرقمي.' }}
      subtitle={{ en: 'These demo terms are placeholders and should be reviewed before production launch.', ar: 'هذه الشروط التجريبية مؤقتة ويجب مراجعتها قبل الإطلاق الفعلي.' }}
      sections={[
        {
          title: { en: 'Account use', ar: 'استخدام الحساب' },
          body: { en: 'Customers are responsible for entering the correct WAHO account ID and contact details.', ar: 'العميل مسؤول عن إدخال معرف حساب WAHO وبيانات التواصل بشكل صحيح.' },
        },
        {
          title: { en: 'Orders', ar: 'الطلبات' },
          body: { en: 'WAHO top-ups may be irreversible after successful fulfillment.', ar: 'قد لا يمكن إلغاء شحن WAHO بعد التنفيذ الناجح.' },
        },
        {
          title: { en: 'Payments', ar: 'الدفع' },
          body: { en: 'Production payments should be confirmed through the connected payment provider before fulfillment.', ar: 'في الإنتاج يجب تأكيد الدفع عبر مزود الدفع المتصل قبل تنفيذ الطلب.' },
        },
        {
          title: { en: 'Demo notice', ar: 'تنبيه النسخة التجريبية' },
          body: { en: 'This deployment uses sample data and simulated flows until real integrations are connected.', ar: 'هذا النشر يستخدم بيانات ومسارات محاكاة حتى يتم ربط التكاملات الحقيقية.' },
        },
      ]}
    />
  );
}
