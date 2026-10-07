import { Text } from '../../Components/Typography/FontText';
// Src/Screens/MemberCreation/CalendarPicker.tsx
import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Modal, StyleSheet, ScrollView } from 'react-native';
import theme from '../../Utills/AppTheme';

const { COLORS, SIZES, FONTS, ELEVATION } = theme;

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface CalendarPickerProps {
  visible: boolean;
  title?: string;
  value?: string; // 'YYYY-MM-DD'
  maxDate?: Date;
  minDate?: Date;
  onConfirm: (date: string) => void;
  onCancel: () => void;
}

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
const stripTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const CalendarPicker: React.FC<CalendarPickerProps> = ({
  visible,
  title = 'Select Date',
  value,
  maxDate,
  minDate,
  onConfirm,
  onCancel,
}) => {
  const today = new Date();

  const resolveInitial = () => {
    if (value) {
      const [y, m, d] = value.split('-').map(Number);
      return { year: y, month: m - 1, day: d };
    }
    const ref = maxDate && stripTime(maxDate) < stripTime(today) ? maxDate : today;
    return { year: ref.getFullYear(), month: ref.getMonth(), day: ref.getDate() };
  };

  const initial = resolveInitial();
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);
  const [selectedDay, setSelectedDay] = useState(initial.day);
  const [selectedMonth, setSelectedMonth] = useState(initial.month);
  const [selectedYear, setSelectedYear] = useState(initial.year);
  // 'calendar' -> day grid, 'year' -> year list step, 'month' -> month grid step
  const [step, setStep] = useState<'calendar' | 'year' | 'month'>('calendar');
  const yearScrollRef = useRef<ScrollView>(null);

  // Resync whenever the modal is (re)opened so stale selections from a
  // previous open don't stick around.
  useEffect(() => {
    if (visible) {
      const next = resolveInitial();
      setViewYear(next.year);
      setViewMonth(next.month);
      setSelectedDay(next.day);
      setSelectedMonth(next.month);
      setSelectedYear(next.year);
      setStep('calendar');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, value]);

  const currentYear = today.getFullYear();
  const yearList = Array.from({ length: 100 }, (_, i) => currentYear - i);

  const isDisabled = (day: number) => {
    const d = new Date(viewYear, viewMonth, day);
    if (maxDate && d > stripTime(maxDate)) return true;
    if (minDate && d < stripTime(minDate)) return true;
    return false;
  };

  const isSelected = (day: number) =>
    day === selectedDay && viewMonth === selectedMonth && viewYear === selectedYear;

  const isToday = (day: number) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const handleDayPress = (day: number) => {
    if (isDisabled(day)) return;
    setSelectedDay(day);
    setSelectedMonth(viewMonth);
    setSelectedYear(viewYear);
  };

  // Prevent paging into a month that is entirely out of range.
  const canGoPrev = !minDate || new Date(viewYear, viewMonth, 0) >= stripTime(minDate);
  const canGoNext = !maxDate || new Date(viewYear, viewMonth + 1, 1) <= stripTime(maxDate);

  const prevMonth = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const handleConfirm = () => {
    const mm = (selectedMonth + 1).toString().padStart(2, '0');
    const dd = selectedDay.toString().padStart(2, '0');
    onConfirm(`${selectedYear}-${mm}-${dd}`);
  };

  const openYearStep = () => {
    setStep('year');
    const idx = yearList.indexOf(viewYear);
    requestAnimationFrame(() => {
      yearScrollRef.current?.scrollTo({ y: Math.max(idx - 3, 0) * 40, animated: false });
    });
  };

  const handleYearPress = (y: number) => {
    setViewYear(y);
    setStep('month'); // year chosen -> move to month step
  };

  const handleMonthPress = (idx: number) => {
    setViewMonth(idx);
    setStep('calendar'); // month chosen -> move to day calendar
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Month/Year Navigation */}
          <View style={styles.navRow}>
            <TouchableOpacity onPress={prevMonth} style={styles.navBtn} disabled={!canGoPrev}>
              <Text style={[styles.navArrow, !canGoPrev && styles.navArrowDisabled]}>‹</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={openYearStep} style={styles.monthYearBtn}>
              <Text style={styles.monthYearText}>
                {MONTHS[viewMonth]} {viewYear} {step === 'calendar' ? '▾' : '▴'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={nextMonth} style={styles.navBtn} disabled={!canGoNext}>
              <Text style={[styles.navArrow, !canGoNext && styles.navArrowDisabled]}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Step 1: Year list */}
          {step === 'year' && (
            <View style={styles.pickerPanel}>
              <Text style={styles.stepLabel}>Select Year</Text>
              <ScrollView
                ref={yearScrollRef}
                style={styles.yearDropdown}
                nestedScrollEnabled
                showsVerticalScrollIndicator
              >
                {yearList.map(y => (
                  <TouchableOpacity
                    key={y}
                    style={[styles.yearItem, y === viewYear && styles.yearItemActive]}
                    onPress={() => handleYearPress(y)}
                  >
                    <Text style={[styles.yearItemText, y === viewYear && styles.yearItemTextActive]}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Step 2: Month grid (shown after a year is picked) */}
          {step === 'month' && (
            <View style={styles.pickerPanel}>
              <Text style={styles.stepLabel}>Select Month — {viewYear}</Text>
              <View style={styles.monthGrid}>
                {MONTHS.map((m, idx) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.monthItem, idx === viewMonth && styles.monthItemActive]}
                    onPress={() => handleMonthPress(idx)}
                  >
                    <Text style={[styles.monthItemText, idx === viewMonth && styles.monthItemTextActive]}>
                      {m.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.backBtn} onPress={() => setStep('year')}>
                <Text style={styles.backBtnText}>‹ Back to year</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3: Day calendar */}
          {step === 'calendar' && (
            <>
              {/* Day Headers */}
              <View style={styles.weekRow}>
                {DAYS_OF_WEEK.map(d => (
                  <Text key={d} style={styles.weekDay}>{d}</Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.grid}>
                {cells.map((day, i) => {
                  const disabled = day !== null && isDisabled(day);
                  return (
                    <TouchableOpacity
                      key={i}
                      style={[
                        styles.cell,
                        day !== null && isSelected(day) && styles.cellSelected,
                        day !== null && isToday(day) && !isSelected(day) && styles.cellToday,
                      ]}
                      onPress={() => day !== null && handleDayPress(day)}
                      disabled={day === null || disabled}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.cellText,
                        day !== null && isSelected(day) && styles.cellTextSelected,
                        day !== null && isToday(day) && !isSelected(day) && styles.cellTextToday,
                        disabled && styles.cellTextDisabled,
                      ]}>
                        {day ?? ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Selected Date Preview */}
              <Text style={styles.preview}>
                Selected: {selectedDay.toString().padStart(2, '0')}/{(selectedMonth + 1).toString().padStart(2, '0')}/{selectedYear}
              </Text>

              {/* Buttons */}
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                  <Text style={styles.confirmBtnText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: SIZES.radius.card,
    padding: SIZES.space.lg,
    width: '92%',
    ...ELEVATION.floating,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.space.md,
  },
  title: {
    ...FONTS.heading,
    color: COLORS.contentBrand,
  },
  closeBtn: {
    fontSize: SIZES.text.xl,
    color: COLORS.contentSecondary,
    padding: SIZES.space.xs,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SIZES.space.sm,
  },
  navBtn: {
    padding: SIZES.space.sm,
  },
  navArrow: {
    fontSize: 24,
    color: COLORS.contentBrand,
    fontWeight: '600',
  },
  navArrowDisabled: {
    color: COLORS.contentMuted,
    opacity: 0.4,
  },
  monthYearBtn: {
    paddingHorizontal: SIZES.space.sm,
    paddingVertical: SIZES.space.xs,
  },
  monthYearText: {
    ...FONTS.bodyEmphasis,
    color: COLORS.contentBrand,
    fontSize: 16,
  },
  pickerPanel: {
    marginBottom: SIZES.space.sm,
  },
  stepLabel: {
    ...FONTS.bodyEmphasis,
    color: COLORS.contentSecondary,
    textAlign: 'center',
    marginBottom: SIZES.space.sm,
  },
  backBtn: {
    paddingVertical: SIZES.space.sm,
    alignItems: 'center',
  },
  backBtnText: {
    ...FONTS.body,
    color: COLORS.contentBrand,
    fontWeight: '600',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SIZES.space.sm,
  },
  monthItem: {
    width: '25%',
    paddingVertical: SIZES.space.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.radius.field,
  },
  monthItemActive: {
    backgroundColor: COLORS.brand,
  },
  monthItemText: {
    ...FONTS.body,
    color: COLORS.contentPrimary,
    fontSize: 13,
  },
  monthItemTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  yearDropdown: {
    maxHeight: 160,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radius.field,
    backgroundColor: COLORS.surface,
    marginBottom: SIZES.space.sm,
  },
  doneBtn: {
    paddingVertical: SIZES.space.sm,
    borderRadius: SIZES.radius.field,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
  },
  doneBtnText: {
    ...FONTS.body,
    color: COLORS.contentOnBrand,
    fontWeight: '600',
  },
  yearItem: {
    paddingVertical: SIZES.space.sm,
    paddingHorizontal: SIZES.space.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSubtle,
  },
  yearItemActive: {
    backgroundColor: COLORS.brandAlpha16,
  },
  yearItemText: {
    ...FONTS.body,
    color: COLORS.contentPrimary,
    textAlign: 'center',
  },
  yearItemTextActive: {
    color: COLORS.contentBrand,
    fontWeight: '700',
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: SIZES.space.xs,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    ...FONTS.caption,
    color: COLORS.contentSecondary,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
  },
  cellSelected: {
    backgroundColor: COLORS.brand,
  },
  cellToday: {
    borderWidth: 1.5,
    borderColor: COLORS.brand,
  },
  cellText: {
    ...FONTS.body,
    color: COLORS.contentPrimary,
    fontSize: 13,
  },
  cellTextSelected: {
    color: COLORS.white,
    fontWeight: '700',
  },
  cellTextToday: {
    color: COLORS.contentBrand,
    fontWeight: '700',
  },
  cellTextDisabled: {
    color: COLORS.contentMuted,
    opacity: 0.4,
  },
  preview: {
    ...FONTS.body,
    color: COLORS.contentBrand,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: SIZES.space.sm,
    marginBottom: SIZES.space.md,
  },
  btnRow: {
    flexDirection: 'row',
    gap: SIZES.space.md,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: SIZES.space.sm,
    borderRadius: SIZES.radius.field,
    backgroundColor: COLORS.border,
    alignItems: 'center',
  },
  cancelBtnText: {
    ...FONTS.body,
    color: COLORS.contentPrimary,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: SIZES.space.sm,
    borderRadius: SIZES.radius.field,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
  },
  confirmBtnText: {
    ...FONTS.body,
    color: COLORS.contentOnBrand,
    fontWeight: '600',
  },
});

export default CalendarPicker;