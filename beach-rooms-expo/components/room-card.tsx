import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getStatusColor, getStatusLabel } from '@/lib/availability';
import type { ClassroomAvailability } from '@/types/database';

interface RoomCardProps {
  availability: ClassroomAvailability;
  onPress?: () => void;
}

const AMENITY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  projector: 'videocam-outline',
  whiteboard: 'easel-outline',
  outlets: 'flash-outline',
  computer: 'desktop-outline',
  smartboard: 'tv-outline',
  microphone: 'mic-outline',
};

export function RoomCard({ availability, onPress }: RoomCardProps) {
  const { classroom, status, statusText } = availability;
  const { building } = classroom;

  const iconColor = useThemeColor({}, 'icon');
  const statusColor = getStatusColor(status);
  const statusLabel = getStatusLabel(status);

  const roomName = `${building.code} ${classroom.room_number}`;
  const floorText = classroom.floor ? `Floor ${classroom.floor}` : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.mainContent}>
        {/* Room Info */}
        <View style={styles.roomInfo}>
          <View style={styles.roomHeader}>
            <ThemedText type="defaultSemiBold" style={styles.roomName}>
              {roomName}
            </ThemedText>
            {classroom.is_accessible && (
              <Ionicons
                name="accessibility-outline"
                size={16}
                color={iconColor}
                style={styles.accessibleIcon}
              />
            )}
          </View>

          <ThemedText style={[styles.buildingName, { color: iconColor }]}>
            {building.name}
            {floorText && ` \u2022 ${floorText}`}
          </ThemedText>

          {/* Capacity & Amenities Row */}
          <View style={styles.detailsRow}>
            <View style={styles.capacityContainer}>
              <Ionicons name="people-outline" size={14} color={iconColor} />
              <ThemedText style={[styles.capacity, { color: iconColor }]}>
                {classroom.capacity}
              </ThemedText>
            </View>

            {classroom.amenities.length > 0 && (
              <View style={styles.amenitiesContainer}>
                {classroom.amenities.slice(0, 3).map((amenity) => {
                  const iconName = AMENITY_ICONS[amenity.toLowerCase()];
                  if (!iconName) return null;
                  return (
                    <Ionicons
                      key={amenity}
                      name={iconName}
                      size={14}
                      color={iconColor}
                      style={styles.amenityIcon}
                    />
                  );
                })}
                {classroom.amenities.length > 3 && (
                  <ThemedText style={[styles.moreAmenities, { color: iconColor }]}>
                    +{classroom.amenities.length - 3}
                  </ThemedText>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Right Side: Status & Arrow */}
        <View style={styles.rightSection}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <ThemedText style={styles.statusBadgeText}>{statusLabel}</ThemedText>
          </View>
          <ThemedText style={[styles.statusText, { color: iconColor }]}>{statusText}</ThemedText>
        </View>

        <Ionicons name="chevron-forward" size={20} color={iconColor} style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
    marginBottom: 12,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomInfo: {
    flex: 1,
    gap: 4,
  },
  roomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomName: {
    fontSize: 17,
  },
  accessibleIcon: {
    marginLeft: 6,
  },
  buildingName: {
    fontSize: 14,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 12,
  },
  capacityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  capacity: {
    fontSize: 13,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  amenityIcon: {
    opacity: 0.8,
  },
  moreAmenities: {
    fontSize: 12,
  },
  rightSection: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 12,
    marginTop: 4,
  },
  chevron: {
    opacity: 0.5,
  },
});
