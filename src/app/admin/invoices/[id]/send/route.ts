import { NextResponse } from "next/server";
import { Resend } from "resend";
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

function toNumber(
  value: number | string | null | undefined,
) {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed) ? parsed : 0;
}

function safeFilePart(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);
}

export async function POST(
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

    const resendApiKey =
      process.env.RESEND_API_KEY;

    const fromEmail =
      process.env.RESEND_FROM_EMAIL ??
      process.env.COMPANY_EMAIL;

    if (!resendApiKey || !fromEmail) {
      return NextResponse.json(
        {
          message:
            "RESEND_API_KEY eller RESEND_FROM_EMAIL saknas i .env.local.",
        },
        {
          status: 500,
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
        "Invoice email lookup error:",
        invoiceResult.error,
      );

      return NextResponse.json(
        {
          message:
            "Fakturan kunde inte hämtas.",
        },
        {
          status: 500,
        },
      );
    }

    if (!invoiceResult.data) {
      return NextResponse.json(
        {
          message:
            "Fakturan kunde inte hittas.",
        },
        {
          status: 404,
        },
      );
    }

    if (itemsResult.error) {
      console.error(
        "Invoice email items lookup error:",
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

    if (!invoice.customer_email) {
      return NextResponse.json(
        {
          message:
            "Kunden saknar e-postadress.",
        },
        {
          status: 400,
        },
      );
    }

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
          fromEmail,
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

    const resend = new Resend(resendApiKey);

    const subject =
      invoice.invoice_number
        ? `Faktura ${invoice.invoice_number} från Fansixs`
        : `Faktura från Fansixs`;

    const { data: emailData, error: emailError } =
      await resend.emails.send({
        from: fromEmail,
        to: invoice.customer_email,
        subject,
        html: `
          <div style="font-family: Arial, sans-serif; color: #172033; line-height: 1.6;">
            <h1 style="margin-bottom: 16px;">Din faktura från Fansixs</h1>
            <p>Hej ${invoice.customer_name},</p>
            <p>Här kommer din faktura som PDF-bilaga.</p>
            <p><strong>Att betala:</strong> ${new Intl.NumberFormat(
              "sv-SE",
              {
                style: "currency",
                currency: "SEK",
              },
            ).format(totalAmount)}</p>
            ${
              invoice.due_date
                ? `<p><strong>Förfallodatum:</strong> ${invoice.due_date}</p>`
                : ""
            }
            <p>Vänliga hälsningar<br />Fansixs</p>
          </div>
        `,
        attachments: [
          {
            filename: fileName,
            content:
              Buffer.from(pdfBuffer),
          },
        ],
      });

    if (emailError) {
      console.error(
        "Invoice email send error:",
        emailError,
      );

      return NextResponse.json(
        {
          message:
            emailError.message ??
            "Fakturan kunde inte skickas.",
        },
        {
          status: 500,
        },
      );
    }

    const { error: updateError } =
      await supabase
        .from("invoices")
        .update({
          status: "Skickad",
        })
        .eq("id", invoiceId);

    if (updateError) {
      console.error(
        "Invoice status update error:",
        updateError,
      );
    }

    return NextResponse.json({
      success: true,
      emailId: emailData?.id ?? null,
      message:
        "Fakturan har skickats till kunden.",
    });
  } catch (error) {
    console.error(
      "Send invoice email route error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Fakturan kunde inte skickas.",
      },
      {
        status: 500,
      },
    );
  }
}