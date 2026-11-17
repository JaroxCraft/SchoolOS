import { Host } from "@expo/ui";
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
import { useReducedMotion } from "react-native-reanimated";

import { EmptyState } from "@/components/empty-state";
import { COLUMN_GAP, GUTTER_WIDTH, LessonTimeline } from "@/components/lesson-timeline";
import { Screen } from "@/components/screen";
import { SegmentedControl } from "@/components/segmented-control";
import { WeekStrip } from "@/components/week-strip";
import { useLessons, usePeriods, useSubjects, useTeachers } from "@/db/queries";
import { useNow } from "@/hooks/use-now";
import type { Weekday } from "@/lib/dates";
import { openScreen, SCHOOL_ROUTES } from "@/lib/routes";
import { schoolWeek, shownWeekday, visiblePeriods } from "@/lib/schedule";

const PADDING = 16;
// A 50-minute lesson is 80 pt tall in the day view, 55 pt in the week view
const DAY_POINTS_PER_MINUTE = 1.6;
const WEEK_POINTS_PER_MINUTE = 1.1;

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
  const positioned = useRef<{ pager: ScrollViewInstance | null; width: number }>(null);
  const reducedMotion = useReducedMotion();

  // This week; at the weekend already the coming one
  const days = schoolWeek(now.date);

  const [mode, setMode] = useState<Mode>("day");
  const todaySelection = shownWeekday(now.date);
  const [selected, setSelected] = useState(todaySelection);
  // A new day began while the screen waited in its tab: it opens on today again, as when it was
  // opened. The pager is keyed by the date, so it scrolls there on its first layout.
  const [selectedOn, setSelectedOn] = useState(now.date);
  if (selectedOn !== now.date) {
    setSelectedOn(now.date);
    setSelected(todaySelection);
  }

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
            // The editor of the settings sheet, as from a lesson's menu (lessonActions)
            onPress: () => openScreen(SCHOOL_ROUTES.settings.timetable),
          }}
        />
      </Screen>
    );
  }

  const scrollToDay = (weekday: number, animated: boolean) =>
    pager.current?.scrollTo({ x: (weekday - 1) * width, animated });

  const selectDay = (weekday: Weekday) => {
    setSelected(weekday);
    if (mode === "week") {
      setMode("day");
      return;
    }
    scrollToDay(weekday, !reducedMotion);
  };

  const selectPage = (page: number) => {
    const index = Math.min(Math.max(page, 0), days.length - 1);
    const weekday = days[index].weekday;
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
    if (towardsNext > 0.2) selectPage(Math.ceil(page));
    else if (towardsNext < -0.2) selectPage(Math.floor(page));
    else selectPage(Math.round(page));
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
            key={now.date}
            ref={pager}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            // Opens on the chosen day without a visible scroll. Later layouts, e.g. while the
            // timetable grows, would pull a swipe in progress back to the chosen day.
            onLayout={() => {
              const last = positioned.current;
              const isFirstLayoutOrResize =
                last === null || last.pager !== pager.current || last.width !== width;
              if (!isFirstLayoutOrResize) return;
              positioned.current = { pager: pager.current, width };
              scrollToDay(selected, false);
            }}
            onScrollEndDrag={selectDayOfSwipe}
            onMomentumScrollEnd={selectRestingDay}>
            {days.map((day) => (
              <View key={day.weekday} style={{ width, paddingHorizontal: PADDING }}>
                <LessonTimeline
                  {...timeline}
                  days={[day]}
                  pointsPerMinute={DAY_POINTS_PER_MINUTE}
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
              pointsPerMinute={WEEK_POINTS_PER_MINUTE}
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
