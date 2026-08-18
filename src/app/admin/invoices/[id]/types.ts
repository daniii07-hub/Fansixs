export type InvoiceStatus =
  | "Utkast"
  | "Godkänd"
  | "Skickad"
  | "Betald"
  | "Förfallen";

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

  deduction_type: "RUT" | "ROT" | null;
  deduction_amount: number;

  notes: string | null;

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

export type InvoiceDetails = {
  invoice: Invoice;
  items: InvoiceItem[];
};