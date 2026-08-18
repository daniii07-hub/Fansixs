import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { summarizeLead } from "@/lib/ai/summarizeLead";

type RequestBody = {
  leadId?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;
    const leadId = body.leadId;

    if (!Number.isInteger(leadId) || !leadId || leadId <= 0) {
      return NextResponse.json(
        {
          message: "Ogiltigt lead-id.",
        },
        {
          status: 400,
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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          message: "OPENAI_API_KEY saknas.",
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

    const { data: existingNote, error: existingNoteError } =
      await supabase
        .from("ai_notes")
        .select("id, summary, recommendation, created_at")
        .eq("lead_id", leadId)
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

    if (existingNoteError) {
      console.error(
        "Kunde inte läsa befintlig AI-anteckning:",
        existingNoteError,
      );

      return NextResponse.json(
        {
          message:
            "Kunde inte kontrollera befintlig AI-sammanfattning.",
        },
        {
          status: 500,
        },
      );
    }

    if (existingNote) {
      return NextResponse.json({
        success: true,
        cached: true,
        summary: existingNote.summary,
        recommendation: existingNote.recommendation,
      });
    }

    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select(
        `
          id,
          name,
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

    if (leadError || !lead) {
      console.error("Kunde inte läsa lead:", leadError);

      return NextResponse.json(
        {
          message: "Leadet kunde inte hittas.",
        },
        {
          status: 404,
        },
      );
    }

    const result = await summarizeLead({
      name: lead.name,
      service: lead.service,
      size: lead.size,
      property_type: lead.property_type,
      city: lead.city,
      desired_date: lead.desired_date,
      frequency: lead.frequency,
    });

    const { data: savedNote, error: saveError } =
      await supabase
        .from("ai_notes")
        .insert({
          lead_id: leadId,
          summary: result.summary,
          recommendation: result.recommendation,
        })
        .select("id")
        .single();

    if (saveError) {
      console.error(
        "Kunde inte spara AI-sammanfattningen:",
        saveError,
      );

      return NextResponse.json(
        {
          message:
            "AI-sammanfattningen skapades men kunde inte sparas.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      success: true,
      cached: false,
      noteId: savedNote.id,
      summary: result.summary,
      recommendation: result.recommendation,
    });
  } catch (error) {
    console.error("AI summary route error:", error);

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "AI-sammanfattningen kunde inte skapas.",
      },
      {
        status: 500,
      },
    );
  }
}