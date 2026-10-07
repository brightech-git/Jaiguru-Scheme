import { Text } from '../../Components/Typography/FontText';
// Src/Screens/PaymentReceipt/PaymentReceipt.tsx
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Alert, Image, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import CommonHeader from '../../Components/CommonHeader/CommonHeader';
import PremiumBackground from '../../Components/PremiumBackground/PremiumBackground';
import PaymentReceiptPDF from '../../Utills/PaymentReceiptPDF';
import { COLORS } from '../../Utills/AppTheme';
import { useCompany } from '../../api/hooks/Company/useCompany';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { AppButton, AppText } from '../../Components/ui/appcomponents';
import { SafeAreaView } from 'react-native-safe-area-context';

const moderateScale = (size: number) => size;

export interface PaymentReceiptRouteParams {
  paymentData?: {
    amount?: number | string;
    weight?: string;
    receiptNo?: string | number;
    updateTime?: string;
    chqBank?: string;
    chqBranch?: string;
    chq_CardNo?: string;
    installment?: string | number;
  };
  schemeData?: any;
  customerData?: { pName?: string; mobile?: string };
}

export default function PaymentReceiptPage() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, PaymentReceiptRouteParams>, string>>();
  const { paymentData, schemeData, customerData } = route.params || {};
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Get company data from hook
  const { company: companyData } = useCompany();

  // If no data is passed, show error or go back
  if (!paymentData || !schemeData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <AppText variant="h6" color="#D32F2F" style={{ marginBottom: 20 }}>
            No receipt data available
          </AppText>
          <AppButton label="Go Back" onPress={() => navigation.goBack()} fullWidth={false} style={{ paddingHorizontal: 32 }} />
        </View>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString || dateString === '1900-01-01 00:00:00.0') return 'N/A';
    try {
      const dateStringFormatted = dateString.includes(' ') ? dateString.replace(' ', 'T').replace(/\.\d+$/, '') : dateString;
      const date = new Date(dateStringFormatted);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount: unknown) => {
    const numAmount = parseFloat(String(amount)) || 0;
    return `₹${numAmount.toLocaleString('en-IN')}`;
  };

  // Generate and download receipt
  const handleDownloadReceipt = async () => {
    setIsGeneratingPDF(true);

    try {
      // Prepare data for PDF generation
      const responseData = {
        schemeData: schemeData,
        payment: {
          amount: paymentData.amount,
          weight: paymentData.weight || '0.0',
          receiptNo: paymentData.receiptNo,
          updateTime: paymentData.updateTime,
          chqBank: paymentData.chqBank,
          chqBranch: paymentData.chqBranch,
          chq_CardNo: paymentData.chq_CardNo,
          installment: paymentData.installment,
        },
        customerInfo: {
          customerName: customerData?.pName || schemeData?.pName || 'Customer',
          mobile: customerData?.mobile || schemeData?.personalInfo?.mobile || 'N/A',
        },
        schemeInfo: {
          schemeName: schemeData?.schemeSummary?.schemeName?.trim() || 'Scheme Name',
          groupCode: schemeData?.groupCode || schemeData?.groupcode || 'N/A',
          regNo: schemeData?.regNo || schemeData?.regno || 'N/A',
        },
      };

      await PaymentReceiptPDF.generatePDF(responseData);
    } catch (error) {
      console.error('Error generating receipt:', error);
      Alert.alert('Error', 'Failed to generate receipt. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <View style={styles.container}>
      <PremiumBackground />
      <SafeAreaView style={styles.safeArea} edges={[]}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <CommonHeader
          title="Payment Receipt"
          transparent
          borderBottom={false}
          shadow={false}
          showBack
          leftIconColor={COLORS.white}
          backIconName="arrow-back"
          backIconColor={COLORS.contentBrand}
          backgroundColor="#FFFFFF"
          textColor="#000000"
          centerTitle
          rightComponent={
            <TouchableOpacity onPress={handleDownloadReceipt} style={styles.actionButton} disabled={isGeneratingPDF}>
              {isGeneratingPDF ? (
                <ActivityIndicator size="small" color={COLORS.contentBrand} />
              ) : (
                <MaterialIcons name="download" size={24} color={COLORS.contentBrand} />
              )}
            </TouchableOpacity>
          }
        />
        <ScrollView contentContainerStyle={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* A4 Paper Container */}
          <View style={styles.receiptContainer}>
            {/* Company Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <Image source={require('../../../assets/icon.png')} style={styles.logo} resizeMode="contain" />
                <View style={styles.companyInfo}>
                  <Text style={styles.companyName}>{companyData?.COMPANYNAME || 'Jaiguru Jewellers'}</Text>
                </View>
              </View>
            </View>

            {/* Contact Information */}
            <View style={styles.contactSection}>
              <Text style={styles.contactText}>📞 {companyData?.PHONE || '+91-95143 33601, +91-95143 33609'}</Text>
              <Text style={styles.contactText}>✉ {companyData?.EMAIL || 'Contact@jaigurujewellers.in'}</Text>
              <Text style={styles.contactText}>
                📍{' '}
                {[companyData?.ADDRESS1, companyData?.ADDRESS2, companyData?.ADDRESS3].filter(Boolean).join(', ') ||
                  '160, Melamasi St, Madurai-625001'}
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Receipt Title */}
            <Text style={styles.receiptTitle}>PAYMENT RECEIPT</Text>

            {/* Scheme and Transaction Info */}
            <View style={styles.infoSection}>
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Scheme Name</Text>
                  <Text style={styles.infoValue}>{schemeData?.schemeSummary?.schemeName?.trim() || 'Scheme Name'}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Transaction Date</Text>
                  <Text style={styles.infoValue}>{formatDate(paymentData.updateTime)}</Text>
                </View>
              </View>
            </View>

            {/* Receipt To Section */}
            <View style={styles.receiptToSection}>
              <Text style={styles.sectionTitle}>RECEIPT TO:</Text>
              <View style={styles.customerBox}>
                <View style={styles.customerRow}>
                  <View style={styles.customerItem}>
                    <Text style={styles.customerLabel}>Name:</Text>
                    <Text style={styles.customerValue}>{customerData?.pName || schemeData?.pName || 'Customer'}</Text>
                  </View>
                  <View style={styles.customerItem}>
                    <Text style={styles.customerLabel}>Receipt No:</Text>
                    <Text style={styles.customerValue}>{paymentData.receiptNo || 'N/A'}</Text>
                  </View>
                </View>
                <View style={styles.customerRow}>
                  <View style={styles.customerItem}>
                    <Text style={styles.customerLabel}>Mobile:</Text>
                    <Text style={styles.customerValue}>{customerData?.mobile || schemeData?.personalInfo?.mobile || 'N/A'}</Text>
                  </View>
                  <View style={styles.customerItem}>
                    <Text style={styles.customerLabel}>Group Code-Reg No:</Text>
                    <Text style={styles.customerValue}>
                      {schemeData?.groupCode || schemeData?.groupcode || 'N/A'}-{schemeData?.regNo || schemeData?.regno || 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Payment Table */}
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader}>
                <Text style={[styles.th, { flex: 0.5 }]}>S.No</Text>
                <Text style={[styles.th, { flex: 1.8 }]}>Group Code Reg-No</Text>
                <Text style={[styles.th, { flex: 1 }]}>Installment</Text>
                {paymentData.weight && parseFloat(paymentData.weight) > 0 && <Text style={[styles.th, { flex: 1 }]}>Weight</Text>}
                <Text style={[styles.th, { flex: 1.2 }]}>Amount</Text>
              </View>

              <View style={styles.tableRow}>
                <Text style={[styles.td, { flex: 0.5 }]}>1</Text>
                <Text style={[styles.td, { flex: 1.8 }]}>
                  {schemeData?.groupCode || schemeData?.groupcode || 'N/A'}-{schemeData?.regNo || schemeData?.regno || 'N/A'}
                </Text>
                <Text style={[styles.td, { flex: 1 }]}>{paymentData.installment || '1'}</Text>
                {paymentData.weight && parseFloat(paymentData.weight) > 0 && (
                  <Text style={[styles.td, { flex: 1 }]}>{parseFloat(paymentData.weight).toFixed(3)}</Text>
                )}
                <Text style={[styles.td, { flex: 1.2 }]}>{formatCurrency(paymentData.amount)}</Text>
              </View>
            </View>

            {/* Total Amount */}
            <View style={styles.totalSection}>
              <Text style={styles.totalLabel}>Total Amount Paid:</Text>
              <Text style={styles.totalAmount}>{formatCurrency(paymentData.amount)}</Text>
            </View>

            {/* Payment Mode Details (if available) */}
            {(paymentData.chqBank || paymentData.chq_CardNo) && (
              <View style={styles.paymentModeSection}>
                <Text style={styles.paymentModeTitle}>Payment Details:</Text>
                {paymentData.chqBank && paymentData.chqBank !== 'N/A' && (
                  <View style={styles.paymentModeRow}>
                    <Text style={styles.paymentModeLabel}>Mode:</Text>
                    <Text style={styles.paymentModeValue}>{paymentData.chqBank}</Text>
                  </View>
                )}
                {paymentData.chqBranch && paymentData.chqBranch !== 'N/A' && (
                  <View style={styles.paymentModeRow}>
                    <Text style={styles.paymentModeLabel}>Branch:</Text>
                    <Text style={styles.paymentModeValue}>{paymentData.chqBranch}</Text>
                  </View>
                )}
                {paymentData.chq_CardNo && paymentData.chq_CardNo !== 'N/A' && (
                  <View style={styles.paymentModeRow}>
                    <Text style={styles.paymentModeLabel}>Ref No:</Text>
                    <Text style={styles.paymentModeValue}>{paymentData.chq_CardNo}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Thank you for being our valued customer</Text>
              <Text style={styles.footerSubText}>This is a computer generated receipt</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(20),
  },
  errorText: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#FF0000',
    marginBottom: moderateScale(20),
  },
  goBackButton: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateScale(12),
    borderRadius: moderateScale(8),
  },
  goBackButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollView: {
    padding: moderateScale(16),
    paddingBottom: moderateScale(32),
  },
  receiptContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(8),
    padding: moderateScale(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    minHeight: moderateScale(800),
  },
  header: {
    marginBottom: moderateScale(16),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: moderateScale(60),
    height: moderateScale(60),
    marginRight: moderateScale(12),
    borderRadius: moderateScale(30),
  },
  logoPlaceholder: {
    width: moderateScale(60),
    height: moderateScale(60),
    borderRadius: moderateScale(30),
    backgroundColor: COLORS.brand,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(12),
  },
  logoPlaceholderText: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    color: COLORS.contentBrand,
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  contactSection: {
    backgroundColor: COLORS.accentTint,
    padding: moderateScale(12),
    borderRadius: moderateScale(6),
    marginBottom: moderateScale(16),
  },
  contactText: {
    color: '#333',
    fontSize: moderateScale(11),
    lineHeight: moderateScale(18),
    marginBottom: moderateScale(2),
  },
  divider: {
    height: 2,
    backgroundColor: COLORS.brand,
    marginVertical: moderateScale(16),
  },
  receiptTitle: {
    fontSize: moderateScale(20),
    fontWeight: 'bold',
    color: COLORS.contentBrand,
    textAlign: 'center',
    marginBottom: moderateScale(20),
    letterSpacing: 1,
  },
  infoSection: {
    backgroundColor: '#F8F9FA',
    padding: moderateScale(14),
    borderRadius: moderateScale(6),
    marginBottom: moderateScale(16),
    borderLeftWidth: 4,
    borderLeftColor: COLORS.borderBrand,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: moderateScale(12),
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: moderateScale(11),
    color: '#666',
    marginBottom: moderateScale(4),
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: moderateScale(13),
    color: '#000',
    fontWeight: 'bold',
  },
  receiptToSection: {
    marginBottom: moderateScale(16),
  },
  sectionTitle: {
    fontSize: moderateScale(13),
    fontWeight: 'bold',
    color: COLORS.contentBrand,
    marginBottom: moderateScale(10),
    textTransform: 'uppercase',
  },
  customerBox: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: moderateScale(6),
    padding: moderateScale(12),
    backgroundColor: '#FAFAFA',
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: moderateScale(10),
    gap: moderateScale(12),
  },
  customerItem: {
    flex: 1,
  },
  customerLabel: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#555',
    marginBottom: moderateScale(4),
  },
  customerValue: {
    fontSize: moderateScale(12),
    color: '#000',
    fontWeight: '500',
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: moderateScale(6),
    overflow: 'hidden',
    marginBottom: moderateScale(16),
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.brand,
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(8),
  },
  th: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: moderateScale(11),
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: moderateScale(12),
    paddingHorizontal: moderateScale(8),
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  td: {
    textAlign: 'center',
    color: '#333',
    fontSize: moderateScale(12),
    fontWeight: '500',
  },
  totalSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: COLORS.accentTint,
    padding: moderateScale(14),
    borderRadius: moderateScale(6),
    marginBottom: moderateScale(20),
    borderWidth: 1,
    borderColor: COLORS.borderAccent,
  },
  totalLabel: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#333',
    marginRight: moderateScale(12),
  },
  totalAmount: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
    color: COLORS.contentBrand,
  },
  paymentModeSection: {
    backgroundColor: '#F8F9FA',
    padding: moderateScale(14),
    borderRadius: moderateScale(6),
    marginBottom: moderateScale(16),
  },
  paymentModeTitle: {
    fontSize: moderateScale(12),
    fontWeight: 'bold',
    color: COLORS.contentBrand,
    marginBottom: moderateScale(8),
  },
  paymentModeRow: {
    flexDirection: 'row',
    marginBottom: moderateScale(4),
  },
  paymentModeLabel: {
    fontSize: moderateScale(11),
    fontWeight: '600',
    color: '#666',
    width: moderateScale(70),
  },
  paymentModeValue: {
    fontSize: moderateScale(11),
    color: '#333',
    flex: 1,
  },
  footer: {
    marginTop: moderateScale(30),
    paddingTop: moderateScale(16),
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  footerText: {
    fontSize: moderateScale(12),
    color: '#555',
    fontWeight: '600',
    marginBottom: moderateScale(6),
  },
  footerSubText: {
    fontSize: moderateScale(10),
    color: COLORS.contentMuted,
    fontStyle: 'italic',
  },
  actionButton: {
    padding: moderateScale(8),
    backgroundColor: '#F0F0F0',
    borderRadius: moderateScale(20),
    width: moderateScale(40),
    height: moderateScale(40),
    justifyContent: 'center',
    alignItems: 'center',
  },
});
