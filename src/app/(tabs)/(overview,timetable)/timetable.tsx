import { router } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  useWindowDimensions,
  View,
} from "react-native";

import { EmptyState } from "@/components/empty-state";
import { Screen } from "@/components/screen";
import { colors } from "@/constants/colors";
import { useLessons, usePeriods, useSubjects } from "@/db/queries";
import { isoWeekday, SCHOOL_WEEKDAYS, today, weekdayName, weekdayShort } from "@/lib/dates";
import { lessonAt } from "@/lib/schedule";
import { joinDetails } from "@/lib/text";

const GRID_PADDING = 12;
const GAP = 4;
const TIME_COLUMN_WIDTH = 40;

export default function TimetableScreen() {
  // Re-renders on light/dark changes, so Android resolves the native colors again
  useColorScheme();
  // Fixed column width, so a row with free periods lines up with full rows
  const cellWidth =
    (useWindowDimensions().width -
      2 * GRID_PADDING -
      TIME_COLUMN_WIDTH -
      SCHOOL_WEEKDAYS.length * GAP) /
    SCHOOL_WEEKDAYS.length;
  const periods = usePeriods();
  const subjects = useSubjects();
  const lessons = useLessons();

  if (periods.length === 0 || lessons.length === 0) {
    return (
      <Screen title="Stundenplan">
        <EmptyState
          icon={{ ios: "calendar", android: "calendar_view_week" }}
          title="Kein Stundenplan"
          message="Teile deinen Fächern die Lektionen der Woche zu, oder importiere den Stundenplan aus deiner Klasse."
          action={{
            label: "Stundenplan ausfüllen",
            onPress: () => router.push("/settings/timetable"),
          }}
        />
      </Screen>
    );
  }

  const currentWeekday = isoWeekday(today());

  return (
    <Screen title="Stundenplan">
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.grid}>
        <View style={styles.row}>
          <View style={styles.timeColumn} />
          {SCHOOL_WEEKDAYS.map((weekday) => (
            <Text
              key={weekday}
              style={[
                styles.dayLabel,
                { width: cellWidth },
                weekday === currentWeekday && styles.currentDay,
              ]}>
              {weekdayShort(weekday)}
            </Text>
          ))}
        </View>

        {periods.map((period, index) => (
          <View key={period.id} style={styles.row}>
            <View style={styles.timeColumn}>
              <Text style={styles.periodNumber}>{index + 1}</Text>
              <Text style={styles.periodTime}>{period.startTime}</Text>
            </View>
            {SCHOOL_WEEKDAYS.map((weekday) => {
              const lesson = lessonAt(lessons, weekday, period.id);
              const subject = subjects.find((candidate) => candidate.id === lesson?.subjectId);
              if (!lesson || !subject) {
                return <View key={weekday} style={[styles.cell, { width: cellWidth }]} />;
              }
              return (
                <Pressable
                  key={weekday}
                  accessibilityRole="button"
                  accessibilityLabel={joinDetails(
                    subject.name,
                    `${weekdayName(weekday)}, ${index + 1}. Lektion`,
                    lesson.room && `Zimmer ${lesson.room}`
                  )}
                  onPress={() =>
                    router.push({
                      pathname: "/subject/[subjectId]",
                      params: { subjectId: String(subject.id) },
                    })
                  }
                  style={({ pressed }) => [
                    styles.cell,
                    { width: cellWidth, backgroundColor: `${subject.color}33` },
                    pressed && styles.pressed,
                  ]}>
                  <View style={[styles.lesson, { borderColor: subject.color }]}>
                    <Text style={styles.abbreviation} numberOfLines={1}>
                      {subject.abbreviation}
                    </Text>
                    {lesson.room && (
                      <Text style={styles.room} numberOfLines={1}>
                        {lesson.room}
                      </Text>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    padding: GRID_PADDING,
    gap: GAP,
  },
  row: {
    flexDirection: "row",
    gap: GAP,
  },
  timeColumn: {
    width: TIME_COLUMN_WIDTH,
    justifyContent: "center",
  },
  dayLabel: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: colors.secondaryLabel,
    paddingBottom: 4,
  },
  currentDay: {
    color: colors.tint,
  },
  periodNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.label,
    fontVariant: ["tabular-nums"],
  },
  periodTime: {
    fontSize: 11,
    color: colors.secondaryLabel,
    fontVariant: ["tabular-nums"],
  },
  cell: {
    // Grows with large text sizes; the cells of a row stretch to the same height
    minHeight: 52,
    borderRadius: 8,
    borderCurve: "continuous",
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.6,
  },
  lesson: {
    flex: 1,
    borderLeftWidth: 3,
    paddingHorizontal: 4,
    justifyContent: "center",
  },
  abbreviation: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.label,
  },
  room: {
    fontSize: 11,
    color: colors.secondaryLabel,
  },
});
