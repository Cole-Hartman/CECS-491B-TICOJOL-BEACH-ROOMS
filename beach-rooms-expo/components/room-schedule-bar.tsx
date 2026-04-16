import { useMemo, useState } from 'react';
import { Dimensions, StyleSheet, TouchableOpacity, View } from 'react-native';

import { HourDetailModal, type ClassSegment } from '@/components/hour-detail-modal';
import { ThemedText } from '@/components/themed-text';
import type { ClassSchedule } from '@/types/database';

const START_HOUR = 8;
const END_HOUR = 22;
const HOURS_PER_ROW = 7;
const BLOCK_GAP = 6;
const HORIZONTAL_PADDING = 32;

const OPEN_COLOR = '#e3f5e9';
const CLASS_COLOR = '#fbdee2';
const LABEL_COLOR = '#78716c';

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function hourLabel(hour: number): string {
  return String(hour % 12 || 12);
}

function hourSuffix(hour: number): string {
  return hour < 12 ? ' am' : ' pm';
}

interface RoomScheduleBarProps {
  schedules: ClassSchedule[];
  now?: Date;
}

export function RoomScheduleBar({ schedules, now = new Date() }: RoomScheduleBarProps) {
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  const screenWidth = Dimensions.get('window').width;
  const blockSize =
    (screenWidth - HORIZONTAL_PADDING - BLOCK_GAP * (HOURS_PER_ROW - 1)) / HOURS_PER_ROW;

  const segments: ClassSegment[] = useMemo(
    () =>
      schedules.map((s) => ({
        startMinutes: timeToMinutes(s.start_time),
        endMinutes: timeToMinutes(s.end_time),
        courseCode: s.course_code,
      })),
    [schedules]
  );

  const currentHour = now.getHours();

  const hours: number[] = [];
  for (let h = START_HOUR; h < END_HOUR; h++) {
    hours.push(h);
  }

  return (
    <>
      <View style={styles.grid}>
        {hours.map((hour) => {
          const hourStart = hour * 60;
          const hourEnd = (hour + 1) * 60;
          const isCurrent = hour === currentHour;

          const overlays = segments
            .filter((s) => s.endMinutes > hourStart && s.startMinutes < hourEnd)
            .map((s) => {
              const clipStart = Math.max(s.startMinutes, hourStart);
              const clipEnd = Math.min(s.endMinutes, hourEnd);
              return {
                leftPct: ((clipStart - hourStart) / 60) * 100,
                widthPct: ((clipEnd - clipStart) / 60) * 100,
              };
            });

          return (
            <TouchableOpacity
              key={hour}
              style={[
                styles.hourBlock,
                {
                  width: blockSize,
                  height: blockSize,
                  backgroundColor: OPEN_COLOR,
                },
                isCurrent && styles.hourBlockCurrent,
              ]}
              onPress={() => setSelectedHour(hour)}
              activeOpacity={0.7}
            >
              {overlays.map((o, i) => (
                <View
                  key={i}
                  style={[
                    styles.classOverlay,
                    {
                      left: `${o.leftPct}%`,
                      width: `${o.widthPct}%`,
                      backgroundColor: CLASS_COLOR,
                    },
                  ]}
                />
              ))}
              <ThemedText style={styles.hourLabel}>
                {hourLabel(hour)}
                <ThemedText style={styles.hourSuffix}>{hourSuffix(hour)}</ThemedText>
              </ThemedText>
            </TouchableOpacity>
          );
        })}
      </View>

      <HourDetailModal
        visible={selectedHour !== null}
        hour={selectedHour}
        segments={segments}
        onClose={() => setSelectedHour(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: BLOCK_GAP,
    marginVertical: 8,
  },
  hourBlock: {
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourBlockCurrent: {
    borderColor: LABEL_COLOR,
    borderWidth: 2,
  },
  classOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
  },
  hourLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: LABEL_COLOR,
  },
  hourSuffix: {
    fontSize: 8,
    fontWeight: '400',
    color: LABEL_COLOR,
    opacity: 0.55,
  },
});
