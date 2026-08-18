export function formatDateTime(
  value: string | null,
) {
  if (!value) {
    return "Ej registrerat";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Ogiltigt datum";
  }

  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function formatBookingDate(
  value: string,
) {
  const date = new Date(
    `${value}T12:00:00`,
  );

  if (Number.isNaN(date.getTime())) {
    return "Ogiltigt datum";
  }

  return new Intl.DateTimeFormat("sv-SE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatTime(
  value: string,
) {
  return value.slice(0, 5);
}