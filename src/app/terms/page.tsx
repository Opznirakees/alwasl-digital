import { InfoPage } from '@/components/info/InfoPage';

export default function TermsPage() {
  return (
    <InfoPage
      eyebrow={{ en: 'Terms of Service', ar: 'شروط الخدمة' }}
      title={{ en: 'Clear rules for using Al-Wasl Digital.', ar: 'قواعد واضحة لاستخدام الوصل الرقمي.' }}
      subtitle={{ en: 'Please check the WAHO ID, selected amount, and payment details before confirming a recharge.', ar: 'يرجى التحقق من معرف WAHO والمبلغ المختار وبيانات الدفع قبل تأكيد الشحن.' }}
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
          body: { en: 'Orders are processed after payment is confirmed. Keep your order ID if support needs to review a payment.', ar: 'تتم معالجة الطلبات بعد تأكيد الدفع. احتفظ برقم الطلب إذا احتاج الدعم إلى مراجعة الدفع.' },
        },
        {
          title: { en: 'Support review', ar: 'مراجعة الدعم' },
          body: { en: 'If a recharge cannot be completed, support may ask for the order ID, WAHO ID, phone number, and payment reference.', ar: 'إذا تعذر إكمال الشحن، قد يطلب الدعم رقم الطلب ومعرف WAHO ورقم الهاتف ومرجع الدفع.' },
        },
      ]}
    />
  );
}
