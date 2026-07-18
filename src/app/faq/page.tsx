import { InfoPage } from '@/components/info/InfoPage';

export default function FaqPage() {
  return (
    <InfoPage
      eyebrow={{ en: 'Common questions', ar: 'الأسئلة الشائعة', zh: '常见问题' }}
      title={{ en: 'Answers you may need before topping up.', ar: 'إجابات قد تحتاجها قبل الشحن.', zh: '充值前可能需要的答案。' }}
      subtitle={{ en: 'Check your WAHO ID and amount carefully. We show the account again before payment.', ar: 'تحقق من معرف WAHO والمبلغ بعناية. سنعرض الحساب مرة أخرى قبل الدفع.', zh: '请仔细核对 WAHO ID 和金额。付款前会再次显示账号。' }}
      actions={[{ label: { en: 'Choose an amount', ar: 'اختر المبلغ', zh: '选择金额' }, href: '/top-up/waho-top-up' }]}
      sections={[
        {
          title: { en: 'What do I need?', ar: 'ماذا أحتاج؟', zh: '需要准备什么？' },
          body: { en: 'You need the WAHO ID, a top-up amount and a phone that can receive the WhatsApp code.', ar: 'تحتاج إلى معرف WAHO ومبلغ الشحن وهاتف يستقبل رمز واتساب.', zh: '您需要 WAHO ID、充值金额以及可接收 WhatsApp 验证码的手机。' },
        },
        {
          title: { en: 'Where is my order?', ar: 'أين طلبي؟', zh: '在哪里查看订单？' },
          body: { en: 'Open My Orders after logging in. Each status explains whether you need to wait, retry or contact support.', ar: 'افتح طلباتي بعد تسجيل الدخول. توضح كل حالة ما إذا كان عليك الانتظار أو المحاولة أو التواصل مع الدعم.', zh: '登录后打开“我的订单”。每个状态都会说明需要等待、重试还是联系客服。' },
        },
        {
          title: { en: 'Which price will I pay?', ar: 'ما السعر الذي سأدفعه؟', zh: '我需要支付多少？' },
          body: { en: 'The final amount is shown before you confirm. Your selected country controls the local currency and available prices.', ar: 'يظهر المبلغ النهائي قبل التأكيد. يحدد البلد المختار العملة المحلية والأسعار المتاحة.', zh: '确认前会显示最终金额。所选国家决定当地货币和可用价格。' },
        },
        {
          title: { en: 'Can I use my wallet?', ar: 'هل يمكنني استخدام المحفظة؟', zh: '可以使用钱包吗？' },
          body: { en: 'Yes, when your balance covers the total. Open My Wallet to see your balance and activity.', ar: 'نعم، عندما يغطي رصيدك المبلغ الإجمالي. افتح محفظتي لرؤية الرصيد والمعاملات.', zh: '可以，前提是余额足够支付总额。打开“我的钱包”可查看余额和记录。' },
        },
      ]}
    />
  );
}
