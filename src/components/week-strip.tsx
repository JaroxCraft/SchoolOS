import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Pressable, StyleSheet, useColorScheme, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import type { TimelineDay } from "@/components/lesson-timeline";
import { useInk } from "@/hooks/use-ink";
import { weekdayName, weekdayShort } from "@/lib/dates";

const CIRCLE = 36;
// The pop of the selection circle, as a spring with a light overshoot. A tap or swipe starts it,
// so it is a spring and can be interrupted by the next one; it runs on the UI thread.
const POP = { duration: 320, dampingRatio: 0.62 };
// Reduce Motion: the circle only fades
const FADE = { duration: 200 };

export type WeekStripProps = {
  days: TimelineDay[];
  // The day shown in the day view; none in the week view
  selected: number | null;
  today: string;
  onSelect: (weekday: number) => void;
  // Space on the left, so the days line up with the columns of the week view
  inset: number;
  gap: number;
};

// The school days of the week, like the week row of Calendar but without dates, since the
// timetable is the same every week. Today is in the accent color; the chosen day sits on a filled
// circle, in the accent color if it is today and in the text color otherwise, as in Calendar.
export function WeekStrip({ days, selected, today, onSelect, inset, gap }: WeekStripProps) {
  return (
    <View style={[styles.row, { paddingLeft: inset, gap }]}>
      {days.map((day) => (
        <WeekDay
          key={day.weekday}
          weekday={day.weekday}
          selected={day.weekday === selected}
          isToday={day.date === today}
          onSelect={onSelect}
        />
      ))}
    </View>
  );
}

type WeekDayProps = {
  weekday: number;
  selected: boolean;
  isToday: boolean;
  onSelect: (weekday: number) => void;
};

// Every day keeps its circle; selecting a day springs the new circle up from half its size while
// the old one shrinks away at the same time, and the text color follows. The circle already
// selected when the screen opens is simply there.
function WeekDay({ weekday, selected, isToday, onSelect }: WeekDayProps) {
  const ink = useInk();
  const dark = useColorScheme() === "dark";
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    const target = selected ? 1 : 0;
    progress.set(reducedMotion ? withTiming(target, FADE) : withSpring(target, POP));
  }, [selected, reducedMotion, progress]);

  const fill = isToday ? ink.accent : ink.label;
  const textColor = isToday ? ink.accent : ink.label;
  const selectedTextColor = isToday || !dark ? "#FFFFFF" : "#000000";

  const circleStyle = useAnimatedStyle(() => {
    const value = progress.get();
    return {
      opacity: Math.min(Math.max(value, 0), 1),
      transform: [{ scale: reducedMotion ? 1 : 0.5 + 0.5 * value }],
    };
  });
  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.get(), [0, 1], [textColor, selectedTextColor]),
  }));

  return (
    <Pressable
      style={styles.day}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${weekdayName(weekday)}${isToday ? ", heute" : ""}`}
      onPress={() => {
        if (!selected) Haptics.selectionAsync();
        onSelect(weekday);
      }}>
      <View style={styles.circle}>
        <Animated.View style={[styles.fill, { backgroundColor: fill }, circleStyle]} />
        <Animated.Text style={[styles.weekday, textStyle]}>{weekdayShort(weekday)}</Animated.Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  day: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 2,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    alignItems: "center",
    justifyContent: "center",
  },
  fill: {
    ...StyleSheet.absoluteFill,
    borderRadius: CIRCLE / 2,
  },
  weekday: {
    fontSize: 15,
    fontWeight: "600",
  },
});
