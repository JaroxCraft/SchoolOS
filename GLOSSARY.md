# SchoolOS

A school planner for secondary-school students: their timetable, what is due when, and reminders. The terms are German, as in the app.

## School week

**Lektionenraster** (period grid):
The fixed daily sequence of Lektionszeiten of a school, the same on every school day.
_Avoid_: Stundenraster, schedule

**Lektionszeit** (period):
One slot of the Lektionenraster with a start and end time, numbered by its start ("3. Lektion").
_Avoid_: Lektion (when the slot is meant), Stunde

**Stundenplan** (timetable):
The weekly plan of which Fach is taught in which Lektionszeit on which weekday, the same every week.
_Avoid_: Schedule

**Lektion** (lesson):
One Fach in one Lektionszeit on one weekday of the Stundenplan, optionally with a Zimmer.
_Avoid_: Stunde, class

**Doppellektion** (double lesson):
Consecutive Lektionen of the same Fach in the same Zimmer; counts as one Lektion.

**Schultag** (school day):
A day with at least one Lektion in the Stundenplan.

**Schulwoche** (school week):
How the Lektionenraster and the Stundenplan play out on real dates and times: which Lektion is next, which day is the next Schultag, when school ends.

**Fach** (subject):
A school subject with name, Kürzel and colour, optionally taught by a Lehrperson.

**Allgemein**:
What an Eintrag without a Fach is shown as.
_Avoid_: Kein Fach, none

**Lehrperson** (teacher):
A teacher with name, Kürzel and optional e-mail address.
_Avoid_: Lehrer, Lehrkraft

## Einträge

**Eintrag** (entry):
Anything with a date: a Hausaufgabe, Prüfung, Präsentation, Abgabe or something else (Sonstiges).
_Avoid_: Task, Termin, event

**Offen** / **Erledigt** (open / done):
An Eintrag is offen until the student checks it off; then it is erledigt, whatever its type.
_Avoid_: Vergangen, completed

**Überfällig** (overdue):
An Eintrag that is still offen after its date, such as a missed Prüfung that is still to be written.
_Avoid_: Verpasst, past

**Fälligkeit** (due date):
When an Eintrag is due: at the next or the following Lektion of its Fach, or on a chosen date and Lektion; the same for every type.

**Stoff** (topic):
What a Prüfung, Präsentation or Abgabe covers.

**Note** (grade):
A mark from 1 to 6 in a Fach, optionally for a Prüfung, Präsentation or Abgabe, counted in the Semester its date falls into.
_Avoid_: Bewertung, Zensur

**Semester**:
A named school half-year with a start and end date that groups the Noten.

## Reminders and files

**Zusammenfassung** (daily summary):
The daily notification after school of everything offen that is due up to the next Schultag.
_Avoid_: Übersicht (that is the start screen)

**Zweite Erinnerung** (second reminder):
The evening notification repeating the Zusammenfassung while something is still offen.

**Übersicht**:
The start screen with the next Lektionen and every Eintrag that is offen.
_Avoid_: Heute, Dashboard

**Backup**:
A file with all data of the app, for restoring it on another device.

**Stundenplan-Datei** (timetable file):
A file with the Lektionenraster, the Fächer with Lektionen, their Lehrpersonen and the Stundenplan, shared within a class.
