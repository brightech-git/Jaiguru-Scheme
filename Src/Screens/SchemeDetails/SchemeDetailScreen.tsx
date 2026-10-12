// SchemeDetailScreen.tsx
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import SchemeDetailsCard from '../../Components/SchemeDetailsCard/SchemeDetailsCard';
import PremiumBackground from '../../Components/PremiumBackground/PremiumBackground';
import BottomTab from '../../Components/BottomTab/BottomTab';
import theme from '../../Utills/AppTheme';
import { AppText } from '../../Components/ui/appcomponents';
import { SafeAreaView } from 'react-native-safe-area-context';

const { COLORS, SIZES } = theme;

type FilterValue = 'all' | 'active' | 'due' | 'completed';

interface FilterButtonProps {
  title: string;
  value: FilterValue;
  isActive: boolean;
  onPress: (value: FilterValue) => void;
}

const FilterButton = ({ title, value, isActive, onPress }: FilterButtonProps) => (
  <TouchableOpacity style={[styles.filterButton, isActive && styles.filterButtonActive]} onPress={() => onPress(value)}>
    <AppText variant="label" color={isActive ? COLORS.surface : COLORS.contentSecondary}>
      {title}
    </AppText>
  </TouchableOpacity>
);

export default function AllSchemesScreen() {
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState<FilterValue>('all');

  const handleBackPress = () => {
    navigation.navigate('MainDrawer');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <PremiumBackground />
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={COLORS.contentPrimary} />
        </TouchableOpacity>
        <AppText variant="h6">All Schemes</AppText>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.filterContainer}>
        <FilterButton title="All" value="all" isActive={filter === 'all'} onPress={setFilter} />
        {/* <FilterButton title="Active" value="active" isActive={filter === 'active'} onPress={setFilter} /> */}
        <FilterButton title="Due" value="due" isActive={filter === 'due'} onPress={setFilter} />
        <FilterButton title="Finished" value="completed" isActive={filter === 'completed'} onPress={setFilter} />
      </View>

      <View style={styles.content}>
        <SchemeDetailsCard layout="vertical" filter={filter} />
      </View>
      <BottomTab activeScreen="SCHEMES" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surfaceMuted },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SIZES.space.lg,
    paddingVertical: SIZES.space.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: { padding: SIZES.space.xs },
  headerRight: { width: 40 },
  filterContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SIZES.space.sm,
    backgroundColor: COLORS.surface,
    paddingHorizontal: SIZES.space.lg,
    paddingVertical: SIZES.space.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterButton: {
    flex: 1,
    minWidth: 100,
    paddingVertical: SIZES.space.sm,
    paddingHorizontal: SIZES.space.md,
    marginHorizontal: 4,
    borderRadius: SIZES.radius.pill,
    backgroundColor: COLORS.surfaceSunken,
    alignItems: 'center',
  },
  filterButtonActive: { backgroundColor: COLORS.brand },
  content: { flex: 1 },
});
