import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getSupabase() {
  const url =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const workOrderId = Number(body.workOrderId);
    const notes = String(body.notes ?? "").trim();

    if (!workOrderId) {
      return NextResponse.json(
        {
          message: "Arbetsorder saknas.",
        },
        {
          status: 400,
        },
      );
    }

    if (!notes) {
      return NextResponse.json(
        {
          message: "Anteckningar saknas.",
        },
        {
          status: 400,
        },
      );
    }

    const completion =
      await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content:
              `Du skriver professionella arbetsrapporter
för svenska serviceföretag.

Skriv alltid:

• kort
• professionellt
• inga punktlistor
• naturligt språk
• max 120 ord.`,
          },
          {
            role: "user",
            content: notes,
          },
        ],
      });

    const report =
      completion.choices[0]?.message?.content ??
      "";

    const supabase = getSupabase();

    if (supabase) {
      await supabase
        .from("work_orders")
        .update({
          ai_summary: report,
        })
        .eq("id", workOrderId);
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "AI kunde inte skapa rapport.",
      },
      {
        status: 500,
      },
    );
  }
}