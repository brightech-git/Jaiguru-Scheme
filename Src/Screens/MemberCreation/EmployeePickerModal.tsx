import { TextInput } from '../../Components/Typography/FontText';
// Src/Screens/MemberCreation/EmployeePickerModal.tsx
import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, Pressable, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useEmployeeSearch } from '../../api/hooks/Employee/useEmployeeSearch';
import { Employee } from '../../types/Employee/Employee';
import { AppText } from '../../Components/ui/appcomponents';
import theme from '../../Utills/AppTheme';

const { COLORS, SIZES, FONTS, ELEVATION } = theme;

// iEmp sent when the customer was not referred by any employee.
export const DEFAULT_EMPLOYEE_ID = '999';

export interface SelectedEmployee {
  id: string;
  name?: string;
}

interface EmployeePickerModalProps {
  visible: boolean;
  selectedId: string;
  onSelect: (employee: SelectedEmployee) => void;
  onClose: () => void;
}

const getInitials = (name: string): string =>
  name
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || '?';

const EmployeePickerModal = ({ visible, selectedId, onSelect, onClose }: EmployeePickerModalProps) => {
  const { results, query, setQuery, loading, error, retry } = useEmployeeSearch(visible);

  useEffect(() => {
    if (!visible) setQuery('');
  }, [visible, setQuery]);

  const pick = (employee: SelectedEmployee) => {
    onSelect(employee);
    onClose();
  };

  const renderEmployee = ({ item }: { item: Employee }) => {
    const id = String(item.EMPID);
    const isSelected = id === selectedId;
    const name = (item.EMPNAME || '').trim() || `Employee ${id}`;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.row, isSelected && styles.rowSelected]}
        onPress={() => pick({ id, name })}
      >
        <View style={[styles.avatar, isSelected && styles.avatarSelected]}>
          <AppText variant="captionBold" color={isSelected ? COLORS.contentOnBrand : COLORS.contentBrand}>
            {getInitials(name)}
          </AppText>
        </View>
        <View style={styles.flex1}>
          <AppText variant="bodyMedium" color={isSelected ? COLORS.contentBrand : COLORS.contentPrimary} numberOfLines={1}>
            {name}
          </AppText>
          <AppText variant="caption">ID: {id}</AppText>
        </View>
        <Icon
          name={isSelected ? 'radio-button-on' : 'radio-button-off'}
          size={SIZES.icon.md}
          color={isSelected ? COLORS.contentBrand : COLORS.borderStrong}
        />
      </TouchableOpacity>
    );
  };

  const isDefaultSelected = selectedId === DEFAULT_EMPLOYEE_ID;

  const listHeader = !query.trim() ? (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.row, styles.defaultRow, isDefaultSelected && styles.rowSelected]}
      onPress={() => pick({ id: DEFAULT_EMPLOYEE_ID })}
    >
      <View style={[styles.avatar, isDefaultSelected && styles.avatarSelected]}>
        <Icon name="storefront-outline" size={SIZES.icon.sm} color={isDefaultSelected ? COLORS.contentOnBrand : COLORS.contentBrand} />
      </View>
      <View style={styles.flex1}>
        <AppText variant="bodyMedium" color={isDefaultSelected ? COLORS.contentBrand : COLORS.contentPrimary}>
          No employee (Default)
        </AppText>
        <AppText variant="caption">ID: {DEFAULT_EMPLOYEE_ID}</AppText>
      </View>
      <Icon
        name={isDefaultSelected ? 'radio-button-on' : 'radio-button-off'}
        size={SIZES.icon.md}
        color={isDefaultSelected ? COLORS.contentBrand : COLORS.borderStrong}
      />
    </TouchableOpacity>
  ) : null;

  const emptyState = loading ? (
    <View style={styles.state}>
      <ActivityIndicator color={COLORS.contentBrand} />
    </View>
  ) : error ? (
    <View style={styles.state}>
      <AppText variant="bodySmall" color={COLORS.dangerText} align="center">
        {error}
      </AppText>
      <TouchableOpacity onPress={retry} style={styles.retry}>
        <AppText variant="captionBold" color={COLORS.contentBrand}>
          Try again
        </AppText>
      </TouchableOpacity>
    </View>
  ) : (
    <View style={styles.state}>
      <Icon name="search-outline" size={SIZES.icon.lg} color={COLORS.contentMuted} />
      <AppText variant="bodySmall" color={COLORS.contentSecondary} align="center" style={{ marginTop: SIZES.space.sm }}>
        {query.trim() ? `No active employee matches "${query.trim()}"` : 'No active employees found'}
      </AppText>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet}>
          <View style={styles.titleRow}>
            <View style={styles.flex1}>
              <AppText variant="h5">Select Employee</AppText>
              <AppText variant="caption">Who helped you join this scheme?</AppText>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close" size={SIZES.icon.md} color={COLORS.contentSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Icon name="search" size={SIZES.icon.sm} color={COLORS.contentMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by name or ID"
              placeholderTextColor={COLORS.contentPlaceholder}
              selectionColor={COLORS.brand}
              autoCorrect={false}
              style={styles.searchInput}
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="close-circle" size={SIZES.icon.sm} color={COLORS.contentMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          <FlatList
            data={results}
            keyExtractor={(item) => String(item.EMPID)}
            renderItem={renderEmployee}
            ListHeaderComponent={listHeader}
            ListEmptyComponent={emptyState}
            ItemSeparatorComponent={() => <View style={{ height: SIZES.space.sm }} />}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default EmployeePickerModal;

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: COLORS.scrim,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.space.xl,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    height: '70%',
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.xl,
    padding: SIZES.space.lg,
    ...ELEVATION.overlay,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SIZES.space.md,
  },
  closeButton: {
    width: SIZES.control.heightSm,
    height: SIZES.control.heightSm,
    borderRadius: SIZES.radius.pill,
    backgroundColor: COLORS.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.space.sm,
    paddingHorizontal: SIZES.space.md,
    height: SIZES.field.height,
    borderRadius: SIZES.radius.field,
    borderWidth: 1,
    borderColor: COLORS.fieldBorder,
    backgroundColor: COLORS.fieldBackground,
    marginBottom: SIZES.space.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONTS.family.regular,
    fontSize: SIZES.text.md,
    color: COLORS.contentPrimary,
    paddingVertical: 0,
  },
  list: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.space.md,
    padding: SIZES.space.md,
    borderRadius: SIZES.radius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  defaultRow: {
    marginBottom: SIZES.space.sm,
  },
  rowSelected: {
    borderColor: COLORS.borderBrand,
    backgroundColor: COLORS.brandTint,
  },
  avatar: {
    width: SIZES.control.heightSm,
    height: SIZES.control.heightSm,
    borderRadius: SIZES.radius.pill,
    backgroundColor: COLORS.brandSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: {
    backgroundColor: COLORS.brand,
  },
  state: {
    alignItems: 'center',
    paddingVertical: SIZES.space.xxxl,
  },
  retry: {
    marginTop: SIZES.space.sm,
    paddingHorizontal: SIZES.space.lg,
    paddingVertical: SIZES.space.xs,
    borderRadius: SIZES.radius.pill,
    borderWidth: 1,
    borderColor: COLORS.brandAlpha32,
  },
});
