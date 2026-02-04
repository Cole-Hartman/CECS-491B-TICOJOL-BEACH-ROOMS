import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
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

  const { availableRooms, occupiedRooms, isLoading, error, refetch } = useClassrooms();
  const [showAllOccupied, setShowAllOccupied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const displayedOccupied = showAllOccupied
    ? occupiedRooms
    : occupiedRooms.slice(0, INITIAL_OCCUPIED_LIMIT);

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
            {availableRooms.length} rooms
          </ThemedText>
        </View>

        {availableRooms.length === 0 ? (
          <View style={styles.emptySection}>
            <ThemedText style={{ color: iconColor }}>No rooms available right now</ThemedText>
          </View>
        ) : (
          availableRooms.map((room) => (
            <RoomCard key={room.classroom.id} availability={room} />
          ))
        )}

        {/* Occupied Rooms Section */}
        {occupiedRooms.length > 0 && (
          <>
            <View style={[styles.sectionHeader, styles.occupiedHeader]}>
              <ThemedText type="subtitle">Currently Occupied</ThemedText>
              <ThemedText style={[styles.sectionCount, { color: iconColor }]}>
                {occupiedRooms.length} rooms
              </ThemedText>
            </View>

            {displayedOccupied.map((room) => (
              <RoomCard key={room.classroom.id} availability={room} />
            ))}

            {occupiedRooms.length > INITIAL_OCCUPIED_LIMIT && (
              <TouchableOpacity
                style={[styles.showMoreButton, { borderColor: iconColor }]}
                onPress={() => setShowAllOccupied(!showAllOccupied)}
              >
                <ThemedText style={[styles.showMoreText, { color: tintColor }]}>
                  {showAllOccupied
                    ? 'Show Less'
                    : `Show ${occupiedRooms.length - INITIAL_OCCUPIED_LIMIT} More`}
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
      <TouchableOpacity style={[styles.searchBar, { borderColor: iconColor }]}>
        <Ionicons name="search" size={20} color={iconColor} />
        <ThemedText style={[styles.searchText, { color: iconColor }]}>
          Search buildings or rooms...
        </ThemedText>
      </TouchableOpacity>

      {/* Quick Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: tintColor }]}>
          <ThemedText style={styles.statNumber} lightColor="#fff" darkColor="#fff">
            {availableRooms.length}
          </ThemedText>
          <ThemedText style={styles.statLabel} lightColor="#fff" darkColor="#fff">
            Available Now
          </ThemedText>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#6c757d' }]}>
          <ThemedText style={styles.statNumber} lightColor="#fff" darkColor="#fff">
            {availableRooms.length + occupiedRooms.length}
          </ThemedText>
          <ThemedText style={styles.statLabel} lightColor="#fff" darkColor="#fff">
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
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 24,
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginBottom: 24,
  },
  searchText: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
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
