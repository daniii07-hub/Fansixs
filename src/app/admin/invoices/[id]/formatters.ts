export function formatInvoiceDate(
  value: string | null,
) {
  if (!value) {
    return "Ej angivet";
  }

  const date = new Date(
    value.includes("T")
      ? value
      : `${value}T12:00:00`,
  );

  if (Number.isNaN(date.getTime())) {
    return "Ogiltigt datum";
  }

  return new Intl.DateTimeFormat("sv-SE", {
    dateStyle: "medium",
  }).format(date);
}

export function formatInvoiceDateTime(
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

export function formatCurrency(
  value: number,
) {
  return new Intl.NumberFormat("sv-SE", {
    style: "currency",
    currency: "SEK",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function calculateInvoiceItemSubtotal({
  quantity,
  unit_price,
}: {
  quantity: number;
  unit_price: number;
}) {
  return quantity * unit_price;
}

export function calculateInvoiceItemVat({
  quantity,
  unit_price,
  vat_rate,
}: {
  quantity: number;
  unit_price: number;
  vat_rate: number;
}) {
  const subtotal =
    calculateInvoiceItemSubtotal({
      quantity,
      unit_price,
    });

  return subtotal * (vat_rate / 100);
}