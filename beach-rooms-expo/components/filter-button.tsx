import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

interface FilterButtonProps {
  activeFilterCount: number;
  onPress: () => void;
}

export function FilterButton({ activeFilterCount, onPress }: FilterButtonProps) {
  const tintColor = useThemeColor({}, 'tint');
  const iconColor = useThemeColor({}, 'icon');

  const hasFilters = activeFilterCount > 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          { borderColor: hasFilters ? tintColor : iconColor },
          hasFilters && { backgroundColor: `${tintColor}15` },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Ionicons
          name="options-outline"
          size={18}
          color={hasFilters ? tintColor : iconColor}
        />
        <ThemedText
          style={[
            styles.buttonText,
            { color: hasFilters ? tintColor : iconColor },
          ]}
        >
          Filters
        </ThemedText>
        {hasFilters && (
          <View style={[styles.badge, { backgroundColor: tintColor }]}>
            <ThemedText style={styles.badgeText}>{activeFilterCount}</ThemedText>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingLeft: 12,
    paddingRight: 14,
    gap: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 13,
  },
});
