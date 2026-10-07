import { useFonts as useExpoFonts } from 'expo-font';

export const BOLD = 'Poppins-Bold';
export const BODY = 'Poppins-Regular';
export const LIGHT = 'Poppins-Light';
export const MEDIUM = 'Poppins-Medium';
export const SEMIBOLD = 'Poppins-SemiBold';

const useFonts = (): boolean => {
  const [fontsLoaded] = useExpoFonts({
    [BOLD]: require('../Assets/Fonts/Poppins/Poppins-Bold.ttf'),
    [BODY]: require('../Assets/Fonts/Poppins/Poppins-Regular.ttf'),
    [LIGHT]: require('../Assets/Fonts/Poppins/Poppins-Light.ttf'),
    [MEDIUM]: require('../Assets/Fonts/Poppins/Poppins-Medium.ttf'),
    [SEMIBOLD]: require('../Assets/Fonts/Poppins/Poppins-SemiBold.ttf'),
  });
  return fontsLoaded;
};

export default useFonts;
