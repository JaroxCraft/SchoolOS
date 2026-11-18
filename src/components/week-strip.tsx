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

import { MIN_TAP_TARGET } from "@/constants/layout";
import { useInk } from "@/hooks/use-ink";
import { t } from "@/i18n";
import { type Weekday, weekdayName, weekdayShort } from "@/lib/dates";
import type { SchoolDay } from "@/lib/schedule";

const CIRCLE = 36;
const DAY_PADDING = 2;
const DAY_HEIGHT = CIRCLE + 2 * DAY_PADDING;
// Grows the tap target to MIN_TAP_TARGET without moving the day
const HIT_SLOP = (MIN_TAP_TARGET - DAY_HEIGHT) / 2;
const POP = { duration: 320, dampingRatio: 0.62 };
const REDUCED_MOTION_FADE = { duration: 200 };

export type WeekStripProps = {
  days: SchoolDay[];
  selected: number | null;
  today: string;
  onSelect: (weekday: Weekday) => void;
  // Space on the left, so the days line up with the columns of the week view
  inset: number;
  gap: number;
};

export function WeekStrip({ days, selected, today, onSelect, inset, gap }: WeekStripProps) {
  return (
    <View style={[styles.row, { paddingLeft: inset, gap }]} accessibilityRole="tablist">
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
  weekday: Weekday;
  selected: boolean;
  isToday: boolean;
  onSelect: (weekday: Weekday) => void;
};

function WeekDay({ weekday, selected, isToday, onSelect }: WeekDayProps) {
  const ink = useInk();
  const dark = useColorScheme() === "dark";
  const reducedMotion = useReducedMotion();
  const progress = useSharedValue(selected ? 1 : 0);

  useEffect(() => {
    const target = selected ? 1 : 0;
    progress.set(reducedMotion ? withTiming(target, REDUCED_MOTION_FADE) : withSpring(target, POP));
  }, [selected, reducedMotion, progress]);

  const dayColor = isToday ? ink.accent : ink.label;
  const selectedTextColor = isToday || !dark ? "#FFFFFF" : "#000000";

  const circleStyle = useAnimatedStyle(() => {
    const value = progress.get();
    return {
      opacity: Math.min(Math.max(value, 0), 1),
      transform: [{ scale: reducedMotion ? 1 : 0.5 + 0.5 * value }],
    };
  });
  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(progress.get(), [0, 1], [dayColor, selectedTextColor]),
  }));

  return (
    <Pressable
      style={styles.day}
      hitSlop={{ top: HIT_SLOP, bottom: HIT_SLOP }}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={t.school.timetable.dayLabel({ weekday: weekdayName(weekday), isToday })}
      onPress={() => onSelect(weekday)}>
      <View style={styles.circle}>
        <Animated.View style={[styles.fill, { backgroundColor: dayColor }, circleStyle]} />
        <Animated.Text style={[styles.weekday, textStyle]} maxFontSizeMultiplier={1.4}>
          {weekdayShort(weekday)}
        </Animated.Text>
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
    paddingVertical: DAY_PADDING,
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
