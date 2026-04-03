import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useFavorites } from '@/hooks/use-favorites';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getStatusColor, getStatusLabel } from '@/lib/availability';
import { formatDistance } from '@/lib/distance';
import { useRoomDetail } from '@/providers/room-detail-provider';

const AMENITY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  projector: 'videocam-outline',
  whiteboard: 'easel-outline',
  outlets: 'flash-outline',
  computer: 'desktop-outline',
  smartboard: 'tv-outline',
  microphone: 'mic-outline',
};

const AMENITY_LABELS: Record<string, string> = {
  projector: 'Projector',
  whiteboard: 'Whiteboard',
  outlets: 'Power Outlets',
  computer: 'Computers',
  smartboard: 'Smart Board',
  microphone: 'Microphone',
};

export default function RoomDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selectedRoom, setSelectedRoom } = useRoomDetail();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();

  const iconColor = useThemeColor({}, 'icon');
  const tintColor = useThemeColor({}, 'tint');
  const backgroundColor = useThemeColor({}, 'background');

  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    setSelectedRoom(null);
    router.back();
  };

  if (!selectedRoom) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.centerContent}>
          <ThemedText>No room selected</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const { classroom, status, statusText, distanceMiles } = selectedRoom;
  const { building } = classroom;
  const roomName = `${building.code} ${classroom.room_number}`;
  const floorText = classroom.floor ? `Floor ${classroom.floor}` : null;
  const distanceText = distanceMiles !== null ? formatDistance(distanceMiles) : null;
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);

  const isCurrentlyFavorite = isFavorite(classroom.id);

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
        <View style={styles.headerSpacer} />
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
        </View>

        {/* Details Section */}
        <View style={styles.detailsSection}>
          <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
            Details
          </ThemedText>
          <View style={[styles.detailsCard, { backgroundColor: 'rgba(128, 128, 128, 0.1)' }]}>
            {/* Capacity */}
            <View style={styles.detailRow}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="people-outline" size={20} color={iconColor} />
              </View>
              <ThemedText style={styles.detailLabel}>Capacity</ThemedText>
              <ThemedText style={styles.detailValue}>{classroom.capacity}</ThemedText>
            </View>

            {/* Distance */}
            {distanceText && (
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="location-outline" size={20} color={iconColor} />
                </View>
                <ThemedText style={styles.detailLabel}>Distance</ThemedText>
                <ThemedText style={styles.detailValue}>{distanceText}</ThemedText>
              </View>
            )}

            {/* Accessibility */}
            {classroom.is_accessible && (
              <View style={styles.detailRow}>
                <View style={styles.detailIconContainer}>
                  <Ionicons name="accessibility-outline" size={20} color={iconColor} />
                </View>
                <ThemedText style={styles.detailLabel}>Accessible</ThemedText>
                <Ionicons name="checkmark-circle" size={20} color="#28a745" />
              </View>
            )}

            {/* Amenities */}
            {classroom.amenities.length > 0 && (
              <View style={styles.amenitiesSection}>
                <View style={styles.detailRow}>
                  <View style={styles.detailIconContainer}>
                    <Ionicons name="list-outline" size={20} color={iconColor} />
                  </View>
                  <ThemedText style={styles.detailLabel}>Amenities</ThemedText>
                </View>
                <View style={styles.amenitiesList}>
                  {classroom.amenities.map((amenity) => {
                    const iconName = AMENITY_ICONS[amenity.toLowerCase()] || 'ellipse-outline';
                    const label = AMENITY_LABELS[amenity.toLowerCase()] || amenity;
                    return (
                      <View key={amenity} style={styles.amenityItem}>
                        <Ionicons name={iconName} size={16} color={iconColor} />
                        <ThemedText style={[styles.amenityLabel, { color: iconColor }]}>
                          {label}
                        </ThemedText>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
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
    marginRight: 44, // Balance the back button width
  },
  headerSpacer: {
    width: 44,
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
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  detailsCard: {
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailIconContainer: {
    width: 32,
  },
  detailLabel: {
    flex: 1,
    fontSize: 16,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  amenitiesSection: {
    marginTop: 8,
  },
  amenitiesList: {
    marginLeft: 32,
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amenityLabel: {
    fontSize: 14,
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
