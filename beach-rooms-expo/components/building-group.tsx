import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useRoomDetail } from '@/providers/room-detail-provider';
import type { ClassroomAvailability } from '@/types/database';

const pinGreen = require('@/assets/images/pin-green.png');
const pinRed = require('@/assets/images/pin-red.png');
const pinAmber = require('@/assets/images/pin-amber.png');


function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes} ${ampm}`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

interface BuildingGroupProps {
  buildingName: string;
  buildingCode: string;
  available: ClassroomAvailability[];
  openingSoon: ClassroomAvailability[];
  occupied: ClassroomAvailability[];
  forceExpanded?: boolean;
  onExpand?: () => void;
  onLayout?: (e: { nativeEvent: { layout: { y: number } } }) => void;
  showOpeningSoon?: boolean;
}

export function BuildingGroup({
  buildingName,
  buildingCode,
  available,
  openingSoon,
  occupied,
  forceExpanded,
  onExpand,
  onLayout,
  showOpeningSoon = true,
}: BuildingGroupProps) {
  const buildingNameColor = useThemeColor(
    { light: 'rgba(0,0,0,0.7)', dark: 'rgba(255,255,255,0.85)' },
    'text'
  );
  const dividerColor = useThemeColor(
    { light: 'rgba(0,0,0,0.15)', dark: 'rgba(255,255,255,0.15)' },
    'text'
  );

  const totalRooms = available.length + (showOpeningSoon ? openingSoon.length : 0) + occupied.length;
  const hasAvailable = available.length > 0;
  const badgeBg = hasAvailable ? '#e6f9ec' : '#fde8ea';
  const badgeBorder = hasAvailable ? '#7ee8a0' : '#f5a3ab';
  const badgeText = hasAvailable ? '#1a9e3f' : '#c9303a';
  const [expanded, setExpanded] = useState(false);
  const [availableExpanded, setAvailableExpanded] = useState(true);
  const [openingSoonExpanded, setOpeningSoonExpanded] = useState(true);
  const [occupiedExpanded, setOccupiedExpanded] = useState(false);

  useEffect(() => {
    if (forceExpanded) setExpanded(true);
  }, [forceExpanded]);

  return (
    <View style={[styles.container, { borderBottomColor: dividerColor }]} onLayout={onLayout}>
      {/* Building Header */}
      <TouchableOpacity
        style={styles.buildingHeader}
        onPress={() => {
          const next = !expanded;
          setExpanded(next);
          if (next && onExpand) onExpand();
        }}
        activeOpacity={0.7}
      >
        <View style={styles.buildingHeaderLeft}>
          <ThemedText type="default" style={[styles.buildingName, { color: buildingNameColor }]}>
            {buildingName}
          </ThemedText>
        </View>
        <View style={styles.buildingHeaderRight}>
          <View style={[styles.countBadge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
            <ThemedText style={[styles.countText, { color: badgeText }]}>
              {available.length}/{totalRooms}
            </ThemedText>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={buildingNameColor}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View>
          {/* Available Section */}
          {available.length > 0 && (
            <View>
              <TouchableOpacity
                style={styles.statusHeader}
                onPress={() => setAvailableExpanded(!availableExpanded)}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.statusLabel, { color: buildingNameColor }]}>
                  Available
                </ThemedText>
                <Ionicons
                  name={availableExpanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={buildingNameColor}
                />
              </TouchableOpacity>

              {availableExpanded &&
                available.map((room) => (
                  <RoomRow key={room.classroom.id} room={room} type="available" buildingCode={buildingCode} dividerColor={dividerColor} />
                ))}
            </View>
          )}

          {/* Opening Soon Section */}
          {showOpeningSoon && openingSoon.length > 0 && (
            <View>
              <TouchableOpacity
                style={styles.statusHeader}
                onPress={() => setOpeningSoonExpanded(!openingSoonExpanded)}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.statusLabel, { color: buildingNameColor }]}>
                  Opening Soon
                </ThemedText>
                <Ionicons
                  name={openingSoonExpanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={buildingNameColor}
                />
              </TouchableOpacity>

              {openingSoonExpanded &&
                openingSoon.map((room) => (
                  <RoomRow key={room.classroom.id} room={room} type="openingSoon" buildingCode={buildingCode} dividerColor={dividerColor} />
                ))}
            </View>
          )}

          {/* Occupied Section */}
          {occupied.length > 0 && (
            <View>
              <TouchableOpacity
                style={styles.statusHeader}
                onPress={() => setOccupiedExpanded(!occupiedExpanded)}
                activeOpacity={0.7}
              >
                <ThemedText style={[styles.statusLabel, { color: buildingNameColor }]}>
                  Occupied
                </ThemedText>
                <Ionicons
                  name={occupiedExpanded ? 'chevron-up' : 'chevron-down'}
                  size={14}
                  color={buildingNameColor}
                />
              </TouchableOpacity>

              {occupiedExpanded &&
                occupied.map((room) => (
                  <RoomRow key={room.classroom.id} room={room} type="occupied" buildingCode={buildingCode} dividerColor={dividerColor} />
                ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function CountdownChip({ minutesUntilFree }: { minutesUntilFree: number }) {
  const label = minutesUntilFree <= 1 ? 'Free in <1 min' : `Free in ${minutesUntilFree} min`;
  return (
    <View style={styles.countdownChip}>
      <Text style={styles.countdownChipText}>{label}</Text>
    </View>
  );
}

function RoomStatusText({ room, type }: { room: ClassroomAvailability; type: 'available' | 'occupied' | 'openingSoon' }) {
  const iconColor = useThemeColor({}, 'icon');

  // Available rooms: parse "Free until H:MM AM/PM (Xh Ym)" from statusText as fallback
  if (type === 'available') {
    if (room.minutesUntilNextClass != null && room.nextClassStartsAt) {
      return (
        <Text style={[styles.roomStatus, { color: iconColor }]}>
          Available for <Text style={styles.roomStatusBold}>{formatDuration(room.minutesUntilNextClass)}</Text> until <Text style={styles.roomStatusBold}>{formatTime(room.nextClassStartsAt)}</Text>
        </Text>
      );
    }

    // "Free until X:XX AM/PM (Xh Ym)" — parse duration and time
    const match = room.statusText.match(/Free until (.+?\s[AP]M)\s*\((.+?)\)/);
    if (match) {
      return (
        <Text style={[styles.roomStatus, { color: iconColor }]}>
          Available for <Text style={styles.roomStatusBold}>{match[2]}</Text> until <Text style={styles.roomStatusBold}>{match[1]}</Text>
        </Text>
      );
    }
  }

  // Opening Soon rooms: show "Free at X:XX" with countdown chip
  if (type === 'openingSoon' && room.currentClassEndsAt) {
    return (
      <Text style={[styles.roomStatus, { color: iconColor }]}>
        Free at <Text style={styles.roomStatusBold}>{formatTime(room.currentClassEndsAt)}</Text>
      </Text>
    );
  }

  // Occupied rooms: parse "Free at H:MM AM/PM for Xh Ym"
  if (type === 'occupied') {
    const occupiedMatch = room.statusText.match(/Free at (.+?\s[AP]M) for (.+)/);
    if (occupiedMatch) {
      return (
        <Text style={[styles.roomStatus, { color: iconColor }]}>
          Free at <Text style={styles.roomStatusBold}>{occupiedMatch[1]}</Text> for <Text style={styles.roomStatusBold}>{occupiedMatch[2]}</Text>
        </Text>
      );
    }
  }

  return (
    <Text style={[styles.roomStatus, { color: iconColor }]}>
      {room.statusText}
    </Text>
  );
}

function RoomRow({
  room,
  type,
  buildingCode,
  dividerColor,
}: {
  room: ClassroomAvailability;
  type: 'available' | 'occupied' | 'openingSoon';
  buildingCode: string;
  dividerColor: string;
}) {
  const { setSelectedRoom } = useRoomDetail();
  const router = useRouter();
  const roomNameColor = useThemeColor(
    { light: 'rgba(0,0,0,0.7)', dark: 'rgba(255,255,255,0.85)' },
    'text'
  );

  const getPinImage = () => {
    if (type === 'available') return pinGreen;
    if (type === 'openingSoon') return pinAmber;
    return pinRed;
  };

  // Calculate minutes until free for opening soon rooms
  const minutesUntilFree = type === 'openingSoon' && room.currentClassEndsAt
    ? Math.max(1, Math.floor((room.currentClassEndsAt.getTime() - Date.now()) / 60000))
    : null;

  return (
    <TouchableOpacity
      style={[styles.roomRow, { borderBottomColor: dividerColor }]}
      onPress={() => {
        setSelectedRoom(room);
        router.push('/room-detail');
      }}
      activeOpacity={0.7}
    >
      <Image
        source={getPinImage()}
        style={styles.statusDot}
      />
      <View style={styles.roomInfo}>
        <View style={styles.roomNameRow}>
          <ThemedText style={[styles.roomNumber, { color: roomNameColor }]}>
            {buildingCode} {room.classroom.room_number}
          </ThemedText>
          {type === 'openingSoon' && minutesUntilFree !== null && (
            <CountdownChip minutesUntilFree={minutesUntilFree} />
          )}
        </View>
        <RoomStatusText room={room} type={type} />
      </View>
      <Ionicons name="chevron-forward" size={14} color={roomNameColor} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
  },
  buildingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  buildingHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buildingName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  buildingHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countBadge: {
      minWidth: 37,
    paddingHorizontal: 7,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
  },
  countText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 1,
  },
  statusLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  roomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 12,
    borderBottomWidth: 1,
  },
  statusDot: {
    width: 22,
    height: 22,
    marginRight: 10,
  },
  roomInfo: {
    flex: 1,
  },
  roomNumber: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  roomNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomStatus: {
    fontSize: 13,
    marginTop: 1,
  },
  roomStatusBold: {
    fontWeight: '700',
  },
  countdownChip: {
    backgroundColor: '#fef6e6',
    borderWidth: 1,
    borderColor: '#f5d78a',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countdownChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#b5850b',
  },
});
