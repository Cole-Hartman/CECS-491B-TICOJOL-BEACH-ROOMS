// Test the sorting logic independently
// This mirrors the sorting logic in useClassrooms hook

interface Building {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
}

interface ClassroomWithBuilding {
  id: string;
  room_number: string;
  building: Building;
}

interface ClassroomAvailability {
  classroom: ClassroomWithBuilding;
  isAvailable: boolean;
  distanceMiles: number | null;
}

function sortClassrooms(
  classrooms: ClassroomAvailability[],
  sortByDistance: boolean
): ClassroomAvailability[] {
  return [...classrooms].sort((a, b) => {
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
}

// Helper to create mock classroom availability
function createMockAvailability(
  buildingCode: string,
  roomNumber: string,
  isAvailable: boolean,
  distanceMiles: number | null
): ClassroomAvailability {
  return {
    classroom: {
      id: `${buildingCode}-${roomNumber}`,
      room_number: roomNumber,
      building: {
        id: `building-${buildingCode}`,
        name: `${buildingCode} Building`,
        code: buildingCode,
        latitude: 33.7838,
        longitude: -118.1141,
      },
    },
    isAvailable,
    distanceMiles,
  };
}

describe('Classroom Sorting Logic', () => {
  describe('sortByDistance = true', () => {
    it('sorts available rooms before occupied rooms', () => {
      const rooms = [
        createMockAvailability('LA', '101', false, 0.5),
        createMockAvailability('ECS', '100', true, 0.8),
        createMockAvailability('VEC', '200', true, 0.3),
      ];

      const sorted = sortClassrooms(rooms, true);

      // Available rooms first
      expect(sorted[0].isAvailable).toBe(true);
      expect(sorted[1].isAvailable).toBe(true);
      expect(sorted[2].isAvailable).toBe(false);
    });

    it('sorts available rooms by distance (closest first)', () => {
      const rooms = [
        createMockAvailability('LA', '101', true, 0.8),
        createMockAvailability('ECS', '100', true, 0.3),
        createMockAvailability('VEC', '200', true, 0.5),
      ];

      const sorted = sortClassrooms(rooms, true);

      expect(sorted[0].distanceMiles).toBe(0.3); // ECS
      expect(sorted[1].distanceMiles).toBe(0.5); // VEC
      expect(sorted[2].distanceMiles).toBe(0.8); // LA
    });

    it('sorts rooms with distance before rooms without distance', () => {
      const rooms = [
        createMockAvailability('LA', '101', true, null),
        createMockAvailability('ECS', '100', true, 0.5),
        createMockAvailability('VEC', '200', true, null),
      ];

      const sorted = sortClassrooms(rooms, true);

      expect(sorted[0].distanceMiles).toBe(0.5); // ECS (has distance)
      expect(sorted[1].distanceMiles).toBeNull(); // No distance
      expect(sorted[2].distanceMiles).toBeNull(); // No distance
    });

    it('falls back to alphabetical sorting when distances are equal', () => {
      const rooms = [
        createMockAvailability('VEC', '200', true, 0.5),
        createMockAvailability('ECS', '100', true, 0.5),
        createMockAvailability('LA', '101', true, 0.5),
      ];

      const sorted = sortClassrooms(rooms, true);

      expect(sorted[0].classroom.building.code).toBe('ECS');
      expect(sorted[1].classroom.building.code).toBe('LA');
      expect(sorted[2].classroom.building.code).toBe('VEC');
    });
  });

  describe('sortByDistance = false', () => {
    it('ignores distance and sorts alphabetically', () => {
      const rooms = [
        createMockAvailability('VEC', '200', true, 0.1), // Closest but V
        createMockAvailability('ECS', '100', true, 0.9), // Farthest but E
        createMockAvailability('LA', '101', true, 0.5),  // Middle
      ];

      const sorted = sortClassrooms(rooms, false);

      // Should be alphabetical: ECS, LA, VEC
      expect(sorted[0].classroom.building.code).toBe('ECS');
      expect(sorted[1].classroom.building.code).toBe('LA');
      expect(sorted[2].classroom.building.code).toBe('VEC');
    });

    it('still sorts available rooms before occupied rooms', () => {
      const rooms = [
        createMockAvailability('LA', '101', false, 0.1),
        createMockAvailability('ECS', '100', true, 0.9),
      ];

      const sorted = sortClassrooms(rooms, false);

      expect(sorted[0].isAvailable).toBe(true);  // ECS
      expect(sorted[1].isAvailable).toBe(false); // LA
    });

    it('sorts by room number when building codes match', () => {
      const rooms = [
        createMockAvailability('ECS', '300', true, null),
        createMockAvailability('ECS', '100', true, null),
        createMockAvailability('ECS', '200', true, null),
      ];

      const sorted = sortClassrooms(rooms, false);

      expect(sorted[0].classroom.room_number).toBe('100');
      expect(sorted[1].classroom.room_number).toBe('200');
      expect(sorted[2].classroom.room_number).toBe('300');
    });
  });

  describe('edge cases', () => {
    it('handles empty array', () => {
      const sorted = sortClassrooms([], true);
      expect(sorted).toHaveLength(0);
    });

    it('handles single item', () => {
      const rooms = [createMockAvailability('ECS', '100', true, 0.5)];
      const sorted = sortClassrooms(rooms, true);
      expect(sorted).toHaveLength(1);
      expect(sorted[0].classroom.building.code).toBe('ECS');
    });

    it('handles all rooms with null distance', () => {
      const rooms = [
        createMockAvailability('VEC', '200', true, null),
        createMockAvailability('ECS', '100', true, null),
        createMockAvailability('LA', '101', true, null),
      ];

      const sorted = sortClassrooms(rooms, true);

      // Should fall back to alphabetical
      expect(sorted[0].classroom.building.code).toBe('ECS');
      expect(sorted[1].classroom.building.code).toBe('LA');
      expect(sorted[2].classroom.building.code).toBe('VEC');
    });
  });
});
