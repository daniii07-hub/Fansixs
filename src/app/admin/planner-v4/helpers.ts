export const PLANNER_START_HOUR = 6;
export const PLANNER_END_HOUR = 22;
export const PLANNER_SLOT_MINUTES = 15;
export const PLANNER_SLOT_HEIGHT = 22;

export function toDateKey(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function parseDate(value: string) {
  return new Date(`${value.slice(0, 10)}T12:00:00`);
}

export function addDays(
  date: Date,
  days: number,
) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + days,
  );
}

export function addMonths(
  date: Date,
  months: number,
) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + months,
    1,
  );
}

export function getMonday(date: Date) {
  const copy = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const weekday = copy.getDay();
  const offset =
    weekday === 0 ? -6 : 1 - weekday;

  copy.setDate(copy.getDate() + offset);

  return copy;
}

export function getWeekDates(
  referenceDate: Date,
) {
  const monday = getMonday(referenceDate);

  return Array.from(
    { length: 7 },
    (_, index) =>
      addDays(monday, index),
  );
}

export function formatPlannerDate(
  value: string | Date,
) {
  const date =
    typeof value === "string"
      ? parseDate(value)
      : value;

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(
    "sv-SE",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    },
  ).format(date);
}

export function formatPlannerMonth(
  value: string | Date,
) {
  const date =
    typeof value === "string"
      ? parseDate(value)
      : value;

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat(
    "sv-SE",
    {
      month: "long",
      year: "numeric",
    },
  ).format(date);
}

export function parseTimeToMinutes(
  value?: string | null,
) {
  if (!value) {
    return null;
  }

  const [hours, minutes] = value
    .slice(0, 5)
    .split(":")
    .map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes)
  ) {
    return null;
  }

  return hours * 60 + minutes;
}

export function minutesToTime(
  value: number,
) {
  const normalized = Math.max(
    0,
    Math.min(value, 23 * 60 + 59),
  );

  const hours = Math.floor(
    normalized / 60,
  );

  const minutes =
    normalized % 60;

  return `${String(hours).padStart(
    2,
    "0",
  )}:${String(minutes).padStart(
    2,
    "0",
  )}`;
}

export function formatTimeRange(
  startTime?: string | null,
  endTime?: string | null,
) {
  if (!startTime) {
    return "Tid saknas";
  }

  const start = startTime.slice(0, 5);

  if (!endTime) {
    return start;
  }

  return `${start}–${endTime.slice(0, 5)}`;
}

export function roundToPlannerSlot(
  minutes: number,
) {
  return Math.round(
    minutes / PLANNER_SLOT_MINUTES,
  ) * PLANNER_SLOT_MINUTES;
}

export function getPlannerTotalHeight() {
  const totalMinutes =
    (PLANNER_END_HOUR -
      PLANNER_START_HOUR) *
    60;

  return (
    (totalMinutes /
      PLANNER_SLOT_MINUTES) *
    PLANNER_SLOT_HEIGHT
  );
}

export function getInitials(
  value?: string | null,
) {
  if (!value?.trim()) {
    return "?";
  }

  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part[0]?.toUpperCase(),
    )
    .join("");
}