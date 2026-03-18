import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo, useRef, useCallback } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CampusMap } from '@/components/campus-map';
import { CollapsibleMapContainer } from '@/components/collapsible-map-container';
import { RoomCard } from '@/components/room-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useBuildingPins } from '@/hooks/use-building-pins';
import { useClassrooms } from '@/hooks/use-classrooms';
import { useThemeColor } from '@/hooks/use-theme-color';

const INITIAL_OCCUPIED_LIMIT = 3;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const popoverBg = useThemeColor({ light: '#ffffff', dark: '#1f2123' }, 'background');
  const popoverText = useThemeColor({}, 'text');
  const dividerColor = useThemeColor(
    { light: 'rgba(0,0,0,0.12)', dark: 'rgba(255,255,255,0.12)' },
    'text'
  );
  const overlayColor = useThemeColor(
    { light: 'rgba(0,0,0,0.15)', dark: 'rgba(0,0,0,0.45)' },
    'background'
  );

  const { classrooms, availableRooms, openingSoonRooms, occupiedRooms, isLoading, error, refetch } = useClassrooms();
  const buildingPins = useBuildingPins(classrooms);
  const scrollViewRef = useRef<ScrollView>(null);
  const buildingYPositions = useRef<Record<string, number>>({});
  const [showAllOccupied, setShowAllOccupied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [hideMap, setHideMap] = useState(false);
  const [popoverTopRight, setPopoverTopRight] = useState<{ top: number; right: number } | null>(null);
  const gearButtonRef = useRef<View>(null);

  const openSettingsPopover = () => {
    const node = gearButtonRef.current;
    if (!node) {
      setSettingsOpen(true);
      setPopoverTopRight({ top: insets.top + 56, right: 16 });
      return;
    }

    node.measureInWindow((x, y, width, height) => {
      const windowWidth = Dimensions.get('window').width;
      const right = Math.max(12, windowWidth - (x + width));
      const top = y + height + 8;
      setPopoverTopRight({ top, right });
      setSettingsOpen(true);
    });
  };

  const toggleSettingsPopover = () => {
    if (settingsOpen) {
      setSettingsOpen(false);
      return;
    }
    openSettingsPopover();
  };

  const usageBullets = [
    "Availability based on official class times only",
    "Rooms may be booked by clubs or meetings",
    "Hours vary during finals week",
    "Keep the rooms tidy",
    "Maintain a respectful noise level to avoid disrupting classes",
    "Classroom access is a privilege. Rooms may be locked by the school if used improperly",
  ];

  const handleBuildingPress = useCallback((buildingId: string) => {
    const y = buildingYPositions.current[buildingId];
    if (y !== undefined) {
      scrollViewRef.current?.scrollTo({ y, animated: true });
    }
  }, []);

  // Filter rooms based on search query
  const filteredAvailable = useMemo(() => {
    if (!searchQuery.trim()) return availableRooms;
    const query = searchQuery.toLowerCase();
    return availableRooms.filter(
      (room) =>
        room.classroom.building.code.toLowerCase().includes(query) ||
        (room.classroom.building.name && room.classroom.building.name.toLowerCase().includes(query)) ||
        room.classroom.room_number.toLowerCase().includes(query) ||
        `${room.classroom.building.code} ${room.classroom.room_number}`.toLowerCase().includes(query)
    );
  }, [availableRooms, searchQuery]);

  const filteredOpeningSoon = useMemo(() => {
    if (!searchQuery.trim()) return openingSoonRooms;
    const query = searchQuery.toLowerCase();
    return openingSoonRooms.filter(
      (room) =>
        room.classroom.building.code.toLowerCase().includes(query) ||
        (room.classroom.building.name && room.classroom.building.name.toLowerCase().includes(query)) ||
        room.classroom.room_number.toLowerCase().includes(query) ||
        `${room.classroom.building.code} ${room.classroom.room_number}`.toLowerCase().includes(query)
    );
  }, [openingSoonRooms, searchQuery]);

  const filteredOccupied = useMemo(() => {
    if (!searchQuery.trim()) return occupiedRooms;
    const query = searchQuery.toLowerCase();
    return occupiedRooms.filter(
      (room) =>
        room.classroom.building.code.toLowerCase().includes(query) ||
        (room.classroom.building.name && room.classroom.building.name.toLowerCase().includes(query)) ||
        room.classroom.room_number.toLowerCase().includes(query) ||
        `${room.classroom.building.code} ${room.classroom.room_number}`.toLowerCase().includes(query)
    );
  }, [occupiedRooms, searchQuery]);

  const displayedOccupied = showAllOccupied
    ? filteredOccupied
    : filteredOccupied.slice(0, INITIAL_OCCUPIED_LIMIT);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Track which buildings we've seen so we only record Y for the first occurrence
  const seenBuildingsRef = useRef(new Set<string>());

  const renderRoomCard = (room: (typeof classrooms)[number]) => {
    const buildingId = room.classroom.building.id;
    const isFirst = !seenBuildingsRef.current.has(buildingId);
    if (isFirst) {
      seenBuildingsRef.current.add(buildingId);
    }

    return (
      <View
        key={room.classroom.id}
        onLayout={
          isFirst
            ? (e) => {
                buildingYPositions.current[buildingId] =
                  e.nativeEvent.layout.y;
              }
            : undefined
        }
      >
        <RoomCard availability={room} />
      </View>
    );
  };

  const renderContent = () => {
    // Reset seen buildings on each render so tracking stays current
    seenBuildingsRef.current.clear();
    if (isLoading && !refreshing) {
      return (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText style={[styles.loadingText, { color: iconColor }]}>
            Finding available rooms...
          </ThemedText>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={48} color="#dc3545" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: tintColor }]}
            onPress={refetch}
          >
            <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <ScrollView
        ref={scrollViewRef}
        style={styles.roomList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={tintColor}
            colors={[tintColor]}
          />
        }
      >
        {/* Available Rooms Section */}
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle">Available Now</ThemedText>
          <ThemedText style={[styles.sectionCount, { color: iconColor }]}>
            {filteredAvailable.length} rooms
          </ThemedText>
        </View>

        {filteredAvailable.length === 0 ? (
          <View style={styles.emptySection}>
            <ThemedText style={{ color: iconColor }}>
              {searchQuery ? 'No matching rooms found' : 'No rooms available right now'}
            </ThemedText>
          </View>
        ) : (
          filteredAvailable.map(renderRoomCard)
        )}

        {/* Opening Soon Section */}
        {filteredOpeningSoon.length > 0 && (
          <>
            <View style={[styles.sectionHeader, styles.openingSoonHeader]}>
              <ThemedText type="subtitle">Opening Soon</ThemedText>
              <ThemedText style={[styles.sectionCount, { color: iconColor }]}>
                {filteredOpeningSoon.length} rooms
              </ThemedText>
            </View>

            {filteredOpeningSoon.map(renderRoomCard)}
          </>
        )}

        {/* Occupied Rooms Section */}
        {filteredOccupied.length > 0 && (
          <>
            <View style={[styles.sectionHeader, styles.occupiedHeader]}>
              <ThemedText type="subtitle">Currently Occupied</ThemedText>
              <ThemedText style={[styles.sectionCount, { color: iconColor }]}>
                {filteredOccupied.length} rooms
              </ThemedText>
            </View>

            {displayedOccupied.map(renderRoomCard)}

            {filteredOccupied.length > INITIAL_OCCUPIED_LIMIT && (
              <TouchableOpacity
                style={[styles.showMoreButton, { borderColor: iconColor }]}
                onPress={() => setShowAllOccupied(!showAllOccupied)}
              >
                <ThemedText style={[styles.showMoreText, { color: tintColor }]}>
                  {showAllOccupied
                    ? 'Show Less'
                    : `Show ${filteredOccupied.length - INITIAL_OCCUPIED_LIMIT} More`}
                </ThemedText>
                <Ionicons
                  name={showAllOccupied ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={tintColor}
                />
              </TouchableOpacity>
            )}
          </>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Campus Map — full width at the very top */}
      {!hideMap && (
        <View style={{ paddingTop: insets.top }}>
          <CollapsibleMapContainer>
            <CampusMap
              buildingPins={buildingPins}
              onBuildingPress={handleBuildingPress}
            />
          </CollapsibleMapContainer>
        </View>
      )}

      {/* Settings Modal */}
      <Modal
        transparent
        visible={settingsOpen}
        animationType="fade"
        onRequestClose={() => setSettingsOpen(false)}
      >
        <Pressable
          style={[styles.modalOverlay, { backgroundColor: overlayColor }]}
          onPress={() => setSettingsOpen(false)}
        >
          <Pressable
            onPress={() => {}}
            style={[
              styles.settingsPopover,
              { backgroundColor: popoverBg },
              popoverTopRight ? { top: popoverTopRight.top, right: popoverTopRight.right } : null,
            ]}
          >
            <View style={styles.settingsRow}>
              <View style={styles.settingsRowLeft}>
                <Ionicons name="map-outline" size={18} color={iconColor} />
                <ThemedText style={[styles.settingsRowLabel, { color: popoverText }]}>Hide Map</ThemedText>
              </View>
              <Switch
                value={hideMap}
                onValueChange={setHideMap}
                trackColor={{ false: dividerColor, true: tintColor }}
                thumbColor="#ffffff"
                ios_backgroundColor={dividerColor}
              />
            </View>

            <View style={[styles.settingsDivider, { backgroundColor: dividerColor }]} />

            <View style={styles.usageSection}>
              <ThemedText style={[styles.settingsSectionTitle, { color: popoverText }]}>
                Usage &amp; Etiquette:
              </ThemedText>
              {usageBullets.map((text) => (
                <View key={text} style={styles.bulletRow}>
                  <ThemedText style={[styles.bulletDot, { color: iconColor }]}>•</ThemedText>
                  <ThemedText style={[styles.bulletText, { color: iconColor }]}>{text}</ThemedText>
                </View>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Rest of content with horizontal padding */}
      <View style={[styles.contentPadding, hideMap && { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <ThemedText type="title">
              <ThemedText type="title" style={{ color: '#EBA920' }}>Beach</ThemedText>
              Rooms
            </ThemedText>
            <ThemedText style={styles.subtitle}>Find empty classrooms at CSULB</ThemedText>
          </View>

          <TouchableOpacity
            ref={gearButtonRef}
            style={styles.headerIconButton}
            onPress={toggleSettingsPopover}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <Ionicons name="settings-outline" size={22} color={iconColor} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBar, { borderColor: iconColor }]}>
          <Ionicons name="search" size={20} color={iconColor} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search buildings or rooms..."
            placeholderTextColor={iconColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={iconColor} />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        {renderContent()}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentPadding: {
    flex: 1,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
  },
  settingsPopover: {
    position: 'absolute',
    width: 290,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingsRowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingsDivider: {
    height: 1,
    marginVertical: 10,
  },
  settingsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  usageSection: {
    paddingHorizontal: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 3,
  },
  bulletDot: {
    lineHeight: 18,
  },
  bulletText: {
    flex: 1,
    lineHeight: 18,
    fontSize: 13,
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.7,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  roomList: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionCount: {
    fontSize: 14,
  },
  openingSoonHeader: {
    marginTop: 24,
  },
  occupiedHeader: {
    marginTop: 24,
  },
  emptySection: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    marginTop: 8,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 8,
    marginHorizontal: 32,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    gap: 4,
  },
  showMoreText: {
    fontWeight: '500',
  },
});
