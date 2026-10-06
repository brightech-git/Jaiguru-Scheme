// Src/Navigations/StackNavigator.tsx
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';

import OnboardingScreen from '../Screens/Onboard/OnboardingScreen';
import LoginScreen from '../Screens/Auth/Login/Login';
import RegisterScreen from '../Screens/Auth/Register/Register';
import VerifyOTPScreen from '../Screens/Auth/VerifyOTP/VerifyOTP';
import MpinCreateScreen from '../Screens/Auth/CreateMpin/CreateMpin';
import MpinVerifyScreen from '../Screens/Auth/VerifyMpin/VerifyMpin';
import AllSchemesScreen from '../Screens/SchemeDetails/SchemeDetailScreen';
import PrivacyPolicy from '../Screens/Policies/PrivacyPolicy';
import TermsAndConditions from '../Screens/Policies/TermsAndConditions';
import DeleteAccount from '../Screens/AccountDelete/AccountDelete';
import SchemePassbook from '../Screens/SchemePassbook/SchemePassbook';
import PaymentReceiptPage from '../Screens/PaymentReceipt/PaymentReceipt';
import MainDrawerNavigator from './DrawerNavigator';
import NotificationScreen from '../Screens/Notification/NotificationScreen';
import VerifyForgotMpinScreen from '../Screens/Auth/ForgotMpin/VerifyMpinOTP';
import ForgotMpinScreen from '../Screens/Auth/ForgotMpin/ForgotMpin';
import ForgotPasswordScreen from '../Screens/Auth/ForgotPassword/ForgotPassword';
import ForgotVerifyOtpScreen from '../Screens/Auth/ForgotPassword/ForgotVerifyOTP';
import ResetPasswordScreen from '../Screens/Auth/ResetPassword/ResetPassword';
import ResetMpinScreen from '../Screens/Auth/ResetMpin/ResetMpin';
import PayNow from '../Screens/PayNow/PayNow';
import MemberCreation from '../Screens/MemberCreation/MemberCreation';
import SchemeTermsAcceptance from '../Screens/SchemeTerms/SchemeTermsAcceptance';
import WebViewScreen from '../Screens/WebView/WebViewScreen';
import GoogleContactMobileScreen from '../Screens/Auth/GoogleContactUpdate/GoogleContactMobile';
import GoogleContactOtpScreen from '../Screens/Auth/GoogleContactUpdate/GoogleContactVerify';
import HelpCentre from '../Screens/HelpCenter/HelpCenter';
import KnowMore from '../Screens/KnowMore/KnowMore'
import ProfileScreen from '../Screens/Profile/Profile';
import RegisterInfoScreen from '../Screens/Auth/RegisterInfo/RegisterInfo';
import RegistrationWelcomeScreen from '../Screens/Auth/RegisterInfo/registration-welcome';
import SplashScreen from '../Screens/Splash/SplashScreen';
import WastageCardScreen from '../Screens/WastageCard/WastageCardScreen';
import { navigationRef } from './navigationRef';
import RatesScreen from '../Screens/Rates/RateScreen';
import SchemeJoinSuccessScreen from '../Screens/MemberCreation/SchemeJoinSuccessScreen';
import PassbookKycScreen from '../Screens/SchemePassbook/PassbookKycScreen';

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      try {
        // AsyncStorage.clear();
        const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
        const token = await AsyncStorage.getItem('authToken');
        const hasMpin = await AsyncStorage.getItem('hasMpin');

        /**
         * 🔀 FINAL FLOW
         */

        // 1️⃣ First time only → Onboarding
        if (!hasSeenOnboarding) {
          setInitialRoute('Onboarding');
        }

        // 2️⃣ Onboarding done, NOT logged in → Login
        else if (!token) {
          setInitialRoute('Login');
        }

        // 3️⃣ Logged in, MPIN not created → Create MPIN
        else if (hasMpin !== 'true') {
          setInitialRoute('MpinCreate');
        }

        // 4️⃣ Logged in + MPIN exists → ALWAYS Verify MPIN
        else {
          setInitialRoute('MpinVerify');
        }
      } catch (e) {
        console.log('Navigation init error', e);
        setInitialRoute('Onboarding');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  if (loading || !initialRoute) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
        <Stack.Screen name="MpinCreate" component={MpinCreateScreen} />
        <Stack.Screen name="MpinVerify" component={MpinVerifyScreen} />
        <Stack.Screen name="AllSchemes" component={AllSchemesScreen} />
        <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
        <Stack.Screen name="TermsAndConditions" component={TermsAndConditions} />
        <Stack.Screen name="DeleteAccount" component={DeleteAccount} />
        <Stack.Screen name="SchemePassbook" component={SchemePassbook} />
        <Stack.Screen name="PassbookKyc" component={PassbookKycScreen} />
        <Stack.Screen name="PaymentReceipt" component={PaymentReceiptPage} />
        <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
        <Stack.Screen name="ForgotMpin" component={ForgotMpinScreen} />
        <Stack.Screen name="VerifyForgotMpin" component={VerifyForgotMpinScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ForgotVerifyOTP" component={ForgotVerifyOtpScreen as any} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen as any} />
        <Stack.Screen name="ResetMPIN" component={ResetMpinScreen} />
        <Stack.Screen name="Paynow" component={PayNow} />
        <Stack.Screen name="MemberCreation" component={MemberCreation} />
        <Stack.Screen name="SchemeJoinSuccess" component={SchemeJoinSuccessScreen} options={{ gestureEnabled: false }} />
        <Stack.Screen name="SchemeTermsAcceptance" component={SchemeTermsAcceptance} />
        <Stack.Screen name="WebViewScreen" component={WebViewScreen} />
        <Stack.Screen name="GoogleContactVerification" component={GoogleContactMobileScreen as any} />
        <Stack.Screen name="GoogleContactVerify" component={GoogleContactOtpScreen as any} />
        <Stack.Screen name="HelpCenter" component={HelpCentre} />
        <Stack.Screen name="KnowMore" component={KnowMore} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="RegisterInfo" component={RegisterInfoScreen} />
        <Stack.Screen name="RegistrationWelcome" component={RegistrationWelcomeScreen} />
        <Stack.Screen name="WastageCard" component={WastageCardScreen} />
        <Stack.Screen name="Rates" component={RatesScreen} />

        {/* Drawer after MPIN success */}
        <Stack.Screen name="MainDrawer" component={MainDrawerNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
