import { getSupabaseServerClient } from "@/lib/supabase/server";
import type {
  Booking,
  Customer,
  Lead,
  WorkOrder,
  WorkOrderDetails,
  WorkOrderImage,
} from "./types";

export async function getWorkOrderDetails(
  workOrderId: number,
): Promise<WorkOrderDetails | null> {
  const supabase = getSupabaseServerClient();

  const { data: workOrderData, error: workOrderError } = await supabase
    .from("work_orders")
    .select(`
      id,
      booking_id,
      customer_id,
      lead_id,
      assigned_to,
      status,
      notes,
      ai_summary,
      customer_signature,
      signed_at,
      started_at,
      completed_at,
      created_at
    `)
    .eq("id", workOrderId)
    .maybeSingle();

  if (workOrderError) throw workOrderError;
  if (!workOrderData) return null;

  const workOrder = workOrderData as WorkOrder;

  const [bookingResult, customerResult, leadResult, imageResult] =
    await Promise.all([
      workOrder.booking_id
        ? supabase.from("bookings").select("*").eq("id", workOrder.booking_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      workOrder.customer_id
        ? supabase.from("customers").select("*").eq("id", workOrder.customer_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      workOrder.lead_id
        ? supabase.from("leads").select("*").eq("id", workOrder.lead_id).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from("work_order_images")
        .select("image_url")
        .eq("work_order_id", workOrder.id)
        .order("created_at"),
    ]);

  if (bookingResult.error) throw bookingResult.error;
  if (!bookingResult.data) return null;

  return {
    workOrder,
    booking: bookingResult.data as Booking,
    customer: (customerResult.data as Customer | null) ?? null,
    lead: (leadResult.data as Lead | null) ?? null,
    savedImageUrls:
      ((imageResult.data as WorkOrderImage[] | null) ?? []).map(
        (image) => image.image_url,
      ),
  };
}