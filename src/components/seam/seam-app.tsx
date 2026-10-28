import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { format } from "date-fns";
import {
  ArrowDown,
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  Download,
  Loader2,
  MonitorUp,
  Pencil,
  Square,
  Trash2,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import { PRACTICE_BLOCKS } from "@/lib/seam/article";
import {
  downloadText,
  listFiles,
  putFile,
  removeFile,
  slugify,
  withText,
  type SeamFile,
  type SeamSource,
} from "@/lib/seam/files";
import {
  createReader,
  paintSample,
  type ReaderPhase,
  type ScreenReader,
} from "@/lib/seam/ocr";
import { countWords, manuscript, stitchDocument, suggestTitle } from "@/lib/seam/stitch";

type View = "library" | "capture" | "file";
type Mode = "screen" | "practice" | null;
type Motion = "idle" | "reading" | "moving" | "still" | "gap" | "error";
type NormRect = { x: number; y: number; w: number; h: number };
type DragMode = "move" | "nw" | "ne" | "sw" | "se";
type Picture = { left: number; top: number; width: number; height: number };

const DEFAULT_REGION: NormRect = { x: 0.08, y: 0.1, w: 0.84, h: 0.8 };

const primaryBtn =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-tally px-5 text-base font-medium text-bg transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tally disabled:cursor-not-allowed disabled:opacity-40";
const ghostBtn =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-fg/15 bg-surface px-5 text-base font-medium text-fg transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tally disabled:cursor-not-allowed disabled:opacity-40";
const quietBtn =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium text-fg transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tally";

const STEPS = [
  "Share a window, a tab, or the whole screen.",
  "Draw the section that holds the text.",
  "Seam reads it once, then waits. Scroll and pause — it continues from the last line.",
  "Stop. The note stays in this app as Markdown.",
];

export function SeamApp() {
  const [view, setView] = useState<View>("library");
  const [files, setFiles] = useState<SeamFile[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [live, setLive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [reads, setReads] = useState(0);
  const [lastMs, setLastMs] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [motion, setMotion] = useState<Motion>("idle");
  const [error, setError] = useState("");
  const [region, setRegion] = useState<NormRect>(DEFAULT_REGION);
  const [picture, setPicture] = useState<Picture | null>(null);
  const [scrolling, setScrolling] = useState(false);
  const [readerPhase, setReaderPhase] = useState<ReaderPhase>("idle");
  const [benching, setBenching] = useState(false);
  const [bench, setBench] = useState<{ ms: number; text: string; ok: boolean } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [titleDraft, setTitleDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const linesRef = useRef<string[]>([]);
  const regionRef = useRef<NormRect>(DEFAULT_REGION);
  const modeRef = useRef<Mode>(null);
  const runningRef = useRef(false);
  const readsRef = useRef(0);
  const motionRef = useRef<Motion>("idle");
  const inFlightRef = useRef<Promise<void> | null>(null);
  const passRef = useRef<(force?: boolean) => Promise<void>>(async () => {});
  const tickRef = useRef<() => void>(() => {});
  const loopRef = useRef<number | null>(null);
  const scrollRaf = useRef<number | null>(null);
  const savingRef = useRef(false);
  const startedAt = useRef(0);
  const lastPassMs = useRef(0);
  const practiceSig = useRef("");
  const pendingMove = useRef(0);
  const hotFrames = useRef(0);
  const stableSince = useRef(0);
  const lastLuma = useRef<Uint8Array | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const readerRef = useRef<ScreenReader | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const transcriptRef = useRef<HTMLDivElement | null>(null);
  const scratchRef = useRef<HTMLCanvasElement | null>(null);
  const grabRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{ mode: DragMode; x: number; y: number; rect: NormRect } | null>(null);

  useEffect(() => {
    regionRef.current = region;
  }, [region]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    setMounted(true);
    const reader = createReader((phase) => setReaderPhase(phase));
    readerRef.current = reader;
    reader.warm();
    void listFiles()
      .then(setFiles)
      .catch(() => setFiles([]));
    return () => {
      runningRef.current = false;
      if (loopRef.current) window.clearTimeout(loopRef.current);
      if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      void reader.stop();
    };
  }, []);

  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => {
      setElapsed(Date.now() - startedAt.current);
    }, 1000);
    return () => window.clearInterval(id);
  }, [live]);

  useEffect(() => {
    if (!live) return;
    const el = transcriptRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines, live]);

  useEffect(() => {
    if (mode !== "screen") return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;
    video.srcObject = stream;
    const measure = () => {
      const stage = stageRef.current;
      if (!stage || !video.videoWidth) return;
      const stageRect = stage.getBoundingClientRect();
      const box = video.getBoundingClientRect();
      const scale = Math.min(box.width / video.videoWidth, box.height / video.videoHeight);
      const width = video.videoWidth * scale;
      const height = video.videoHeight * scale;
      setPicture({
        left: box.left - stageRect.left + (box.width - width) / 2,
        top: box.top - stageRect.top + (box.height - height) / 2,
        width,
        height,
      });
    };
    void video.play().catch(() => {});
    video.addEventListener("loadedmetadata", measure);
    video.addEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    observer.observe(video);
    measure();
    return () => {
      video.removeEventListener("loadedmetadata", measure);
      video.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, [mode]);

  function setMotionIf(next: Motion) {
    if (motionRef.current === next) return;
    motionRef.current = next;
    setMotion(next);
  }

  function releaseStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setPicture(null);
  }

  function stopAutoScroll() {
    if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
    scrollRaf.current = null;
    setScrolling(false);
  }

  function readPractice(): string[] {
    const root = scrollerRef.current;
    if (!root) return [];
    const box = root.getBoundingClientRect();
    const found: string[] = [];
    root.querySelectorAll<HTMLElement>("[data-line]").forEach((el) => {
      const rect = el.getBoundingClientRect();
      const visible = Math.min(rect.bottom, box.bottom) - Math.max(rect.top, box.top);
      if (visible > 8) found.push((el.textContent ?? "").replace(/\s+/g, " ").trim());
    });
    return found.filter(Boolean);
  }

  function sampleLuma(video: HTMLVideoElement, rect: NormRect): Uint8Array | null {
    if (!video.videoWidth) return null;
    const scratch = scratchRef.current ?? document.createElement("canvas");
    scratchRef.current = scratch;
    const size = 24;
    if (scratch.width !== size) {
      scratch.width = size;
      scratch.height = size;
    }
    const ctx = scratch.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(
      video,
      rect.x * video.videoWidth,
      rect.y * video.videoHeight,
      Math.max(1, rect.w * video.videoWidth),
      Math.max(1, rect.h * video.videoHeight),
      0,
      0,
      size,
      size,
    );
    const data = ctx.getImageData(0, 0, size, size).data;
    const luma = new Uint8Array(size * size);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
      luma[p] = (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    return luma;
  }

  async function readScreen(): Promise<string[]> {
    const video = videoRef.current;
    const reader = readerRef.current;
    if (!video || !reader || !video.videoWidth) return [];
    const grab = grabRef.current ?? document.createElement("canvas");
    grabRef.current = grab;
    const rect = regionRef.current;
    const sw = Math.max(1, rect.w * video.videoWidth);
    const sh = Math.max(1, rect.h * video.videoHeight);
    const scale = Math.min(1, 800 / sw, 1100 / sh);
    grab.width = Math.max(2, Math.round(sw * scale));
    grab.height = Math.max(2, Math.round(sh * scale));
    const ctx = grab.getContext("2d", { willReadFrequently: true });
    if (!ctx) return [];
    ctx.drawImage(video, rect.x * video.videoWidth, rect.y * video.videoHeight, sw, sh, 0, 0, grab.width, grab.height);
    return reader.read(grab);
  }

  async function runPass(force: boolean): Promise<void> {
    if (!runningRef.current && !force) return;
    const source = modeRef.current;
    const t0 = performance.now();
    setMotionIf("reading");
    try {
      const raw = source === "practice" ? readPractice() : await readScreen();
      if (!runningRef.current && !force) return;
      const signature = raw.join("\n");
      if (source === "practice" && signature === practiceSig.current && !force) {
        setMotionIf("still");
        return;
      }
      practiceSig.current = signature;
      const result = stitchDocument(linesRef.current, raw);
      linesRef.current = result.lines;
      readsRef.current += 1;
      const ms = performance.now() - t0;
      lastPassMs.current = ms;
      setLastMs(ms);
      setReads(readsRef.current);
      setLines(result.lines);
      setError("");
      if (result.gap) {
        setMotionIf("gap");
        toast("A fast flick skipped some text. The note marks the gap.");
      } else {
        setMotionIf("still");
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not read that section";
      setError(message);
      setMotionIf("error");
    }
  }

  async function pass(force = false): Promise<void> {
    if (!runningRef.current && !force) return;
    if (inFlightRef.current) {
      if (!force) return;
      await inFlightRef.current;
    }
    const job = runPass(force);
    inFlightRef.current = job;
    try {
      await job;
    } finally {
      if (inFlightRef.current === job) inFlightRef.current = null;
    }
  }

  passRef.current = pass;

  tickRef.current = () => {
    if (!runningRef.current) return;
    if (modeRef.current === "practice") {
      const signature = readPractice().join("\n");
      if (signature && signature !== practiceSig.current) void passRef.current(false);
      else if (motionRef.current === "reading") setMotionIf("still");
      loopRef.current = window.setTimeout(() => tickRef.current(), 200);
      return;
    }
    const video = videoRef.current;
    if (!video?.videoWidth) {
      loopRef.current = window.setTimeout(() => tickRef.current(), 120);
      return;
    }
    const luma = sampleLuma(video, regionRef.current);
    const prev = lastLuma.current;
    lastLuma.current = luma;
    const delta = luma && prev ? drift(prev, luma) : 0;
    const now = performance.now();
    if (delta >= 8) {
      hotFrames.current += 1;
      pendingMove.current += delta;
      stableSince.current = now;
      if (hotFrames.current >= 2) setMotionIf("moving");
    } else if (now - stableSince.current > 200 && hotFrames.current >= 2) {
      hotFrames.current = 0;
      pendingMove.current = 0;
      void passRef.current(false);
    } else if (now - stableSince.current > 450) {
      hotFrames.current = 0;
      pendingMove.current = 0;
    }
    loopRef.current = window.setTimeout(() => tickRef.current(), 90);
  };

  function startReading() {
    if (modeRef.current === "screen" && !videoRef.current?.videoWidth) {
      toast("Wait for the shared picture, then start.");
      return;
    }
    linesRef.current = [];
    practiceSig.current = "";
    readsRef.current = 0;
    pendingMove.current = 0;
    hotFrames.current = 0;
    lastLuma.current = null;
    stableSince.current = performance.now();
    savingRef.current = false;
    runningRef.current = true;
    startedAt.current = Date.now();
    setLines([]);
    setReads(0);
    setLastMs(0);
    setElapsed(0);
    setError("");
    setLive(true);
    setMotionIf("reading");
    if (loopRef.current) window.clearTimeout(loopRef.current);
    window.setTimeout(() => {
      void passRef.current(true);
    }, 60);
    loopRef.current = window.setTimeout(() => tickRef.current(), 180);
  }

  async function stopAndSave() {
    if (savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    runningRef.current = false;
    if (loopRef.current) window.clearTimeout(loopRef.current);
    stopAutoScroll();
    try {
      await pass(true);
    } catch {
      // The pass records its own error.
    }
    const text = manuscript(linesRef.current).trim();
    if (!text || countWords(text) === 0) {
      toast("Nothing to save yet.");
      savingRef.current = false;
      setSaving(false);
      setLive(false);
      setMotionIf("idle");
      return;
    }
    const source: SeamSource = modeRef.current === "screen" ? "screen" : "practice";
    const createdAt = Date.now();
    const title = suggestTitle(text);
    const draftFile: SeamFile = {
      id: crypto.randomUUID(),
      title,
      createdAt,
      words: 0,
      reads: readsRef.current,
      source,
      text,
      markdown: "",
    };
    const file = withText(draftFile, text, title);
    try {
      await putFile(file);
    } catch {
      toast("Couldn't save the note in this browser.");
      savingRef.current = false;
      setSaving(false);
      setLive(false);
      return;
    }
    releaseStream();
    setFiles((current) => [file, ...(current ?? []).filter((item) => item.id !== file.id)]);
    setOpenId(file.id);
    setDraft(file.text);
    setTitleDraft(file.title);
    setEditing(false);
    setConfirmDelete(false);
    setView("file");
    setLive(false);
    setMode(null);
    setSaving(false);
    savingRef.current = false;
    setMotionIf("idle");
  }

  async function shareScreen() {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      toast("This browser can't share a screen. Use the practice page, or open Seam in Chrome or Edge.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 12, max: 15 } },
        audio: false,
        preferCurrentTab: false,
        selfBrowserSurface: "exclude",
        surfaceSwitching: "include",
      } as DisplayMediaStreamOptions);
      releaseStream();
      streamRef.current = stream;
      const [track] = stream.getVideoTracks();
      track?.addEventListener("ended", () => {
        if (runningRef.current) void stopAndSave();
        else {
          releaseStream();
          setMode(null);
          toast("The screen share ended.");
        }
      });
      setRegion(DEFAULT_REGION);
      regionRef.current = DEFAULT_REGION;
      setMode("screen");
      modeRef.current = "screen";
    } catch (caught) {
      const name = caught instanceof DOMException ? caught.name : "";
      if (name !== "NotAllowedError" && name !== "AbortError") {
        toast("Couldn't start screen share.");
      } else if (name === "NotAllowedError") {
        toast("Screen share was blocked. The practice page still runs the same scroll memory.");
      }
    }
  }

  function openPractice() {
    releaseStream();
    setMode("practice");
    modeRef.current = "practice";
    setLive(false);
    window.setTimeout(() => {
      if (scrollerRef.current) scrollerRef.current.scrollTop = 0;
    }, 0);
  }

  function leaveCapture() {
    if (runningRef.current || live) {
      void stopAndSave();
      return;
    }
    stopAutoScroll();
    releaseStream();
    setMode(null);
    setView("library");
  }

  function toggleScroll() {
    if (scrollRaf.current) {
      stopAutoScroll();
      return;
    }
    setScrolling(true);
    let last = performance.now();
    const step = (now: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      const dt = Math.min(32, now - last);
      last = now;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
        stopAutoScroll();
        return;
      }
      el.scrollTop += (240 * dt) / 1000;
      scrollRaf.current = requestAnimationFrame(step);
    };
    scrollRaf.current = requestAnimationFrame(step);
  }

  async function timeSample() {
    const reader = readerRef.current;
    if (!reader) return;
    setBenching(true);
    const canvas = document.createElement("canvas");
    paintSample(canvas);
    const t0 = performance.now();
    try {
      const found = await reader.read(canvas);
      const text = found.join(" ").replace(/\s+/g, " ").trim();
      setBench({
        ms: performance.now() - t0,
        text,
        ok: /seam/i.test(text) && /scroll/i.test(text),
      });
    } catch (caught) {
      setBench({
        ms: performance.now() - t0,
        text: caught instanceof Error ? caught.message : "The reader failed",
        ok: false,
      });
    } finally {
      setBenching(false);
    }
  }

  function beginDrag(event: ReactPointerEvent, dragMode: DragMode) {
    if (live) return;
    event.preventDefault();
    event.stopPropagation();
    overlayRef.current?.setPointerCapture(event.pointerId);
    dragRef.current = {
      mode: dragMode,
      x: event.clientX,
      y: event.clientY,
      rect: { ...regionRef.current },
    };
  }

  function onRegionMove(event: ReactPointerEvent) {
    const drag = dragRef.current;
    const overlay = overlayRef.current;
    if (!drag || !overlay) return;
    const bounds = overlay.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const dx = (event.clientX - drag.x) / bounds.width;
    const dy = (event.clientY - drag.y) / bounds.height;
    const min = 0.12;
    let { x, y, w, h } = drag.rect;
    if (drag.mode === "move") {
      x = clamp(x + dx, 0, 1 - w);
      y = clamp(y + dy, 0, 1 - h);
    } else {
      if (drag.mode.includes("w")) {
        const nextX = clamp(x + dx, 0, x + w - min);
        w = w + (x - nextX);
        x = nextX;
      }
      if (drag.mode.includes("e")) w = clamp(w + dx, min, 1 - x);
      if (drag.mode.includes("n")) {
        const nextY = clamp(y + dy, 0, y + h - min);
        h = h + (y - nextY);
        y = nextY;
      }
      if (drag.mode.includes("s")) h = clamp(h + dy, min, 1 - y);
    }
    const next = { x, y, w, h };
    regionRef.current = next;
    setRegion(next);
  }

  const body = manuscript(lines);
  const words = countWords(body);
  const openFile = files?.find((file) => file.id === openId) ?? null;

  return (
    <div className="min-h-dvh bg-bg text-fg">
      {mounted ? (
        <Toaster
          theme="dark"
          position="top-center"
          toastOptions={{
            style: {
              background: "var(--color-surface)",
              color: "var(--color-fg)",
              border: "1px solid color-mix(in oklab, var(--color-fg) 12%, transparent)",
            },
          }}
        />
      ) : null}
      {view === "library" ? (
        <Library
          files={files}
          onStart={() => {
            setMode(null);
            setLive(false);
            setLines([]);
            linesRef.current = [];
            setView("capture");
          }}
          onOpen={(id) => {
            const file = files?.find((item) => item.id === id);
            if (!file) return;
            setOpenId(id);
            setDraft(file.text);
            setTitleDraft(file.title);
            setEditing(false);
            setConfirmDelete(false);
            setView("file");
          }}
        />
      ) : null}
      {view === "capture" ? (
        <div className="flex h-dvh flex-col overflow-hidden">
          <header className="flex shrink-0 items-center gap-3 border-b border-fg/10 px-4 py-3 sm:px-6">
            <button type="button" className={quietBtn} onClick={leaveCapture}>
              <ArrowLeft className="size-5" />
              Library
            </button>
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <span
                className={
                  live
                    ? "tally-live size-2.5 shrink-0 rounded-full bg-tally"
                    : "size-2.5 shrink-0 rounded-full bg-fg/20"
                }
              />
              <p className="truncate font-serif text-lg">
                {live ? "Reading" : mode === "practice" ? "Practice" : mode === "screen" ? "Screen" : "New capture"}
              </p>
            </div>
            {live ? <p className="tabular-nums text-sm text-muted">{formatElapsed(elapsed)}</p> : null}
          </header>

          {mode === null ? (
            <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 sm:px-6">
              <div>
                <h1 className="font-serif text-4xl leading-tight text-balance">Choose what to read</h1>
                <p className="mt-3 max-w-prose text-base leading-relaxed text-pretty text-muted">
                  Seam only sees a picture you share. Draw a rectangle, and it copies the text inside. When that
                  picture scrolls and stops, it continues from the last line instead of starting over.
                </p>
              </div>
              <button type="button" className="flex items-start gap-4 rounded-2xl border border-fg/10 bg-surface p-5 text-left hover:border-tally" onClick={() => void shareScreen()}>
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-tally text-bg">
                  <MonitorUp className="size-5" />
                </span>
                <span>
                  <span className="block text-base font-medium">Share a screen</span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted">
                    Pick another window, a tab, or the whole display. Leave Seam’s own buttons outside the frame.
                  </span>
                </span>
              </button>
              <button type="button" className="flex items-start gap-4 rounded-2xl border border-fg/10 bg-surface p-5 text-left hover:border-fg/30" onClick={openPractice}>
                <span className="grid size-11 shrink-0 place-items-center rounded-full border border-fg/15 text-fg">
                  <BookOpen className="size-5" />
                </span>
                <span>
                  <span className="block text-base font-medium">Practice on a sample page</span>
                  <span className="mt-1 block text-sm leading-relaxed text-muted">
                    Same memory for scrolling text, read straight from the page. Use this when screen share is blocked.
                  </span>
                </span>
              </button>
              <div className="rounded-2xl border border-fg/10 px-5 py-4">
                <p className="text-sm leading-relaxed text-muted">{readerLabel(readerPhase)}</p>
                <button type="button" className={`${ghostBtn} mt-4`} onClick={() => void timeSample()} disabled={benching}>
                  {benching ? <Loader2 className="size-4 animate-spin" /> : null}
                  Time a sample image
                </button>
                {bench ? (
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    {bench.ok
                      ? `Sample read in ${formatMs(bench.ms)}.`
                      : `The reader didn’t match the sample (${formatMs(bench.ms)}).`}{" "}
                    <span className="text-fg">{bench.text}</span>
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
              <div ref={stageRef} className="relative min-h-0 flex-1 overflow-hidden bg-bg">
                {mode === "practice" ? (
                  <div className="flex h-full min-h-0 flex-col">
                    <div className="flex items-center justify-between border-b border-fg/10 px-4 py-3">
                      <div>
                        <p className="text-xs font-medium tracking-wide text-muted">Sample app</p>
                        <p className="font-serif text-lg">Field notes</p>
                      </div>
                      <p className="text-xs text-muted">Selected section</p>
                    </div>
                    <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                      <div className="mx-auto flex max-w-xl flex-col gap-5">
                        {PRACTICE_BLOCKS.map((block) =>
                          block.kind === "h" ? (
                            <h2 key={block.text} data-line className="font-serif text-2xl leading-tight text-balance">
                              {block.text}
                            </h2>
                          ) : (
                            <p key={block.text} data-line className="font-serif text-lg leading-relaxed text-pretty">
                              {block.text}
                            </p>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <video ref={videoRef} autoPlay playsInline muted className="pointer-events-none h-full w-full object-contain" />
                    {picture ? (
                      <div
                        ref={overlayRef}
                        className="absolute overflow-hidden"
                        style={{ left: picture.left, top: picture.top, width: picture.width, height: picture.height }}
                        onPointerMove={onRegionMove}
                        onPointerUp={() => {
                          dragRef.current = null;
                        }}
                        onPointerCancel={() => {
                          dragRef.current = null;
                        }}
                      >
                        <div
                          role="group"
                          aria-label="Selected section"
                          className="region-frame absolute border-2 border-tally"
                          style={{
                            left: `${region.x * 100}%`,
                            top: `${region.y * 100}%`,
                            width: `${region.w * 100}%`,
                            height: `${region.h * 100}%`,
                          }}
                          onPointerDown={(event) => beginDrag(event, "move")}
                        >
                          {live ? null : (
                            <>
                              <Handle label="Resize from top left" className="-top-5 -left-5" onDown={(event) => beginDrag(event, "nw")} />
                              <Handle label="Resize from top right" className="-top-5 -right-5" onDown={(event) => beginDrag(event, "ne")} />
                              <Handle label="Resize from bottom left" className="-bottom-5 -left-5" onDown={(event) => beginDrag(event, "sw")} />
                              <Handle label="Resize from bottom right" className="-bottom-5 -right-5" onDown={(event) => beginDrag(event, "se")} />
                            </>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="absolute inset-x-0 bottom-4 text-center text-sm text-muted">Waiting for the shared picture…</p>
                    )}
                  </>
                )}
              </div>

              <aside className="flex h-72 min-h-0 shrink-0 flex-col overflow-hidden border-t border-fg/10 lg:h-auto lg:min-h-0 lg:w-1/2 lg:flex-1 lg:border-t-0 lg:border-l">
                <div className="flex shrink-0 flex-col gap-2 border-b border-fg/10 px-4 py-3">
                  {!live ? (
                    <button
                      type="button"
                      className={`${primaryBtn} w-full`}
                      onClick={startReading}
                      disabled={mode === "screen" && !picture}
                    >
                      Read this section
                    </button>
                  ) : (
                    <button type="button" className={`${primaryBtn} w-full`} onClick={() => void stopAndSave()} disabled={saving}>
                      {saving ? <Loader2 className="size-4 animate-spin" /> : <Square className="size-4 fill-current" />}
                      Stop and save
                    </button>
                  )}
                  {live ? (
                    <div className="flex gap-2">
                      <button type="button" className={`${ghostBtn} min-w-0 flex-1`} onClick={() => void pass(true)} disabled={saving}>
                        Read again
                      </button>
                      {mode === "practice" ? (
                        <button type="button" className={`${ghostBtn} min-w-0 flex-1`} onClick={toggleScroll}>
                          <ArrowDown className="size-4" />
                          {scrolling ? "Pause" : "Run scroll"}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
                <div className="shrink-0 px-4 py-3">
                  <p data-seam="status" aria-live="polite" className="text-sm leading-relaxed text-muted">
                    {statusCopy({ live, saving, motion, error, lastMs, mode, words })}
                  </p>
                  <p className="mt-1 text-sm tabular-nums text-muted">
                    {reads} {reads === 1 ? "pass" : "passes"} · {words} words
                    {lastMs > 0 ? ` · last pass ${formatMs(lastMs)}` : ""}
                  </p>
                </div>
                <div ref={transcriptRef} data-seam="transcript" className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                  <Manuscript text={body} />
                </div>
              </aside>
            </div>
          )}
        </div>
      ) : null}
      {view === "file" && openFile ? (
        <FileView
          file={openFile}
          editing={editing}
          draft={draft}
          titleDraft={titleDraft}
          confirmDelete={confirmDelete}
          onBack={() => setView("library")}
          onDraft={setDraft}
          onTitle={setTitleDraft}
          onEdit={() => {
            setDraft(openFile.text);
            setTitleDraft(openFile.title);
            setEditing(true);
          }}
          onCancel={() => setEditing(false)}
          onConfirmDelete={setConfirmDelete}
          onSave={async () => {
            try {
              const next = withText(openFile, draft, titleDraft.trim() || openFile.title);
              await putFile(next);
              setFiles((current) => current?.map((item) => (item.id === next.id ? next : item)) ?? [next]);
              setTitleDraft(next.title);
              setEditing(false);
              toast("Changes saved");
            } catch {
              toast("Couldn't save the changes.");
            }
          }}
          onDelete={async () => {
            try {
              await removeFile(openFile.id);
              setFiles((current) => current?.filter((item) => item.id !== openFile.id) ?? []);
              setView("library");
            } catch {
              toast("Couldn't delete that file.");
            }
          }}
        />
      ) : null}
    </div>
  );
}

function Library({
  files,
  onStart,
  onOpen,
}: {
  files: SeamFile[] | null;
  onStart: () => void;
  onOpen: (id: string) => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 py-6 sm:px-8 sm:py-10">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-tally text-bg" aria-hidden="true">
            <span className="size-2.5 rounded-full bg-bg" />
          </span>
          <p className="font-serif text-xl">Seam</p>
        </div>
        <p className="text-sm text-muted">Saved on this device</p>
      </header>

      <div className="mt-10 grid flex-1 gap-12 lg:mt-16 lg:grid-cols-2 lg:gap-16">
        <section>
          <p className="text-sm font-medium tracking-wide text-tally">Screen section reader</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-balance sm:text-5xl">
            Copy the text on screen. Keep going when it scrolls.
          </h1>
          <p className="mt-5 max-w-prose text-base leading-relaxed text-pretty text-muted">
            Draw a section of a shared screen. Seam reads what’s already there — usually a couple of seconds once
            the reader is warm — then waits. Scroll that section and pause. It lines the new text up with the last
            lines it kept, and only adds what it hasn’t seen.
          </p>
          <button type="button" className={`${primaryBtn} mt-8`} onClick={onStart}>
            Start a capture
          </button>
          <ol className="mt-10 grid gap-4">
            {STEPS.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-full border border-fg/15 font-medium tabular-nums text-tally">
                  {index + 1}
                </span>
                <p className="pt-1 text-sm leading-relaxed text-fg">{step}</p>
              </li>
            ))}
          </ol>
          <aside className="mt-8 border-l-2 border-tally pl-4">
            <p className="text-sm font-medium">What a website can and can’t do</p>
            <p className="mt-1 text-sm leading-relaxed text-pretty text-muted">
              Seam can’t open other apps by itself or read text they haven’t drawn. You share a window or the whole
              screen, then draw the part that matters. On a phone, split screen is the workable setup. This preview
              often blocks sharing, so the practice page is here.
            </p>
          </aside>
        </section>

        <section>
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-serif text-2xl">Library</h2>
            <p className="text-sm tabular-nums text-muted">
              {files === null ? "…" : `${files.length} ${files.length === 1 ? "file" : "files"}`}
            </p>
          </div>
          {files === null ? (
            <p className="mt-6 text-sm text-muted">Opening the library…</p>
          ) : files.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-fg/10 bg-surface px-5 py-8">
              <p className="font-serif text-xl">No files yet</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                When you stop a capture, Seam stores a Markdown file here. You can also download it as .md or .txt.
                Nothing is uploaded.
              </p>
            </div>
          ) : (
            <ul className="mt-4">
              {files.map((file) => (
                <li key={file.id} className="border-b border-fg/10">
                  <button type="button" className="flex w-full items-center gap-3 py-4 text-left" onClick={() => onOpen(file.id)}>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-serif text-lg">{file.title}</span>
                      <span className="mt-1 block text-sm text-muted tabular-nums">
                        {format(file.createdAt, "d MMM · HH:mm")} · {file.words} words ·{" "}
                        {file.source === "screen" ? "Screen" : "Practice"}
                      </span>
                    </span>
                    <span className="text-xs font-medium tracking-wide text-muted">MD</span>
                    <ChevronRight className="size-5 shrink-0 text-muted" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function FileView({
  file,
  editing,
  draft,
  titleDraft,
  confirmDelete,
  onBack,
  onDraft,
  onTitle,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  onConfirmDelete,
}: {
  file: SeamFile;
  editing: boolean;
  draft: string;
  titleDraft: string;
  confirmDelete: boolean;
  onBack: () => void;
  onDraft: (value: string) => void;
  onTitle: (value: string) => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => Promise<void>;
  onDelete: () => Promise<void>;
  onConfirmDelete: (value: boolean) => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-5 py-6 sm:px-8">
      <header className="flex items-center justify-between gap-3">
        <button type="button" className={quietBtn} onClick={onBack}>
          <ArrowLeft className="size-5" />
          Library
        </button>
        <p className="text-xs font-medium tracking-wide text-muted">Markdown</p>
      </header>
      <article className="mt-8">
        {editing ? (
          <input
            value={titleDraft}
            onChange={(event) => onTitle(event.target.value)}
            aria-label="Title"
            className="w-full bg-transparent font-serif text-4xl leading-tight text-fg outline-none"
          />
        ) : (
          <h1 className="font-serif text-4xl leading-tight text-balance">{file.title}</h1>
        )}
        <p className="mt-3 text-sm text-muted tabular-nums">
          {format(file.createdAt, "d MMM yyyy · HH:mm")} · {file.source === "screen" ? "Screen section" : "Practice page"} ·{" "}
          {file.words} words · {file.reads} {file.reads === 1 ? "pass" : "passes"}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            className={ghostBtn}
            onClick={() => {
              void navigator.clipboard.writeText(file.markdown).then(
                () => toast("Copied Markdown"),
                () => toast("Couldn’t copy from this browser"),
              );
            }}
          >
            <Copy className="size-4" />
            Copy
          </button>
          <button
            type="button"
            className={ghostBtn}
            onClick={() => downloadText(`${slugify(file.title)}.md`, file.markdown, "text/markdown")}
          >
            <Download className="size-4" />
            .md
          </button>
          <button
            type="button"
            className={ghostBtn}
            onClick={() => downloadText(`${slugify(file.title)}.txt`, file.text, "text/plain")}
          >
            <Download className="size-4" />
            .txt
          </button>
          {editing ? (
            <>
              <button type="button" className={primaryBtn} onClick={() => void onSave()}>
                <Check className="size-4" />
                Save
              </button>
              <button type="button" className={quietBtn} onClick={onCancel}>
                Cancel
              </button>
            </>
          ) : (
            <button type="button" className={quietBtn} onClick={onEdit}>
              <Pencil className="size-4" />
              Edit
            </button>
          )}
        </div>
        <div className="mt-8">
          {editing ? (
            <textarea
              value={draft}
              onChange={(event) => onDraft(event.target.value)}
              aria-label="Note"
              className="min-h-80 w-full resize-y rounded-2xl border border-fg/10 bg-surface p-4 font-serif text-lg leading-relaxed text-fg outline-none focus-visible:border-tally"
            />
          ) : (
            <Manuscript text={file.text} />
          )}
        </div>
        <div className="mt-10 border-t border-fg/10 pt-6">
          {confirmDelete ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm text-muted">Delete this file from the library?</p>
              <button type="button" className={primaryBtn} onClick={() => void onDelete()}>
                Delete
              </button>
              <button type="button" className={quietBtn} onClick={() => onConfirmDelete(false)}>
                Keep
              </button>
            </div>
          ) : (
            <button type="button" className={quietBtn} onClick={() => onConfirmDelete(true)}>
              <Trash2 className="size-4" />
              Delete
            </button>
          )}
        </div>
      </article>
    </main>
  );
}

function Manuscript({ text }: { text: string }) {
  const parts = text.split(/\n\n+/).filter((part) => part.trim().length > 0);
  if (!parts.length) {
    return <p className="text-sm leading-relaxed text-muted">The manuscript shows up here.</p>;
  }
  return (
    <div className="flex flex-col gap-4">
      {parts.map((part, index) =>
        part.startsWith(">") ? (
          <blockquote key={`${index}-${part.slice(0, 12)}`} className="border-l-2 border-tally pl-4 text-sm leading-relaxed text-muted">
            {part.replace(/^>\s*/, "")}
          </blockquote>
        ) : (
          <p key={`${index}-${part.slice(0, 12)}`} className="font-serif text-lg leading-relaxed text-pretty break-words">
            {part}
          </p>
        ),
      )}
    </div>
  );
}

function Handle({
  label,
  className,
  onDown,
}: {
  label: string;
  className: string;
  onDown: (event: ReactPointerEvent) => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={`absolute grid size-11 place-items-center ${className}`}
      onPointerDown={onDown}
    >
      <span className="size-3 rounded-sm bg-tally" />
    </button>
  );
}

function statusCopy({
  live,
  saving,
  motion,
  error,
  lastMs,
  mode,
  words,
}: {
  live: boolean;
  saving: boolean;
  motion: Motion;
  error: string;
  lastMs: number;
  mode: Mode;
  words: number;
}): string {
  if (saving) return "Saving the note…";
  if (motion === "error") return error || "The reader hit a problem.";
  if (!live) {
    return mode === "screen"
      ? "Drag the frame over the text. Only that rectangle is read."
      : "This page is the section. Start, then scroll — Seam keeps only the new lines.";
  }
  if (motion === "reading" && words === 0) return "Reading what’s already on screen…";
  if (motion === "reading") return "Reading the new lines…";
  if (motion === "moving") return "Scrolling. Seam continues from the last line when the screen stops.";
  if (motion === "gap") return "Caught up. A gap is marked where a flick skipped a screen.";
  if (words === 0) return "No text in this section yet. Move the frame, or scroll text into it.";
  return `Caught up${lastMs > 0 ? ` in ${formatMs(lastMs)}` : ""}. Scroll and pause to continue.`;
}

function readerLabel(phase: ReaderPhase): string {
  if (phase === "ready") {
    return "Optical reader is ready on this device. A still section should land in a couple of seconds. Nothing is uploaded.";
  }
  if (phase === "loading") {
    return "Warming the optical reader. It stays on this device. The first screen read is faster once this finishes.";
  }
  if (phase === "error") {
    return "The optical reader didn’t load, so screen reading is unavailable. The practice page still works.";
  }
  return "The optical reader loads on this device. Nothing is uploaded.";
}

function formatMs(ms: number): string {
  if (ms <= 0) return "—";
  if (ms < 1000) return `${Math.max(1, Math.round(ms))} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function formatElapsed(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function drift(a: Uint8Array, b: Uint8Array): number {
  const count = Math.min(a.length, b.length);
  if (!count) return 0;
  let sum = 0;
  for (let i = 0; i < count; i++) sum += Math.abs(a[i] - b[i]);
  return sum / count;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
