export function injectAds<T>(items: T[], interval: number = 4): (T | { isAd: true })[] {
  const result: (T | { isAd: true })[] = [];
  items.forEach((item, index) => {
    result.push(item);
    if ((index + 1) % interval === 0 && index !== items.length - 1) {
      result.push({ isAd: true });
    }
  });
  return result;
}
