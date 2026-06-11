export const wahoScreenshots = {
  liveStream: '/waho/live-stream.webp',
  onlineParties: '/waho/online-parties.webp',
  friends: '/waho/friends.webp',
  casualGames: '/waho/casual-games.webp',
  privateChat: '/waho/private-chat.webp',
  partyRoom: '/waho/party-room.webp',
  audioRoom: '/waho/audio-room.webp',
} as const;

export const wahoShowcaseImages = [
  {
    src: wahoScreenshots.liveStream,
    label: { en: 'WAHO app', ar: 'تطبيق WAHO', zh: 'WAHO 应用' },
  },
  {
    src: wahoScreenshots.onlineParties,
    label: { en: 'Account', ar: 'الحساب', zh: '账号' },
  },
  {
    src: wahoScreenshots.friends,
    label: { en: 'Profile', ar: 'الملف', zh: '资料' },
  },
  {
    src: wahoScreenshots.casualGames,
    label: { en: 'Top-up amount', ar: 'مبلغ الشحن', zh: '充值金额' },
  },
  {
    src: wahoScreenshots.privateChat,
    label: { en: 'Confirmation', ar: 'التأكيد', zh: '确认' },
  },
  {
    src: wahoScreenshots.partyRoom,
    label: { en: 'Order status', ar: 'حالة الطلب', zh: '订单状态' },
  },
  {
    src: wahoScreenshots.audioRoom,
    label: { en: 'Support', ar: 'الدعم', zh: '支持' },
  },
] as const;
