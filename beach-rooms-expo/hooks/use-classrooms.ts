import { useCallback, useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';
import { calculateAvailability } from '@/lib/availability';
import type {
  ClassroomWithBuilding,
  ClassSchedule,
  ClassroomAvailability,
} from '@/types/database';

interface UseClassroomsResult {
  classrooms: ClassroomAvailability[];
  availableRooms: ClassroomAvailability[];
  occupiedRooms: ClassroomAvailability[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useClassrooms(): UseClassroomsResult {
  const [classrooms, setClassrooms] = useState<ClassroomAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClassrooms = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Commented out for testing - using Monday at noon instead
      // const now = new Date();
      // const dayOfWeek = now.getDay();
      
      // Testing: using Monday at noon
      const now = new Date();
      const currentDay = now.getDay();
      const daysUntilMonday = currentDay === 1 ? 0 : (1 + 7 - currentDay) % 7; // Today if Monday, otherwise next Monday
      now.setDate(now.getDate() + daysUntilMonday);
      now.setHours(12, 0, 0, 0); // Set to noon
      const dayOfWeek = 1; // Monday

      // Fetch classrooms with building info
      const { data: classroomsData, error: classroomsError } = await supabase
        .from('classrooms')
        .select(`*, building:buildings(*)`)
        .order('room_number');

      if (classroomsError) {
        throw new Error(classroomsError.message);
      }

      // Fetch today's schedules
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('class_schedules')
        .select('*')
        .eq('day_of_week', dayOfWeek)
        .eq('semester', 'Spring 2026');

      if (schedulesError) {
        throw new Error(schedulesError.message);
      }

      const schedules = (schedulesData || []) as ClassSchedule[];

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
          return calculateAvailability(classroomWithBuilding, roomSchedules, now);
        })
        .filter((c): c is ClassroomAvailability => c !== null);

      // Sort: available first, then by building code and room number
      classroomsWithAvailability.sort((a, b) => {
        // Available rooms first
        if (a.isAvailable !== b.isAvailable) {
          return a.isAvailable ? -1 : 1;
        }
        // Then by building code
        const buildingCompare = a.classroom.building.code.localeCompare(
          b.classroom.building.code
        );
        if (buildingCompare !== 0) {
          return buildingCompare;
        }
        // Then by room number
        return a.classroom.room_number.localeCompare(b.classroom.room_number);
      });

      setClassrooms(classroomsWithAvailability);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch classrooms';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClassrooms();
  }, [fetchClassrooms]);

  const availableRooms = classrooms.filter((c) => c.isAvailable);
  const occupiedRooms = classrooms.filter((c) => !c.isAvailable);

  return {
    classrooms,
    availableRooms,
    occupiedRooms,
    isLoading,
    error,
    refetch: fetchClassrooms,
  };
}
