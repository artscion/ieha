export const IMAGE_SOURCE_URL_EVENT = 'ieha:catalogue-image-source-url';

export function publishImageSourceUrl(url: string | null): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(IMAGE_SOURCE_URL_EVENT, {
      detail: { url },
    })
  );
}
