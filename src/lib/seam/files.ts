import { format } from "date-fns";
import { countWords } from "./stitch";

export type SeamSource = "screen" | "practice";

export type SeamFile = {
  id: string;
  title: string;
  createdAt: number;
  words: number;
  reads: number;
  source: SeamSource;
  markdown: string;
  text: string;
};

const DB_NAME = "seam";
const STORE = "files";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open the library"));
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Library request failed"));
  });
}

export async function listFiles(): Promise<SeamFile[]> {
  const db = await openDb();
  try {
    const rows = await requestToPromise(
      db.transaction(STORE, "readonly").objectStore(STORE).getAll(),
    );
    return (rows as SeamFile[]).sort((a, b) => b.createdAt - a.createdAt);
  } finally {
    db.close();
  }
}

export async function putFile(file: SeamFile): Promise<void> {
  const db = await openDb();
  try {
    await requestToPromise(db.transaction(STORE, "readwrite").objectStore(STORE).put(file));
  } finally {
    db.close();
  }
}

export async function removeFile(id: string): Promise<void> {
  const db = await openDb();
  try {
    await requestToPromise(db.transaction(STORE, "readwrite").objectStore(STORE).delete(id));
  } finally {
    db.close();
  }
}

export function buildMarkdown(file: Pick<SeamFile, "title" | "createdAt" | "words" | "reads" | "source" | "text">): string {
  const when = format(file.createdAt, "d MMM yyyy · HH:mm");
  const via = file.source === "screen" ? "Screen section" : "Practice page";
  return `# ${file.title}\n\n_${when} · ${via} · ${file.words} words · ${file.reads} ${file.reads === 1 ? "read" : "reads"}_\n\n${file.text.trim()}\n`;
}

export function withText(file: SeamFile, text: string, title = file.title): SeamFile {
  const words = countWords(text);
  const next = { ...file, title, text, words };
  return { ...next, markdown: buildMarkdown(next) };
}

export function slugify(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return slug || "capture";
}

export function downloadText(filename: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
