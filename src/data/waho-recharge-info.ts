export const wahoRechargeInfo = {
  title: {
    en: 'Before you top up WAHO',
    ar: 'قبل شحن WAHO',
    zh: '充值 WAHO 前',
  },
  body: {
    en: 'This page is only for WAHO account balance. Check the account ID, choose the IQD amount, pay, and keep the order ID for support.',
    ar: 'هذه الصفحة مخصصة فقط لشحن رصيد حساب WAHO. تحقق من معرف الحساب واختر مبلغ الدينار وادفع واحتفظ برقم الطلب للدعم.',
    zh: '此页面仅用于 WAHO 账号余额充值。请检查账号 ID，选择 IQD 金额，完成付款，并保留订单号以便客服查询。',
  },
  cards: [
    {
      title: {
        en: '1. WAHO ID',
        ar: '١. معرف WAHO',
        zh: '1. WAHO ID',
      },
      body: {
        en: 'Enter the exact WAHO account ID. A wrong ID can send the balance to the wrong account.',
        ar: 'أدخل معرف حساب WAHO بدقة. المعرف الخاطئ قد يرسل الرصيد إلى حساب غير صحيح.',
        zh: '请输入准确的 WAHO 账号 ID。ID 错误可能会把余额充值到错误账号。',
      },
    },
    {
      title: {
        en: '2. IQD amount',
        ar: '٢. مبلغ الدينار',
        zh: '2. IQD 金额',
      },
      body: {
        en: 'Choose one of the available top-up amounts before going to payment.',
        ar: 'اختر أحد مبالغ الشحن المتاحة قبل الانتقال إلى الدفع.',
        zh: '付款前请选择一个可用的充值金额。',
      },
    },
    {
      title: {
        en: '3. Payment',
        ar: '٣. الدفع',
        zh: '3. 付款',
      },
      body: {
        en: 'After payment is confirmed, the selected amount is processed for the WAHO ID you entered.',
        ar: 'بعد تأكيد الدفع، تتم معالجة المبلغ المختار لمعرف WAHO الذي أدخلته.',
        zh: '付款确认后，所选金额将按你输入的 WAHO ID 处理。',
      },
    },
    {
      title: {
        en: '4. Order ID',
        ar: '٤. رقم الطلب',
        zh: '4. 订单号',
      },
      body: {
        en: 'Use the order ID when asking support to check a pending, failed, or refunded recharge.',
        ar: 'استخدم رقم الطلب عند طلب مراجعة شحن قيد الانتظار أو فاشل أو مسترد.',
        zh: '如果需要客服查询待处理、失败或退款的充值，请提供订单号。',
      },
    },
  ],
} as const;
