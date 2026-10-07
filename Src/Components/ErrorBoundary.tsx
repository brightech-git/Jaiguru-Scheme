import { Text } from './Typography/FontText';
// Src/Components/ErrorBoundary.tsx
//
// The app had ZERO error boundaries anywhere before this. React's default
// behavior when a component throws during render/lifecycle with no boundary
// above it is to unmount the whole tree — in a release build (no redbox),
// that surfaces to the user as the entire app just disappearing, with no
// error screen at all. That matches the "suddenly closed, no error shown"
// reports on the Member Creation step transition and elsewhere.
//
// IMPORTANT — what this does and does NOT catch:
//   - DOES catch: JS exceptions thrown while a component renders, or in
//     lifecycle methods, anywhere below this in the tree.
//   - Does NOT catch: exceptions thrown inside event handlers (onPress, etc.)
//     that don't happen during render, async/promise rejections, or genuine
//     NATIVE crashes (native module invariant violations, native library
//     crashes like the WebView renderer-process issue fixed separately in
//     RazorpayWebView.tsx). Those bypass JS entirely and need an actual device
//     crash log (adb logcat) or a crash-reporting SDK (Crashlytics/Sentry —
//     neither is wired up in this app yet) to diagnose.
import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../Utills/AppTheme';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // No crash-reporting SDK is configured in this app yet, so this console.error
    // is the only trace of what happened — check Metro/logcat output for it.
    console.error('[ErrorBoundary] Caught a render error that would otherwise have crashed the whole app:', error, errorInfo?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </Text>
            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surfacePage },
  scrollContent: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.danger, marginBottom: 12, textAlign: 'center' },
  message: { fontSize: 14, color: COLORS.contentSecondary, textAlign: 'center', marginBottom: 24 },
  button: { backgroundColor: COLORS.brand, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: COLORS.contentOnBrand, fontWeight: '600', fontSize: 16 },
});
