import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { IMAGE_BASE_URL } from '../../Config/BaseUrl';
import { imageUrl } from '../../Utills/imageUrl';

type Banner = { image_path: string };
const memory = new Map<string, Banner[]>();
export function useCachedBanners<T extends Banner>(name: string, fetchList: () => Promise<T[]>) {
  const key = `public-banners:v1:${IMAGE_BASE_URL}:${name}`;
  const [items, setItems] = useState<T[]>(() => (memory.get(key) || []) as T[]);
  const [loading, setLoading] = useState(!memory.has(key));
  const [error, setError] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const sequence = useRef(0);
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    const current = ++sequence.current;
    const show = (list: T[]) => {
      if (current !== sequence.current) return;
      setItems(list);
      setLoading(false);
    };
    setError(null);
    (async () => {
      if (!memory.has(key)) {
        try {
          const cached = JSON.parse(await AsyncStorage.getItem(key) || 'null');
          if (Array.isArray(cached) && cached.length && cached.every(item => typeof item?.image_path === 'string')) {
            memory.set(key, cached);
            show(cached);
          }
        } catch { /* Cache failures must not prevent fetching banners. */ }
      }
      if (current !== sequence.current) return;
      let timeout: ReturnType<typeof setTimeout> | undefined;
      try {
        const list = await Promise.race([
          fetchList(),
          new Promise<never>((_, reject) => { timeout = setTimeout(() => reject(new Error('Banner loading timed out')), 12000); }),
        ]);
        if (current !== sequence.current) return;
        const valid = list.filter(item => typeof item?.image_path === 'string' && item.image_path.trim());
        memory.set(key, valid);
        void AsyncStorage.setItem(key, JSON.stringify(valid)).catch(() => {});
        show(valid);
        // Background prefetch never blocks the visible carousel.
        if (valid.length) void Image.prefetch(valid.map(item => imageUrl(item.image_path)), { cachePolicy: 'memory-disk' }).catch(() => {});
      } catch (err: any) {
        if (current === sequence.current) {
          setError(err?.message || 'Unable to load banners');
          setLoading(false);
        }
      } finally { clearTimeout(timeout); }
    })();
    return () => { sequence.current++; };
  }, [key, fetchList, revision]);
  return { items, loading, error, refresh };
}
