const MEDIA_PATHS = {
  photoFolder: 'assets/images/stories/',
  videoFolder: 'assets/videos/stories/',
  wishVideo: 'assets/videos/wish-pantai.mp4'
};

const STORY_MEDIA = {
  photos: [
    { file: 'photo-01.jpg', caption: 'Our memory #1' },
    { file: 'photo-02.jpg', caption: 'Our memory #2' },
    { file: 'photo-03.jpg', caption: 'Our memory #3' },
    { file: 'photo-04.jpg', caption: 'Our memory #4' },
    { file: 'photo-05.jpg', caption: 'Our memory #5' }
  ],
  videos: [
    { file: 'story-01.mp4', label: 'Video cerita #1' },
    { file: 'story-02.mp4', label: 'Video cerita #2' }
  ]
};

const WA_CONFIG = {
  number: '6281276886123',
  message: 'Makasih banyak ya Sayank buat kejutannya! Luv you too! ❤️'
};

function resolveMediaPath(folder, item) {
  const raw = typeof item === 'string'
    ? item.trim()
    : String(item?.src || item?.file || '').trim();
  if (!raw) return '';
  if (/^(https?:\/\/|data:|blob:|\.\.?\/|assets\/)/i.test(raw)) return raw;
  return `${String(folder || '').replace(/\/+$/, '')}/${raw.replace(/^\/+/, '')}`;
}