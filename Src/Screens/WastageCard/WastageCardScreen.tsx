import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CommonHeader from '../../Components/CommonHeader/CommonHeader';
import BottomTab from '../../Components/BottomTab/BottomTab';

export default function WastageCardScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <CommonHeader title="Wastage Card" />
      <View style={styles.content}>
        <Image
          source={require('../../Assets/wastage-card.jpeg')}
          style={styles.image}
          resizeMode="contain"
          accessibilityLabel="Wastage card"
        />
      </View>
      <BottomTab activeScreen="WastageCard" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
