import { Host } from "@expo/ui";
import { router } from "expo-router";
import { useRef, useState } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  type ScrollViewInstance,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

import { EmptyState } from "@/components/empty-state";
import {
  COLUMN_GAP,
  GUTTER_WIDTH,
  LessonTimeline,
  type TimelineDay,
} from "@/components/lesson-timeline";
import { Screen } from "@/components/screen";
import { SegmentedControl } from "@/components/segmented-control";
import { WeekStrip } from "@/components/week-strip";
import { useLessons, usePeriods, useSubjects, useTeachers } from "@/db/queries";
import { useNow } from "@/hooks/use-now";
import { addDays, isoWeekday, SCHOOL_WEEKDAYS } from "@/lib/dates";
import { SCHOOL_ROUTES } from "@/lib/routes";
import { visiblePeriods } from "@/lib/timeline";

const PADDING = 16;
// Points per minute: a 50-minute lesson is 80 pt tall in the day view, 55 pt in the week view
const DAY_SCALE = 1.6;
const WEEK_SCALE = 1.1;

type Mode = "day" | "week";

// The timetable in two views. "Tag" (default) shows one day as a time axis with large cards;
// swiping sideways or tapping a date in the week row changes the day. "Woche" shows all five days
// side by side; tapping a date there opens that day.
export default function TimetableScreen() {
  const { width } = useWindowDimensions();
  const periods = usePeriods();
  const subjects = useSubjects();
  const teachers = useTeachers();
  const lessons = useLessons();
  const now = useNow();
  const pager = useRef<ScrollViewInstance>(null);

  // This week; at the weekend already the coming one
  const todayWeekday = isoWeekday(now.date);
  const monday = addDays(now.date, todayWeekday <= 5 ? 1 - todayWeekday : 8 - todayWeekday);
  const days: TimelineDay[] = SCHOOL_WEEKDAYS.map((weekday) => ({
    weekday,
    date: addDays(monday, weekday - 1),
  }));

  const [mode, setMode] = useState<Mode>("day");
  const [selected, setSelected] = useState(todayWeekday <= 5 ? todayWeekday : 1);

  const shown = visiblePeriods(lessons, periods);
  if (shown.length === 0) {
    return (
      <Screen title="Stundenplan">
        <EmptyState
          icon={{ ios: "calendar", android: "calendar_view_week" }}
          title="Kein Stundenplan"
          message="Teile deinen Fächern die Lektionen der Woche zu."
          action={{
            label: "Stundenplan ausfüllen",
            onPress: () => router.push(SCHOOL_ROUTES.setup.timetable),
          }}
        />
      </Screen>
    );
  }

  const scrollToDay = (weekday: number, animated: boolean) =>
    pager.current?.scrollTo({ x: (weekday - 1) * width, animated });

  const selectDay = (weekday: number) => {
    setSelected(weekday);
    if (mode === "week") {
      setMode("day");
      return;
    }
    scrollToDay(weekday, true);
  };

  const selectPage = (page: number) => {
    const weekday = Math.min(Math.max(page + 1, 1), days.length);
    if (weekday !== selected) setSelected(weekday);
  };

  // When the finger lifts, the week row switches to the day the page will come to rest on, so the
  // circle animates while the page slides into place, like in Calendar. iOS reports where the
  // scroll will end; Android only the swipe direction, as the finger's velocity (negative towards
  // the next day, the opposite of the iOS content velocity).
  const selectDayOfSwipe = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { targetContentOffset, contentOffset, velocity } = nativeEvent;
    if (targetContentOffset) {
      selectPage(Math.round(targetContentOffset.x / width));
      return;
    }
    const towardsNext = (Platform.OS === "android" ? -1 : 1) * (velocity?.x ?? 0);
    const page = contentOffset.x / width;
    selectPage(
      Math.abs(towardsNext) > 0.2
        ? (towardsNext > 0 ? Math.ceil : Math.floor)(page)
        : Math.round(page)
    );
  };

  // The page the scroll came to rest on, in case Android's fling ended elsewhere than guessed
  const selectRestingDay = ({ nativeEvent }: NativeSyntheticEvent<NativeScrollEvent>) =>
    selectPage(Math.round(nativeEvent.contentOffset.x / width));

  const timeline = {
    periods,
    visiblePeriods: shown,
    lessons,
    subjects,
    teachers,
    now,
  };

  return (
    <Screen title="Stundenplan">
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Host matchContents={{ vertical: true }}>
            <SegmentedControl
              value={mode}
              onChange={setMode}
              options={[
                { label: "Tag", value: "day" },
                { label: "Woche", value: "week" },
              ]}
            />
          </Host>
        </View>
        {/* In the week view the days line up with the columns below */}
        <View style={mode === "week" ? styles.week : styles.header}>
          <WeekStrip
            days={days}
            selected={mode === "day" ? selected : null}
            today={now.date}
            onSelect={selectDay}
            inset={mode === "week" ? GUTTER_WIDTH + COLUMN_GAP : 0}
            gap={COLUMN_GAP}
          />
        </View>

        {mode === "day" ? (
          <ScrollView
            ref={pager}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            // Opens on the chosen day without a visible scroll
            onLayout={() => scrollToDay(selected, false)}
            onScrollEndDrag={selectDayOfSwipe}
            onMomentumScrollEnd={selectRestingDay}>
            {days.map((day) => (
              <View key={day.weekday} style={{ width, paddingHorizontal: PADDING }}>
                <LessonTimeline
                  {...timeline}
                  days={[day]}
                  scale={DAY_SCALE}
                  width={width - 2 * PADDING}
                  compact={false}
                />
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.week}>
            <LessonTimeline
              {...timeline}
              days={days}
              scale={WEEK_SCALE}
              width={width - PADDING}
              compact
            />
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 8,
    paddingBottom: 24,
    gap: 16,
  },
  header: {
    paddingHorizontal: PADDING,
    gap: 12,
  },
  week: {
    paddingLeft: PADDING / 2,
    paddingRight: PADDING / 2,
  },
});
