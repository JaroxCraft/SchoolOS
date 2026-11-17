import { useState } from "react";

import { AbbreviationField, abbreviationToSave, canSaveNamed } from "@/components/name-fields";
import { TextField } from "@/components/text-field";
import { addTeacher, updateTeacher } from "@/db/actions";
import type { Teacher } from "@/db/schema";
import { teacherAbbreviation } from "@/lib/text";

export function useTeacherDraft(initial?: Teacher) {
  const [teacher, setTeacher] = useState(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [abbreviation, setAbbreviation] = useState(initial?.abbreviation ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [version, setVersion] = useState(0);

  const start = (next?: Teacher) => {
    setTeacher(next);
    setName(next?.name ?? "");
    setAbbreviation(next?.abbreviation ?? "");
    setEmail(next?.email ?? "");
    setVersion((count) => count + 1);
  };

  const save = async (): Promise<number> => {
    const values = {
      name: name.trim(),
      abbreviation: abbreviationToSave(abbreviation, name, teacherAbbreviation),
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
      autoFocus={!teacher}
      autoCapitalize="words"
      onChangeText={setName}
    />,
    <AbbreviationField
      key={`abbreviation-${version}`}
      name={name}
      makeAbbreviation={teacherAbbreviation}
      example="Kürzel, z. B. JRi"
      defaultValue={abbreviation}
      autoCapitalize="none"
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
    canSave: canSaveNamed(dirty, name),
    dirty,
    start,
    save,
  };
}
