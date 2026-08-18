import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { renderWorkOrderPdf } from "@/lib/pdf/workOrderPdf";
import type { WorkOrderPdfData } from "@/lib/pdf/pdfTypes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type WorkOrder = {
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
};

type Booking = {
  id: number;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  service: string;
  city: string | null;
  booking_date: string;
  start_time: string;
  end_time: string | null;
  notes: string | null;
};

type Customer = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
};

type Lead = {
  id: number;
  service: string;
  city: string;
};

type ChecklistItem = {
  title: string;
  completed: boolean;
  sort_order: number;
};

type WorkOrderImage = {
  image_url: string;
  image_type: string | null;
  created_at: string;
};

function getSupabaseClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return null;
  }

  return createClient(
    supabaseUrl,
    supabaseSecretKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

function safeFilePart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    const workOrderId = Number(id);

    if (
      !Number.isInteger(workOrderId) ||
      workOrderId <= 0
    ) {
      return NextResponse.json(
        {
          message: "Ogiltigt arbetsorder-ID.",
        },
        {
          status: 400,
        },
      );
    }

    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        {
          message:
            "Supabase-inställningarna saknas.",
        },
        {
          status: 500,
        },
      );
    }

    const {
      data: workOrderData,
      error: workOrderError,
    } = await supabase
      .from("work_orders")
      .select(
        `
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
          completed_at
        `,
      )
      .eq("id", workOrderId)
      .single();

    if (workOrderError || !workOrderData) {
      console.error(
        "PDF work-order lookup error:",
        workOrderError,
      );

      return NextResponse.json(
        {
          message:
            "Arbetsordern kunde inte hittas.",
        },
        {
          status: 404,
        },
      );
    }

    const workOrder =
      workOrderData as WorkOrder;

    let booking: Booking | null = null;
    let customer: Customer | null = null;
    let lead: Lead | null = null;

    if (workOrder.booking_id) {
      const {
        data: bookingData,
        error: bookingError,
      } = await supabase
        .from("bookings")
        .select(
          `
            id,
            customer_name,
            customer_email,
            customer_phone,
            service,
            city,
            booking_date,
            start_time,
            end_time,
            notes
          `,
        )
        .eq("id", workOrder.booking_id)
        .maybeSingle();

      if (bookingError) {
        console.error(
          "PDF booking lookup error:",
          bookingError,
        );
      }

      booking =
        (bookingData as Booking | null) ??
        null;
    }

    if (workOrder.customer_id) {
      const {
        data: customerData,
        error: customerError,
      } = await supabase
        .from("customers")
        .select(
          `
            id,
            name,
            email,
            phone,
            city
          `,
        )
        .eq("id", workOrder.customer_id)
        .maybeSingle();

      if (customerError) {
        console.error(
          "PDF customer lookup error:",
          customerError,
        );
      }

      customer =
        (customerData as Customer | null) ??
        null;
    }

    if (workOrder.lead_id) {
      const {
        data: leadData,
        error: leadError,
      } = await supabase
        .from("leads")
        .select(
          `
            id,
            service,
            city
          `,
        )
        .eq("id", workOrder.lead_id)
        .maybeSingle();

      if (leadError) {
        console.error(
          "PDF lead lookup error:",
          leadError,
        );
      }

      lead = (leadData as Lead | null) ?? null;
    }

    if (!booking) {
      return NextResponse.json(
        {
          message:
            "Bokningen som hör till arbetsordern kunde inte hittas.",
        },
        {
          status: 404,
        },
      );
    }

    const [
      checklistResult,
      imagesResult,
    ] = await Promise.all([
      supabase
        .from("work_order_checklist")
        .select(
          `
            title,
            completed,
            sort_order
          `,
        )
        .eq("work_order_id", workOrder.id)
        .order("sort_order", {
          ascending: true,
        }),
      supabase
        .from("work_order_images")
        .select(
          `
            image_url,
            image_type,
            created_at
          `,
        )
        .eq("work_order_id", workOrder.id)
        .order("created_at", {
          ascending: true,
        }),
    ]);

    if (checklistResult.error) {
      console.error(
        "PDF checklist lookup error:",
        checklistResult.error,
      );
    }

    if (imagesResult.error) {
      console.error(
        "PDF image lookup error:",
        imagesResult.error,
      );
    }

    const checklist =
      (checklistResult.data ??
        []) as ChecklistItem[];

    const images =
      (imagesResult.data ??
        []) as WorkOrderImage[];

    const customerName =
      customer?.name ??
      booking.customer_name ??
      "Okänd kund";

    const customerEmail =
      customer?.email ??
      booking.customer_email ??
      null;

    const customerPhone =
      customer?.phone ??
      booking.customer_phone ??
      null;

    const customerCity =
      booking.city ??
      customer?.city ??
      lead?.city ??
      null;

    const service =
      booking.service ??
      lead?.service ??
      "Tjänst saknas";

    const pdfData: WorkOrderPdfData = {
      workOrderId: workOrder.id,
      status: workOrder.status,

      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
        city: customerCity,
      },

      booking: {
        service,
        bookingDate: booking.booking_date,
        startTime: booking.start_time,
        endTime: booking.end_time,
      },

      assignedTo: workOrder.assigned_to,
      notes:
        workOrder.notes ??
        booking.notes ??
        null,
      aiSummary: workOrder.ai_summary,

      checklist: checklist.map((item) => ({
        title: item.title,
        completed: item.completed,
      })),

      images: images.map((image) => ({
        url: image.image_url,
        type: image.image_type,
      })),

      customerSignature:
        workOrder.customer_signature,
      signedAt: workOrder.signed_at,

      startedAt: workOrder.started_at,
      completedAt: workOrder.completed_at,

      company: {
        name:
          process.env.COMPANY_NAME ??
          "Fansixs",
        email:
          process.env.COMPANY_EMAIL ??
          process.env.LEAD_NOTIFICATION_EMAIL ??
          null,
        phone:
          process.env.COMPANY_PHONE ?? null,
        website:
          process.env.COMPANY_WEBSITE ??
          "fansixs.se",
        organizationNumber:
          process.env.COMPANY_ORG_NUMBER ??
          null,
      },
    };

    const pdfBuffer =
      await renderWorkOrderPdf(pdfData);

    const customerFilePart =
      safeFilePart(customerName) ||
      "kund";

    const fileName =
      `arbetsrapport-${workOrder.id}-${customerFilePart}.pdf`;

    return new NextResponse(
      new Uint8Array(pdfBuffer),
      {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition":
            `attachment; filename="${fileName}"`,
          "Cache-Control":
            "private, no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error(
      "Work-order PDF route error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "PDF-filen kunde inte skapas.",
      },
      {
        status: 500,
      },
    );
  }
}