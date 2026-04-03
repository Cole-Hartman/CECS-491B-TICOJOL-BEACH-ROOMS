import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/providers/auth-provider';

interface ReportSuccessModalProps {
  visible: boolean;
  onClose: () => void;
  reportId: string;
}

export function ReportSuccessModal({ visible, onClose, reportId }: ReportSuccessModalProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();

  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const backgroundColor = useThemeColor({ light: '#ffffff', dark: '#1f2123' }, 'background');
  const overlayColor = useThemeColor(
    { light: 'rgba(0,0,0,0.4)', dark: 'rgba(0,0,0,0.6)' },
    'background'
  );
  const borderColor = useThemeColor(
    { light: 'rgba(0,0,0,0.12)', dark: 'rgba(255,255,255,0.12)' },
    'text'
  );

  const handleViewReports = () => {
    onClose();
    router.push('/my-reports' as '/login');
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={[styles.overlay, { backgroundColor: overlayColor }]} onPress={onClose}>
        <Pressable style={[styles.container, { backgroundColor }]} onPress={() => {}}>
          {/* Success Icon */}
          <View style={[styles.iconContainer, { backgroundColor: '#28a745' }]}>
            <Ionicons name="checkmark" size={40} color="#fff" />
          </View>

          {/* Title */}
          <ThemedText type="subtitle" style={styles.title}>
            Report Submitted
          </ThemedText>

          {/* Message */}
          <ThemedText style={[styles.message, { color: iconColor }]}>
            Thank you for helping us improve BeachRooms. We&apos;ll review your report and take action if needed.
          </ThemedText>

          {/* Report ID */}
          <View style={[styles.reportIdContainer, { borderColor }]}>
            <ThemedText style={[styles.reportIdLabel, { color: iconColor }]}>
              Report ID
            </ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.reportId}>
              {reportId.substring(0, 8)}...
            </ThemedText>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {isLoggedIn && (
              <TouchableOpacity
                style={[styles.viewReportsButton, { borderColor: tintColor }]}
                onPress={handleViewReports}
              >
                <ThemedText style={{ color: tintColor }}>View My Reports</ThemedText>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: tintColor }]}
              onPress={onClose}
            >
              <ThemedText style={styles.doneButtonText}>Done</ThemedText>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  reportIdContainer: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  reportIdLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  reportId: {
    fontSize: 16,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  viewReportsButton: {
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  doneButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
