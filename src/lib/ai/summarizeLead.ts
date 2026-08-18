import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

type Lead = {
  name: string;
  service: string;
  size: string;
  property_type: string;
  city: string;
  desired_date: string;
  frequency: string;
};

export async function summarizeLead(lead: Lead) {
  const prompt = `
Du är en erfaren säljare.

Sammanfatta detta lead på svenska.

Returnera JSON med exakt dessa fält:

summary
recommendation

Lead:

Namn: ${lead.name}
Tjänst: ${lead.service}
Storlek: ${lead.size}
Typ: ${lead.property_type}
Ort: ${lead.city}
Datum: ${lead.desired_date}
Frekvens: ${lead.frequency}
`;

  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: prompt,
    text: {
      format: {
        type: "json_schema",
        name: "lead_summary",
        schema: {
          type: "object",
          properties: {
            summary: {
              type: "string",
            },
            recommendation: {
              type: "string",
            },
          },
          required: ["summary", "recommendation"],
          additionalProperties: false,
        },
      },
    },
  });

  return JSON.parse(response.output_text) as {
    summary: string;
    recommendation: string;
  };
}