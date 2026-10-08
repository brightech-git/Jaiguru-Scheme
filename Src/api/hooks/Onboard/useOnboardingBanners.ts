// Src/api/hooks/Onboard/useOnboardingBanners.ts
import { useCachedBanners } from '../useCachedBanners';
import { onboardingService } from '../../services/onboardingService';
const fetchBanners = async () => (await onboardingService.getBanners()).banners ?? [];

export const useOnboardBanners = () => {
  const { items, ...state } = useCachedBanners('onboarding', fetchBanners);
  return { banners: items, ...state };
};
