import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  setupNotificationListeners,
  setupAndroidChannel,
  registerNotificationOpenHandlers,
} from './Src/Helpers/NotificationHelper';
import StackNavigator from './Src/Navigations/StackNavigator';
import useFonts from './Src/Utills/Fonts';
import { applyOTAUpdateIfAvailable, getForceUpdateInfo, ForceUpdateInfo } from './Src/Utills/VersionChecker';
import appLogo from './Src/Assets/Company/logo.png';
import { COLORS } from './Src/Utills/AppTheme';
import ErrorBoundary from './Src/Components/ErrorBoundary';
import { AppToastProvider } from './Src/Components/ui/appcomponents';
import NotificationBanner from './Src/Components/NotificationBanner/NotificationBanner';
import MaintenanceScreen from './Src/Screens/Maintenance/MaintenanceScreen';
import ForceUpdateScreen from './Src/Screens/ForceUpdate/ForceUpdateScreen';
import { API_BASE_URL } from './Src/Config/BaseUrl';


export default function App() {
  const [appReady, setAppReady] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceBypassed, setMaintenanceBypassed] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState<string | undefined>();
  const [forceUpdate, setForceUpdate] = useState<ForceUpdateInfo | null>(null);

  // ✅ LOAD FONTS
  const fontsLoaded = useFonts();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/app-config/all`);
        if (res.ok) {
          const data = await res.json();
          const config = data?.[0];
          console.log('[AppConfig]', JSON.stringify(config, null, 2));
          if (config?.IS_MAINTENANCE) {
            setIsMaintenance(true);
            setMaintenanceMsg(config.MAINTENANCE_MSG);
            return;
          }
          const updateInfo = await getForceUpdateInfo(config);
          if (updateInfo.required) {
            setForceUpdate(updateInfo);
            return;
          }
        }
      } catch (e) {
        console.log('Config fetch failed:', e);
      }
      applyOTAUpdateIfAvailable();
    };
    fetchConfig();
  }, []);

  useEffect(() => {
    const initApp = async () => {
      try {
        await setupAndroidChannel();
        setAppReady(true);
      } catch (error) {
        console.error('App initialization error:', error);
        setAppReady(true);
      }
    };

    initApp();
    const cleanupListeners = setupNotificationListeners();
    // Background-tap and quit-state (cold start) notification taps —
    // separate from setupNotificationListeners' foreground-only onMessage.
    const cleanupOpenHandlers = registerNotificationOpenHandlers();
    return () => {
      cleanupListeners();
      cleanupOpenHandlers();
    };
  }, []);

  if (isMaintenance && !maintenanceBypassed) {
    return <MaintenanceScreen message={maintenanceMsg} onUnlock={() => setMaintenanceBypassed(true)} />;
  }

  if (forceUpdate && fontsLoaded && appReady) {
    return (
      <ForceUpdateScreen
        currentVersion={forceUpdate.currentVersion}
        latestVersion={forceUpdate.latestVersion}
        storeUrl={forceUpdate.storeUrl}
      />
    );
  }

  // Show loading until fonts are loaded and app is ready
  if (!fontsLoaded || !appReady) {
    return (
      <View style={styles.loadingContainer}>
        <Image source={appLogo} style={styles.loadingLogo} resizeMode="contain" />
        <ActivityIndicator size="large" color={COLORS.brand} style={styles.loadingSpinner} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* <SafeAreaView style={styles.safeArea}> */}
        <View style={styles.container}>
          <ErrorBoundary>
            <AppToastProvider>
              <StackNavigator />
            </AppToastProvider>
          </ErrorBoundary>
          <StatusBar style="auto" />
        </View>
      {/* </SafeAreaView> */}
      <NotificationBanner />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingLogo: {
    width: 140,
    height: 140,
    marginBottom: 24,
  },
  loadingSpinner: {
    marginTop: 8,
  },
});
