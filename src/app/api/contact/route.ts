import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs";

type ContactRequest = {
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  message?: string;
};

function cleanValue(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error("RESEND_API_KEY saknas.");

      return NextResponse.json(
        { message: "E-posttjänsten är inte konfigurerad ännu." },
        { status: 500 },
      );
    }

    const body = (await request.json()) as ContactRequest;

    const name = cleanValue(body.name, 100);
    const company = cleanValue(body.company, 150);
    const email = cleanValue(body.email, 200);
    const phone = cleanValue(body.phone, 50);
    const message = cleanValue(body.message, 3000);

    if (!name || !company || !email) {
      return NextResponse.json(
        { message: "Namn, företag och e-post måste fyllas i." },
        { status: 400 },
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: "E-postadressen verkar inte vara giltig." },
        { status: 400 },
      );
    }

    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from: "Fansixs hemsida <onboarding@resend.dev>",
      to: ["dntryhards@gmail.com"],
      replyTo: email,
      subject: `Ny demoförfrågan från ${company}`,
      text: `
Ny demoförfrågan från Fansixs hemsida

Namn: ${name}
Företag: ${company}
E-post: ${email}
Telefon: ${phone || "Inte angivet"}

Vad företaget behöver hjälp med:
${message || "Inte angivet"}
      `.trim(),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
          <h1 style="font-size: 24px; margin-bottom: 24px;">
            Ny demoförfrågan
          </h1>

          <table style="width: 100%; max-width: 600px; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Namn</td>
              <td style="padding: 8px 0;">${name}</td>
            </tr>

            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Företag</td>
              <td style="padding: 8px 0;">${company}</td>
            </tr>

            <tr>
              <td style="padding: 8px 0; font-weight: bold;">E-post</td>
              <td style="padding: 8px 0;">
                <a href="mailto:${email}">${email}</a>
              </td>
            </tr>

            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Telefon</td>
              <td style="padding: 8px 0;">${phone || "Inte angivet"}</td>
            </tr>
          </table>

          <div style="margin-top: 24px;">
            <p style="font-weight: bold; margin-bottom: 8px;">
              Vad företaget behöver hjälp med
            </p>

            <p style="white-space: pre-wrap; background: #f3f4f6; padding: 16px; border-radius: 12px;">
              ${message || "Inte angivet"}
            </p>
          </div>
        </div>
      `,
    });

    if (error) {
      console.error("Resend-fel:", error);

      return NextResponse.json(
        { message: "Det gick inte att skicka förfrågan." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        message: "Förfrågan har skickats.",
        id: data?.id,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Kontaktformulär-fel:", error);

    return NextResponse.json(
      { message: "Ett oväntat fel inträffade." },
      { status: 500 },
    );
  }
}