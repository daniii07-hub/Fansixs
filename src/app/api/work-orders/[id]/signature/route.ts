import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function PATCH(
  request: Request,
  { params }: Context,
) {
  try {
    const { id } = await params;
    const workOrderId = Number(id);

    if (!Number.isInteger(workOrderId) || workOrderId <= 0) {
      return NextResponse.json(
        { message: "Ogiltigt arbetsorder-ID." },
        { status: 400 },
      );
    }

    const body = await request.json();

    const signature = String(
      body.signature ?? "",
    ).trim();

    if (!signature.startsWith("data:image/")) {
      return NextResponse.json(
        { message: "Ogiltig signatur." },
        { status: 400 },
      );
    }

    const supabase = getSupabase();

    if (!supabase) {
      return NextResponse.json(
        { message: "Supabase saknas." },
        { status: 500 },
      );
    }

    const signedAt = new Date().toISOString();

    const { data, error } = await supabase
      .from("work_orders")
      .update({
        customer_signature: signature,
        signed_at: signedAt,
      })
      .eq("id", workOrderId)
      .select(
        "customer_signature, signed_at",
      )
      .single();

    if (error) {
      return NextResponse.json(
        { message: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      signature: data.customer_signature,
      signedAt: data.signed_at,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Kunde inte spara signaturen.",
      },
      { status: 500 },
    );
  }
}