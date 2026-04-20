import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ReportFormModal } from '@/components/report-form-modal';
import { ReportSuccessModal } from '@/components/report-success-modal';
import { RoomScheduleBar } from '@/components/room-schedule-bar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFavorites } from '@/hooks/use-favorites';
import { useThemeColor } from '@/hooks/use-theme-color';
import { calculateAvailability, findNextUsableWindow, getStatusColor, getStatusLabel, isBuildingOpen } from '@/lib/availability';
import { useRoomDetail } from '@/providers/room-detail-provider';
import type { Report } from '@/types/database';

function formatHMMSS(totalSeconds: number): string {
  const clampedSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(clampedSeconds / 3600);
  const minutes = Math.floor((clampedSeconds % 3600) / 60);
  const seconds = clampedSeconds % 60;
  return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default function RoomDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selectedRoom, setSelectedRoom } = useRoomDetail();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');

  const [isSaving, setIsSaving] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [submittedReportId, setSubmittedReportId] = useState<string>('');
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!selectedRoom) return;
    const id = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(id);
  }, [selectedRoom]);

  const handleReportSuccess = (report: Report) => {
    setReportModalVisible(false);
    setSubmittedReportId(report.id);
    setSuccessModalVisible(true);
  };

  const handleClose = () => {
    setSelectedRoom(null);
    router.back();
  };

  const liveAvailability = useMemo(() => {
    if (!selectedRoom) return null;
    return calculateAvailability(selectedRoom.classroom, selectedRoom.todaySchedules, now);
  }, [selectedRoom, now]);

  if (!selectedRoom || !liveAvailability) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerContent}>
          <ThemedText>No room selected</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const { classroom, todaySchedules } = selectedRoom;

  const status = liveAvailability.status;
  const statusText = liveAvailability.statusText;
  const { building } = classroom;
  const roomName = `${building.code} ${classroom.room_number}`;
  const floorText = classroom.floor ? `Floor ${classroom.floor}` : null;
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);

  const isCurrentlyFavorite = isFavorite(classroom.id);

  const countdownTarget =
    status === 'open'
      ? liveAvailability.nextClassStartsAt
      : status === 'in_use'
        ? liveAvailability.currentClassEndsAt
        : status === 'limited'
          ? liveAvailability.nextClassStartsAt
        : null;

  const countdownSeconds =
    countdownTarget !== null ? Math.max(0, Math.floor((countdownTarget.getTime() - now.getTime()) / 1000)) : null;

  const handleToggleFavorite = async () => {
    setIsSaving(true);
    try {
      if (isCurrentlyFavorite) {
        await removeFavorite(classroom.id);
      } else {
        await addFavorite(classroom.id);
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={tintColor} />
        </TouchableOpacity>
        <ThemedText type="subtitle" style={styles.headerTitle}>
          Room Details
        </ThemedText>
        <TouchableOpacity
          onPress={() => setReportModalVisible(true)}
          style={styles.reportButton}
          hitSlop={10}
        >
          <Ionicons name="flag-outline" size={22} color={iconColor} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Room Info Section */}
        <View style={styles.roomInfoSection}>
          <ThemedText type="title" style={styles.roomName}>
            {roomName}
          </ThemedText>
          <ThemedText style={[styles.buildingName, { color: iconColor }]}>
            {building.name}
          </ThemedText>
          {floorText && (
            <ThemedText style={[styles.floorText, { color: iconColor }]}>
              {floorText}
            </ThemedText>
          )}
        </View>

        {/* Status Section */}
        <View style={styles.statusSection}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <ThemedText style={styles.statusBadgeText}>{statusLabel}</ThemedText>
          </View>
          <ThemedText style={[styles.statusText, { color: iconColor }]}>
            {statusText}
          </ThemedText>
          {countdownSeconds !== null && countdownTarget !== null && (
            <ThemedText style={[styles.countdownText, { color: iconColor }]}>
              {status === 'open' || status === 'limited' ? 'Next class in ' : 'Free in '}
              {formatHMMSS(countdownSeconds)}
            </ThemedText>
          )}
        </View>

        {/* Today's Schedule */}
        <View style={styles.scheduleSection}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Today&apos;s Schedule
          </ThemedText>
          <RoomScheduleBar schedules={todaySchedules} />
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: '#e3f5e9' }]} />
              <ThemedText style={[styles.legendLabel, { color: iconColor }]}>Open</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: '#fbdee2' }]} />
              <ThemedText style={[styles.legendLabel, { color: iconColor }]}>Class</ThemedText>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, { borderColor: '#78716c', borderWidth: 2 }]} />
              <ThemedText style={[styles.legendLabel, { color: iconColor }]}>Now</ThemedText>
            </View>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Favorite Button - Fixed at bottom */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 16, backgroundColor }]}>
        <TouchableOpacity
          style={[
            styles.favoriteButton,
            isCurrentlyFavorite
              ? { backgroundColor: tintColor }
              : { borderColor: tintColor, borderWidth: 2 },
          ]}
          onPress={handleToggleFavorite}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={isCurrentlyFavorite ? '#fff' : tintColor} />
          ) : (
            <>
              <Ionicons
                name={isCurrentlyFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={isCurrentlyFavorite ? '#fff' : tintColor}
              />
              <ThemedText
                style={[
                  styles.favoriteButtonText,
                  { color: isCurrentlyFavorite ? '#fff' : tintColor },
                ]}
              >
                {isCurrentlyFavorite ? 'Saved' : 'Save Room'}
              </ThemedText>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Report Modals */}
      <ReportFormModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        onSuccess={handleReportSuccess}
        classroomId={classroom.id}
        roomName={roomName}
      />

      <ReportSuccessModal
        visible={successModalVisible}
        onClose={() => setSuccessModalVisible(false)}
        reportId={submittedReportId}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  reportButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  roomInfoSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  roomName: {
    fontSize: 32,
    marginBottom: 4,
  },
  buildingName: {
    fontSize: 18,
    marginBottom: 2,
  },
  floorText: {
    fontSize: 16,
  },
  statusSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  statusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  statusText: {
    fontSize: 16,
    textAlign: 'center',
  },
  countdownText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 6,
    fontVariant: ['tabular-nums'],
  },
  scheduleSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendSwatch: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 13,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  favoriteButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
