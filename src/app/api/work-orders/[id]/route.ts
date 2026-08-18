import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const allowedStatuses = [
  "Planerad",
  "Pågår",
  "Utförd",
  "Fakturerad",
] as const;

type WorkOrderStatus =
  (typeof allowedStatuses)[number];

type UpdateBody = {
  status?: string;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    const workOrderId = Number(id);

    if (
      !Number.isInteger(workOrderId) ||
      workOrderId <= 0
    ) {
      return NextResponse.json(
        {
          message: "Ogiltigt arbetsorder-ID.",
        },
        {
          status: 400,
        },
      );
    }

    const body = (await request.json()) as UpdateBody;
    const status = body.status;

    if (
      !status ||
      !allowedStatuses.includes(
        status as WorkOrderStatus,
      )
    ) {
      return NextResponse.json(
        {
          message: "Status saknas eller är ogiltig.",
        },
        {
          status: 400,
        },
      );
    }

    const supabase = getSupabaseServerClient();

    const { data: currentWorkOrder, error: lookupError } =
      await supabase
        .from("work_orders")
        .select(
          `
            id,
            status,
            started_at,
            completed_at
          `,
        )
        .eq("id", workOrderId)
        .maybeSingle();

    if (lookupError) {
      console.error(
        "Work-order lookup error:",
        lookupError,
      );

      return NextResponse.json(
        {
          message:
            "Arbetsordern kunde inte kontrolleras.",
        },
        {
          status: 500,
        },
      );
    }

    if (!currentWorkOrder) {
      return NextResponse.json(
        {
          message: "Arbetsordern kunde inte hittas.",
        },
        {
          status: 404,
        },
      );
    }

    const now = new Date().toISOString();

    const update: {
      status: WorkOrderStatus;
      started_at?: string | null;
      completed_at?: string | null;
    } = {
      status: status as WorkOrderStatus,
    };

    if (
      status === "Pågår" &&
      !currentWorkOrder.started_at
    ) {
      update.started_at = now;
    }

    if (status === "Utförd") {
      update.completed_at =
        currentWorkOrder.completed_at ?? now;
    }

    if (status === "Planerad") {
      update.started_at = null;
      update.completed_at = null;
    }

    const { data, error } = await supabase
      .from("work_orders")
      .update(update)
      .eq("id", workOrderId)
      .select(
        `
          id,
          status,
          started_at,
          completed_at
        `,
      )
      .single();

    if (error) {
      console.error(
        "Work-order PATCH error:",
        error,
      );

      return NextResponse.json(
        {
          message:
            "Arbetsordern kunde inte uppdateras.",
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      success: true,
      workOrder: data,
    });
  } catch (error) {
    console.error(
      "Work-order route error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Ett oväntat fel inträffade.",
      },
      {
        status: 500,
      },
    );
  }
}