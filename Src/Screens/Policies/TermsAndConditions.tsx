import React from 'react';
import AppContentScreen from '../../Components/AppContent/AppContentScreen';

export interface TermsAndConditionsProps {
  navigation: { goBack: () => void };
}

const TermsAndConditions = ({ navigation }: TermsAndConditionsProps) => (
  <AppContentScreen contentId="TERMS" title="Terms & Conditions" navigation={navigation} />
);

export default TermsAndConditions;
