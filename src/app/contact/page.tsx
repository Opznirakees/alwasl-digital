import { InfoPage } from '@/components/info/InfoPage';
import { supportWhatsAppHref } from '@/config/contact';

export default function ContactPage() {
  return (
    <InfoPage
      eyebrow={{ en: 'Contact', ar: 'تواصل معنا', zh: '联系我们' }}
      title={{ en: 'Need help? Send us a message.', ar: 'تحتاج مساعدة؟ أرسل لنا رسالة.', zh: '需要帮助？给我们发消息。' }}
      subtitle={{ en: 'WhatsApp is the quickest way to ask about a WAHO account, payment or order.', ar: 'واتساب هو أسرع طريقة للسؤال عن حساب WAHO أو الدفع أو الطلب.', zh: '通过 WhatsApp 可最快咨询 WAHO 账号、付款或订单问题。' }}
      actions={[
        { label: { en: 'Open WhatsApp', ar: 'افتح واتساب', zh: '打开 WhatsApp' }, href: supportWhatsAppHref },
        { label: { en: 'Read common answers', ar: 'اقرأ الإجابات الشائعة', zh: '查看常见问题' }, href: '/faq' },
      ]}
      sections={[
        {
          title: { en: 'Have this ready', ar: 'جهز هذه المعلومات', zh: '请提前准备' },
          items: [
            { en: 'Your order ID, if you already ordered.', ar: 'رقم الطلب إذا كنت قد طلبت بالفعل.', zh: '如果已下单，请准备订单编号。' },
            { en: 'The phone number used to log in.', ar: 'رقم الهاتف المستخدم لتسجيل الدخول.', zh: '登录时使用的手机号码。' },
            { en: 'A short description of what happened.', ar: 'وصف قصير لما حدث.', zh: '简短说明遇到的问题。' },
          ],
        },
        {
          title: { en: 'Order help', ar: 'مساعدة الطلبات', zh: '订单帮助' },
          body: { en: 'Send the order ID when a top-up is taking longer than expected, failed or was refunded.', ar: 'أرسل رقم الطلب عندما يستغرق الشحن وقتاً أطول من المتوقع أو يفشل أو يتم استرداده.', zh: '充值等待时间过长、失败或退款时，请发送订单编号。' },
        },
        {
          title: { en: 'Payment help', ar: 'مساعدة الدفع', zh: '付款帮助' },
          body: { en: 'Tell us the selected method and payment reference. Never send a password or WhatsApp verification code.', ar: 'أخبرنا بالطريقة المختارة ومرجع الدفع. لا ترسل كلمة مرور أو رمز تحقق واتساب أبداً.', zh: '请告诉我们付款方式和付款凭证。切勿发送密码或 WhatsApp 验证码。' },
        },
        {
          title: { en: 'Wrong WAHO ID?', ar: 'معرف WAHO غير صحيح؟', zh: 'WAHO ID 填错了？' },
          body: { en: 'Contact support immediately and include the order ID. A completed top-up may not be reversible.', ar: 'تواصل مع الدعم فوراً وأرسل رقم الطلب. قد لا يمكن عكس الشحن المكتمل.', zh: '请立即联系客服并提供订单编号。已完成的充值可能无法撤销。' },
        },
      ]}
    />
  );
}
