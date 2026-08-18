import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  renderInvoicePdf,
  type InvoicePdfData,
} from "@/lib/pdf/invoice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type InvoiceRow = {
  id: number;
  invoice_number: string | null;
  status: string;

  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  customer_city: string | null;

  invoice_date: string;
  due_date: string | null;

  deduction_type: "RUT" | "ROT" | null;
  deduction_amount: number | string | null;

  notes: string | null;
};

type InvoiceItemRow = {
  description: string;
  quantity: number | string;
  unit_price: number | string;
  vat_rate: number | string;
  sort_order: number;
};

function safeFilePart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);
}

function toNumber(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed) ? parsed : 0;
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    const invoiceId = Number(id);

    if (
      !Number.isInteger(invoiceId) ||
      invoiceId <= 0
    ) {
      return NextResponse.json(
        {
          message: "Ogiltigt faktura-ID.",
        },
        {
          status: 400,
        },
      );
    }

    const supabase = getSupabaseServerClient();

    const [
      invoiceResult,
      itemsResult,
    ] = await Promise.all([
      supabase
        .from("invoices")
        .select(
          `
            id,
            invoice_number,
            status,
            customer_name,
            customer_email,
            customer_phone,
            customer_city,
            invoice_date,
            due_date,
            deduction_type,
            deduction_amount,
            notes
          `,
        )
        .eq("id", invoiceId)
        .maybeSingle(),

      supabase
        .from("invoice_items")
        .select(
          `
            description,
            quantity,
            unit_price,
            vat_rate,
            sort_order
          `,
        )
        .eq("invoice_id", invoiceId)
        .order("sort_order", {
          ascending: true,
        }),
    ]);

    if (invoiceResult.error) {
      console.error(
        "Invoice PDF lookup error:",
        invoiceResult.error,
      );

      return NextResponse.json(
        {
          message:
            invoiceResult.error.message,
          error: invoiceResult.error,
        },
        {
          status: 500,
        },
      );
    }

    if (!invoiceResult.data) {
      return NextResponse.json(
        {
          message: "Fakturan kunde inte hittas.",
        },
        {
          status: 404,
        },
      );
    }

    if (itemsResult.error) {
      console.error(
        "Invoice PDF items lookup error:",
        itemsResult.error,
      );

      return NextResponse.json(
        {
          message:
            "Fakturaraderna kunde inte hämtas.",
        },
        {
          status: 500,
        },
      );
    }

    const invoice =
      invoiceResult.data as InvoiceRow;

    const items =
      (itemsResult.data ?? []) as InvoiceItemRow[];

    const pdfItems = items.map((item) => ({
      description: item.description,
      quantity: toNumber(item.quantity),
      unitPrice: toNumber(item.unit_price),
      vatRate: toNumber(item.vat_rate),
    }));

    const subtotal = pdfItems.reduce(
      (sum, item) =>
        sum +
        item.quantity * item.unitPrice,
      0,
    );

    const vatAmount = pdfItems.reduce(
      (sum, item) => {
        const rowSubtotal =
          item.quantity * item.unitPrice;

        return (
          sum +
          rowSubtotal *
            (item.vatRate / 100)
        );
      },
      0,
    );

    const deductionAmount = toNumber(
      invoice.deduction_amount,
    );

    const totalAmount = Math.max(
      0,
      subtotal +
        vatAmount -
        deductionAmount,
    );

    const pdfData: InvoicePdfData = {
      id: invoice.id,
      invoiceNumber:
        invoice.invoice_number,
      status: invoice.status,

      invoiceDate:
        invoice.invoice_date,
      dueDate: invoice.due_date,

      customer: {
        name: invoice.customer_name,
        email: invoice.customer_email,
        phone: invoice.customer_phone,
        city: invoice.customer_city,
      },

      items: pdfItems,

      subtotal,
      vatAmount,
      deductionType:
        invoice.deduction_type,
      deductionAmount,
      totalAmount,

      notes: invoice.notes,

      company: {
        name:
          process.env.COMPANY_NAME ??
          "Fansixs",
        email:
          process.env.COMPANY_EMAIL ??
          null,
        phone:
          process.env.COMPANY_PHONE ??
          null,
        website:
          process.env.COMPANY_WEBSITE ??
          "fansixs.se",
        organizationNumber:
          process.env.COMPANY_ORG_NUMBER ??
          null,
        bankgiro:
          process.env.COMPANY_BANKGIRO ??
          null,
        plusgiro:
          process.env.COMPANY_PLUSGIRO ??
          null,
        swish:
          process.env.COMPANY_SWISH ??
          null,
      },
    };

    const pdfBuffer =
      await renderInvoicePdf(pdfData);

    const customerFilePart =
      safeFilePart(
        invoice.customer_name,
      ) || "kund";

    const invoiceFilePart =
      invoice.invoice_number
        ? safeFilePart(
            invoice.invoice_number,
          )
        : String(invoice.id);

    const fileName =
      `faktura-${invoiceFilePart}-${customerFilePart}.pdf`;

    return new NextResponse(
      new Uint8Array(pdfBuffer),
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/pdf",
          "Content-Disposition":
            `attachment; filename="${fileName}"`,
          "Cache-Control":
            "private, no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error(
      "Invoice PDF route error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "PDF-fakturan kunde inte skapas.",
      },
      {
        status: 500,
      },
    );
  }
}