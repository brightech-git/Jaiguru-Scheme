import { Text } from '../../../Components/Typography/FontText';
import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import useAuth from '../../../api/hooks/Auth/useAuth';
import CommonHeader from '../../../Components/CommonHeader/CommonHeader';
import theme from '../../../Utills/AppTheme';
import { AppInput, AppButton } from '../../../Components/ui/appcomponents';

const { COLORS, SIZES, FONTS } = theme;

interface Props {
  route: { params: { contactNumber: string; otp: string } };
  navigation: any;
}

const ResetPasswordScreen = ({ route, navigation }: Props) => {
  const { contactNumber, otp } = route.params;

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { updatePassword, loading } = useAuth();

  const handleReset = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Enter all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const res: any = await updatePassword({ contactNumber, otp, newPassword });

    if (!res?.error) {
      Alert.alert('Success', 'Password Updated Successfully');
      navigation.navigate('Login');
    } else {
      Alert.alert('Error', res.error);
    }
  };

  return (
    <View style={styles.container}>
      <CommonHeader title="Reset Password" />

      <View style={styles.content}>
        <Text style={styles.title}>Create New Password</Text>

        <AppInput
          label="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New Password"
          isPassword
          leftIcon="lock-closed-outline"
          containerStyle={styles.field}
        />

        <AppInput
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm Password"
          isPassword
          error={confirmPassword && newPassword !== confirmPassword ? 'Passwords do not match' : undefined}
          leftIcon="lock-closed-outline"
          containerStyle={styles.field}
        />

        <AppButton label="Update Password" onPress={handleReset} loading={loading} variant="primary" size="lg" style={styles.button} />
      </View>
    </View>
  );
};

export default ResetPasswordScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  content: { padding: SIZES.space.gutter },
  title: { ...FONTS.title, color: COLORS.contentPrimary, marginBottom: SIZES.space.xl },
  field: { marginBottom: SIZES.space.md },
  button: { marginTop: SIZES.space.sm },
});
