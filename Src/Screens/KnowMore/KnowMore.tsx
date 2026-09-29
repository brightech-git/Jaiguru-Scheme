import React from 'react';
import { useNavigation } from '@react-navigation/native';
import AppContentScreen from '../../Components/AppContent/AppContentScreen';

const KnowMore = () => {
  const navigation = useNavigation<any>();

  return <AppContentScreen contentId="KNOWMORE" title="Know More" navigation={navigation} />;
};

export default KnowMore;
