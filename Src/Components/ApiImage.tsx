import React, { useEffect, useState } from 'react';
import { Image, ImageProps } from 'expo-image';
import logo from '../Assets/Company/logo.png';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import AppSkeleton from './ui/appcomponents/AppSkeleton';
import { COLORS } from '../Utills/AppTheme';

export default function ApiImage({ loadingPlaceholder = 'logo', ...props }: ImageProps & { loadingPlaceholder?: 'logo' | 'skeleton' }) {
  const [failed, setFailed] = useState(false);
  const [displayedKey, setDisplayedKey] = useState<string | undefined>();
  const sourceKey = typeof props.source === 'string' ? props.source : JSON.stringify(props.source);
  useEffect(() => setFailed(false), [sourceKey]);
  if (loadingPlaceholder === 'skeleton') {
    return <View style={[props.style as StyleProp<ViewStyle>, { overflow: 'hidden', backgroundColor: COLORS.surfaceMuted }]}>
      <Image cachePolicy="memory-disk" transition={0} {...props} placeholder={null}
        style={StyleSheet.absoluteFill} recyclingKey={sourceKey}
        onDisplay={() => { setDisplayedKey(sourceKey); props.onDisplay?.(); }}
        onError={event => { setFailed(true); props.onError?.(event); }} />
      {displayedKey !== sourceKey && !failed && <View pointerEvents="none" style={StyleSheet.absoluteFill}><AppSkeleton style={{ flex: 1 }} height={undefined} borderRadius={0} /></View>}
    </View>;
  }
  return <Image cachePolicy="memory-disk" transition={150} placeholder={logo} placeholderContentFit="contain"
    {...props} source={failed ? logo : props.source} contentFit={failed ? 'contain' : props.contentFit || 'cover'}
    onError={event => { setFailed(true); props.onError?.(event); }} />;
}
