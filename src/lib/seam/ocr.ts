export type ReaderPhase = "idle" | "loading" | "ready" | "error";

type OcrWorker = {
  setParameters: (params: Record<string, string>) => Promise<unknown>;
  recognize: (
    image: HTMLCanvasElement,
    options?: Record<string, unknown>,
    output?: { text?: boolean },
  ) => Promise<{ data: { text: string } }>;
  terminate: () => Promise<unknown>;
};

type TesseractModule = {
  createWorker: (
    langs?: string,
    oem?: number,
    options?: {
      logger?: (message: { status: string; progress: number }) => void;
    },
  ) => Promise<OcrWorker>;
  PSM: { SINGLE_BLOCK: string };
};

type DetectedText = {
  rawValue?: string;
  boundingBox?: { top?: number; y?: number; left?: number; x?: number; height?: number };
};

type TextDetectorLike = {
  detect: (source: CanvasImageSource) => Promise<DetectedText[]>;
};

export type ScreenReader = {
  warm: () => void;
  read: (canvas: HTMLCanvasElement) => Promise<string[]>;
  stop: () => Promise<void>;
};

function detector(): TextDetectorLike | null {
  const ctor = (window as Window & { TextDetector?: new () => TextDetectorLike }).TextDetector;
  if (!ctor) return null;
  try {
    return new ctor();
  } catch {
    return null;
  }
}

function linesFromDetector(blocks: DetectedText[]): string[] {
  const items = blocks
    .map((block) => ({
      text: (block.rawValue ?? "").replace(/\s+/g, " ").trim(),
      top: block.boundingBox?.top ?? block.boundingBox?.y ?? 0,
      left: block.boundingBox?.left ?? block.boundingBox?.x ?? 0,
      height: block.boundingBox?.height ?? 16,
    }))
    .filter((item) => item.text.length > 0)
    .sort((a, b) => a.top - b.top || a.left - b.left);
  if (!items.length) return [];

  const lines: { top: number; height: number; parts: { left: number; text: string }[] }[] = [];
  for (const item of items) {
    const row = lines.find((line) => Math.abs(line.top - item.top) < Math.max(line.height, item.height) * 0.6);
    if (row) row.parts.push({ left: item.left, text: item.text });
    else lines.push({ top: item.top, height: item.height, parts: [{ left: item.left, text: item.text }] });
  }
  return lines.map((line) =>
    line.parts
      .sort((a, b) => a.left - b.left)
      .map((part) => part.text)
      .join(" "),
  );
}

export function prepareForOcr(source: HTMLCanvasElement): HTMLCanvasElement {
  const maxW = 800;
  const maxH = 1100;
  const scale = Math.min(1, maxW / source.width, maxH / source.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, Math.round(source.width * scale));
  canvas.height = Math.max(2, Math.round(source.height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return source;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  let sum = 0;
  const pixels = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    const luma = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    data[i] = data[i + 1] = data[i + 2] = luma;
    sum += luma;
  }
  if (sum / pixels < 140) {
    for (let i = 0; i < data.length; i += 4) {
      const inverted = 255 - data[i];
      data[i] = data[i + 1] = data[i + 2] = inverted;
    }
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

export function paintSample(canvas: HTMLCanvasElement): void {
  canvas.width = 880;
  canvas.height = 360;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.fillStyle = "#f4efe6";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1c1a16";
  ctx.font = "600 32px Georgia, serif";
  const lines = [
    "Seam reads this section once,",
    "then waits for the scroll to stop.",
    "New lines are kept. Old lines are not.",
  ];
  lines.forEach((line, index) => {
    ctx.fillText(line, 48, 96 + index * 64);
  });
}

export const SAMPLE_SNIPPET = "Seam reads this section once";

export function createReader(
  onPhase: (phase: ReaderPhase, detail?: string) => void,
): ScreenReader {
  let workerPromise: Promise<OcrWorker> | null = null;
  let dead = false;
  const native = typeof window === "undefined" ? null : detector();

  function boot(): Promise<OcrWorker> {
    if (!workerPromise) {
      workerPromise = (async () => {
        onPhase("loading", "Loading the reader");
        const imported = (await import("tesseract.js")) as unknown as TesseractModule;
        const worker = await imported.createWorker("eng", 1, {
          logger: (message) => {
            if (message.status && message.progress > 0 && message.progress < 1) {
              onPhase("loading", message.status);
            }
          },
        });
        await worker.setParameters({
          tessedit_pageseg_mode: imported.PSM.SINGLE_BLOCK,
          preserve_interword_spaces: "1",
          user_defined_dpi: "120",
        });
        if (dead) {
          await worker.terminate();
          throw new Error("Reader closed");
        }
        onPhase("ready");
        return worker;
      })().catch((error: unknown) => {
        workerPromise = null;
        const message = error instanceof Error ? error.message : "Reader failed to load";
        onPhase("error", message);
        throw error;
      });
    }
    return workerPromise;
  }

  async function read(canvas: HTMLCanvasElement): Promise<string[]> {
    if (native) {
      try {
        const found = linesFromDetector(await native.detect(canvas));
        if (found.length) return found;
      } catch {
        // Fall through to the optical reader.
      }
    }
    const worker = await boot();
    const prepared = prepareForOcr(canvas);
    const result = await worker.recognize(prepared, {}, { text: true });
    return result.data.text.split(/\n/);
  }

  return {
    warm: () => {
      if (native) onPhase("ready", "Instant reader");
      void boot().catch(() => {
        // Phase already recorded.
      });
    },
    read,
    stop: async () => {
      dead = true;
      if (!workerPromise) return;
      try {
        const worker = await workerPromise;
        await worker.terminate();
      } catch {
        // Already failed or closed.
      }
    },
  };
}
