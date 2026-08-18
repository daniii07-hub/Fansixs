"use client";

import { ChangeEvent, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Upload,
} from "lucide-react";

type Props = {
  workOrderId: number;
  initialImages?: string[];
};

type UploadResponse = {
  success?: boolean;
  images?: string[];
  message?: string;
};

export default function PhotoUpload({
  workOrderId,
  initialImages = [],
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [images, setImages] =
    useState<string[]>(initialImages);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function uploadFiles(
    files: FileList | null,
  ) {
    if (!files?.length || uploading) {
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();

      formData.append(
        "workOrderId",
        String(workOrderId),
      );

      for (const file of Array.from(files)) {
        formData.append("files", file);
      }

      const response = await fetch(
        "/api/work-orders/upload-image",
        {
          method: "POST",
          body: formData,
        },
      );

      const responseText = await response.text();

      let data: UploadResponse = {};

      if (responseText) {
        try {
          data = JSON.parse(
            responseText,
          ) as UploadResponse;
        } catch {
          throw new Error(
            "Servern returnerade ett ogiltigt svar.",
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.message ??
            "Uppladdningen misslyckades.",
        );
      }

      const uploadedImages = Array.isArray(
        data.images,
      )
        ? data.images.filter(
            (image): image is string =>
              typeof image === "string" &&
              image.length > 0,
          )
        : [];

      if (uploadedImages.length === 0) {
        throw new Error(
          "Bilderna laddades upp, men inga bildlänkar returnerades.",
        );
      }

      setImages((currentImages) =>
        Array.from(
          new Set([
            ...currentImages,
            ...uploadedImages,
          ]),
        ),
      );

      setSuccess(
        uploadedImages.length === 1
          ? "Bilden har laddats upp och sparats."
          : `${uploadedImages.length} bilder har laddats upp och sparats.`,
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Kunde inte ladda upp bilder.",
      );
    } finally {
      setUploading(false);

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    void uploadFiles(event.target.files);
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <Camera className="h-5 w-5 text-purple-300" />

        <h2 className="text-xl font-semibold text-white">
          Bilder från jobbet
        </h2>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        Ladda upp före- och efterbilder. Tidigare
        uppladdade bilder visas automatiskt här.
      </p>

      <label
        className={`mt-6 flex items-center justify-center rounded-2xl border-2 border-dashed border-purple-400/30 bg-black/20 p-8 transition ${
          uploading
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:border-purple-500 hover:bg-purple-500/[0.04]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          hidden
          disabled={uploading}
          onChange={handleFileChange}
        />

        {uploading ? (
          <div className="text-center">
            <Loader2 className="mx-auto h-9 w-9 animate-spin text-purple-300" />

            <p className="mt-4 font-medium text-white">
              Laddar upp bilder...
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Stäng inte sidan under uppladdningen.
            </p>
          </div>
        ) : (
          <div className="text-center">
            <Upload className="mx-auto h-10 w-10 text-purple-300" />

            <p className="mt-4 font-medium text-white">
              Klicka för att välja bilder
            </p>

            <p className="mt-2 text-sm text-slate-500">
              JPG, PNG, WebP eller HEIC · max 10 MB
            </p>
          </div>
        )}
      </label>

      {error && (
        <div
          role="alert"
          className="mt-4 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200"
        >
          {error}
        </div>
      )}

      {success && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          {success}
        </div>
      )}

      {images.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-white/10 bg-black/10 px-6 py-10 text-center">
          <ImageIcon className="mx-auto h-9 w-9 text-slate-600" />

          <p className="mt-4 text-sm text-slate-400">
            Inga bilder har laddats upp ännu.
          </p>
        </div>
      ) : (
        <div className="mt-8">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-semibold text-white">
              Bildgalleri
            </h3>

            <span className="text-sm text-slate-500">
              {images.length}{" "}
              {images.length === 1
                ? "bild"
                : "bilder"}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {images.map((image, index) => (
              <a
                key={`${image}-${index}`}
                href={image}
                target="_blank"
                rel="noreferrer"
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black/20"
              >
                <img
                  src={image}
                  alt={`Arbetsbild ${index + 1}`}
                  loading="lazy"
                  className="aspect-square w-full object-cover transition duration-300 group-hover:scale-105"
                />

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8 opacity-0 transition group-hover:opacity-100">
                  <p className="text-xs font-medium text-white">
                    Öppna bild
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}