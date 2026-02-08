import { Ionicons } from '@expo/vector-icons';
import { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RoomCard } from '@/components/room-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useClassrooms } from '@/hooks/use-classrooms';
import { useThemeColor } from '@/hooks/use-theme-color';

const INITIAL_OCCUPIED_LIMIT = 3;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');
  const textColor = useThemeColor({}, 'text');

  const { availableRooms, occupiedRooms, isLoading, error, refetch } = useClassrooms();
  const [showAllOccupied, setShowAllOccupied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter rooms based on search query
  const filteredAvailable = useMemo(() => {
    if (!searchQuery.trim()) return availableRooms;
    const query = searchQuery.toLowerCase();
    return availableRooms.filter(
      (room) =>
        room.classroom.building.code.toLowerCase().includes(query) ||
        room.classroom.room_number.toLowerCase().includes(query) ||
        `${room.classroom.building.code} ${room.classroom.room_number}`.toLowerCase().includes(query)
    );
  }, [availableRooms, searchQuery]);

  const filteredOccupied = useMemo(() => {
    if (!searchQuery.trim()) return occupiedRooms;
    const query = searchQuery.toLowerCase();
    return occupiedRooms.filter(
      (room) =>
        room.classroom.building.code.toLowerCase().includes(query) ||
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
          filteredAvailable.map((room) => (
            <RoomCard key={room.classroom.id} availability={room} />
          ))
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

            {displayedOccupied.map((room) => (
              <RoomCard key={room.classroom.id} availability={room} />
            ))}

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
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <ThemedText type="title">BeachRooms</ThemedText>
        <ThemedText style={styles.subtitle}>Find empty classrooms at CSULB</ThemedText>
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

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, styles.availableCard]}>
          <ThemedText style={styles.statNumber} darkColor="#fff">
            {availableRooms.length}
          </ThemedText>
          <ThemedText style={styles.statLabel} darkColor="rgba(255,255,255,0.85)">
            Available Now
          </ThemedText>
        </View>
        <View style={[styles.statCard, styles.totalCard]}>
          <ThemedText style={styles.statNumber} darkColor="#fff">
            {availableRooms.length + occupiedRooms.length}
          </ThemedText>
          <ThemedText style={styles.statLabel} darkColor="rgba(255,255,255,0.85)">
            Total Rooms
          </ThemedText>
        </View>
      </View>

      {/* Content */}
      {renderContent()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    marginTop: 16,
    marginBottom: 16,
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
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  availableCard: {
    backgroundColor: '#4a9eba',
  },
  totalCard: {
    backgroundColor: '#5a6268',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    paddingTop: 10,
  },
  statLabel: {
    fontSize: 13,
    marginTop: 6,
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
