export type WorkOrder = {
  id: number;
  booking_id: number | null;
  customer_id: number | null;
  lead_id: number | null;
  assigned_to: string | null;

  status: string;

  notes: string | null;
  ai_summary: string | null;

  customer_signature: string | null;
  signed_at: string | null;

  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};

export type Booking = {
  id: number;

  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;

  service: string;
  city: string | null;

  booking_date: string;
  start_time: string;
  end_time: string | null;

  status: string;

  notes: string | null;
};

export type Customer = {
  id: number;

  name: string;
  email: string | null;
  phone: string | null;

  city: string | null;
};

export type Lead = {
  id: number;

  service: string;
  city: string;

  desired_date: string;

  status: string;
};

export type WorkOrderImage = {
  image_url: string;
};

export type WorkOrderDetails = {
  workOrder: WorkOrder;
  booking: Booking;
  customer: Customer | null;
  lead: Lead | null;
  savedImageUrls: string[];
};