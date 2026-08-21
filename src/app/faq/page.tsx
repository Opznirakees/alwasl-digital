import { InfoPage } from '@/components/info/InfoPage';

export default function FaqPage() {
  return (
    <InfoPage
      eyebrow={{ en: 'Common questions', ar: 'الأسئلة الشائعة', zh: '常见问题' }}
      title={{ en: 'Answers you may need before topping up.', ar: 'إجابات قد تحتاجها قبل الشحن.', zh: '充值前可能需要的答案。' }}
      subtitle={{ en: 'Check the selected amount and delivery details carefully before you pay.', ar: 'تحقق من المبلغ المختار وبيانات التسليم بعناية قبل الدفع.', zh: '付款前请仔细核对所选金额和交付信息。' }}
      actions={[{ label: { en: 'Choose a category', ar: 'اختر الفئة', zh: '选择分类' }, href: '/#categories' }]}
      sections={[
        {
          title: { en: 'What do I need?', ar: 'ماذا أحتاج؟', zh: '需要准备什么？' },
          body: { en: 'You need a recharge amount and a phone that can receive the WhatsApp code. Some products also ask for an account ID.', ar: 'تحتاج إلى مبلغ شحن وهاتف يستقبل رمز واتساب. بعض المنتجات تطلب أيضاً معرف الحساب.', zh: '您需要充值金额和可接收 WhatsApp 验证码的手机。部分产品还需要账号 ID。' },
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
