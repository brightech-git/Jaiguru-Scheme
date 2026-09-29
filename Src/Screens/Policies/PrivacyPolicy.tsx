import React from 'react';
import AppContentScreen from '../../Components/AppContent/AppContentScreen';

export interface PrivacyPolicyProps {
  navigation: { goBack: () => void };
}

const PrivacyPolicy = ({ navigation }: PrivacyPolicyProps) => (
  <AppContentScreen contentId="PRIVACY" title="Privacy Policy" navigation={navigation} />
);

export default PrivacyPolicy;
