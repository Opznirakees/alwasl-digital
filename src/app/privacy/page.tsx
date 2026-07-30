import { InfoPage } from '@/components/info/InfoPage';

export default function PrivacyPage() {
  return (
    <InfoPage
      eyebrow={{ en: 'Privacy', ar: 'سياسة الخصوصية', zh: '隐私政策' }}
      title={{ en: 'We use only the information needed for your top-up.', ar: 'نستخدم فقط المعلومات اللازمة لشحنك.', zh: '我们只使用完成充值所需的信息。' }}
      subtitle={{ en: 'This explains what we use when you log in, place an order, pay or ask for help.', ar: 'يوضح هذا ما نستخدمه عند تسجيل الدخول أو الطلب أو الدفع أو طلب المساعدة.', zh: '这里说明您登录、下单、付款或寻求帮助时我们会使用哪些信息。' }}
      sections={[
        {
          title: { en: 'What we store', ar: 'ما نخزنه', zh: '我们存储什么' },
          body: { en: 'We may store your phone number, WAHO ID, orders, wallet activity and payment references.', ar: 'قد نخزن رقم هاتفك ومعرف WAHO والطلبات ومعاملات المحفظة ومراجع الدفع.', zh: '我们可能会存储您的手机号码、WAHO ID、订单、钱包记录和付款凭证。' },
        },
        {
          title: { en: 'Why we need it', ar: 'لماذا نحتاجه', zh: '为什么需要这些信息' },
          body: { en: 'We use it to log you in, process and follow orders, help you, and protect the service from misuse.', ar: 'نستخدمه لتسجيل دخولك وتنفيذ الطلبات ومتابعتها ومساعدتك وحماية الخدمة من إساءة الاستخدام.', zh: '我们用它来帮助您登录、处理和跟踪订单、提供帮助并防止服务被滥用。' },
        },
        {
          title: { en: 'Who receives it', ar: 'من يستلمه', zh: '谁会收到这些信息' },
          body: { en: 'Only the payment and top-up services needed to complete your order may receive the necessary order details.', ar: 'قد تستلم خدمات الدفع والشحن اللازمة لإتمام طلبك تفاصيل الطلب الضرورية فقط.', zh: '只有完成订单所需的付款和充值服务才可能收到必要的订单信息。' },
        },
        {
          title: { en: 'Saved on your device', ar: 'محفوظ على جهازك', zh: '保存在您的设备上' },
          body: { en: 'Your language can stay in this browser so the app opens in the same language next time.', ar: 'يمكن أن تبقى لغتك محفوظة في هذا المتصفح ليفتح التطبيق باللغة نفسها لاحقاً.', zh: '语言偏好可保存在当前浏览器中，以便下次以相同语言打开应用。' },
        },
      ]}
    />
  );
}
