import { AppStack } from "@/components/app-stack";

// The overview and the timetable tab share this stack, so a subject or a setup step opened from
// either tab is pushed onto that tab's own stack and back returns to where it was opened.
export const unstable_settings = {
  anchor: "index",
  timetable: { anchor: "timetable" },
};

export default AppStack;
