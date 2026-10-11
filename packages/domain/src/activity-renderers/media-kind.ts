export type MediaKind = 'video' | 'audio' | 'image' | 'link';

/** Media are links (there is no upload in the MVP); the address says how to show one. */
export function mediaKindOf(url: string): MediaKind {
  const path = url.split(/[?#]/)[0]?.toLowerCase() ?? '';
  if (/\.(mp4|webm|ogv|mov|m4v)$/.test(path)) return 'video';
  if (/\.(mp3|wav|ogg|oga|m4a|aac)$/.test(path)) return 'audio';
  if (/\.(png|jpe?g|gif|webp|svg|avif)$/.test(path)) return 'image';
  return 'link';
}
