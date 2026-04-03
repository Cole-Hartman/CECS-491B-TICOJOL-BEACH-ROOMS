import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { calculateAvailability } from '@/lib/availability';
import { calculateDistanceMiles } from '@/lib/distance';
import type {
  ClassroomWithBuilding,
  ClassSchedule,
  ClassroomAvailability,
} from '@/types/database';
import type { UserLocation } from '@/hooks/use-location';

const OPENING_SOON_MINUTES = 30;

interface UseClassroomsOptions {
  userLocation?: UserLocation | null;
  filterTime?: Date | null;
  sortByDistance?: boolean;
}

interface UseClassroomsResult {
  classrooms: ClassroomAvailability[];
  availableRooms: ClassroomAvailability[];
  openingSoonRooms: ClassroomAvailability[];
  occupiedRooms: ClassroomAvailability[];
  closedRooms: ClassroomAvailability[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useClassrooms(options: UseClassroomsOptions = {}): UseClassroomsResult {
  const { userLocation, filterTime, sortByDistance = true } = options;
  const [classrooms, setClassrooms] = useState<ClassroomAvailability[]>([]);
  const [testTime, setTestTime] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClassrooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use filterTime if provided, otherwise use current time
      const now = filterTime ?? new Date();
      const dayOfWeek = now.getDay();

      // Fetch classrooms with building info
      const { data: classroomsData, error: classroomsError } = await supabase
        .from('classrooms')
        .select(`*, building:buildings(*)`)
        .order('room_number');

      if (classroomsError) {
        throw new Error(classroomsError.message);
      }

      // Fetch today's schedules with pagination (Supabase has 1000 row limit)
      const allSchedules: ClassSchedule[] = [];
      const pageSize = 1000;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: batch, error: schedulesError } = await supabase
          .from('class_schedules')
          .select('*')
          .eq('day_of_week', dayOfWeek)
          .eq('semester', 'Spring 2026')
          .range(offset, offset + pageSize - 1);

        if (schedulesError) {
          throw new Error(schedulesError.message);
        }

        allSchedules.push(...(batch || []));
        hasMore = (batch?.length || 0) === pageSize;
        offset += pageSize;
      }

      const schedules = allSchedules as ClassSchedule[];
      console.log(`Fetched ${schedules.length} schedules for day ${dayOfWeek}`);

      // Calculate availability for each classroom
      const classroomsWithAvailability = (classroomsData || [])
        .map((classroom) => {
          // Supabase returns building as an object or null
          const classroomWithBuilding = classroom as unknown as ClassroomWithBuilding;
          if (!classroomWithBuilding.building) {
            return null;
          }
          // Filter schedules for this specific room
          const roomSchedules = schedules.filter(
            (s) => s.classroom_id === classroomWithBuilding.id
          );
          const availability = calculateAvailability(classroomWithBuilding, roomSchedules, now);

          // Calculate distance if user location is available
          if (userLocation && classroomWithBuilding.building.latitude && classroomWithBuilding.building.longitude) {
            availability.distanceMiles = calculateDistanceMiles(
              userLocation.latitude,
              userLocation.longitude,
              classroomWithBuilding.building.latitude,
              classroomWithBuilding.building.longitude
            );
          }

          return availability;
        })
        .filter((c): c is ClassroomAvailability => c !== null);

      // Sort: available first, then by distance (if enabled), then alphabetically
      classroomsWithAvailability.sort((a, b) => {
        // Primary: Available rooms first
        if (a.isAvailable !== b.isAvailable) {
          return a.isAvailable ? -1 : 1;
        }

        // Secondary: Distance (closest first) when location available and sorting enabled
        if (sortByDistance) {
          if (a.distanceMiles !== null && b.distanceMiles !== null) {
            const distanceDiff = a.distanceMiles - b.distanceMiles;
            if (Math.abs(distanceDiff) > 0.001) {
              return distanceDiff;
            }
          } else if (a.distanceMiles !== null && b.distanceMiles === null) {
            // Rooms with distance sort before those without
            return -1;
          } else if (a.distanceMiles === null && b.distanceMiles !== null) {
            return 1;
          }
        }

        // Fallback: Alphabetically by building code, then room number
        const buildingCompare = a.classroom.building.code.localeCompare(
          b.classroom.building.code
        );
        if (buildingCompare !== 0) {
          return buildingCompare;
        }
        return a.classroom.room_number.localeCompare(b.classroom.room_number);
      });

      setClassrooms(classroomsWithAvailability);
      setTestTime(now);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch classrooms';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [userLocation, filterTime, sortByDistance]);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  const availableRooms = classrooms.filter((c) => c.isAvailable);

  // Rooms opening soon: currently in use but class ends within 30 minutes
  const now = testTime || new Date();
  const inUseRooms = classrooms.filter((c) => c.status === 'in_use');
  console.log(`[Opening Soon] Test time: ${now.toISOString()}`);
  console.log(`[Opening Soon] In-use rooms: ${inUseRooms.length}`);
  inUseRooms.slice(0, 5).forEach((c) => {
    const minutesUntilFree = c.currentClassEndsAt
      ? Math.floor((c.currentClassEndsAt.getTime() - now.getTime()) / 60000)
      : null;
    console.log(
      `  ${c.classroom.building.code} ${c.classroom.room_number}: ends at ${c.currentClassEndsAt?.toISOString()}, minutes until free: ${minutesUntilFree}`
    );
  });

  const openingSoonRooms = classrooms.filter((c) => {
    if (c.isAvailable || c.status !== 'in_use' || !c.currentClassEndsAt) {
      return false;
    }
    const minutesUntilFree = Math.floor(
      (c.currentClassEndsAt.getTime() - now.getTime()) / 60000
    );
    return minutesUntilFree > 0 && minutesUntilFree <= OPENING_SOON_MINUTES;
  });
  console.log(`[Opening Soon] Found ${openingSoonRooms.length} opening soon rooms`);

  // Occupied rooms: in_use or limited status, excludes those opening soon
  const openingSoonIds = new Set(openingSoonRooms.map((c) => c.classroom.id));
  const occupiedRooms = classrooms.filter(
    (c) =>
      !c.isAvailable &&
      !openingSoonIds.has(c.classroom.id) &&
      (c.status === 'in_use' || c.status === 'limited')
  );

  // Closed rooms: building closed, no classes today, etc.
  const closedRooms = classrooms.filter((c) => c.status === 'closed');

  return {
    classrooms,
    availableRooms,
    openingSoonRooms,
    occupiedRooms,
    closedRooms,
    isLoading,
    error,
    refetch: fetchClassrooms,
  };
}
