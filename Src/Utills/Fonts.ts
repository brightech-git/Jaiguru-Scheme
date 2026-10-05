import { useFonts as useExpoFonts } from 'expo-font';

export const BOLD = 'Poppins-Bold';
export const BODY = 'InterDisplay-Medium';

const useFonts = (): boolean => {
  const [fontsLoaded] = useExpoFonts({
    [BOLD]: require('../Assets/Fonts/Poppins/Poppins-Bold.ttf'),
    [BODY]: require('../Assets/Fonts/InterDisplay-Medium.otf'),
  });
  return fontsLoaded;
};

export default useFonts;
