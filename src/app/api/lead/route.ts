import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { Resend } from "resend";

type Lead = {
  name: string;
  phone: string;
  email: string;
  service: string;
  size: string;
  propertyType: string;
  city: string;
  desiredDate: string;
  frequency: string;
};

type LeadRequestBody = {
  lead?: Lead;
};

function isValidLead(value: unknown): value is Lead {
  if (!value || typeof value !== "object") {
    return false;
  }

  const lead = value as Partial<Lead>;

  return (
    typeof lead.name === "string" &&
    typeof lead.phone === "string" &&
    typeof lead.email === "string" &&
    typeof lead.service === "string" &&
    typeof lead.size === "string" &&
    typeof lead.propertyType === "string" &&
    typeof lead.city === "string" &&
    typeof lead.desiredDate === "string" &&
    typeof lead.frequency === "string"
  );
}

function clean(value: string, maxLength = 500) {
  return value.trim().slice(0, maxLength);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createRow(label: string, value: string) {
  return `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #64748b; width: 38%;">
        ${escapeHtml(label)}
      </td>

      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #0f172a; font-weight: 600;">
        ${escapeHtml(value || "Ej angivet")}
      </td>
    </tr>
  `;
}

export async function POST(request: Request) {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    const notificationEmail =
      process.env.LEAD_NOTIFICATION_EMAIL;

    const rawSupabaseUrl =
      process.env.SUPABASE_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL ??
      "";

    const supabaseUrl = rawSupabaseUrl
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/\/rest\/v1\/?$/i, "")
      .replace(/\/$/, "");

    const supabaseSecretKey = (
      process.env.SUPABASE_SECRET_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY ??
      ""
    )
      .trim()
      .replace(/^["']|["']$/g, "");

    if (!resendApiKey) {
      return NextResponse.json(
        {
          message: "RESEND_API_KEY saknas på servern.",
        },
        {
          status: 500,
        },
      );
    }

    if (!notificationEmail) {
      return NextResponse.json(
        {
          message:
            "LEAD_NOTIFICATION_EMAIL saknas på servern.",
        },
        {
          status: 500,
        },
      );
    }

    const body = (await request.json()) as LeadRequestBody;

    if (!isValidLead(body.lead)) {
      return NextResponse.json(
        {
          message: "Offertuppgifterna är ogiltiga.",
        },
        {
          status: 400,
        },
      );
    }

    const lead: Lead = {
      name: clean(body.lead.name, 100),
      phone: clean(body.lead.phone, 50),
      email: clean(body.lead.email, 150),
      service: clean(body.lead.service, 100),
      size: clean(body.lead.size, 100),
      propertyType: clean(body.lead.propertyType, 100),
      city: clean(body.lead.city, 100),
      desiredDate: clean(body.lead.desiredDate, 100),
      frequency: clean(body.lead.frequency, 100),
    };

    const requiredFields = [
      lead.name,
      lead.phone,
      lead.email,
      lead.service,
      lead.size,
      lead.propertyType,
      lead.city,
      lead.desiredDate,
    ];

    if (requiredFields.some((value) => value.length === 0)) {
      return NextResponse.json(
        {
          message:
            "Offertförfrågan saknar nödvändiga uppgifter.",
        },
        {
          status: 400,
        },
      );
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(lead.email)) {
      return NextResponse.json(
        {
          message: "Kundens e-postadress är ogiltig.",
        },
        {
          status: 400,
        },
      );
    }

    const resend = new Resend(resendApiKey);

    const supabase =
      supabaseUrl && supabaseSecretKey
        ? createClient(supabaseUrl, supabaseSecretKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          })
        : null;

    const rows = [
      createRow("Namn", lead.name),
      createRow("Telefon", lead.phone),
      createRow("E-post", lead.email),
      createRow("Tjänst", lead.service),
      createRow("Storlek", lead.size),
      createRow("Typ", lead.propertyType),
      createRow("Ort", lead.city),
      createRow("Önskat datum", lead.desiredDate),
      createRow("Frekvens", lead.frequency),
    ].join("");

    /*
     * 1. Skicka leadet till företaget.
     */
    const {
      data: companyEmailData,
      error: companyEmailError,
    } = await resend.emails.send({
      from: "Fansixs <info@fansixs.se>",
      to: [notificationEmail],
      replyTo: lead.email,
      subject: `Ny offertförfrågan: ${lead.service} – ${lead.name}`,
      html: `
        <!doctype html>
        <html lang="sv">
          <body style="margin: 0; padding: 0; background: #f8fafc; font-family: Arial, sans-serif;">
            <div style="max-width: 640px; margin: 0 auto; padding: 32px 16px;">
              <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 18px; overflow: hidden;">
                <div style="padding: 28px; background: linear-gradient(135deg, #2563eb, #9333ea);">
                  <p style="margin: 0; color: #ffffff; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
                    Fansixs AI
                  </p>

                  <h1 style="margin: 10px 0 0; color: #ffffff; font-size: 26px;">
                    Ny offertförfrågan
                  </h1>

                  <p style="margin: 10px 0 0; color: #e2e8f0; line-height: 1.6;">
                    AI-medarbetaren har samlat in en komplett förfrågan.
                  </p>
                </div>

                <div style="padding: 28px;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                    ${rows}
                  </table>

                  <div style="margin-top: 24px; padding: 16px; border-radius: 12px; background: #f1f5f9;">
                    <p style="margin: 0; color: #475569; font-size: 13px; line-height: 1.6;">
                      Svara direkt på detta mejl för att kontakta kunden på
                      ${escapeHtml(lead.email)}.
                    </p>
                  </div>
                </div>
              </div>

              <p style="margin: 18px 0 0; text-align: center; color: #94a3b8; font-size: 12px;">
                Skickat automatiskt av Fansixs AI.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
Ny offertförfrågan från Fansixs AI

Namn: ${lead.name}
Telefon: ${lead.phone}
E-post: ${lead.email}
Tjänst: ${lead.service}
Storlek: ${lead.size}
Typ: ${lead.propertyType}
Ort: ${lead.city}
Önskat datum: ${lead.desiredDate}
Frekvens: ${lead.frequency || "Ej angivet"}
      `.trim(),
    });

    if (companyEmailError) {
      console.error(
        "Resend company email error:",
        companyEmailError,
      );

      return NextResponse.json(
        {
          message:
            companyEmailError.message ||
            "Offertförfrågan kunde inte skickas just nu.",
        },
        {
          status: 500,
        },
      );
    }

    /*
     * 2. Spara leadet i Supabase.
     *
     * Mejlen fortsätter fungera även om databasen tillfälligt
     * är felkonfigurerad eller inte kan nås.
     */
    let savedLeadId: number | null = null;
    let databaseSaved = false;
    let databaseErrorMessage: string | null = null;

    if (!supabase) {
      databaseErrorMessage =
        "Supabase saknar SUPABASE_URL eller hemlig servernyckel i .env.local.";

      console.error(
        "Supabase configuration error:",
        databaseErrorMessage,
      );
    } else {
      /*
       * Hitta en befintlig kund via e-post eller skapa en ny.
       * Därefter kopplas leadet till kunden med customer_id.
       */
      let customerId: number | null = null;

      const {
        data: existingCustomer,
        error: existingCustomerError,
      } = await supabase
        .from("customers")
        .select("id")
        .ilike("email", lead.email)
        .limit(1)
        .maybeSingle();

      if (existingCustomerError) {
        console.error(
          "Supabase customer lookup error:",
          existingCustomerError,
        );
      }

      if (existingCustomer?.id) {
        customerId = existingCustomer.id;

        const { error: customerUpdateError } = await supabase
          .from("customers")
          .update({
            name: lead.name,
            phone: lead.phone,
            city: lead.city,
          })
          .eq("id", customerId);

        if (customerUpdateError) {
          console.error(
            "Supabase customer update error:",
            customerUpdateError,
          );
        }
      } else {
        const {
          data: createdCustomer,
          error: customerCreateError,
        } = await supabase
          .from("customers")
          .insert({
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            city: lead.city,
          })
          .select("id")
          .single();

        if (customerCreateError) {
          console.error(
            "Supabase customer create error:",
            customerCreateError,
          );
        } else if (createdCustomer?.id) {
          customerId = createdCustomer.id;
        }
      }

      const { data: savedLead, error: databaseError } =
        await supabase
          .from("leads")
          .insert({
            customer_id: customerId,
            name: lead.name,
            phone: lead.phone,
            email: lead.email,
            service: lead.service,
            size: lead.size,
            property_type: lead.propertyType,
            city: lead.city,
            desired_date: lead.desiredDate,
            frequency: lead.frequency,
          })
          .select("id")
          .single();

      if (databaseError) {
        databaseErrorMessage = databaseError.message;

        console.error(
          "Supabase lead insert error:",
          databaseError,
        );
      } else {
        databaseSaved = true;
        savedLeadId =
          typeof savedLead?.id === "number"
            ? savedLead.id
            : null;
      }
    }

    /*
     * 3. Skicka bekräftelse till kunden.
     */
    const {
      data: customerEmailData,
      error: customerEmailError,
    } = await resend.emails.send({
      from: "Fansixs <info@fansixs.se>",
      to: [lead.email],
      replyTo: "info@fansixs.se",
      subject: `Vi har tagit emot din förfrågan om ${lead.service}`,
      html: `
        <!doctype html>
        <html lang="sv">
          <body style="margin: 0; padding: 0; background: #f8fafc; font-family: Arial, sans-serif;">
            <div style="max-width: 640px; margin: 0 auto; padding: 32px 16px;">
              <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 18px; overflow: hidden;">
                <div style="padding: 28px; background: linear-gradient(135deg, #2563eb, #9333ea);">
                  <p style="margin: 0; color: #ffffff; font-size: 13px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">
                    Fansixs
                  </p>

                  <h1 style="margin: 10px 0 0; color: #ffffff; font-size: 26px;">
                    Tack för din förfrågan!
                  </h1>

                  <p style="margin: 10px 0 0; color: #e2e8f0; line-height: 1.6;">
                    Vi har tagit emot dina uppgifter.
                  </p>
                </div>

                <div style="padding: 28px;">
                  <p style="margin: 0; color: #0f172a; font-size: 17px; line-height: 1.7;">
                    Hej ${escapeHtml(lead.name)}!
                  </p>

                  <p style="margin: 18px 0 0; color: #475569; font-size: 15px; line-height: 1.7;">
                    Tack för din offertförfrågan om
                    <strong>${escapeHtml(lead.service)}</strong>.
                    Dina uppgifter har tagits emot och företaget kan nu
                    återkomma till dig.
                  </p>

                  <div style="margin-top: 24px; padding: 20px; border-radius: 14px; background: #f8fafc; border: 1px solid #e5e7eb;">
                    <h2 style="margin: 0 0 14px; color: #0f172a; font-size: 17px;">
                      Din förfrågan
                    </h2>

                    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                      ${createRow("Tjänst", lead.service)}
                      ${createRow("Storlek", lead.size)}
                      ${createRow("Typ", lead.propertyType)}
                      ${createRow("Ort", lead.city)}
                      ${createRow(
                        "Önskat datum",
                        lead.desiredDate,
                      )}
                      ${createRow(
                        "Frekvens",
                        lead.frequency,
                      )}
                    </table>
                  </div>

                  <p style="margin: 24px 0 0; color: #475569; font-size: 15px; line-height: 1.7;">
                    Du behöver inte göra något mer just nu.
                  </p>

                  <p style="margin: 24px 0 0; color: #0f172a; font-size: 15px; line-height: 1.7;">
                    Med vänliga hälsningar<br />
                    <strong>Fansixs</strong>
                  </p>
                </div>
              </div>

              <p style="margin: 18px 0 0; text-align: center; color: #94a3b8; font-size: 12px;">
                Detta mejl skickades automatiskt efter din offertförfrågan.
              </p>
            </div>
          </body>
        </html>
      `,
      text: `
Hej ${lead.name}!

Tack för din offertförfrågan om ${lead.service}.

Vi har tagit emot dina uppgifter och företaget kan nu återkomma till dig.

Din förfrågan:
Tjänst: ${lead.service}
Storlek: ${lead.size}
Typ: ${lead.propertyType}
Ort: ${lead.city}
Önskat datum: ${lead.desiredDate}
Frekvens: ${lead.frequency || "Ej angivet"}

Du behöver inte göra något mer just nu.

Med vänliga hälsningar
Fansixs
      `.trim(),
    });

    if (customerEmailError) {
      console.error(
        "Resend customer confirmation error:",
        customerEmailError,
      );
    }

    return NextResponse.json({
      success: true,
      companyEmailId: companyEmailData?.id ?? null,
      databaseSaved,
      databaseError: databaseErrorMessage,
      leadId: savedLeadId,
      customerConfirmationSent: !customerEmailError,
      customerEmailId: customerEmailData?.id ?? null,
    });
  } catch (error) {
    console.error("Lead route error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Ett oväntat fel inträffade när offertförfrågan skulle skickas.",
      },
      {
        status: 500,
      },
    );
  }
}