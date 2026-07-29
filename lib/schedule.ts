import { dailySchedule } from "@/data/schedule";
import type { Programme, ProgrammeWithStatus } from "@/types/programme";

const UK_TIME_ZONE = "Europe/London";

export function getUkNow(date = new Date()): Date {
  return new Date(date.toLocaleString("en-GB", { timeZone: UK_TIME_ZONE }));
}

function minutesFromTime(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function programmeBounds(programme: Programme, ukNow: Date): Pick<ProgrammeWithStatus, "startsAt" | "endsAt"> {
  const startMinutes = minutesFromTime(programme.startTime);
  const endMinutes = minutesFromTime(programme.endTime);
  const dayStart = new Date(ukNow);
  dayStart.setHours(0, 0, 0, 0);

  const startsAt = new Date(dayStart.getTime() + startMinutes * 60_000);
  const endsAt = new Date(dayStart.getTime() + (endMinutes === 0 ? 24 * 60 : endMinutes) * 60_000);

  return { startsAt, endsAt };
}

export function withProgrammeStatus(programme: Programme, ukNow = getUkNow()): ProgrammeWithStatus {
  const { startsAt, endsAt } = programmeBounds(programme, ukNow);
  const total = endsAt.getTime() - startsAt.getTime();
  const elapsed = ukNow.getTime() - startsAt.getTime();
  const progress = Math.max(0, Math.min(100, (elapsed / total) * 100));
  return { ...programme, startsAt, endsAt, progress };
}

export function getCurrentProgramme(now = new Date()): ProgrammeWithStatus {
  const ukNow = getUkNow(now);
  const minutes = ukNow.getHours() * 60 + ukNow.getMinutes();
  const current = dailySchedule.find((programme) => {
    const start = minutesFromTime(programme.startTime);
    const end = minutesFromTime(programme.endTime) || 24 * 60;
    return minutes >= start && minutes < end;
  }) ?? dailySchedule[0];
  return withProgrammeStatus(current, ukNow);
}

export function getNextProgramme(now = new Date()): ProgrammeWithStatus {
  const current = getCurrentProgramme(now);
  const currentIndex = dailySchedule.findIndex((programme) => programme.id === current.id);
  const next = dailySchedule[(currentIndex + 1) % dailySchedule.length];
  return withProgrammeStatus(next, getUkNow(now));
}
