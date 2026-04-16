import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export interface ClassSegment {
  startMinutes: number;
  endMinutes: number;
  courseCode: string | null;
}

interface HourDetailModalProps {
  visible: boolean;
  hour: number | null;
  segments: ClassSegment[];
  onClose: () => void;
}

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const display = h % 12 || 12;
  return `${display}:${m.toString().padStart(2, '0')} ${ampm}`;
}

function formatHourRange(hour: number): string {
  return `${formatMinutes(hour * 60)} - ${formatMinutes((hour + 1) * 60)}`;
}

export function HourDetailModal({ visible, hour, segments, onClose }: HourDetailModalProps) {
  const bgColor = useThemeColor({ light: '#ffffff', dark: '#1f2123' }, 'background');
  const iconColor = useThemeColor({}, 'icon');
  const overlayColor = useThemeColor(
    { light: 'rgba(0,0,0,0.35)', dark: 'rgba(0,0,0,0.6)' },
    'background'
  );

  if (hour === null) {
    return null;
  }

  const hourStart = hour * 60;
  const hourEnd = (hour + 1) * 60;

  const classSegs = segments
    .filter((s) => s.endMinutes > hourStart && s.startMinutes < hourEnd)
    .map((s) => ({
      start: Math.max(s.startMinutes, hourStart),
      end: Math.min(s.endMinutes, hourEnd),
      courseCode: s.courseCode,
      isClass: true,
    }))
    .sort((a, b) => a.start - b.start);

  const rows: { start: number; end: number; courseCode: string | null; isClass: boolean }[] = [];
  let cursor = hourStart;
  for (const c of classSegs) {
    if (c.start > cursor) {
      rows.push({ start: cursor, end: c.start, courseCode: null, isClass: false });
    }
    rows.push(c);
    cursor = Math.max(cursor, c.end);
  }
  if (cursor < hourEnd) {
    rows.push({ start: cursor, end: hourEnd, courseCode: null, isClass: false });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: overlayColor }]} onPress={onClose}>
        <Pressable style={[styles.card, { backgroundColor: bgColor }]} onPress={() => {}}>
          <ThemedText type="defaultSemiBold" style={styles.title}>
            {formatHourRange(hour)}
          </ThemedText>

          <View style={styles.rows}>
            {rows.map((row, i) => (
              <View key={i} style={styles.row}>
                <View style={styles.rowHeader}>
                  <ThemedText style={[styles.rowTime, { color: iconColor }]}>
                    {formatMinutes(row.start)} - {formatMinutes(row.end)}
                  </ThemedText>
                  <ThemedText
                    style={[styles.rowLabel, { color: row.isClass ? '#dc3545' : '#28a745' }]}
                  >
                    {row.isClass ? 'Class' : 'Available'}
                  </ThemedText>
                </View>
                {row.isClass && row.courseCode && (
                  <ThemedText style={[styles.courseCode, { color: iconColor }]}>
                    {row.courseCode}
                  </ThemedText>
                )}
              </View>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  title: {
    fontSize: 18,
    marginBottom: 14,
  },
  rows: {
    gap: 12,
  },
  row: {
    gap: 4,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowTime: {
    fontSize: 14,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  courseCode: {
    fontSize: 13,
  },
});
