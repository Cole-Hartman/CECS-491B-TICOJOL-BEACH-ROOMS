import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
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

import { BuildingGroup } from '@/components/building-group';
import { CampusMap } from '@/components/campus-map';
import { CollapsibleMapContainer } from '@/components/collapsible-map-container';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useBuildingPins } from '@/hooks/use-building-pins';
import { useClassrooms } from '@/hooks/use-classrooms';
import { useColorSchemeToggle } from '@/hooks/use-color-scheme';
import { useSettings } from '@/hooks/use-settings';
import { useLocation } from '@/hooks/use-location';
import { useThemeColor } from '@/hooks/use-theme-color';
import type { ClassroomAvailability } from '@/types/database';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colorScheme, setColorScheme } = useColorSchemeToggle();
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');
  const popoverBg = useThemeColor({ light: '#ffffff', dark: '#1f2123' }, 'background');
  const popoverText = useThemeColor({}, 'text');
  const dividerColor = useThemeColor(
    { light: 'rgba(0,0,0,0.15)', dark: 'rgba(255,255,255,0.15)' },
    'text'
  );
  const strokeColor = useThemeColor(
    { light: 'rgba(0,0,0,0.2)', dark: 'rgba(255,255,255,0.2)' },
    'text'
  );
  const overlayColor = useThemeColor(
    { light: 'rgba(0,0,0,0.15)', dark: 'rgba(0,0,0,0.45)' },
    'background'
  );
  const { location, status: locationStatus, requestPermission, refreshLocation } = useLocation();
  const { classrooms, isLoading, error, refetch } = useClassrooms({userLocation: location});
  const buildingPins = useBuildingPins(classrooms);
  const scrollViewRef = useRef<ScrollView>(null);
  const buildingYPositions = useRef<Record<string, number>>({});
  const [expandedBuildingId, setExpandedBuildingId] = useState<string | null>(null);
  const [focusBuildingId, setFocusBuildingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { settings, update: updateSetting, loaded: settingsLoaded } = useSettings();
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    if (settingsLoaded) {
      setColorScheme(settings.darkMode ? 'dark' : 'light');
    }
  }, [settingsLoaded, setColorScheme, settings.darkMode]);
  const [autoCenterHelpVisible, setAutoCenterHelpVisible] = useState(false);
  const [usageExpanded, setUsageExpanded] = useState(false);
  const [popoverTopRight, setPopoverTopRight] = useState<{ top: number; right: number } | null>(null);
  const settingsButtonRef = useRef<View>(null);

  const openSettingsPopover = () => {
    const node = settingsButtonRef.current;
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
    "Keep the rooms tidy!",
    "Maintain a respectful noise level to avoid disrupting classes",
    "Classroom access is a privilege. Rooms may be locked by the school if used improperly",
  ];

  const handleBuildingPress = useCallback((buildingId: string) => {
    setExpandedBuildingId(buildingId);
    const y = buildingYPositions.current[buildingId];
    if (y !== undefined) {
      scrollViewRef.current?.scrollTo({ y, animated: true });
    }
  }, []);

  // Filter and group rooms by building
  const buildingGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = query
      ? classrooms.filter(
          (room) =>
            room.classroom.building.code.toLowerCase().includes(query) ||
            (room.classroom.building.name && room.classroom.building.name.toLowerCase().includes(query)) ||
            room.classroom.room_number.toLowerCase().includes(query) ||
            `${room.classroom.building.code} ${room.classroom.room_number}`.toLowerCase().includes(query)
        )
      : classrooms;

    const groups = new Map<string, {
      buildingName: string;
      buildingCode: string;
      available: ClassroomAvailability[];
      occupied: ClassroomAvailability[];
    }>();

    for (const room of filtered) {
      const id = room.classroom.building.id;
      if (!groups.has(id)) {
        groups.set(id, {
          buildingName: room.classroom.building.name,
          buildingCode: room.classroom.building.code,
          available: [],
          occupied: [],
        });
      }
      const group = groups.get(id)!;
      if (room.isAvailable) {
        group.available.push(room);
      } else {
        group.occupied.push(room);
      }
    }

    // Sort buildings: those with available rooms first, then by code
    return [...groups.entries()]
      .sort(([, a], [, b]) => {
        if (a.available.length > 0 && b.available.length === 0) return -1;
        if (a.available.length === 0 && b.available.length > 0) return 1;
        return a.buildingCode.localeCompare(b.buildingCode);
      })
      .map(([id, data]) => ({ buildingId: id, ...data }));
  }, [classrooms, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetch(), refreshLocation()]);
    setRefreshing(false);
  };

  const renderContent = () => {
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
        {buildingGroups.length === 0 ? (
          <View style={styles.emptySection}>
            <ThemedText style={{ color: iconColor }}>
              {searchQuery ? 'No matching rooms found' : 'No rooms available right now'}
            </ThemedText>
          </View>
        ) : (
          buildingGroups.map((group) => (
            <BuildingGroup
              key={group.buildingId}
              buildingName={group.buildingName}
              buildingCode={group.buildingCode}
              available={group.available}
              occupied={group.occupied}
              forceExpanded={expandedBuildingId === group.buildingId}
              onExpand={() => {
                if (settings.autoCenter) {
                  setFocusBuildingId(null);
                  setTimeout(() => setFocusBuildingId(group.buildingId), 0);
                }
              }}
              onLayout={(e) => {
                buildingYPositions.current[group.buildingId] = e.nativeEvent.layout.y;
              }}
            />
          ))
        )}

        {/* Bottom spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      {/* Campus Map — full width at the very top */}
      {!settings.hideMap && (
        <View style={{ paddingTop: insets.top }}>
          <CollapsibleMapContainer>
            <CampusMap
              buildingPins={buildingPins}
              focusBuildingId={focusBuildingId}
              onBuildingPress={handleBuildingPress}
            />
          </CollapsibleMapContainer>
        </View>
      )}

      {/* Rest of content */}
      <View style={[styles.contentPadding, settings.hideMap && { paddingTop: insets.top }]}>
        {/* Header: Logo + Search + Filter in one row */}
        <View style={[styles.headerRow, { borderBottomColor: dividerColor }]}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />

          <View style={[styles.searchBar, { borderColor: strokeColor }]}>
            <Ionicons name="search" size={18} color={iconColor} />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search..."
              placeholderTextColor={iconColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={iconColor} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.iconCircle, { borderColor: strokeColor }]}
            onPress={() => {/* TODO: open filter */}}
            accessibilityRole="button"
            accessibilityLabel="Filter rooms"
          >
            <Ionicons name="options-outline" size={18} color={textColor} />
          </TouchableOpacity>

          <TouchableOpacity
            ref={settingsButtonRef}
            style={[styles.iconCircle, { borderColor: strokeColor }]}
            onPress={toggleSettingsPopover}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={18} color={textColor} />
          </TouchableOpacity>
        </View>

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
                  value={settings.hideMap}
                  onValueChange={(v) => updateSetting('hideMap', v)}
                  trackColor={{ false: dividerColor, true: tintColor }}
                  thumbColor="#ffffff"
                  ios_backgroundColor={dividerColor}
                />
              </View>

              <View style={styles.settingsRow}>
                <View style={styles.settingsRowLeft}>
                  <Ionicons name="locate-outline" size={18} color={iconColor} />
                  <ThemedText style={[styles.settingsRowLabel, { color: popoverText }]}>Auto-center Building</ThemedText>
                  <TouchableOpacity onPress={() => setAutoCenterHelpVisible(!autoCenterHelpVisible)} hitSlop={8}>
                    <Ionicons name="help-circle-outline" size={16} color={iconColor} />
                  </TouchableOpacity>
                </View>
                <Switch
                  value={settings.autoCenter}
                  onValueChange={(v) => updateSetting('autoCenter', v)}
                  trackColor={{ false: dividerColor, true: tintColor }}
                  thumbColor="#ffffff"
                  ios_backgroundColor={dividerColor}
                />
              </View>

              {autoCenterHelpVisible && (
                <ThemedText style={[styles.autoCenterHelp, { color: iconColor }]}>
                  Expanding a building will automatically center the map to that building&apos;s location.
                </ThemedText>
              )}

              <View style={styles.settingsRow}>
                <View style={styles.settingsRowLeft}>
                  <Ionicons name={colorScheme === 'dark' ? 'moon' : 'moon-outline'} size={18} color={iconColor} />
                  <ThemedText style={[styles.settingsRowLabel, { color: popoverText }]}>Dark Mode</ThemedText>
                </View>
                <Switch
                  value={colorScheme === 'dark'}
                  onValueChange={(val) => {
                    setColorScheme(val ? 'dark' : 'light');
                    updateSetting('darkMode', val);
                  }}
                  trackColor={{ false: dividerColor, true: tintColor }}
                  thumbColor="#ffffff"
                  ios_backgroundColor={dividerColor}
                />
              </View>

              <View style={[styles.settingsDivider, { backgroundColor: dividerColor }]} />

              <TouchableOpacity
                style={styles.usageToggle}
                onPress={() => setUsageExpanded(!usageExpanded)}
              >
                <View style={styles.settingsRowLeft}>
                  <Ionicons name="information-circle-outline" size={18} color={iconColor} />
                  <ThemedText style={[styles.settingsRowLabel, { color: popoverText }]}>Usage &amp; Etiquette</ThemedText>
                </View>
                <Ionicons
                  name={usageExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={iconColor}
                />
              </TouchableOpacity>

              {usageExpanded && (
                <View style={styles.usageSection}>
                  {usageBullets.map((text) => (
                    <View key={text} style={styles.bulletRow}>
                      <ThemedText style={[styles.bulletDot, { color: iconColor }]}>•</ThemedText>
                      <ThemedText style={[styles.bulletText, { color: iconColor }]}>{text}</ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Content */}
        <View style={styles.roomContent}>
          {renderContent()}
        </View>
        </View>
        {/* Location Banner */}
        {(locationStatus === 'denied' || locationStatus === 'pending') && (
          <TouchableOpacity
            style={styles.locationBanner}
            onPress={requestPermission}
            activeOpacity={0.7}
          >
            <Ionicons name="location-outline" size={18} color="#fff" />
            <ThemedText style={styles.locationBannerText}>
              Enable location to sort by distance
            </ThemedText>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </ThemedView>

  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentPadding: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  logoImage: {
    height: 34,
    width: 85,
    marginLeft: -4,
    marginVertical: 3,
  },
  roomContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
  },
  settingsPopover: {
    position: 'absolute',
    width: 320,
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
  autoCenterHelp: {
    fontSize: 12,
    lineHeight: 16,
    paddingHorizontal: 6,
    paddingBottom: 6,
  },
  settingsRowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingsDivider: {
    height: 1,
    marginVertical: 10,
  },
  usageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  usageSection: {
    paddingHorizontal: 6,
    paddingTop: 6,
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
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6c757d',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 8,
  },
  locationBannerText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  roomList: {
    flex: 1,
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
});
