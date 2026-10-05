import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Controller, type Control, type FieldErrors } from 'react-hook-form';

import theme from '../../../../Utills/AppTheme';
import LuxuryInput from '../../Login/components/LuxuryInput';
import type { RegisterFormValues } from '../validation/registerSchema';

const { COLORS, SIZES, ELEVATION } = theme;

export interface RegisterFormProps {
  control: Control<RegisterFormValues>;
  errors: FieldErrors<RegisterFormValues>;
  disabled?: boolean;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ control, errors, disabled }) => (
  <View style={styles.cardShadow}>
    <BlurView intensity={30} tint="light" style={styles.card}>
      <Controller
        control={control}
        name="contactNumber"
        render={({ field: { value, onChange, onBlur } }) => (
          <LuxuryInput
            icon="cellphone"
            value={value}
            onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, 10))}
            onBlur={onBlur}
            placeholder="Contact Number"
            keyboardType="number-pad"
            maxLength={10}
            editable={!disabled}
            error={errors.contactNumber?.message}
            accessibilityLabel="Contact number"
            returnKeyType="done"
          />
        )}
      />
    </BlurView>
  </View>
);

const styles = StyleSheet.create({
  cardShadow: {
    borderRadius: SIZES.radius.xxl,
    ...ELEVATION.floating,
    shadowColor: COLORS.shadowAccent,
  },
  card: {
    borderRadius: SIZES.radius.xxl,
    overflow: 'hidden',
    padding: SIZES.space.xxl,
    backgroundColor: COLORS.whiteAlpha70,
    borderWidth: 1,
    borderColor: COLORS.brandAlpha32,
  },
});

export default React.memo(RegisterForm);
