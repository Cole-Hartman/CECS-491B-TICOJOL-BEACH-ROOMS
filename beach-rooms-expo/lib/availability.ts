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
 * Format duration in short form (e.g., "2h" or "1h 30m")
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Format "Free at X for Y" message
 */
function formatFreeAtWithDuration(time: Date, durationMinutes: number): string {
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');

  return `Free at ${displayHours}:${displayMinutes} ${ampm} for ${formatDuration(durationMinutes)}`;
}

/**
 * Format "Free until X (Y)" message for currently available rooms
 */
function formatFreeUntilWithDuration(untilTime: Date, durationMinutes: number): string {
  const hours = untilTime.getHours();
  const minutes = untilTime.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');

  return `Free until ${displayHours}:${displayMinutes} ${ampm} (${formatDuration(durationMinutes)})`;
}

const MIN_USABLE_MINUTES = 30;

interface UsableWindow {
  startsAt: Date;
  durationMinutes: number;
}

/**
 * Find the next time when the room will be free for >= 30 minutes.
 * Returns the start time and duration of the usable window, or null if none.
 */
function findNextUsableWindow(
  schedules: ClassSchedule[],
  fromTime: Date,
  buildingCloses: Date
): UsableWindow | null {
  // Sort future schedules by start time
  const futureSchedules = schedules
    .map((s) => ({
      start: parseTimeToday(s.start_time, fromTime),
      end: parseTimeToday(s.end_time, fromTime),
    }))
    .filter((s) => s.end > fromTime)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  let checkTime = fromTime;

  for (const schedule of futureSchedules) {
    // Check gap between checkTime and this class start
    const gapMinutes = Math.floor((schedule.start.getTime() - checkTime.getTime()) / 60000);

    if (gapMinutes >= MIN_USABLE_MINUTES) {
      // Found a usable gap starting at checkTime, ending at next class
      return { startsAt: checkTime, durationMinutes: gapMinutes };
    }

    // Gap too short, move checkTime to after this class
    checkTime = schedule.end;
  }

  // Check if there's usable time after all classes (before building closes)
  const remainingMinutes = Math.floor((buildingCloses.getTime() - checkTime.getTime()) / 60000);
  if (remainingMinutes >= MIN_USABLE_MINUTES) {
    return { startsAt: checkTime, durationMinutes: remainingMinutes };
  }

  return null; // No usable time today
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

  // If room has no classes today, it's likely locked
  if (schedules.length === 0) {
    return {
      classroom,
      isAvailable: false,
      isBuildingOpen: buildingStatus.isOpen,
      status: 'closed',
      nextClassStartsAt: null,
      currentClassEndsAt: null,
      minutesUntilNextClass: null,
      statusText: 'No classes today',
    };
  }

  // Find current class and next class
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

    // Find when room will actually be usable (>= 30 min gap)
    const nextWindow = findNextUsableWindow(schedules, endsAt, buildingStatus.closesAt);

    return {
      classroom,
      isAvailable: false,
      isBuildingOpen: true,
      status: 'in_use',
      nextClassStartsAt: nextClass ? parseTimeToday(nextClass.start_time, now) : null,
      currentClassEndsAt: endsAt,
      minutesUntilNextClass: null,
      statusText: nextWindow
        ? formatFreeAtWithDuration(nextWindow.startsAt, nextWindow.durationMinutes)
        : 'Busy all day',
    };
  }

  // Room not currently in class - check gap to next class
  if (nextClass) {
    const nextStartTime = parseTimeToday(nextClass.start_time, now);
    const minutesUntil = Math.floor((nextStartTime.getTime() - now.getTime()) / 60000);

    // Only consider available if >= 30 minutes until next class
    if (minutesUntil < MIN_USABLE_MINUTES) {
      // Find when room will actually be usable
      const nextWindow = findNextUsableWindow(schedules, now, buildingStatus.closesAt);

      return {
        classroom,
        isAvailable: false,
        isBuildingOpen: true,
        status: 'limited',
        nextClassStartsAt: nextStartTime,
        currentClassEndsAt: null,
        minutesUntilNextClass: minutesUntil,
        statusText: nextWindow
          ? formatFreeAtWithDuration(nextWindow.startsAt, nextWindow.durationMinutes)
          : 'Busy all day',
      };
    }

    return {
      classroom,
      isAvailable: true,
      isBuildingOpen: true,
      status: 'open',
      nextClassStartsAt: nextStartTime,
      currentClassEndsAt: null,
      minutesUntilNextClass: minutesUntil,
      statusText: formatFreeUntilWithDuration(nextStartTime, minutesUntil),
    };
  }

  // No more classes today - free until building closes
  const minutesUntilClose = Math.floor(
    (buildingStatus.closesAt.getTime() - now.getTime()) / 60000
  );
  return {
    classroom,
    isAvailable: true,
    isBuildingOpen: true,
    status: 'open',
    nextClassStartsAt: null,
    currentClassEndsAt: null,
    minutesUntilNextClass: null,
    statusText: formatFreeUntilWithDuration(buildingStatus.closesAt, minutesUntilClose),
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
