import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { EmptyState } from "@/components/empty-state";
import { Screen } from "@/components/screen";
import { colors } from "@/constants/colors";
import { useLessons, usePeriods, useSubjects } from "@/db/queries";
import { isoWeekday, SCHOOL_WEEKDAYS, today, weekdayShort } from "@/lib/dates";

export default function TimetableScreen() {
  const periods = usePeriods();
  const subjects = useSubjects();
  const lessons = useLessons();

  if (periods.length === 0 || lessons.length === 0) {
    return (
      <Screen title="Stundenplan">
        <EmptyState
          title="Kein Stundenplan"
          message="Erfasse in den Einstellungen dein Lektionenraster, deine Fächer und deine Lektionen."
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
              style={[styles.dayLabel, weekday === currentWeekday && styles.currentDay]}>
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
              const lesson = lessons.find(
                (candidate) => candidate.weekday === weekday && candidate.periodId === period.id
              );
              const subject = subjects.find((candidate) => candidate.id === lesson?.subjectId);
              if (!lesson || !subject) {
                return <View key={weekday} style={styles.cell} />;
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
                    styles.lesson,
                    { backgroundColor: `${subject.color}33`, borderColor: subject.color },
                  ]}>
                  <Text style={styles.abbreviation} numberOfLines={1}>
                    {subject.abbreviation}
                  </Text>
                  {lesson.room && (
                    <Text style={styles.room} numberOfLines={1}>
                      {lesson.room}
                    </Text>
                  )}
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
    padding: 12,
    gap: 4,
  },
  row: {
    flexDirection: "row",
    gap: 4,
  },
  timeColumn: {
    width: 40,
    justifyContent: "center",
  },
  dayLabel: {
    flex: 1,
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
    flex: 1,
    height: 52,
    borderRadius: 8,
  },
  lesson: {
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
