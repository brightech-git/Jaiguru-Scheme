import { IMAGE_BASE_URL } from '../Config/BaseUrl';
export const imageUrl = (path: string): string => /^https?:\/\//i.test(path) ? path : `${IMAGE_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
