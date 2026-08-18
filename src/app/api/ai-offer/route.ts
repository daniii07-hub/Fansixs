import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import OpenAI from "openai";

type RequestBody = {
  leadId?: number;
};

type Lead = {
  id: number;
  name: string;
  email: string;
  phone: string;
  service: string;
  size: string;
  property_type: string;
  city: string;
  desired_date: string;
  frequency: string;
};

type OfferResult = {
  title: string;
  introduction: string;
  scope: string;
  priceNote: string;
  nextStep: string;
  emailSubject: string;
  emailBody: string;
};

function isOfferResult(value: unknown): value is OfferResult {
  if (!value || typeof value !== "object") {
    return false;
  }

  const offer = value as Partial<OfferResult>;

  return (
    typeof offer.title === "string" &&
    typeof offer.introduction === "string" &&
    typeof offer.scope === "string" &&
    typeof offer.priceNote === "string" &&
    typeof offer.nextStep === "string" &&
    typeof offer.emailSubject === "string" &&
    typeof offer.emailBody === "string"
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const leadId = body.leadId;

    if (
      !Number.isInteger(leadId) ||
      typeof leadId !== "number" ||
      leadId <= 0
    ) {
      return NextResponse.json(
        {
          message: "Ogiltigt lead-id.",
        },
        {
          status: 400,
        },
      );
    }

    const openAIKey = process.env.OPENAI_API_KEY;

    if (!openAIKey) {
      return NextResponse.json(
        {
          message: "OPENAI_API_KEY saknas på servern.",
        },
        {
          status: 500,
        },
      );
    }

    const supabaseUrl =
      process.env.SUPABASE_URL ??
      process.env.NEXT_PUBLIC_SUPABASE_URL;

    const supabaseSecretKey =
      process.env.SUPABASE_SECRET_KEY ??
      process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
      return NextResponse.json(
        {
          message: "Supabase-inställningarna saknas.",
        },
        {
          status: 500,
        },
      );
    }

    const supabase = createClient(
      supabaseUrl,
      supabaseSecretKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    const { data, error } = await supabase
      .from("leads")
      .select(
        `
          id,
          name,
          email,
          phone,
          service,
          size,
          property_type,
          city,
          desired_date,
          frequency
        `,
      )
      .eq("id", leadId)
      .single();

    if (error || !data) {
      console.error("Kunde inte läsa lead:", error);

      return NextResponse.json(
        {
          message: "Leadet kunde inte hittas.",
        },
        {
          status: 404,
        },
      );
    }

    const lead = data as Lead;

    const openai = new OpenAI({
      apiKey: openAIKey,
    });

    const response = await openai.responses.create({
      model: "gpt-5.5",

      instructions: `
Du är en professionell offertassistent för en svensk städfirma.

Skapa ett kort, tydligt och säljande offertutkast på svenska utifrån kundens uppgifter.

Viktiga regler:
- Hitta aldrig på ett exakt pris.
- Skriv att slutligt pris fastställs efter att företaget har granskat uppgifterna.
- Påstå inte att bokningen är bekräftad.
- Använd ett vänligt och professionellt språk.
- Gör mejlet redo att kopiera och skicka till kunden.
- Använd inte personnummer eller känsliga uppgifter.
- Skriv inte att du är en AI.
      `.trim(),

      input: `
Skapa ett offertutkast för följande kund:

Namn: ${lead.name}
E-post: ${lead.email}
Telefon: ${lead.phone}
Tjänst: ${lead.service}
Storlek: ${lead.size}
Typ av bostad eller lokal: ${lead.property_type}
Ort: ${lead.city}
Önskat datum: ${lead.desired_date}
Frekvens: ${lead.frequency || "Ej angivet"}
      `.trim(),

      max_output_tokens: 900,

      text: {
        format: {
          type: "json_schema",
          name: "cleaning_offer",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,

            properties: {
              title: {
                type: "string",
              },

              introduction: {
                type: "string",
              },

              scope: {
                type: "string",
              },

              priceNote: {
                type: "string",
              },

              nextStep: {
                type: "string",
              },

              emailSubject: {
                type: "string",
              },

              emailBody: {
                type: "string",
              },
            },

            required: [
              "title",
              "introduction",
              "scope",
              "priceNote",
              "nextStep",
              "emailSubject",
              "emailBody",
            ],
          },
        },
      },
    });

    const outputText = response.output_text?.trim();

    if (!outputText) {
      console.error(
        "OpenAI returnerade ingen offerttext:",
        response,
      );

      return NextResponse.json(
        {
          message: "AI:n returnerade inget offertutkast.",
        },
        {
          status: 500,
        },
      );
    }

    let parsedOffer: unknown;

    try {
      parsedOffer = JSON.parse(outputText);
    } catch (parseError) {
      console.error("Kunde inte läsa offertsvaret:", {
        parseError,
        outputText,
      });

      return NextResponse.json(
        {
          message: "Offertutkastet hade ett ogiltigt format.",
        },
        {
          status: 500,
        },
      );
    }

    if (!isOfferResult(parsedOffer)) {
      console.error(
        "Offertutkastet saknade obligatoriska fält:",
        parsedOffer,
      );

      return NextResponse.json(
        {
          message: "Offertutkastet var ofullständigt.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      success: true,
      offer: parsedOffer,
    });
  } catch (error) {
    console.error("AI offer route error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Offertutkastet kunde inte skapas.",
      },
      {
        status: 500,
      },
    );
  }
}