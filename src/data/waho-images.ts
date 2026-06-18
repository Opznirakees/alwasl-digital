export const wahoScreenshots = {
  liveStream: '/waho/live-stream.webp',
  onlineParties: '/waho/online-parties.webp',
  friends: '/waho/friends.webp',
  casualGames: '/waho/casual-games.webp',
  privateChat: '/waho/private-chat.webp',
  partyRoom: '/waho/party-room.webp',
  audioRoom: '/waho/audio-room.webp',
} as const;

export const wahoShowcaseIntro = {
  title: {
    en: 'What your WAHO balance is used for',
    ar: 'استخدامات رصيد WAHO',
    zh: 'WAHO 余额可用于什么',
  },
  body: {
    en: 'Use your balance inside WAHO for live rooms, private chats, and virtual gifts. Choose an amount below and top up the correct WAHO ID.',
    ar: 'استخدم رصيدك داخل WAHO للبث والغرف الصوتية والمحادثات الخاصة والهدايا. اختر المبلغ بالأسفل واشحن معرف WAHO الصحيح.',
    zh: '余额可在 WAHO 内用于直播房间、私聊和虚拟礼物。请在下方选择金额，并为正确的 WAHO ID 充值。',
  },
} as const;

export const wahoShowcaseImages = [
  {
    src: wahoScreenshots.liveStream,
    label: { en: 'Live rooms', ar: 'غرف البث', zh: '直播房间' },
  },
  {
    src: wahoScreenshots.onlineParties,
    label: { en: 'Voice rooms', ar: 'غرف صوتية', zh: '语音房间' },
  },
  {
    src: wahoScreenshots.friends,
    label: { en: 'Friends', ar: 'الأصدقاء', zh: '好友' },
  },
  {
    src: wahoScreenshots.casualGames,
    label: { en: 'WAHO app', ar: 'تطبيق WAHO', zh: 'WAHO 应用' },
  },
  {
    src: wahoScreenshots.privateChat,
    label: { en: 'Private chat', ar: 'محادثة خاصة', zh: '私聊界面' },
  },
  {
    src: wahoScreenshots.partyRoom,
    label: { en: 'Virtual gifts', ar: 'هدايا افتراضية', zh: '虚拟礼物' },
  },
  {
    src: wahoScreenshots.audioRoom,
    label: { en: 'Audio rooms', ar: 'غرف صوتية', zh: '语音房间' },
  },
] as const;
