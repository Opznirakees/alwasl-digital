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
    label: { en: 'Live', ar: 'البث المباشر', zh: '直播' },
  },
  {
    src: wahoScreenshots.onlineParties,
    label: { en: 'Parties', ar: 'الحفلات', zh: '派对' },
  },
  {
    src: wahoScreenshots.friends,
    label: { en: 'Friends', ar: 'الأصدقاء', zh: '好友' },
  },
  {
    src: wahoScreenshots.casualGames,
    label: { en: 'Games', ar: 'الألعاب', zh: '游戏' },
  },
  {
    src: wahoScreenshots.privateChat,
    label: { en: 'Private chat', ar: 'الدردشة الخاصة', zh: '私聊' },
  },
  {
    src: wahoScreenshots.partyRoom,
    label: { en: 'Gift effects', ar: 'مؤثرات الهدايا', zh: '礼物特效' },
  },
  {
    src: wahoScreenshots.audioRoom,
    label: { en: 'Community', ar: 'المجتمع', zh: '社区' },
  },
] as const;
