import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

function getSupabase() {
  const url =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET(request: Request) {
  const supabase = getSupabase();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase saknas." }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const workOrderId = Number(searchParams.get("workOrderId"));

  const { data, error } = await supabase
    .from("work_order_checklist")
    .select("*")
    .eq("work_order_id", workOrderId)
    .order("sort_order");

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    items: data ?? [],
  });
}

export async function PATCH(request: Request) {
  const supabase = getSupabase();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase saknas." }, { status: 500 });
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from("work_order_checklist")
    .update({ completed: !!body.completed })
    .eq("id", body.itemId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    item: data,
  });
}

export async function PUT(request: Request) {
  const supabase = getSupabase();

  if (!supabase) {
    return NextResponse.json({ message: "Supabase saknas." }, { status: 500 });
  }

  const body = await request.json();

  const { error } = await supabase
    .from("work_order_checklist")
    .update({ completed: false })
    .eq("work_order_id", body.workOrderId);

  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}