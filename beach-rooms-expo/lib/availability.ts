import type {
  ClassSchedule,
  ClassroomWithBuilding,
  ClassroomAvailability,
  AvailabilityStatus,
} from '@/types/database';

/**
 * Parse a TIME string (HH:MM:SS or HH:MM) into a Date object for today
 */
export function parseTimeToday(timeString: string, referenceDate: Date = new Date()): Date {
  const parts = timeString.split(':').map(Number);
  const hours = parts[0];
  const minutes = parts[1];
  const seconds = parts[2] ?? 0;
  const date = new Date(referenceDate);
  date.setHours(hours, minutes, seconds, 0);
  return date;
}

/**
 * Check if a building is open based on its stored hours.
 * Only weekday hours are supported; weekends are assumed closed.
 */
export function isBuildingOpen(
  building: ClassroomWithBuilding['building'],
  now: Date = new Date()
): { isOpen: boolean; opensAt: Date | null; closesAt: Date | null } {
  const dayOfWeek = now.getDay();

  // Weekends are closed (0=Sunday, 6=Saturday)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { isOpen: false, opensAt: null, closesAt: null };
  }

  // Weekday hours
  const openTime = building.weekday_open;
  const closeTime = building.weekday_close;

  // No hours set
  if (!openTime || !closeTime) {
    return { isOpen: false, opensAt: null, closesAt: null };
  }

  const opensAt = parseTimeToday(openTime, now);
  const closesAt = parseTimeToday(closeTime, now);

  const isOpen = now >= opensAt && now <= closesAt;

  return { isOpen, opensAt, closesAt };
}

/**
 * Format time until an event
 */
function formatTimeUntil(targetTime: Date, prefix: string): string {
  const hours = targetTime.getHours();
  const minutes = targetTime.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');

  return `${prefix} ${displayHours}:${displayMinutes} ${ampm}`;
}

/**
 * Format how long a room is free for
 */
function formatFreeTime(minutes: number): string {
  if (minutes < 60) {
    return `Free for ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `Free for ${hours}h`;
  }

  return `Free for ${hours}h ${remainingMinutes}m`;
}

/**
 * Calculate availability for a single classroom
 */
export function calculateAvailability(
  classroom: ClassroomWithBuilding,
  schedules: ClassSchedule[],
  now: Date = new Date()
): ClassroomAvailability {
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const buildingStatus = isBuildingOpen(classroom.building, now);

  // If building has no hours for today (weekend or no data)
  if (!buildingStatus.opensAt || !buildingStatus.closesAt) {
    return {
      classroom,
      isAvailable: false,
      isBuildingOpen: false,
      status: 'closed',
      nextClassStartsAt: null,
      currentClassEndsAt: null,
      minutesUntilNextClass: null,
      statusText: isWeekend ? 'Closed on weekends' : 'No classes today',
    };
  }

  // If building hasn't opened yet
  if (now < buildingStatus.opensAt) {
    return {
      classroom,
      isAvailable: false,
      isBuildingOpen: false,
      status: 'closed',
      nextClassStartsAt: buildingStatus.opensAt,
      currentClassEndsAt: null,
      minutesUntilNextClass: null,
      statusText: formatTimeUntil(buildingStatus.opensAt, 'Opens at'),
    };
  }

  // If building is closed (after hours)
  if (now > buildingStatus.closesAt) {
    return {
      classroom,
      isAvailable: false,
      isBuildingOpen: false,
      status: 'closed',
      nextClassStartsAt: null,
      currentClassEndsAt: null,
      minutesUntilNextClass: null,
      statusText: 'Building closed',
    };
  }

  // Check if any class is currently in session
  let currentClass: ClassSchedule | null = null;
  let nextClass: ClassSchedule | null = null;

  for (const schedule of schedules) {
    const startTime = parseTimeToday(schedule.start_time, now);
    const endTime = parseTimeToday(schedule.end_time, now);

    if (now >= startTime && now < endTime) {
      currentClass = schedule;
    } else if (now < startTime) {
      if (!nextClass || startTime < parseTimeToday(nextClass.start_time, now)) {
        nextClass = schedule;
      }
    }
  }

  // If currently in class
  if (currentClass) {
    const endsAt = parseTimeToday(currentClass.end_time, now);
    return {
      classroom,
      isAvailable: false,
      isBuildingOpen: true,
      status: 'in_use',
      nextClassStartsAt: nextClass ? parseTimeToday(nextClass.start_time, now) : null,
      currentClassEndsAt: endsAt,
      minutesUntilNextClass: null,
      statusText: formatTimeUntil(endsAt, 'Available at'),
    };
  }

  // Room is available
  if (nextClass) {
    const nextStartTime = parseTimeToday(nextClass.start_time, now);
    const minutesUntil = Math.floor((nextStartTime.getTime() - now.getTime()) / 60000);

    // If less than 30 minutes until next class, mark as limited
    const status: AvailabilityStatus = minutesUntil < 30 ? 'limited' : 'open';

    return {
      classroom,
      isAvailable: true,
      isBuildingOpen: true,
      status,
      nextClassStartsAt: nextStartTime,
      currentClassEndsAt: null,
      minutesUntilNextClass: minutesUntil,
      statusText: formatFreeTime(minutesUntil),
    };
  }

  // No more classes today
  return {
    classroom,
    isAvailable: true,
    isBuildingOpen: true,
    status: 'open',
    nextClassStartsAt: null,
    currentClassEndsAt: null,
    minutesUntilNextClass: null,
    statusText: 'Available all day',
  };
}

/**
 * Get status badge color based on availability status
 */
export function getStatusColor(status: AvailabilityStatus): string {
  switch (status) {
    case 'open':
      return '#28a745'; // Green
    case 'in_use':
      return '#dc3545'; // Red
    case 'limited':
      return '#ffc107'; // Yellow/Amber
    case 'closed':
      return '#6c757d'; // Gray
  }
}

/**
 * Get display label for status
 */
export function getStatusLabel(status: AvailabilityStatus): string {
  switch (status) {
    case 'open':
      return 'Open';
    case 'in_use':
      return 'In Use';
    case 'limited':
      return 'Limited';
    case 'closed':
      return 'Closed';
  }
}
