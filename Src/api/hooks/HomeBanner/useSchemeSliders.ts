import { schemeSliderService } from '../../services/schemeSliderService';
import { useCachedBanners } from '../useCachedBanners';
const fetchSliders = async () => (await schemeSliderService.getSliders()).sliders ?? [];
export function useSchemeSliders() {
  const { items, ...state } = useCachedBanners('home', fetchSliders);
  return { sliders: items, ...state };
}
