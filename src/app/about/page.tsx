import { InfoPage } from '@/components/info/InfoPage';

export default function AboutPage() {
  return (
    <InfoPage
      eyebrow={{ en: 'About Al-Wasl Digital', ar: 'عن الوصل الرقمي' }}
      title={{ en: 'Fast WAHO account top-ups with clear payment steps.', ar: 'شحن سريع لحسابات WAHO بخطوات دفع واضحة.' }}
      subtitle={{ en: 'Al-Wasl Digital helps customers top up a WAHO account quickly with clear amounts and local payment options.', ar: 'الوصل الرقمي يساعد العملاء على شحن حساب WAHO بسرعة عبر مبالغ واضحة وخيارات دفع محلية.' }}
      actions={[
        { label: { en: 'Browse WAHO top-ups', ar: 'تصفح شحن WAHO' }, href: '/top-up' },
        { label: { en: 'Contact support', ar: 'تواصل مع الدعم' }, href: '/contact' },
      ]}
      sections={[
        {
          title: { en: 'What we offer', ar: 'ماذا نقدم' },
          body: { en: 'Customers choose a WAHO top-up amount, enter the WAHO ID, confirm the account details, and continue to payment.', ar: 'يختار العملاء مبلغ شحن WAHO ويدخلون معرف WAHO ويتأكدون من بيانات الحساب ثم يتابعون للدفع.' },
        },
        {
          title: { en: 'Designed for the region', ar: 'مصمم للمنطقة' },
          body: { en: 'The app supports Arabic, English, and Chinese, local payment expectations, wallet behavior, and IQD-first pricing.', ar: 'يدعم التطبيق العربية والإنجليزية والصينية ومتطلبات الدفع المحلي وسلوك المحفظة والتسعير بالدينار العراقي أولاً.' },
        },
        {
          title: { en: 'Built for WAHO recharges', ar: 'مصمم لشحن WAHO' },
          body: { en: 'Every step is focused on one outcome: the right WAHO ID, the selected IQD amount, payment confirmation, and order status.', ar: 'كل خطوة تركز على نتيجة واحدة: معرف WAHO الصحيح، مبلغ الدينار المختار، تأكيد الدفع، وحالة الطلب.' },
        },
        {
          title: { en: 'What customers should expect', ar: 'ما يتوقعه العملاء' },
          items: [
            { en: 'Clear WAHO top-up amounts in IQD.', ar: 'مبالغ شحن WAHO واضحة بالدينار العراقي.' },
            { en: 'A required WAHO ID check before payment.', ar: 'فحص معرف WAHO قبل الدفع.' },
            { en: 'Support when a payment or order needs review.', ar: 'دعم عند الحاجة لمراجعة الدفع أو الطلب.' },
          ],
        },
      ]}
    />
  );
}
