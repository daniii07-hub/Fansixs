export function formatPdfDate(value?: string | null) {
  if (!value) {
    return "Ej angivet";
  }

  const date = value.includes("T")
    ? new Date(value)
    : new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "long",
  }).format(date);
}

export function formatPdfDateTime(value?: string | null) {
  if (!value) {
    return "Ej registrerat";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatPdfTime(value?: string | null) {
  if (!value) {
    return "";
  }

  return value.slice(0, 5);
}

export function getTimeRange(
  startTime: string,
  endTime?: string | null,
) {
  const start = formatPdfTime(startTime);
  const end = formatPdfTime(endTime);

  return end ? `${start}–${end}` : start;
}

export function safePdfText(
  value?: string | null,
  fallback = "Ej angivet",
) {
  const cleaned = value?.trim();

  return cleaned || fallback;
}
