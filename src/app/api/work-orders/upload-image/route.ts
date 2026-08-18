import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const BUCKET_NAME = "work-order-images";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_FILES = 10;

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function getSupabaseClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseSecretKey =
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function safeFileName(name: string) {
  const extension = name.includes(".")
    ? name.split(".").pop()?.toLowerCase() ?? "jpg"
    : "jpg";

  const baseName = name
    .replace(/\.[^/.]+$/, "")
    .normalize("NFKD")
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 80);

  return `${baseName || "image"}.${extension}`;
}

function isImageFile(file: File) {
  if (allowedMimeTypes.has(file.type)) {
    return true;
  }

  const extension = file.name
    .split(".")
    .pop()
    ?.toLowerCase();

  return ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(
    extension ?? "",
  );
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();

    if (!supabase) {
      return NextResponse.json(
        {
          message: "Supabase-inställningarna saknas.",
        },
        {
          status: 500,
        },
      );
    }

    const formData = await request.formData();

    const workOrderId = Number(
      formData.get("workOrderId"),
    );

    const imageTypeValue = formData.get("imageType");

    const imageType =
      typeof imageTypeValue === "string" &&
      imageTypeValue.trim()
        ? imageTypeValue.trim().slice(0, 50)
        : "Övrigt";

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

    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        {
          message: "Inga bilder valdes.",
        },
        {
          status: 400,
        },
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        {
          message: `Du kan ladda upp högst ${MAX_FILES} bilder åt gången.`,
        },
        {
          status: 400,
        },
      );
    }

    for (const file of files) {
      if (!isImageFile(file)) {
        return NextResponse.json(
          {
            message: `${file.name} är inte ett tillåtet bildformat.`,
          },
          {
            status: 400,
          },
        );
      }

      if (file.size <= 0) {
        return NextResponse.json(
          {
            message: `${file.name} är tom.`,
          },
          {
            status: 400,
          },
        );
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            message: `${file.name} är större än 10 MB.`,
          },
          {
            status: 400,
          },
        );
      }
    }

    const {
      data: workOrder,
      error: workOrderError,
    } = await supabase
      .from("work_orders")
      .select("id")
      .eq("id", workOrderId)
      .maybeSingle();

    if (workOrderError) {
      console.error(
        "Work-order lookup error:",
        workOrderError,
      );

      return NextResponse.json(
        {
          message: "Arbetsordern kunde inte kontrolleras.",
        },
        {
          status: 500,
        },
      );
    }

    if (!workOrder) {
      return NextResponse.json(
        {
          message: "Arbetsordern kunde inte hittas.",
        },
        {
          status: 404,
        },
      );
    }

    const uploadedPaths: string[] = [];
    const uploadedImages: Array<{
      image_url: string;
      image_type: string;
    }> = [];

    try {
      for (const file of files) {
        const fileName = safeFileName(file.name);

        const storagePath = [
          `work-order-${workOrderId}`,
          `${crypto.randomUUID()}-${fileName}`,
        ].join("/");

        const fileBuffer = await file.arrayBuffer();

        const { error: uploadError } =
          await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, fileBuffer, {
              contentType:
                file.type || "application/octet-stream",
              cacheControl: "3600",
              upsert: false,
            });

        if (uploadError) {
          throw new Error(
            `Kunde inte ladda upp ${file.name}: ${uploadError.message}`,
          );
        }

        uploadedPaths.push(storagePath);

        const { data: publicUrlData } =
          supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(storagePath);

        const publicUrl =
          publicUrlData.publicUrl;

        if (!publicUrl) {
          throw new Error(
            `Kunde inte skapa en publik länk för ${file.name}.`,
          );
        }

        uploadedImages.push({
          image_url: publicUrl,
          image_type: imageType,
        });
      }

      const rows = uploadedImages.map((image) => ({
        work_order_id: workOrderId,
        image_url: image.image_url,
        image_type: image.image_type,
      }));

      const {
        data: savedImages,
        error: databaseError,
      } = await supabase
        .from("work_order_images")
        .insert(rows)
        .select(
          `
            id,
            work_order_id,
            image_url,
            image_type,
            created_at
          `,
        );

      if (databaseError) {
        throw new Error(
          `Bilderna laddades upp men kunde inte sparas i databasen: ${databaseError.message}`,
        );
      }

      return NextResponse.json(
        {
          success: true,
          images: uploadedImages.map(
            (image) => image.image_url,
          ),
          records: savedImages ?? [],
        },
        {
          status: 201,
        },
      );
    } catch (uploadProcessError) {
      if (uploadedPaths.length > 0) {
        const { error: cleanupError } =
          await supabase.storage
            .from(BUCKET_NAME)
            .remove(uploadedPaths);

        if (cleanupError) {
          console.error(
            "Storage cleanup error:",
            cleanupError,
          );
        }
      }

      throw uploadProcessError;
    }
  } catch (error) {
    console.error(
      "Work-order image upload error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Bilderna kunde inte laddas upp.",
      },
      {
        status: 500,
      },
    );
  }
}