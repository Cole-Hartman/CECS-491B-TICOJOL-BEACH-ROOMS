// Database entity types matching Supabase schema

export interface Building {
  id: string;
  name: string;
  code: string;
  latitude: number;
  longitude: number;
  address: string | null;
  weekday_open: string | null;
  weekday_close: string | null;
  saturday_open: string | null;
  saturday_close: string | null;
  sunday_open: string | null;
  sunday_close: string | null;
  created_at: string;
}

export interface Classroom {
  id: string;
  building_id: string;
  room_number: string;
  capacity: number;
  floor: number | null;
  is_accessible: boolean;
  amenities: string[];
  created_at: string;
  updated_at: string;
}

export interface ClassSchedule {
  id: string;
  classroom_id: string;
  day_of_week: number; // 0-6, Sunday=0
  start_time: string; // TIME format "HH:MM:SS"
  end_time: string;
  semester: string;
  course_code: string | null;
  created_at: string;
}

export interface ClassroomWithBuilding extends Classroom {
  building: Building;
}

export type AvailabilityStatus = 'open' | 'in_use' | 'limited' | 'closed';

export interface ClassroomAvailability {
  classroom: ClassroomWithBuilding;
  isAvailable: boolean;
  isBuildingOpen: boolean;
  status: AvailabilityStatus;
  nextClassStartsAt: Date | null;
  currentClassEndsAt: Date | null;
  minutesUntilNextClass: number | null;
  statusText: string;
}
