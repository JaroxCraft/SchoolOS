import { useState } from "react";

import { TextField } from "@/components/text-field";
import { addTeacher, updateTeacher } from "@/db/actions";
import type { Teacher } from "@/db/schema";
import { teacherAbbreviation } from "@/lib/text";

// A teacher being added or changed, in the teacher form (settings) and right in the teacher
// picker: the fields with their placeholders and limits, whether it can be saved or has changes,
// and saving it with the values tidied up (trimmed, an empty Kürzel made from the name like the
// one of a Fach, an empty email address stored as none).
export function useTeacherDraft(initial?: Teacher) {
  // The teacher the draft changes; undefined for a new one
  const [teacher, setTeacher] = useState(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [abbreviation, setAbbreviation] = useState(initial?.abbreviation ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  // Remounts the fields each time the draft starts over, so they show the values above
  const [version, setVersion] = useState(0);

  // Starts over with a teacher to change, or with an empty draft for a new one
  const start = (next?: Teacher) => {
    setTeacher(next);
    setName(next?.name ?? "");
    setAbbreviation(next?.abbreviation ?? "");
    setEmail(next?.email ?? "");
    setVersion((count) => count + 1);
  };

  // Returns the id of the saved teacher
  const save = async (): Promise<number> => {
    const trimmedName = name.trim();
    const values = {
      name: trimmedName,
      abbreviation: abbreviation.trim() || teacherAbbreviation(trimmedName),
      email: email.trim() || null,
    };
    if (!teacher) return addTeacher(values);
    await updateTeacher(teacher.id, values);
    return teacher.id;
  };

  const fields = [
    <TextField
      key={`name-${version}`}
      placeholder="Name, z. B. Julian Riegger"
      defaultValue={name}
      // A new teacher starts with the name; a change starts where the user taps
      autoFocus={!teacher}
      autoCapitalize="words"
      onChangeText={setName}
    />,
    <TextField
      key={`abbreviation-${version}`}
      placeholder={
        name.trim() ? `Kürzel (sonst «${teacherAbbreviation(name)}»)` : "Kürzel, z. B. JRi"
      }
      defaultValue={abbreviation}
      autoCapitalize="none"
      maxLength={5}
      onChangeText={setAbbreviation}
    />,
    <TextField
      key={`email-${version}`}
      placeholder="E-Mail, z. B. julian.riegger@schule.ch"
      defaultValue={email}
      keyboardType="email-address"
      autoCapitalize="none"
      autoCorrect={false}
      onChangeText={setEmail}
    />,
  ];

  const dirty =
    name !== (teacher?.name ?? "") ||
    abbreviation !== (teacher?.abbreviation ?? "") ||
    email !== (teacher?.email ?? "");

  return {
    fields,
    // ✓ only while there is something to save
    canSave: dirty && name.trim().length > 0,
    dirty,
    start,
    save,
  };
}
