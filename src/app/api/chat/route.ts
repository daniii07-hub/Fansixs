import { NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type RequestBody = {
  messages?: ChatMessage[];
};

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

type StructuredAIReply = {
  reply: string;
  leadCompleted: boolean;
  lead: Lead;
};

type OpenAITextContent = {
  type?: string;
  text?: string;
};

type OpenAIOutputItem = {
  type?: string;
  content?: OpenAITextContent[];
};

type OpenAIResponse = {
  output?: OpenAIOutputItem[];
  error?: {
    message?: string;
  };
  incomplete_details?: {
    reason?: string;
  };
};

const SYSTEM_PROMPT = `
Du är en AI-medarbetare och digital säljare för en svensk städfirma.

Ditt mål är att:
1. Hjälpa kunden med frågor om städtjänster.
2. Samla in information för en komplett offertförfrågan.
3. Ställa en tydlig fråga åt gången.
4. Aldrig fråga efter information kunden redan har lämnat.

Du hjälper till med:
- hemstädning
- flyttstädning
- kontorsstädning
- storstädning
- fönsterputs
- återkommande städning

Information som kan behövas:
- tjänst
- bostadens eller lokalens storlek
- villa, lägenhet eller lokal
- ort eller postnummer
- önskat datum
- hur ofta städningen ska ske
- kundens namn
- telefonnummer
- e-postadress

Regler:
- skriv naturlig och professionell svenska
- håll svaren korta och vänliga
- ställ helst bara en fråga åt gången
- bekräfta kort kundens svar innan nästa fråga
- hitta aldrig på exakta priser
- be aldrig om personnummer eller betalningsuppgifter
- påstå aldrig att en riktig bokning eller offert har skickats
- använd en tom sträng för uppgifter som ännu saknas
- behåll alla uppgifter kunden redan har lämnat i lead-objektet
- sätt leadCompleted till false så länge viktig information saknas

För en komplett offertförfrågan måste följande finnas:
- namn
- telefonnummer
- e-postadress
- tjänst
- storlek
- typ av bostad eller lokal
- ort
- önskat datum eller önskat startdatum

Frekvens krävs endast för återkommande städning.

När allt är komplett:
- sätt leadCompleted till true
- sammanfatta uppgifterna kort
- säg att offertförfrågan är redo att skickas vidare
- säg inte att den redan har skickats
`;

function extractOutputText(data: OpenAIResponse): string {
  if (!Array.isArray(data.output)) {
    return "";
  }

  const textParts: string[] = [];

  for (const outputItem of data.output) {
    if (!Array.isArray(outputItem.content)) {
      continue;
    }

    for (const contentItem of outputItem.content) {
      if (
        contentItem.type === "output_text" &&
        typeof contentItem.text === "string"
      ) {
        textParts.push(contentItem.text);
      }
    }
  }

  return textParts.join("\n").trim();
}

function isStructuredReply(value: unknown): value is StructuredAIReply {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<StructuredAIReply>;

  if (
    typeof candidate.reply !== "string" ||
    typeof candidate.leadCompleted !== "boolean" ||
    !candidate.lead ||
    typeof candidate.lead !== "object"
  ) {
    return false;
  }

  const lead = candidate.lead as Partial<Lead>;

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

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          message: "OPENAI_API_KEY saknas på servern.",
        },
        {
          status: 500,
        },
      );
    }

    const body = (await request.json()) as RequestBody;
    const messages = body.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        {
          message: "Inga meddelanden skickades.",
        },
        {
          status: 400,
        },
      );
    }

    const safeMessages = messages
      .filter(
        (message): message is ChatMessage =>
          (message.role === "user" ||
            message.role === "assistant") &&
          typeof message.content === "string" &&
          message.content.trim().length > 0,
      )
      .slice(-20)
      .map((message) => ({
        role: message.role,
        content: message.content.trim().slice(0, 2000),
      }));

    if (safeMessages.length === 0) {
      return NextResponse.json(
        {
          message: "Meddelandena var ogiltiga.",
        },
        {
          status: 400,
        },
      );
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-5.6",
          instructions: SYSTEM_PROMPT,
          input: safeMessages,
          max_output_tokens: 700,
          text: {
            format: {
              type: "json_schema",
              name: "cleaning_lead_response",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  reply: {
                    type: "string",
                  },
                  leadCompleted: {
                    type: "boolean",
                  },
                  lead: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      name: {
                        type: "string",
                      },
                      phone: {
                        type: "string",
                      },
                      email: {
                        type: "string",
                      },
                      service: {
                        type: "string",
                      },
                      size: {
                        type: "string",
                      },
                      propertyType: {
                        type: "string",
                      },
                      city: {
                        type: "string",
                      },
                      desiredDate: {
                        type: "string",
                      },
                      frequency: {
                        type: "string",
                      },
                    },
                    required: [
                      "name",
                      "phone",
                      "email",
                      "service",
                      "size",
                      "propertyType",
                      "city",
                      "desiredDate",
                      "frequency",
                    ],
                  },
                },
                required: [
                  "reply",
                  "leadCompleted",
                  "lead",
                ],
              },
            },
          },
        }),
      },
    );

    const data = (await response.json()) as OpenAIResponse;

    if (!response.ok) {
      console.error("OpenAI API error:", data);

      return NextResponse.json(
        {
          message:
            data.error?.message ||
            "AI-tjänsten kunde inte svara just nu. Försök igen.",
        },
        {
          status: response.status,
        },
      );
    }

    const outputText = extractOutputText(data);

    if (!outputText) {
      console.error("OpenAI returned no readable text:", data);

      return NextResponse.json(
        {
          message:
            data.incomplete_details?.reason ===
            "max_output_tokens"
              ? "AI-svaret blev för långt. Försök igen."
              : "AI:n returnerade inget läsbart svar.",
        },
        {
          status: 500,
        },
      );
    }

    let structuredReply: unknown;

    try {
      structuredReply = JSON.parse(outputText);
    } catch (error) {
      console.error("Could not parse structured reply:", {
        error,
        outputText,
      });

      return NextResponse.json(
        {
          message: "AI-svaret kunde inte behandlas.",
        },
        {
          status: 500,
        },
      );
    }

    if (!isStructuredReply(structuredReply)) {
      console.error(
        "AI returned an invalid structured reply:",
        structuredReply,
      );

      return NextResponse.json(
        {
          message: "AI-svaret hade ett ogiltigt format.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json(structuredReply);
  } catch (error) {
    console.error("Chat route error:", error);

    return NextResponse.json(
      {
        message: "Ett oväntat fel inträffade. Försök igen.",
      },
      {
        status: 500,
      },
    );
  }
}