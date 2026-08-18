import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type CreateBookingBody = {
  leadId?: number | null;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  service?: string;
  city?: string;
  bookingDate?: string;
  startTime?: string;
  endTime?: string;
  status?: string;
  notes?: string;
};

const allowedStatuses = [
  "Bekräftad",
  "Väntar",
  "Avbokad",
  "Utförd",
] as const;

type BookingStatus = (typeof allowedStatuses)[number];

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

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function clean(value: string | undefined, maxLength = 500) {
  return value?.trim().slice(0, maxLength) ?? "";
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: string) {
  return /^\d{2}:\d{2}$/.test(value);
}

function getWorkOrderStatus(status: BookingStatus) {
  if (status === "Utförd") {
    return "Utförd";
  }

  return "Planerad";
}

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        {
          message: "Supabase-inställningarna saknas.",
        },
        {
          status: 500,
        },
      );
    }

    const { data, error } = await supabase
      .from("bookings")
      .select(
        `
          id,
          lead_id,
          customer_name,
          customer_email,
          customer_phone,
          service,
          city,
          booking_date,
          start_time,
          end_time,
          status,
          notes,
          created_at
        `,
      )
      .order("booking_date", {
        ascending: true,
      })
      .order("start_time", {
        ascending: true,
      });

    if (error) {
      console.error("Bookings GET error:", error);

      return NextResponse.json(
        {
          message: "Bokningarna kunde inte hämtas.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      success: true,
      bookings: data ?? [],
    });
  } catch (error) {
    console.error("Bookings GET route error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Ett oväntat fel inträffade.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        {
          message: "Supabase-inställningarna saknas.",
        },
        {
          status: 500,
        },
      );
    }

    const body = (await request.json()) as CreateBookingBody;

    const customerName = clean(body.customerName, 100);
    const customerEmail = clean(body.customerEmail, 150);
    const customerPhone = clean(body.customerPhone, 50);
    const service = clean(body.service, 100);
    const city = clean(body.city, 100);
    const bookingDate = clean(body.bookingDate, 10);
    const startTime = clean(body.startTime, 5);
    const endTime = clean(body.endTime, 5);
    const notes = clean(body.notes, 2000);

    const status: BookingStatus = allowedStatuses.includes(
      body.status as BookingStatus,
    )
      ? (body.status as BookingStatus)
      : "Bekräftad";

    if (!customerName) {
      return NextResponse.json(
        {
          message: "Kundens namn saknas.",
        },
        {
          status: 400,
        },
      );
    }

    if (!service) {
      return NextResponse.json(
        {
          message: "Tjänst saknas.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isValidDate(bookingDate)) {
      return NextResponse.json(
        {
          message: "Bokningsdatumet är ogiltigt.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isValidTime(startTime)) {
      return NextResponse.json(
        {
          message: "Starttiden är ogiltig.",
        },
        {
          status: 400,
        },
      );
    }

    if (endTime && !isValidTime(endTime)) {
      return NextResponse.json(
        {
          message: "Sluttiden är ogiltig.",
        },
        {
          status: 400,
        },
      );
    }

    if (endTime && endTime <= startTime) {
      return NextResponse.json(
        {
          message:
            "Sluttiden måste vara senare än starttiden.",
        },
        {
          status: 400,
        },
      );
    }

    const leadId =
      typeof body.leadId === "number" &&
      Number.isInteger(body.leadId) &&
      body.leadId > 0
        ? body.leadId
        : null;

    let customerId: number | null = null;

    if (leadId) {
      const { data: lead, error: leadError } =
        await supabase
          .from("leads")
          .select("customer_id")
          .eq("id", leadId)
          .maybeSingle();

      if (leadError) {
        console.error(
          "Booking lead lookup error:",
          leadError,
        );
      } else if (
        typeof lead?.customer_id === "number"
      ) {
        customerId = lead.customer_id;
      }
    }

    const { data: booking, error: bookingError } =
      await supabase
        .from("bookings")
        .insert({
          lead_id: leadId,
          customer_name: customerName,
          customer_email: customerEmail || null,
          customer_phone: customerPhone || null,
          service,
          city: city || null,
          booking_date: bookingDate,
          start_time: startTime,
          end_time: endTime || null,
          status,
          notes: notes || null,
        })
        .select(
          `
            id,
            lead_id,
            customer_name,
            customer_email,
            customer_phone,
            service,
            city,
            booking_date,
            start_time,
            end_time,
            status,
            notes,
            created_at
          `,
        )
        .single();

    if (bookingError || !booking) {
      console.error(
        "Bookings POST error:",
        bookingError,
      );

      return NextResponse.json(
        {
          message: "Bokningen kunde inte sparas.",
        },
        {
          status: 500,
        },
      );
    }

    let workOrderCreated = false;
    let workOrderId: number | null = null;
    let workOrderError: string | null = null;

    /*
     * Avbokade bokningar ska inte skapa arbetsorder.
     * Alla andra bokningar skapar automatiskt en arbetsorder.
     */
    if (status !== "Avbokad") {
      const {
        data: existingWorkOrder,
        error: existingWorkOrderError,
      } = await supabase
        .from("work_orders")
        .select("id")
        .eq("booking_id", booking.id)
        .maybeSingle();

      if (existingWorkOrderError) {
        console.error(
          "Work order lookup error:",
          existingWorkOrderError,
        );
      }

      if (existingWorkOrder?.id) {
        workOrderCreated = true;
        workOrderId = existingWorkOrder.id;
      } else {
        const {
          data: workOrder,
          error: createWorkOrderError,
        } = await supabase
          .from("work_orders")
          .insert({
            booking_id: booking.id,
            customer_id: customerId,
            lead_id: leadId,
            status: getWorkOrderStatus(status),
            notes: notes || null,
          })
          .select("id")
          .single();

        if (createWorkOrderError) {
          workOrderError = createWorkOrderError.message;

          console.error(
            "Work order create error:",
            createWorkOrderError,
          );
        } else if (workOrder?.id) {
          workOrderCreated = true;
          workOrderId = workOrder.id;
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        booking,
        workOrderCreated,
        workOrderId,
        workOrderError,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Bookings POST route error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Ett oväntat fel inträffade.",
      },
      {
        status: 500,
      },
    );
  }
}