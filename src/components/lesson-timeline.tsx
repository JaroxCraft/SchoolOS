import * as Haptics from "expo-haptics";
import { Link } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { LessonMenu } from "@/components/lesson-menu";
import { colors, useNativeColorsRefresh } from "@/constants/colors";
import type { Lesson, Period, Subject, Teacher } from "@/db/schema";
import { minutesOf, minutesToTime } from "@/lib/dates";
import { findById } from "@/lib/find";
import { lessonActions } from "@/lib/lesson-actions";
import { claimOpening, subjectHref } from "@/lib/routes";
import {
  lessonBlocks,
  type LessonBlock,
  type LessonState,
  lessonState,
  type Now,
  periodLabel,
  periodNumber,
  type SchoolDay,
} from "@/lib/schedule";
import { joinDetails } from "@/lib/text";

export const GUTTER_WIDTH = 44;
export const COLUMN_GAP = 4;
// Text grows with the system text size, but the cards have the height of their lessons
const MAX_FONT_SCALE = 1.3;

type LessonTimelineProps = {
  // All periods (for their numbers) and the ones shown
  periods: Period[];
  visiblePeriods: Period[];
  // One day (day view) or the five school days (week view)
  days: SchoolDay[];
  lessons: Lesson[];
  subjects: Subject[];
  teachers: Teacher[];
  // Points per minute
  scale: number;
  width: number;
  compact: boolean;
  now: Now;
};

// Spoken after the lesson, since the outline and dimming only show it
const STATE_LABELS = { past: "vorbei", current: "jetzt", upcoming: undefined } as const;

// The timetable as a time axis, like the day and week views of Calendar: every lesson is a card as
// tall as it lasts, a double lesson one card across the break, breaks and free periods are space.
// On today the current lesson is outlined, past ones are dimmed and a red line marks the time.
export function LessonTimeline({
  periods,
  visiblePeriods,
  days,
  lessons,
  subjects,
  teachers,
  scale,
  width,
  compact,
  now,
}: LessonTimelineProps) {
  useNativeColorsRefresh();
  const start = minutesOf(visiblePeriods[0].startTime);
  // The latest end, not the last period's: an earlier period may end later and must not be clipped
  const end = Math.max(...visiblePeriods.map((period) => minutesOf(period.endTime)));
  const y = (minutes: number) => (minutes - start) * scale;
  const columnWidth = (width - GUTTER_WIDTH - COLUMN_GAP * days.length) / days.length;
  const columnLeft = (index: number) =>
    GUTTER_WIDTH + COLUMN_GAP + index * (columnWidth + COLUMN_GAP);
  const nowVisible = now.minutes >= start && now.minutes <= end;

  return (
    <View style={{ width, height: y(end) + 8 }}>
      {visiblePeriods.map((period) => {
        const number = periodNumber(periods, period.id);
        return (
          <View
            key={period.id}
            style={[styles.periodLine, { top: y(minutesOf(period.startTime)) }]}>
            <View style={styles.gutterLabel}>
              <Text style={styles.periodNumber} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                {number}
              </Text>
              <Text style={styles.periodTime} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                {period.startTime}
              </Text>
            </View>
            <View style={styles.hairline} />
          </View>
        );
      })}

      {days.map((day, index) => {
        const isToday = day.date === now.date;
        const blocks = lessonBlocks(lessons, periods, day.weekday);
        return (
          <View
            key={day.weekday}
            style={[
              styles.column,
              { left: columnLeft(index), width: columnWidth, height: y(end) },
              compact && isToday && styles.todayColumn,
            ]}>
            {blocks.map((block) => {
              const subject = findById(subjects, block.lesson.subjectId);
              if (!subject) return null;
              return (
                <LessonCard
                  key={block.key}
                  block={block}
                  subject={subject}
                  teacher={findById(teachers, subject.teacherId)}
                  compact={compact}
                  top={y(block.start)}
                  height={(block.end - block.start) * scale}
                  state={lessonState(day.date, block, now)}
                />
              );
            })}
            {!compact && blocks.length === 0 && (
              <Text style={styles.free} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                Keine Lektionen
              </Text>
            )}
            {isToday && nowVisible && (
              <View pointerEvents="none" style={[styles.nowLine, { top: y(now.minutes) - 1 }]}>
                <View style={styles.nowDot} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

type LessonCardProps = {
  block: LessonBlock;
  subject: Subject;
  teacher: Teacher | undefined;
  compact: boolean;
  top: number;
  height: number;
  state: LessonState;
};

// A lesson as a card in the subject color. Tapping it opens the subject in this tab; a long press
// offers the actions of every lesson (lessonActions): iOS as the link's context menu, Android as a
// Material menu.
function LessonCard({ block, subject, teacher, compact, top, height, state }: LessonCardProps) {
  const time = `${minutesToTime(block.start)}–${minutesToTime(block.end)}`;
  const details = compact
    ? block.lesson.room
    : joinDetails(time, block.lesson.room, teacher?.abbreviation || undefined);
  const periodsLabel =
    block.firstNumber === block.lastNumber
      ? periodLabel(block.firstNumber)
      : block.lastNumber - block.firstNumber === 1
        ? `${block.firstNumber}. und ${block.lastNumber}. Lektion`
        : `${block.firstNumber}.–${block.lastNumber}. Lektion`;
  // Short cards put the details next to the name
  const twoLines = compact || height >= 52;
  const actions = lessonActions(subject.id);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={[styles.cardSlot, { top: top + 1, height: height - 2 }]}>
      <Link
        href={subjectHref(subject.id)}
        push
        asChild
        // Two cards touched at once open only one subject screen
        onPress={(event) => {
          if (!claimOpening()) event.preventDefault();
        }}>
        <Link.Trigger>
          <Pressable
            style={styles.fill}
            onLongPress={
              Platform.OS === "android"
                ? () => {
                    Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Long_Press);
                    setMenuOpen(true);
                  }
                : undefined
            }
            accessibilityRole="button"
            accessibilityLabel={joinDetails(
              subject.name,
              periodsLabel,
              time,
              block.lesson.room,
              STATE_LABELS[state]
            )}>
            {({ pressed }) => (
              <View
                style={[
                  styles.card,
                  compact ? styles.cardCompact : styles.cardRegular,
                  {
                    backgroundColor: `${subject.color}${state === "current" ? "47" : "2E"}`,
                    borderLeftColor: subject.color,
                  },
                  state === "current" && { borderColor: subject.color, borderWidth: 1.5 },
                  state === "past" && styles.past,
                  pressed && styles.pressed,
                ]}>
                {twoLines ? (
                  <>
                    <Text
                      style={compact ? styles.abbreviation : styles.name}
                      numberOfLines={1}
                      maxFontSizeMultiplier={MAX_FONT_SCALE}>
                      {compact ? subject.abbreviation : subject.name}
                    </Text>
                    {details ? (
                      <Text
                        style={compact ? styles.detailCompact : styles.detail}
                        numberOfLines={1}
                        maxFontSizeMultiplier={MAX_FONT_SCALE}>
                        {details}
                      </Text>
                    ) : null}
                  </>
                ) : (
                  <Text numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>
                    <Text style={styles.name}>{subject.name}</Text>
                    {details ? <Text style={styles.detail}>{`  ${details}`}</Text> : null}
                  </Text>
                )}
              </View>
            )}
          </Pressable>
        </Link.Trigger>
        <Link.Menu title={`${subject.name} · ${periodsLabel}`}>
          {actions.map((action) => (
            <Link.MenuAction key={action.label} icon={action.icon} onPress={action.onPress}>
              {action.label}
            </Link.MenuAction>
          ))}
        </Link.Menu>
      </Link>
      <LessonMenu actions={actions} open={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  periodLine: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  gutterLabel: {
    width: GUTTER_WIDTH,
    marginTop: -2,
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
  hairline: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
  },
  column: {
    position: "absolute",
    top: 0,
  },
  todayColumn: {
    backgroundColor: colors.highlight,
    borderRadius: 8,
    borderCurve: "continuous",
  },
  cardSlot: {
    position: "absolute",
    left: 0,
    right: 0,
  },
  fill: {
    flex: 1,
  },
  card: {
    flex: 1,
    overflow: "hidden",
    borderLeftWidth: 4,
    borderRadius: 8,
    borderCurve: "continuous",
  },
  cardRegular: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 2,
  },
  cardCompact: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  past: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.6,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.label,
  },
  detail: {
    fontSize: 13,
    color: colors.secondaryLabel,
    fontVariant: ["tabular-nums"],
  },
  abbreviation: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.label,
  },
  detailCompact: {
    fontSize: 11,
    color: colors.secondaryLabel,
  },
  free: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 15,
    color: colors.secondaryLabel,
  },
  nowLine: {
    position: "absolute",
    left: -4,
    right: 0,
    height: 2,
    backgroundColor: colors.now,
    justifyContent: "center",
  },
  nowDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: -4,
    backgroundColor: colors.now,
  },
});
