import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
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
import { FilterButton } from '@/components/filter-button';
import { FilterMenu } from '@/components/filter-menu';
import { ReportFormModal } from '@/components/report-form-modal';
import { ReportSuccessModal } from '@/components/report-success-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TimePickerModal } from '@/components/time-picker-modal';
import { useBuildingPins } from '@/hooks/use-building-pins';
import { useClassrooms } from '@/hooks/use-classrooms';
import { useColorSchemeToggle } from '@/hooks/use-color-scheme';
import { useSettings } from '@/hooks/use-settings';
import { useLocation } from '@/hooks/use-location';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAuth } from '@/providers/auth-provider';
import type { ClassroomAvailability, Report } from '@/types/database';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isLoggedIn } = useAuth();
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
  const { settings, update: updateSetting, loaded: settingsLoaded } = useSettings();
  const scrollViewRef = useRef<ScrollView>(null);
  const buildingYPositions = useRef<Record<string, number>>({});
  const [expandedBuildingId, setExpandedBuildingId] = useState<string | null>(null);
  const [focusBuildingId, setFocusBuildingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [minDuration, setMinDuration] = useState<number | null>(null);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);

  // Fetch classrooms with filter parameters
  const { classrooms, openingSoonRooms, isLoading, error, refetch } = useClassrooms({
    userLocation: settings?.sortByDistance ? location : undefined,
    filterTime: selectedTime,
    minDuration,
  });
  const buildingPins = useBuildingPins(classrooms);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Report state
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [submittedReportId, setSubmittedReportId] = useState<string>('');

  useEffect(() => {
    if (settingsLoaded) {
      setColorScheme(settings.darkMode ? 'dark' : 'light');
    }
  }, [settingsLoaded, setColorScheme, settings.darkMode]);
  const [autoCenterHelpVisible, setAutoCenterHelpVisible] = useState(false);
  const [usageExpanded, setUsageExpanded] = useState(false);
  const [popoverTopRight, setPopoverTopRight] = useState<{ top: number; right: number } | null>(null);
  const settingsButtonRef = useRef<View>(null);

  const handleReportSuccess = (report: Report) => {
    setReportModalVisible(false);
    setSubmittedReportId(report.id);
    setSuccessModalVisible(true);
  };

  const handleOpenReportModal = () => {
    setSettingsOpen(false);
    setReportModalVisible(true);
  };

  const handleOpenMyReports = () => {
    setSettingsOpen(false);
    router.push('/my-reports' as '/login');
  };

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

  const handleTimeConfirm = (time: Date) => {
    setSelectedTime(time);
    setTimePickerVisible(false);
  };

  const handleTimeReset = () => {
    setSelectedTime(null);
    setTimePickerVisible(false);
  };

  const locationEnabled = locationStatus === 'granted' && location !== null;

  const handleFilterApply = (newState: { selectedTime: Date | null; sortByDistance: boolean; minDuration: number | null }) => {
    setSelectedTime(newState.selectedTime);
    if (newState.sortByDistance !== settings?.sortByDistance) {
      updateSetting('sortByDistance', newState.sortByDistance);
    }
    setMinDuration(newState.minDuration);
  };

  // Count active filters for badge
  const activeFilterCount =
    (selectedTime !== null ? 1 : 0) +
    (settings?.sortByDistance && locationEnabled ? 1 : 0) +
    (minDuration !== null ? 1 : 0);

  // Create a set of opening soon room IDs for quick lookup (only when no time filter)
  const openingSoonIds = useMemo(() => {
    if (selectedTime !== null) return new Set<string>();
    return new Set(openingSoonRooms.map((r) => r.classroom.id));
  }, [openingSoonRooms, selectedTime]);

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
      distanceMiles: number | null;
      available: ClassroomAvailability[];
      openingSoon: ClassroomAvailability[];
      occupied: ClassroomAvailability[];
    }>();

    for (const room of filtered) {
      const id = room.classroom.building.id;
      if (!groups.has(id)) {
        groups.set(id, {
          buildingName: room.classroom.building.name,
          buildingCode: room.classroom.building.code,
          distanceMiles: room.distanceMiles,
          available: [],
          openingSoon: [],
          occupied: [],
        });
      }
      const group = groups.get(id)!;
      // Check if room meets minimum duration requirement (remaining time from now)
      let remainingMinutes: number | null = null;
      if (room.isAvailable) {
        if (room.minutesUntilNextClass !== null) {
          // Room has a next class - use time until that class
          remainingMinutes = room.minutesUntilNextClass;
        } else if (room.classroom.building.weekday_close) {
          // No next class - calculate time until building closes
          const now = selectedTime ?? new Date();
          const [hours, minutes] = room.classroom.building.weekday_close.split(':').map(Number);
          const closeTime = new Date(now);
          closeTime.setHours(hours, minutes, 0, 0);
          remainingMinutes = Math.floor((closeTime.getTime() - now.getTime()) / 60000);
        }
      }
      const meetsMinDuration = minDuration === null ||
        (remainingMinutes !== null && remainingMinutes >= minDuration);

      if (room.isAvailable && meetsMinDuration) {
        group.available.push(room);
      } else if (openingSoonIds.has(room.classroom.id)) {
        // Room is opening soon - add to openingSoon array
        group.openingSoon.push(room);
      } else {
        group.occupied.push(room);
      }
    }

    // Sort openingSoon rooms by time-until-free (soonest first)
    for (const group of groups.values()) {
      group.openingSoon.sort((a, b) => {
        const aTime = a.currentClassEndsAt?.getTime() ?? Infinity;
        const bTime = b.currentClassEndsAt?.getTime() ?? Infinity;
        return aTime - bTime;
      });
    }

    // Sort buildings: those with available rooms first, then by distance or code
    return [...groups.entries()]
      .sort(([, a], [, b]) => {
        if (a.available.length > 0 && b.available.length === 0) return -1;
        if (a.available.length === 0 && b.available.length > 0) return 1;
        if (settings?.sortByDistance && a.distanceMiles != null && b.distanceMiles != null) {
          return a.distanceMiles - b.distanceMiles;
        }
        return a.buildingCode.localeCompare(b.buildingCode);
      })
      .map(([id, data]) => ({ buildingId: id, ...data }));
  }, [classrooms, searchQuery, settings?.sortByDistance, minDuration, selectedTime, openingSoonIds]);

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
              openingSoon={group.openingSoon}
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
              showOpeningSoon={selectedTime === null}
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

          <FilterButton
            activeFilterCount={activeFilterCount}
            onPress={() => setFilterMenuVisible(true)}
          />

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

        {/* Filter Menu Modal */}
        <FilterMenu
          visible={filterMenuVisible}
          onClose={() => setFilterMenuVisible(false)}
          filterState={{ selectedTime, sortByDistance: settings?.sortByDistance ?? false, minDuration }}
          onApply={handleFilterApply}
          onOpenTimePicker={() => {
            setFilterMenuVisible(false);
            setTimePickerVisible(true);
          }}
          locationEnabled={locationEnabled}
          onRequestLocation={requestPermission}
        />

        {/* Time Picker Modal */}
        <TimePickerModal
          visible={timePickerVisible}
          initialTime={selectedTime || new Date()}
          onConfirm={(time) => {
            handleTimeConfirm(time);
            setFilterMenuVisible(true);
          }}
          onCancel={() => {
            setTimePickerVisible(false);
            setFilterMenuVisible(true);
          }}
          onReset={() => {
            handleTimeReset();
            setFilterMenuVisible(true);
          }}
        />

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
                <View style={styles.settingsRowRight}>
                  <Switch
                    value={settings.hideMap}
                    onValueChange={(v) => updateSetting('hideMap', v)}
                    trackColor={{ false: dividerColor, true: tintColor }}
                    thumbColor="#ffffff"
                    ios_backgroundColor={dividerColor}
                  />
                </View>
              </View>

              <View style={styles.settingsRow}>
                <View style={styles.settingsRowLeft}>
                  <Ionicons name="locate-outline" size={18} color={iconColor} />
                  <ThemedText style={[styles.settingsRowLabel, { color: popoverText }]}>Auto-center Building</ThemedText>
                  <TouchableOpacity onPress={() => setAutoCenterHelpVisible(!autoCenterHelpVisible)} hitSlop={8}>
                    <Ionicons name="help-circle-outline" size={16} color={iconColor} />
                  </TouchableOpacity>
                </View>
                <View style={styles.settingsRowRight}>
                  <Switch
                    value={settings.autoCenter}
                    onValueChange={(v) => updateSetting('autoCenter', v)}
                    trackColor={{ false: dividerColor, true: tintColor }}
                    thumbColor="#ffffff"
                    ios_backgroundColor={dividerColor}
                  />
                </View>
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
                <View style={styles.settingsRowRight}>
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
                <View style={styles.settingsRowRight}>
                  <Ionicons
                    name={usageExpanded ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color={iconColor}
                  />
                </View>
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

              <View style={[styles.settingsDivider, { backgroundColor: dividerColor }]} />

              {/* Report Section */}
              <TouchableOpacity style={styles.settingsLinkRow} onPress={handleOpenReportModal}>
                <View style={styles.settingsRowLeft}>
                  <Ionicons name="flag-outline" size={18} color={iconColor} />
                  <ThemedText style={[styles.settingsRowLabel, { color: popoverText }]}>
                    Report an Issue
                  </ThemedText>
                </View>
                <View style={styles.settingsRowRight}>
                  <Ionicons name="chevron-forward" size={14} color={iconColor} />
                </View>
              </TouchableOpacity>

              {isLoggedIn && (
                <TouchableOpacity style={styles.settingsLinkRow} onPress={handleOpenMyReports}>
                  <View style={styles.settingsRowLeft}>
                    <Ionicons name="document-text-outline" size={18} color={iconColor} />
                    <ThemedText style={[styles.settingsRowLabel, { color: popoverText }]}>
                      My Reports
                    </ThemedText>
                  </View>
                  <View style={styles.settingsRowRight}>
                    <Ionicons name="chevron-forward" size={14} color={iconColor} />
                  </View>
                </TouchableOpacity>
              )}
            </Pressable>
          </Pressable>
        </Modal>

        {/* Content */}
        <View style={styles.roomContent}>
          {renderContent()}
        </View>
      </View>

      {/* Report Modals */}
      <ReportFormModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        onSuccess={handleReportSuccess}
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
    paddingHorizontal: 6,
  },
  settingsRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  settingsRowRight: {
    width: 52,
    alignItems: 'flex-end',
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
    paddingHorizontal: 6,
  },
  usageSection: {
    paddingHorizontal: 6,
    paddingTop: 6,
  },
  settingsLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
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
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
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
