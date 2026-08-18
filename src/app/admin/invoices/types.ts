export type InvoiceStatus =
  | "Utkast"
  | "Godkänd"
  | "Skickad"
  | "Betald"
  | "Förfallen";

export type DeductionType =
  | "RUT"
  | "ROT"
  | null;

export type Invoice = {
  id: number;
  work_order_id: number | null;
  customer_id: number | null;

  invoice_number: string | null;
  status: InvoiceStatus;

  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_city: string | null;

  invoice_date: string;
  due_date: string | null;

  subtotal: number;
  vat_amount: number;
  total_amount: number;

  deduction_type: DeductionType;
  deduction_amount: number;

  notes: string | null;

  fortnox_invoice_id: string | null;
  fortnox_invoice_number: string | null;

  created_at: string;
  updated_at: string;
};

export type InvoiceItem = {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  sort_order: number;
};

export type InvoiceWithItems = {
  invoice: Invoice;
  items: InvoiceItem[];
};