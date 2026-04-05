import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useReports } from '@/hooks/use-reports';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { Report, ReportCategory } from '@/types/database';

interface ReportFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (report: Report) => void;
  classroomId?: string;
  roomName?: string;
}

const CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: 'incorrect_time', label: 'Incorrect Time' },
  { value: 'incorrect_info', label: 'Incorrect Info' },
  { value: 'app_bug', label: 'App Bug' },
  { value: 'other', label: 'Other' },
];

export function ReportFormModal({
  visible,
  onClose,
  onSuccess,
  classroomId,
  roomName,
}: ReportFormModalProps) {
  const { submitReport, isSubmitting } = useReports();
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const backgroundColor = useThemeColor({ light: '#ffffff', dark: '#1f2123' }, 'background');
  const overlayColor = useThemeColor(
    { light: 'rgba(0,0,0,0.4)', dark: 'rgba(0,0,0,0.6)' },
    'background'
  );
  const inputBgColor = useThemeColor(
    { light: 'rgba(0,0,0,0.05)', dark: 'rgba(255,255,255,0.08)' },
    'background'
  );
  const borderColor = useThemeColor(
    { light: 'rgba(0,0,0,0.12)', dark: 'rgba(255,255,255,0.12)' },
    'text'
  );

  const resetForm = () => {
    setCategory(null);
    setDescription('');
    setContactEmail('');
    setFormError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    setFormError(null);

    if (!category) {
      setFormError('Please select a category');
      return;
    }

    if (!description.trim()) {
      setFormError('Please enter a description');
      return;
    }

    if (contactEmail && !isValidEmail(contactEmail)) {
      setFormError('Please enter a valid email address');
      return;
    }

    try {
      const report = await submitReport({
        classroomId,
        reportType: category,
        description: description.trim(),
        contactEmail: contactEmail.trim() || undefined,
      });

      resetForm();
      onSuccess(report);
    } catch {
      setFormError('Failed to submit report. Please try again.');
    }
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={[styles.overlay, { backgroundColor: overlayColor }]} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <Pressable style={[styles.container, { backgroundColor }]} onPress={() => {}}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header */}
              <View style={styles.header}>
                <ThemedText type="subtitle">Report an Issue</ThemedText>
                <TouchableOpacity onPress={handleClose} hitSlop={10}>
                  <Ionicons name="close" size={24} color={iconColor} />
                </TouchableOpacity>
              </View>

              {/* Room Context */}
              {roomName && (
                <View style={[styles.roomContext, { backgroundColor: inputBgColor }]}>
                  <Ionicons name="location-outline" size={18} color={iconColor} />
                  <ThemedText style={[styles.roomContextText, { color: iconColor }]}>
                    Reporting for: {roomName}
                  </ThemedText>
                </View>
              )}

              {/* Category Selection */}
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.label}>
                  Category *
                </ThemedText>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.categoryButton,
                        { borderColor: category === cat.value ? tintColor : borderColor },
                        category === cat.value && { backgroundColor: tintColor },
                      ]}
                      onPress={() => setCategory(cat.value)}
                    >
                      <ThemedText
                        style={[
                          styles.categoryButtonText,
                          category === cat.value && styles.categoryButtonTextSelected,
                        ]}
                      >
                        {cat.label}
                      </ThemedText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Description */}
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.label}>
                  Description *
                </ThemedText>
                <TextInput
                  style={[
                    styles.textArea,
                    { backgroundColor: inputBgColor, color: textColor, borderColor },
                  ]}
                  placeholder="Describe the issue..."
                  placeholderTextColor={iconColor}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>

              {/* Contact Email */}
              <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.label}>
                  Contact Email (optional)
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: inputBgColor, color: textColor, borderColor },
                  ]}
                  placeholder="email@example.com"
                  placeholderTextColor={iconColor}
                  value={contactEmail}
                  onChangeText={setContactEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Error Message */}
              {formError && (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={18} color="#dc3545" />
                  <ThemedText style={styles.errorText}>{formError}</ThemedText>
                </View>
              )}

              {/* Buttons */}
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor }]}
                  onPress={handleClose}
                  disabled={isSubmitting}
                >
                  <ThemedText style={{ color: iconColor }}>Cancel</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: tintColor }]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={styles.submitButtonText}>Submit</ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    paddingBottom: 34,
    paddingHorizontal: 20,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  roomContext: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  roomContextText: {
    fontSize: 14,
  },
  section: {
    marginBottom: 20,
  },
  label: {
    marginBottom: 10,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: '#fff',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
