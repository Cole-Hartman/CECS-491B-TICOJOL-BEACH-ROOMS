import { Dimensions, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

import { useThemeColor } from '@/hooks/use-theme-color';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const MAP_EXPANDED_HEIGHT = SCREEN_HEIGHT * 0.4;
const MAP_COLLAPSED_HEIGHT = 24;
const SNAP_THRESHOLD = (MAP_EXPANDED_HEIGHT + MAP_COLLAPSED_HEIGHT) / 2;

interface CollapsibleMapContainerProps {
  children: React.ReactNode;
}

export function CollapsibleMapContainer({
  children,
}: CollapsibleMapContainerProps) {
  const borderColor = useThemeColor({}, 'icon');
  const mapHeight = useSharedValue(MAP_EXPANDED_HEIGHT);
  const startHeight = useSharedValue(MAP_EXPANDED_HEIGHT);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startHeight.value = mapHeight.value;
    })
    .onUpdate((event) => {
      const newHeight = startHeight.value + event.translationY;
      mapHeight.value = Math.max(
        MAP_COLLAPSED_HEIGHT,
        Math.min(MAP_EXPANDED_HEIGHT, newHeight)
      );
    })
    .onEnd(() => {
      const target =
        mapHeight.value < SNAP_THRESHOLD
          ? MAP_COLLAPSED_HEIGHT
          : MAP_EXPANDED_HEIGHT;
      mapHeight.value = withSpring(target, {
        damping: 20,
        stiffness: 200,
      });
    });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    height: mapHeight.value,
  }));

  const animatedMapOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      mapHeight.value,
      [MAP_COLLAPSED_HEIGHT, MAP_COLLAPSED_HEIGHT + 40],
      [0, 1]
    ),
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View style={[styles.container, animatedContainerStyle]}>
        <Animated.View style={[styles.mapContent, animatedMapOpacity]}>
          {children}
        </Animated.View>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.handleContainer}>
          <View style={[styles.handle, { backgroundColor: borderColor }]} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  container: {
    overflow: 'hidden',
  },
  mapContent: {
    ...StyleSheet.absoluteFillObject,
  },
  handleContainer: {
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    opacity: 0.6,
  },
});
