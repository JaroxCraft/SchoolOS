import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { Screen } from "@/components/screen";
import { colors } from "@/constants/colors";
import { useLessons, usePeriods, useSubjects } from "@/db/queries";
import { isoWeekday, SCHOOL_WEEKDAYS, today, weekdayShort } from "@/lib/dates";
import { lessonAt } from "@/lib/schedule";

const GRID_PADDING = 12;
const GAP = 4;
const TIME_COLUMN_WIDTH = 40;

export default function TimetableScreen() {
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
          message="Erfasse in den Einstellungen dein Lektionenraster, deine Fächer und deine Lektionen."
          action={{ label: "Einrichten", onPress: () => router.push("/settings") }}
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
                  accessibilityLabel={`${subject.name}, ${weekdayShort(weekday)} ${index + 1}. Lektion`}
                  onPress={() =>
                    router.push({
                      pathname: "/timetable/[subjectId]",
                      params: { subjectId: String(subject.id) },
                    })
                  }
                  style={[
                    styles.cell,
                    { width: cellWidth, backgroundColor: `${subject.color}33` },
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
    color: colors.label,
  },
  periodNumber: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.label,
  },
  periodTime: {
    fontSize: 11,
    color: colors.secondaryLabel,
    fontVariant: ["tabular-nums"],
  },
  cell: {
    height: 52,
    borderRadius: 8,
    overflow: "hidden",
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
