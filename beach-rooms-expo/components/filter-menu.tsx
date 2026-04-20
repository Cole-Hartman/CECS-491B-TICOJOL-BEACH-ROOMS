import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Switch, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { formatTimeDisplay } from '@/lib/time-utils';

interface FilterState {
  selectedTime: Date | null;
  sortByDistance: boolean;
  minDuration: number | null; // in minutes: 30, 60, 120, 240, or null for any
}

const DURATION_OPTIONS = [
  { label: 'Any', value: null },
  { label: '30m', value: 30 },
  { label: '1h', value: 60 },
  { label: '2h', value: 120 },
  { label: '4h', value: 240 },
];

interface FilterMenuProps {
  visible: boolean;
  onClose: () => void;
  matchingRoomCount: number;
  filterState: FilterState;
  onApply: (newState: FilterState) => void;
  onOpenTimePicker: () => void;
  locationEnabled: boolean;
  onRequestLocation: () => void;
}

export function FilterMenu({
  visible,
  onClose,
  matchingRoomCount,
  filterState,
  onApply,
  onOpenTimePicker,
  locationEnabled,
  onRequestLocation,
}: FilterMenuProps) {
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({ light: '#ffffff', dark: '#1f2123' }, 'background');
  const overlayColor = useThemeColor(
    { light: 'rgba(0,0,0,0.4)', dark: 'rgba(0,0,0,0.6)' },
    'background'
  );
  const dividerColor = useThemeColor(
    { light: 'rgba(0,0,0,0.1)', dark: 'rgba(255,255,255,0.1)' },
    'text'
  );
  const secondaryBg = useThemeColor(
    { light: '#f5f5f5', dark: '#2a2b2d' },
    'background'
  );
  const dangerTextColor = useThemeColor({ light: '#dc3545', dark: '#ff6b6b' }, 'text');

  const { selectedTime, sortByDistance, minDuration } = filterState;
  const hasTimeFilter = selectedTime !== null;
  const hasDurationFilter = minDuration !== null;

  const handleToggleDistance = () => {
    if (!locationEnabled) {
      onRequestLocation();
      return;
    }
    onApply({ ...filterState, sortByDistance: !sortByDistance });
  };

  const handleClearTime = () => {
    onApply({ ...filterState, selectedTime: null });
  };

  const handleSelectDuration = (duration: number | null) => {
    onApply({ ...filterState, minDuration: duration });
  };

  const handleResetAll = () => {
    onApply({ selectedTime: null, sortByDistance: true, minDuration: null });
  };

  const hasActiveFilters = hasTimeFilter || !sortByDistance || hasDurationFilter;
  const countLabel =
    matchingRoomCount === 0
      ? 'No rooms match'
      : matchingRoomCount === 1
        ? '1 room matches'
        : `${matchingRoomCount} rooms match`;
  const isZero = matchingRoomCount === 0;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={[styles.overlay, { backgroundColor: overlayColor }]} onPress={onClose}>
        <Pressable style={[styles.container, { backgroundColor }]} onPress={() => {}}>
          {/* Header */}
          <View style={styles.header}>
            <ThemedText type="subtitle">Filters</ThemedText>
            <TouchableOpacity onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={iconColor} />
            </TouchableOpacity>
          </View>

          <ThemedText style={[styles.matchCountText, { color: isZero ? dangerTextColor : iconColor }]}>
            {countLabel}
          </ThemedText>

          {/* Start Time Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time-outline" size={20} color={iconColor} />
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                Start Time
              </ThemedText>
            </View>
            <TouchableOpacity
              style={[styles.timeRow, { backgroundColor: secondaryBg }]}
              onPress={onOpenTimePicker}
              activeOpacity={0.7}
            >
              <View style={styles.timeDisplay}>
                <ThemedText
                  style={[
                    styles.timeText,
                    { color: hasTimeFilter ? tintColor : textColor },
                  ]}
                >
                  {hasTimeFilter ? formatTimeDisplay(selectedTime) : 'Now'}
                </ThemedText>
                {hasTimeFilter && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      handleClearTime();
                    }}
                    hitSlop={8}
                    style={styles.clearTimeButton}
                  >
                    <Ionicons name="close-circle" size={20} color={tintColor} />
                  </TouchableOpacity>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={iconColor} />
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* Minimum Duration Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="hourglass-outline" size={20} color={iconColor} />
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                Minimum Duration
              </ThemedText>
            </View>
            <View style={styles.durationChipsContainer}>
              {DURATION_OPTIONS.map((option) => {
                const isSelected = minDuration === option.value;
                return (
                  <TouchableOpacity
                    key={option.label}
                    style={[
                      styles.durationChip,
                      { borderColor: isSelected ? tintColor : dividerColor },
                      isSelected && { backgroundColor: `${tintColor}20` },
                    ]}
                    onPress={() => handleSelectDuration(option.value)}
                    activeOpacity={0.7}
                  >
                    <ThemedText
                      style={[
                        styles.durationChipText,
                        { color: isSelected ? tintColor : textColor },
                      ]}
                    >
                      {option.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* Sort by Distance Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location-outline" size={20} color={iconColor} />
              <ThemedText style={[styles.sectionTitle, { color: textColor }]}>
                Sort by Distance
              </ThemedText>
            </View>
            <View style={[styles.distanceRow, { backgroundColor: secondaryBg }]}>
              <View style={styles.distanceTextContainer}>
                <ThemedText style={[styles.distanceText, { color: textColor }]}>
                  Show closest rooms first
                </ThemedText>
                {!locationEnabled && (
                  <ThemedText style={[styles.distanceSubtext, { color: iconColor }]}>
                    Requires location access
                  </ThemedText>
                )}
              </View>
              <Switch
                value={locationEnabled && sortByDistance}
                onValueChange={handleToggleDistance}
                trackColor={{ false: dividerColor, true: tintColor }}
                thumbColor="#ffffff"
                ios_backgroundColor={dividerColor}
              />
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* Footer Buttons */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetAll}
              disabled={!hasActiveFilters}
            >
              <Ionicons
                name="refresh-outline"
                size={18}
                color={hasActiveFilters ? iconColor : dividerColor}
              />
              <ThemedText
                style={[
                  styles.resetButtonText,
                  { color: hasActiveFilters ? iconColor : dividerColor },
                ]}
              >
                Reset All
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: tintColor }]}
              onPress={onClose}
            >
              <ThemedText style={styles.applyButtonText}>Done</ThemedText>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 34,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  section: {
    marginVertical: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
  },
  clearTimeButton: {
    marginLeft: 4,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  durationChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  durationChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  distanceTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  distanceText: {
    fontSize: 15,
  },
  distanceSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
  matchCountText: {
    marginTop: -12,
    marginBottom: 12,
    fontSize: 14,
    fontWeight: '600',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: '500',
  },
  applyButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
