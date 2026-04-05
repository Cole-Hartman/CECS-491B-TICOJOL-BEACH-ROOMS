import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, TouchableOpacity, useColorScheme, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { roundToNearestFiveMinutes } from '@/lib/time-utils';

interface TimePickerModalProps {
  visible: boolean;
  initialTime: Date;
  onConfirm: (time: Date) => void;
  onCancel: () => void;
  onReset: () => void;
}

export function TimePickerModal({
  visible,
  initialTime,
  onConfirm,
  onCancel,
  onReset,
}: TimePickerModalProps) {
  const [tempTime, setTempTime] = useState(initialTime);
  const colorScheme = useColorScheme();
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const backgroundColor = useThemeColor({ light: '#ffffff', dark: '#1f2123' }, 'background');
  const overlayColor = useThemeColor(
    { light: 'rgba(0,0,0,0.4)', dark: 'rgba(0,0,0,0.6)' },
    'background'
  );

  const handleChange = (_event: unknown, selectedDate?: Date) => {
    if (selectedDate) {
      setTempTime(selectedDate);
    }
  };

  const handleConfirm = () => {
    onConfirm(roundToNearestFiveMinutes(tempTime));
  };

  const handleReset = () => {
    setTempTime(new Date());
    onReset();
  };

  // Reset temp time when modal opens
  const handleShow = () => {
    setTempTime(initialTime);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
      onShow={handleShow}
    >
      <Pressable style={[styles.overlay, { backgroundColor: overlayColor }]} onPress={onCancel}>
        <Pressable style={[styles.container, { backgroundColor }]} onPress={() => {}}>
          <View style={styles.header}>
            <ThemedText type="subtitle">Select Time</ThemedText>
            <TouchableOpacity onPress={onCancel} hitSlop={10}>
              <Ionicons name="close" size={24} color={iconColor} />
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
            <DateTimePicker
              value={tempTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleChange}
              minuteInterval={5}
              style={styles.picker}
              themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
            />
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Ionicons name="refresh-outline" size={18} color={iconColor} />
              <ThemedText style={[styles.resetButtonText, { color: iconColor }]}>
                Reset to Now
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: tintColor }]}
              onPress={handleConfirm}
            >
              <ThemedText style={styles.applyButtonText}>Apply</ThemedText>
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
    marginBottom: 8,
  },
  pickerContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  picker: {
    width: '100%',
    height: 180,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
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
