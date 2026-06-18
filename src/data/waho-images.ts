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
    en: 'Screenshots from the WAHO app',
    ar: 'لقطات من تطبيق WAHO',
    zh: 'WAHO 应用截图',
  },
  body: {
    en: 'These app screenshots help customers recognize WAHO clearly before choosing a recharge amount.',
    ar: 'هذه الصور للتعرّف على التطبيق: يمكن للعملاء تمييز WAHO بوضوح قبل اختيار مبلغ الشحن.',
    zh: '这些图片用于识别应用：客户可清楚确认 WAHO，然后选择充值金额。',
  },
} as const;

export const wahoShowcaseImages = [
  {
    src: wahoScreenshots.liveStream,
    label: { en: 'Live screen', ar: 'شاشة البث', zh: '直播界面' },
  },
  {
    src: wahoScreenshots.onlineParties,
    label: { en: 'Voice room', ar: 'غرفة صوتية', zh: '语音房间' },
  },
  {
    src: wahoScreenshots.friends,
    label: { en: 'Friends screen', ar: 'شاشة الأصدقاء', zh: '好友界面' },
  },
  {
    src: wahoScreenshots.casualGames,
    label: { en: 'App screen', ar: 'شاشة التطبيق', zh: '应用界面' },
  },
  {
    src: wahoScreenshots.privateChat,
    label: { en: 'Private chat', ar: 'محادثة خاصة', zh: '私聊界面' },
  },
  {
    src: wahoScreenshots.partyRoom,
    label: { en: 'Gift screen', ar: 'شاشة الهدايا', zh: '礼物界面' },
  },
  {
    src: wahoScreenshots.audioRoom,
    label: { en: 'Audio room', ar: 'غرفة صوتية', zh: '语音房间' },
  },
] as const;
