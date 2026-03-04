import { useMemo } from 'react';
import type { ClassroomAvailability } from '@/types/database';

export interface BuildingPin {
  id: string;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  hasAvailableRoom: boolean;
  availableCount: number;
  totalRooms: number;
}

export function useBuildingPins(
  classrooms: ClassroomAvailability[]
): BuildingPin[] {
  return useMemo(() => {
    const buildingMap = new Map<string, BuildingPin>();

    for (const room of classrooms) {
      const { building } = room.classroom;
      const existing = buildingMap.get(building.id);

      if (existing) {
        existing.totalRooms += 1;
        if (room.isAvailable) {
          existing.availableCount += 1;
          existing.hasAvailableRoom = true;
        }
      } else {
        buildingMap.set(building.id, {
          id: building.id,
          code: building.code,
          name: building.name,
          latitude: building.latitude,
          longitude: building.longitude,
          hasAvailableRoom: room.isAvailable,
          availableCount: room.isAvailable ? 1 : 0,
          totalRooms: 1,
        });
      }
    }

    return Array.from(buildingMap.values());
  }, [classrooms]);
}
