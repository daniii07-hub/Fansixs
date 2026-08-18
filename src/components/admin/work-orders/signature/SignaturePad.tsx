"use client";

import {
  ChangeEvent,
  PointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  CheckCircle2,
  Eraser,
  Loader2,
  PenLine,
  Save,
} from "lucide-react";

type Props = {
  workOrderId: number;
  initialSignature?: string | null;
  initialSignedAt?: string | null;
};

type ApiResponse = {
  success?: boolean;
  signature?: string;
  signedAt?: string;
  message?: string;
};

export default function SignaturePad({
  workOrderId,
  initialSignature = null,
  initialSignedAt = null,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef<{
    x: number;
    y: number;
  } | null>(null);

  const [signature, setSignature] = useState(
    initialSignature ?? "",
  );
  const [signedAt, setSignedAt] = useState(
    initialSignedAt ?? "",
  );
  const [hasDrawing, setHasDrawing] = useState(
    Boolean(initialSignature),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function getCanvas() {
    return canvasRef.current;
  }

  function getContext() {
    const canvas = getCanvas();

    if (!canvas) {
      return null;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return null;
    }

    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 3;
    context.strokeStyle = "#111827";

    return context;
  }

  function resizeCanvas() {
    const canvas = getCanvas();

    if (!canvas) {
      return;
    }

    const containerWidth =
      canvas.parentElement?.clientWidth ?? 640;

    const displayWidth = Math.max(
      280,
      Math.floor(containerWidth),
    );
    const displayHeight = 240;
    const pixelRatio = window.devicePixelRatio || 1;

    const previousImage =
      hasDrawing || signature
        ? canvas.toDataURL("image/png")
        : "";

    canvas.width = displayWidth * pixelRatio;
    canvas.height = displayHeight * pixelRatio;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    context.setTransform(
      pixelRatio,
      0,
      0,
      pixelRatio,
      0,
      0,
    );

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, displayWidth, displayHeight);

    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 3;
    context.strokeStyle = "#111827";

    const source = signature || previousImage;

    if (source) {
      const image = new Image();

      image.onload = () => {
        context.drawImage(
          image,
          0,
          0,
          displayWidth,
          displayHeight,
        );
      };

      image.src = source;
    }
  }

  useEffect(() => {
    resizeCanvas();

    function handleResize() {
      resizeCanvas();
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener(
        "resize",
        handleResize,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (signature) {
      resizeCanvas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  function getPoint(
    event: PointerEvent<HTMLCanvasElement>,
  ) {
    const canvas = getCanvas();

    if (!canvas) {
      return null;
    }

    const rect = canvas.getBoundingClientRect();

    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function startDrawing(
    event: PointerEvent<HTMLCanvasElement>,
  ) {
    if (saving) {
      return;
    }

    const canvas = getCanvas();
    const point = getPoint(event);

    if (!canvas || !point) {
      return;
    }

    canvas.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    lastPointRef.current = point;
    setError("");
    setSuccess("");
  }

  function draw(
    event: PointerEvent<HTMLCanvasElement>,
  ) {
    if (!drawingRef.current) {
      return;
    }

    const context = getContext();
    const point = getPoint(event);
    const lastPoint = lastPointRef.current;

    if (!context || !point || !lastPoint) {
      return;
    }

    context.beginPath();
    context.moveTo(lastPoint.x, lastPoint.y);
    context.lineTo(point.x, point.y);
    context.stroke();

    lastPointRef.current = point;
    setHasDrawing(true);
    setSignature("");
    setSignedAt("");
  }

  function stopDrawing(
    event: PointerEvent<HTMLCanvasElement>,
  ) {
    const canvas = getCanvas();

    if (
      canvas?.hasPointerCapture(event.pointerId)
    ) {
      canvas.releasePointerCapture(event.pointerId);
    }

    drawingRef.current = false;
    lastPointRef.current = null;
  }

  function clearSignature() {
    if (saving) {
      return;
    }

    const canvas = getCanvas();
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    const rect = canvas.getBoundingClientRect();

    context.clearRect(0, 0, rect.width, rect.height);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, rect.width, rect.height);

    setSignature("");
    setSignedAt("");
    setHasDrawing(false);
    setError("");
    setSuccess("");
  }

  async function saveSignature() {
    if (saving) {
      return;
    }

    const canvas = getCanvas();

    if (!canvas || !hasDrawing) {
      setError(
        "Kunden behöver skriva sin signatur innan den kan sparas.",
      );
      return;
    }

    const dataUrl = canvas.toDataURL("image/png");

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/work-orders/${workOrderId}/signature`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            signature: dataUrl,
          }),
        },
      );

      const responseText = await response.text();

      let data: ApiResponse = {};

      if (responseText) {
        try {
          data = JSON.parse(
            responseText,
          ) as ApiResponse;
        } catch {
          throw new Error(
            "Servern returnerade ett ogiltigt svar.",
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Signaturen kunde inte sparas.",
        );
      }

      const savedSignature =
        data.signature || dataUrl;

      setSignature(savedSignature);
      setSignedAt(data.signedAt ?? "");
      setHasDrawing(true);
      setSuccess(
        "Kundsignaturen har sparats på arbetsordern.",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Signaturen kunde inte sparas.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleKeyboardClear(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    event.preventDefault();
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <PenLine className="h-5 w-5 text-purple-300" />

        <h2 className="text-xl font-semibold text-white">
          Kundsignatur
        </h2>
      </div>

      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
        Kunden kan signera direkt med finger, mus eller
        pekpenna. Signaturen sparas på arbetsordern.
      </p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white">
        <canvas
          ref={canvasRef}
          className="block w-full touch-none cursor-crosshair"
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerCancel={stopDrawing}
          onPointerLeave={(event) => {
            if (drawingRef.current) {
              stopDrawing(event);
            }
          }}
          aria-label="Signaturruta"
        />
      </div>

      <input
        type="hidden"
        value={signature}
        onChange={handleKeyboardClear}
      />

      {signedAt && (
        <p className="mt-3 text-sm text-slate-500">
          Signerad{" "}
          {new Intl.DateTimeFormat("sv-SE", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(new Date(signedAt))}
        </p>
      )}

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

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={clearSignature}
          disabled={saving || !hasDrawing}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.1] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Eraser className="h-4 w-4" />
          Rensa
        </button>

        <button
          type="button"
          onClick={saveSignature}
          disabled={saving || !hasDrawing}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}

          {saving
            ? "Sparar signatur..."
            : "Spara signatur"}
        </button>
      </div>
    </section>
  );
}