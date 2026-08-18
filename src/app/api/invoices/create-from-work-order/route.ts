import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type CreateInvoiceBody = {
  workOrderId?: number;
};

type WorkOrder = {
  id: number;
  customer_id: number | null;
  booking_id: number | null;
  status: string;
};

type Customer = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  city: string | null;
};

type Booking = {
  id: number;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  service: string;
  city: string | null;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateInvoiceBody;
    const workOrderId = Number(body.workOrderId);

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

    const supabase = getSupabaseServerClient();

    const {
      data: existingInvoice,
      error: existingInvoiceError,
    } = await supabase
      .from("invoices")
      .select("id")
      .eq("work_order_id", workOrderId)
      .maybeSingle();

    if (existingInvoiceError) {
      console.error(
        "Invoice duplicate lookup error:",
        existingInvoiceError,
      );

      return NextResponse.json(
        {
          message:
            "Det gick inte att kontrollera befintliga fakturor.",
        },
        {
          status: 500,
        },
      );
    }

    if (existingInvoice) {
      return NextResponse.json({
        success: true,
        invoiceId: existingInvoice.id,
        alreadyExists: true,
      });
    }

    const {
      data: workOrderData,
      error: workOrderError,
    } = await supabase
      .from("work_orders")
      .select(
        `
          id,
          customer_id,
          booking_id,
          status
        `,
      )
      .eq("id", workOrderId)
      .maybeSingle();

    if (workOrderError) {
      console.error(
        "Work-order lookup error:",
        workOrderError,
      );

      return NextResponse.json(
        {
          message:
            "Arbetsordern kunde inte hämtas.",
        },
        {
          status: 500,
        },
      );
    }

    if (!workOrderData) {
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

    let customer: Customer | null = null;
    let booking: Booking | null = null;

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
          "Customer lookup error:",
          customerError,
        );
      }

      customer =
        (customerData as Customer | null) ??
        null;
    }

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
            city
          `,
        )
        .eq("id", workOrder.booking_id)
        .maybeSingle();

      if (bookingError) {
        console.error(
          "Booking lookup error:",
          bookingError,
        );
      }

      booking =
        (bookingData as Booking | null) ??
        null;
    }

    const customerName =
      customer?.name ??
      booking?.customer_name ??
      "";

    if (!customerName) {
      return NextResponse.json(
        {
          message:
            "Arbetsordern saknar kunduppgifter.",
        },
        {
          status: 400,
        },
      );
    }

    const customerEmail =
      customer?.email ??
      booking?.customer_email ??
      null;

    const customerPhone =
      customer?.phone ??
      booking?.customer_phone ??
      null;

    const customerCity =
      customer?.city ??
      booking?.city ??
      null;

    const service =
      booking?.service ??
      "Utfört arbete";

    const invoiceDate =
      new Date().toISOString().slice(0, 10);

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const {
      data: invoice,
      error: invoiceError,
    } = await supabase
      .from("invoices")
      .insert({
        work_order_id: workOrder.id,
        customer_id: customer?.id ?? null,
        status: "Utkast",
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_city: customerCity,
        invoice_date: invoiceDate,
        due_date: dueDate
          .toISOString()
          .slice(0, 10),
        subtotal: 0,
        vat_amount: 0,
        total_amount: 0,
        deduction_amount: 0,
      })
      .select("id")
      .single();

    if (invoiceError || !invoice) {
      console.error(
        "Invoice insert error:",
        invoiceError,
      );

      return NextResponse.json(
        {
          message:
            invoiceError?.message ??
            "Fakturautkastet kunde inte skapas.",
        },
        {
          status: 500,
        },
      );
    }

    const { error: itemError } = await supabase
      .from("invoice_items")
      .insert({
        invoice_id: invoice.id,
        description: service,
        quantity: 1,
        unit_price: 0,
        vat_rate: 25,
        sort_order: 1,
      });

    if (itemError) {
      console.error(
        "Invoice item insert error:",
        itemError,
      );

      await supabase
        .from("invoices")
        .delete()
        .eq("id", invoice.id);

      return NextResponse.json(
        {
          message:
            "Fakturan skapades men fakturaraden kunde inte sparas.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,
        invoiceId: invoice.id,
        alreadyExists: false,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Create invoice from work-order error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Kunde inte skapa fakturautkast.",
      },
      {
        status: 500,
      },
    );
  }
}