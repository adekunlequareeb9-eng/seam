import { o as __toESM } from "../_runtime.mjs";
import { q as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as MonitorUp, c as Copy, d as BookOpen, f as ArrowLeft, i as Pencil, l as ChevronRight, n as Trash2, o as LoaderCircle, p as ArrowDown, r as Square, s as Download, u as Check } from "../_libs/lucide-react.mjs";
import { t as format } from "../_libs/date-fns.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CVMCllrq.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var PRACTICE_BLOCKS = [
	{
		kind: "h",
		text: "Field notes from a scrolling screen"
	},
	{
		kind: "p",
		text: "Start where the section already is. The first pass should take the words that are visible and then stop, instead of reading the same rectangle again."
	},
	{
		kind: "p",
		text: "A ferry timetable is a good test. The eye lands on the next boat, the one after, and the note about the last crossing before dark. None of those lines should be copied twice."
	},
	{
		kind: "p",
		text: "When the page moves, the top lines leave and new ones arrive at the bottom. A careful reader keeps the overlap, finds the last line it already trusts, and continues from there."
	},
	{
		kind: "p",
		text: "Market boards work the same way. Prices are rewritten over old prices. You want the newest sentence, not a second copy of the sentence that was already in the notebook."
	},
	{
		kind: "p",
		text: "If the scroll pauses, that pause is the moment to read. Motion blurs letters. A still section is sharp, and a sharp section can be finished in a couple of seconds."
	},
	{
		kind: "p",
		text: "Bus windows repeat the same route number. Repetition is not new text. The stitcher has to tell a repeated sign from a line it has never stored."
	},
	{
		kind: "p",
		text: "Scroll back toward the beginning and the opening can still be missing. If those earlier lines were never captured, they belong at the top, not pasted on the end."
	},
	{
		kind: "p",
		text: "A heading is short. A wrapped sentence is long. Keep the heading on its own line, and join the wrapped sentence so the saved note reads like a page instead of a stack of cuts."
	},
	{
		kind: "p",
		text: "Someone flicks too fast and a whole screen never settles. Say so in the note. A marked gap is more honest than a paragraph invented to hide the skip."
	},
	{
		kind: "p",
		text: "The harbor lights were still on when the last boat cleared the bar. That sentence is a landmark. If a later pass only sees the end of it, replace the short version with the full one."
	},
	{
		kind: "p",
		text: "Phone screens and desktop windows share one rule here: only the rectangle you chose is in play. Chrome around it, and the tool's own buttons, should stay outside the frame."
	},
	{
		kind: "p",
		text: "Stop the session and the manuscript is the file. Markdown stays in the library on this device. A text download is the same words without the title block."
	},
	{
		kind: "p",
		text: "Read this closing once. If the scroller is still moving, wait until the last paragraph is fully in view, then catch it and go quiet. That quiet is the reader being done."
	},
	{
		kind: "p",
		text: "Nothing below this line is part of the sample. If it shows up in the note, the section was taller than the page, and the extra words came from outside the field guide."
	}
];
var GAP_LINE = "Seam lost the overlap here. A fast flick may have skipped a screen.";
var MATCH_WINDOW = 100;
function normLine(value) {
	return value.toLowerCase().replace(/[^\p{L}\p{N}\s']/gu, "").replace(/\s+/g, " ").trim();
}
function cleanLines(raw) {
	const out = [];
	for (const piece of raw) for (const bit of piece.split(/\n+/)) {
		const line = bit.replace(/\s+/g, " ").trim();
		if (!line || !/[\p{L}\p{N}]/u.test(line)) continue;
		if ([...line].length < 2) continue;
		const prev = out[out.length - 1];
		if (prev && /[\p{L}]-$/u.test(prev) && /^[\p{Ll}]/u.test(line)) {
			out[out.length - 1] = prev.slice(0, -1) + line;
			continue;
		}
		out.push(line);
	}
	return out;
}
function ratio(a, b) {
	if (a === b) return 1;
	const m = a.length;
	const n = b.length;
	if (!m || !n) return 0;
	const limit = Math.ceil(Math.max(m, n) * .2);
	if (Math.abs(m - n) > limit) return 0;
	const s = m > 160 ? a.slice(0, 160) : a;
	const t = n > 160 ? b.slice(0, 160) : b;
	const sm = s.length;
	const sn = t.length;
	let prev = new Uint16Array(sn + 1);
	let curr = new Uint16Array(sn + 1);
	for (let j = 0; j <= sn; j++) prev[j] = j;
	for (let i = 1; i <= sm; i++) {
		curr[0] = i;
		let rowMin = curr[0];
		const sc = s.charCodeAt(i - 1);
		for (let j = 1; j <= sn; j++) {
			const cost = sc === t.charCodeAt(j - 1) ? 0 : 1;
			const v = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
			curr[j] = v;
			if (v < rowMin) rowMin = v;
		}
		if (rowMin > limit) return 0;
		const swap = prev;
		prev = curr;
		curr = swap;
	}
	return 1 - prev[sn] / Math.max(sm, sn);
}
function linesMatch(a, b) {
	const na = normLine(a);
	const nb = normLine(b);
	if (!na || !nb) return false;
	if (na === nb) return true;
	const short = na.length <= nb.length ? na : nb;
	const long = na.length <= nb.length ? nb : na;
	if (short.length >= 14 && long.startsWith(short) && short.length / long.length >= .62) return true;
	if (short.length < 12) return false;
	return ratio(na, nb) >= .86;
}
function preferLine(current, incoming) {
	const c = current.trim();
	const n = incoming.trim();
	if (!n) return c;
	if (!c) return n;
	if (!linesMatch(c, n)) return c;
	return n.length > c.length ? n : c;
}
function better(next, best) {
	if (!best) return true;
	if (next.len !== best.len) return next.len > best.len;
	if (next.reachesEnd !== best.reachesEnd) return next.reachesEnd;
	return next.i > best.i;
}
function stitchDocument(doc, incomingRaw) {
	const incoming = cleanLines(incomingRaw);
	if (incoming.length === 0) return {
		lines: doc,
		added: [],
		upgraded: 0,
		gap: false
	};
	if (doc.length === 0) return {
		lines: incoming,
		added: [...incoming],
		upgraded: 0,
		gap: false
	};
	const start = Math.max(0, doc.length - MATCH_WINDOW);
	const tail = doc.slice(start);
	let best = null;
	for (let i = 0; i < tail.length; i++) for (let j = 0; j < incoming.length; j++) {
		if (!linesMatch(tail[i], incoming[j])) continue;
		let len = 1;
		while (i + len < tail.length && j + len < incoming.length && linesMatch(tail[i + len], incoming[j + len])) len++;
		const candidate = {
			len,
			i,
			j,
			reachesEnd: i + len === tail.length
		};
		if (better(candidate, best)) best = candidate;
	}
	const anchorLong = !!best && best.len === 1 && normLine(incoming[best.j]).length >= 18;
	const confident = !!best && (best.len >= 2 || anchorLong);
	if (!best || !confident) {
		let hits = 0;
		for (const line of incoming) if (tail.some((existing) => linesMatch(existing, line))) hits++;
		if (hits / incoming.length >= .65) return {
			lines: doc,
			added: [],
			upgraded: 0,
			gap: false
		};
		if (incoming.length === 1 && normLine(incoming[0]).length < 12) return {
			lines: doc,
			added: [],
			upgraded: 0,
			gap: false
		};
		return {
			lines: [
				...doc,
				GAP_LINE,
				...incoming
			],
			added: [...incoming],
			upgraded: 0,
			gap: true
		};
	}
	const next = doc.slice();
	let upgraded = 0;
	for (let k = 0; k < best.len; k++) {
		const di = start + best.i + k;
		const betterLine = preferLine(next[di], incoming[best.j + k]);
		if (betterLine !== next[di]) {
			next[di] = betterLine;
			upgraded++;
		}
	}
	const added = [];
	const overlapEnd = start + best.i + best.len;
	if (next.slice(overlapEnd).length === 0) for (let j = best.j + best.len; j < incoming.length; j++) {
		const line = incoming[j];
		const prev = next[next.length - 1];
		if (prev && linesMatch(prev, line)) {
			const betterLine = preferLine(prev, line);
			if (betterLine !== prev) {
				next[next.length - 1] = betterLine;
				upgraded++;
			}
			continue;
		}
		next.push(line);
		added.push(line);
	}
	if (best.j > 0 && start + best.i === 0) {
		const prefix = [];
		for (let j = 0; j < best.j; j++) {
			const line = incoming[j];
			if (!next.slice(0, best.j + 4).some((existing) => linesMatch(existing, line))) prefix.push(line);
		}
		if (prefix.length) {
			next.unshift(...prefix);
			added.unshift(...prefix);
		}
	}
	return {
		lines: next,
		added,
		upgraded,
		gap: false
	};
}
function manuscript(lines) {
	const paras = [];
	let buf = "";
	const flush = () => {
		const trimmed = buf.trim();
		if (trimmed) paras.push(trimmed);
		buf = "";
	};
	for (const line of lines) {
		if (line.includes("Seam lost the overlap here")) {
			flush();
			paras.push("> Seam lost the overlap here. A fast flick may have skipped a screen.");
			continue;
		}
		if (!buf) {
			buf = line;
			continue;
		}
		const endsSentence = /[.!?…]["'”)]?$/.test(buf);
		if (buf.length >= 40 && !endsSentence) buf = `${buf} ${line}`;
		else {
			flush();
			buf = line;
		}
	}
	flush();
	return paras.join("\n\n");
}
function countWords(text) {
	return text.replace(/^>.*$/gm, " ").match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu)?.length ?? 0;
}
function suggestTitle(text) {
	const line = text.split("\n").map((item) => item.replace(/^>\s*/, "").trim()).find((item) => item.length > 0 && !item.startsWith("Seam lost the overlap"));
	if (!line) return "Untitled capture";
	const title = line.split(/\s+/).slice(0, 8).join(" ");
	return line.split(/\s+/).length > 8 ? `${title}…` : title;
}
var DB_NAME = "seam";
var STORE = "files";
function openDb() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, 1);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error ?? /* @__PURE__ */ new Error("Could not open the library"));
	});
}
function requestToPromise(request) {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error ?? /* @__PURE__ */ new Error("Library request failed"));
	});
}
async function listFiles() {
	const db = await openDb();
	try {
		return (await requestToPromise(db.transaction(STORE, "readonly").objectStore(STORE).getAll())).sort((a, b) => b.createdAt - a.createdAt);
	} finally {
		db.close();
	}
}
async function putFile(file) {
	const db = await openDb();
	try {
		await requestToPromise(db.transaction(STORE, "readwrite").objectStore(STORE).put(file));
	} finally {
		db.close();
	}
}
async function removeFile(id) {
	const db = await openDb();
	try {
		await requestToPromise(db.transaction(STORE, "readwrite").objectStore(STORE).delete(id));
	} finally {
		db.close();
	}
}
function buildMarkdown(file) {
	const when = format(file.createdAt, "d MMM yyyy · HH:mm");
	const via = file.source === "screen" ? "Screen section" : "Practice page";
	return `# ${file.title}\n\n_${when} · ${via} · ${file.words} words · ${file.reads} ${file.reads === 1 ? "read" : "reads"}_\n\n${file.text.trim()}\n`;
}
function withText(file, text, title = file.title) {
	const words = countWords(text);
	const next = {
		...file,
		title,
		text,
		words
	};
	return {
		...next,
		markdown: buildMarkdown(next)
	};
}
function slugify(title) {
	return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "capture";
}
function downloadText(filename, content, mime) {
	const blob = new Blob([content], { type: mime });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}
function detector() {
	const ctor = window.TextDetector;
	if (!ctor) return null;
	try {
		return new ctor();
	} catch {
		return null;
	}
}
function linesFromDetector(blocks) {
	const items = blocks.map((block) => ({
		text: (block.rawValue ?? "").replace(/\s+/g, " ").trim(),
		top: block.boundingBox?.top ?? block.boundingBox?.y ?? 0,
		left: block.boundingBox?.left ?? block.boundingBox?.x ?? 0,
		height: block.boundingBox?.height ?? 16
	})).filter((item) => item.text.length > 0).sort((a, b) => a.top - b.top || a.left - b.left);
	if (!items.length) return [];
	const lines = [];
	for (const item of items) {
		const row = lines.find((line) => Math.abs(line.top - item.top) < Math.max(line.height, item.height) * .6);
		if (row) row.parts.push({
			left: item.left,
			text: item.text
		});
		else lines.push({
			top: item.top,
			height: item.height,
			parts: [{
				left: item.left,
				text: item.text
			}]
		});
	}
	return lines.map((line) => line.parts.sort((a, b) => a.left - b.left).map((part) => part.text).join(" "));
}
function prepareForOcr(source) {
	const scale = Math.min(1, 800 / source.width, 1100 / source.height);
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
		const luma = data[i] * .299 + data[i + 1] * .587 + data[i + 2] * .114;
		data[i] = data[i + 1] = data[i + 2] = luma;
		sum += luma;
	}
	if (sum / pixels < 140) for (let i = 0; i < data.length; i += 4) {
		const inverted = 255 - data[i];
		data[i] = data[i + 1] = data[i + 2] = inverted;
	}
	ctx.putImageData(image, 0, 0);
	return canvas;
}
function paintSample(canvas) {
	canvas.width = 880;
	canvas.height = 360;
	const ctx = canvas.getContext("2d");
	if (!ctx) return;
	ctx.fillStyle = "#f4efe6";
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = "#1c1a16";
	ctx.font = "600 32px Georgia, serif";
	[
		"Seam reads this section once,",
		"then waits for the scroll to stop.",
		"New lines are kept. Old lines are not."
	].forEach((line, index) => {
		ctx.fillText(line, 48, 96 + index * 64);
	});
}
function createReader(onPhase) {
	let workerPromise = null;
	let dead = false;
	const native = typeof window === "undefined" ? null : detector();
	function boot() {
		if (!workerPromise) workerPromise = (async () => {
			onPhase("loading", "Loading the reader");
			const imported = await import("../_libs/tesseract.js.mjs").then((n) => /* @__PURE__ */ __toESM(n.t()));
			const worker = await imported.createWorker("eng", 1, { logger: (message) => {
				if (message.status && message.progress > 0 && message.progress < 1) onPhase("loading", message.status);
			} });
			await worker.setParameters({
				tessedit_pageseg_mode: imported.PSM.SINGLE_BLOCK,
				preserve_interword_spaces: "1",
				user_defined_dpi: "120"
			});
			if (dead) {
				await worker.terminate();
				throw new Error("Reader closed");
			}
			onPhase("ready");
			return worker;
		})().catch((error) => {
			workerPromise = null;
			onPhase("error", error instanceof Error ? error.message : "Reader failed to load");
			throw error;
		});
		return workerPromise;
	}
	async function read(canvas) {
		if (native) try {
			const found = linesFromDetector(await native.detect(canvas));
			if (found.length) return found;
		} catch {}
		const worker = await boot();
		const prepared = prepareForOcr(canvas);
		return (await worker.recognize(prepared, {}, { text: true })).data.text.split(/\n/);
	}
	return {
		warm: () => {
			if (native) onPhase("ready", "Instant reader");
			boot().catch(() => {});
		},
		read,
		stop: async () => {
			dead = true;
			if (!workerPromise) return;
			try {
				await (await workerPromise).terminate();
			} catch {}
		}
	};
}
var DEFAULT_REGION = {
	x: .08,
	y: .1,
	w: .84,
	h: .8
};
var primaryBtn = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-tally px-5 text-base font-medium text-bg transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tally disabled:cursor-not-allowed disabled:opacity-40";
var ghostBtn = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-fg/15 bg-surface px-5 text-base font-medium text-fg transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tally disabled:cursor-not-allowed disabled:opacity-40";
var quietBtn = "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium text-fg transition-colors hover:bg-fg/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-tally";
var STEPS = [
	"Share a window, a tab, or the whole screen.",
	"Draw the section that holds the text.",
	"Seam reads it once, then waits. Scroll and pause — it continues from the last line.",
	"Stop. The note stays in this app as Markdown."
];
function SeamApp() {
	const [view, setView] = (0, import_react.useState)("library");
	const [files, setFiles] = (0, import_react.useState)(null);
	const [openId, setOpenId] = (0, import_react.useState)(null);
	const [mode, setMode] = (0, import_react.useState)(null);
	const [live, setLive] = (0, import_react.useState)(false);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [lines, setLines] = (0, import_react.useState)([]);
	const [reads, setReads] = (0, import_react.useState)(0);
	const [lastMs, setLastMs] = (0, import_react.useState)(0);
	const [elapsed, setElapsed] = (0, import_react.useState)(0);
	const [motion, setMotion] = (0, import_react.useState)("idle");
	const [error, setError] = (0, import_react.useState)("");
	const [region, setRegion] = (0, import_react.useState)(DEFAULT_REGION);
	const [picture, setPicture] = (0, import_react.useState)(null);
	const [scrolling, setScrolling] = (0, import_react.useState)(false);
	const [readerPhase, setReaderPhase] = (0, import_react.useState)("idle");
	const [benching, setBenching] = (0, import_react.useState)(false);
	const [bench, setBench] = (0, import_react.useState)(null);
	const [mounted, setMounted] = (0, import_react.useState)(false);
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [titleDraft, setTitleDraft] = (0, import_react.useState)("");
	const [confirmDelete, setConfirmDelete] = (0, import_react.useState)(false);
	const linesRef = (0, import_react.useRef)([]);
	const regionRef = (0, import_react.useRef)(DEFAULT_REGION);
	const modeRef = (0, import_react.useRef)(null);
	const runningRef = (0, import_react.useRef)(false);
	const readsRef = (0, import_react.useRef)(0);
	const motionRef = (0, import_react.useRef)("idle");
	const inFlightRef = (0, import_react.useRef)(null);
	const passRef = (0, import_react.useRef)(async () => {});
	const tickRef = (0, import_react.useRef)(() => {});
	const loopRef = (0, import_react.useRef)(null);
	const scrollRaf = (0, import_react.useRef)(null);
	const savingRef = (0, import_react.useRef)(false);
	const startedAt = (0, import_react.useRef)(0);
	const lastPassMs = (0, import_react.useRef)(0);
	const practiceSig = (0, import_react.useRef)("");
	const pendingMove = (0, import_react.useRef)(0);
	const hotFrames = (0, import_react.useRef)(0);
	const stableSince = (0, import_react.useRef)(0);
	const lastLuma = (0, import_react.useRef)(null);
	const streamRef = (0, import_react.useRef)(null);
	const readerRef = (0, import_react.useRef)(null);
	const videoRef = (0, import_react.useRef)(null);
	const stageRef = (0, import_react.useRef)(null);
	const overlayRef = (0, import_react.useRef)(null);
	const scrollerRef = (0, import_react.useRef)(null);
	const transcriptRef = (0, import_react.useRef)(null);
	const scratchRef = (0, import_react.useRef)(null);
	const grabRef = (0, import_react.useRef)(null);
	const dragRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		regionRef.current = region;
	}, [region]);
	(0, import_react.useEffect)(() => {
		modeRef.current = mode;
	}, [mode]);
	(0, import_react.useEffect)(() => {
		setMounted(true);
		const reader = createReader((phase) => setReaderPhase(phase));
		readerRef.current = reader;
		reader.warm();
		listFiles().then(setFiles).catch(() => setFiles([]));
		return () => {
			runningRef.current = false;
			if (loopRef.current) window.clearTimeout(loopRef.current);
			if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
			streamRef.current?.getTracks().forEach((track) => track.stop());
			reader.stop();
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (!live) return;
		const id = window.setInterval(() => {
			setElapsed(Date.now() - startedAt.current);
		}, 1e3);
		return () => window.clearInterval(id);
	}, [live]);
	(0, import_react.useEffect)(() => {
		if (!live) return;
		const el = transcriptRef.current;
		if (el) el.scrollTop = el.scrollHeight;
	}, [lines, live]);
	(0, import_react.useEffect)(() => {
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
				height
			});
		};
		video.play().catch(() => {});
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
	function setMotionIf(next) {
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
	function readPractice() {
		const root = scrollerRef.current;
		if (!root) return [];
		const box = root.getBoundingClientRect();
		const found = [];
		root.querySelectorAll("[data-line]").forEach((el) => {
			const rect = el.getBoundingClientRect();
			if (Math.min(rect.bottom, box.bottom) - Math.max(rect.top, box.top) > 8) found.push((el.textContent ?? "").replace(/\s+/g, " ").trim());
		});
		return found.filter(Boolean);
	}
	function sampleLuma(video, rect) {
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
		ctx.drawImage(video, rect.x * video.videoWidth, rect.y * video.videoHeight, Math.max(1, rect.w * video.videoWidth), Math.max(1, rect.h * video.videoHeight), 0, 0, size, size);
		const data = ctx.getImageData(0, 0, size, size).data;
		const luma = /* @__PURE__ */ new Uint8Array(576);
		for (let i = 0, p = 0; i < data.length; i += 4, p++) luma[p] = (data[i] + data[i + 1] + data[i + 2]) / 3;
		return luma;
	}
	async function readScreen() {
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
	async function runPass(force) {
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
			} else setMotionIf("still");
		} catch (caught) {
			const message = caught instanceof Error ? caught.message : "Could not read that section";
			setError(message);
			setMotionIf("error");
		}
	}
	async function pass(force = false) {
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
			if (signature && signature !== practiceSig.current) passRef.current(false);
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
			passRef.current(false);
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
			passRef.current(true);
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
		} catch {}
		const text = manuscript(linesRef.current).trim();
		if (!text || countWords(text) === 0) {
			toast("Nothing to save yet.");
			savingRef.current = false;
			setSaving(false);
			setLive(false);
			setMotionIf("idle");
			return;
		}
		const source = modeRef.current === "screen" ? "screen" : "practice";
		const createdAt = Date.now();
		const title = suggestTitle(text);
		const file = withText({
			id: crypto.randomUUID(),
			title,
			createdAt,
			words: 0,
			reads: readsRef.current,
			source,
			text,
			markdown: ""
		}, text, title);
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
				video: { frameRate: {
					ideal: 12,
					max: 15
				} },
				audio: false,
				preferCurrentTab: false,
				selfBrowserSurface: "exclude",
				surfaceSwitching: "include"
			});
			releaseStream();
			streamRef.current = stream;
			const [track] = stream.getVideoTracks();
			track?.addEventListener("ended", () => {
				if (runningRef.current) stopAndSave();
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
			if (name !== "NotAllowedError" && name !== "AbortError") toast("Couldn't start screen share.");
			else if (name === "NotAllowedError") toast("Screen share was blocked. The practice page still runs the same scroll memory.");
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
			stopAndSave();
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
		const step = (now) => {
			const el = scrollerRef.current;
			if (!el) return;
			const dt = Math.min(32, now - last);
			last = now;
			if (el.scrollTop + el.clientHeight >= el.scrollHeight - 2) {
				stopAutoScroll();
				return;
			}
			el.scrollTop += 240 * dt / 1e3;
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
			const text = (await reader.read(canvas)).join(" ").replace(/\s+/g, " ").trim();
			setBench({
				ms: performance.now() - t0,
				text,
				ok: /seam/i.test(text) && /scroll/i.test(text)
			});
		} catch (caught) {
			setBench({
				ms: performance.now() - t0,
				text: caught instanceof Error ? caught.message : "The reader failed",
				ok: false
			});
		} finally {
			setBenching(false);
		}
	}
	function beginDrag(event, dragMode) {
		if (live) return;
		event.preventDefault();
		event.stopPropagation();
		overlayRef.current?.setPointerCapture(event.pointerId);
		dragRef.current = {
			mode: dragMode,
			x: event.clientX,
			y: event.clientY,
			rect: { ...regionRef.current }
		};
	}
	function onRegionMove(event) {
		const drag = dragRef.current;
		const overlay = overlayRef.current;
		if (!drag || !overlay) return;
		const bounds = overlay.getBoundingClientRect();
		if (!bounds.width || !bounds.height) return;
		const dx = (event.clientX - drag.x) / bounds.width;
		const dy = (event.clientY - drag.y) / bounds.height;
		const min = .12;
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
		const next = {
			x,
			y,
			w,
			h
		};
		regionRef.current = next;
		setRegion(next);
	}
	const body = manuscript(lines);
	const words = countWords(body);
	const openFile = files?.find((file) => file.id === openId) ?? null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-dvh bg-bg text-fg",
		children: [
			mounted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
				theme: "dark",
				position: "top-center",
				toastOptions: { style: {
					background: "var(--color-surface)",
					color: "var(--color-fg)",
					border: "1px solid color-mix(in oklab, var(--color-fg) 12%, transparent)"
				} }
			}) : null,
			view === "library" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Library, {
				files,
				onStart: () => {
					setMode(null);
					setLive(false);
					setLines([]);
					linesRef.current = [];
					setView("capture");
				},
				onOpen: (id) => {
					const file = files?.find((item) => item.id === id);
					if (!file) return;
					setOpenId(id);
					setDraft(file.text);
					setTitleDraft(file.title);
					setEditing(false);
					setConfirmDelete(false);
					setView("file");
				}
			}) : null,
			view === "capture" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex h-dvh flex-col overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex shrink-0 items-center gap-3 border-b border-fg/10 px-4 py-3 sm:px-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: quietBtn,
							onClick: leaveCapture,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-5" }), "Library"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 flex-1 items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: live ? "tally-live size-2.5 shrink-0 rounded-full bg-tally" : "size-2.5 shrink-0 rounded-full bg-fg/20" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate font-serif text-lg",
								children: live ? "Reading" : mode === "practice" ? "Practice" : mode === "screen" ? "Screen" : "New capture"
							})]
						}),
						live ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "tabular-nums text-sm text-muted",
							children: formatElapsed(elapsed)
						}) : null,
						live ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: primaryBtn,
							onClick: () => void stopAndSave(),
							disabled: saving,
							children: [saving ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "size-4 fill-current" }), "Stop"]
						}) : null
					]
				}), mode === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col gap-4 overflow-y-auto px-4 py-6 sm:px-6",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "font-serif text-4xl leading-tight text-balance",
							children: "Choose what to read"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 max-w-prose text-base leading-relaxed text-pretty text-muted",
							children: "Seam only sees a picture you share. Draw a rectangle, and it copies the text inside. When that picture scrolls and stops, it continues from the last line instead of starting over."
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "flex items-start gap-4 rounded-2xl border border-fg/10 bg-surface p-5 text-left hover:border-tally",
							onClick: () => void shareScreen(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-11 shrink-0 place-items-center rounded-full bg-tally text-bg",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MonitorUp, { className: "size-5" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-base font-medium",
								children: "Share a screen"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-1 block text-sm leading-relaxed text-muted",
								children: "Pick another window, a tab, or the whole display. Leave Seam’s own buttons outside the frame."
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: "flex items-start gap-4 rounded-2xl border border-fg/10 bg-surface p-5 text-left hover:border-fg/30",
							onClick: openPractice,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "grid size-11 shrink-0 place-items-center rounded-full border border-fg/15 text-fg",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-5" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-base font-medium",
								children: "Practice on a sample page"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mt-1 block text-sm leading-relaxed text-muted",
								children: "Same memory for scrolling text, read straight from the page. Use this when screen share is blocked."
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-2xl border border-fg/10 px-5 py-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm leading-relaxed text-muted",
									children: readerLabel(readerPhase)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									className: `${ghostBtn} mt-4`,
									onClick: () => void timeSample(),
									disabled: benching,
									children: [benching ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : null, "Time a sample image"]
								}),
								bench ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-3 text-sm leading-relaxed text-muted",
									children: [
										bench.ok ? `Sample read in ${formatMs(bench.ms)}.` : `The reader didn’t match the sample (${formatMs(bench.ms)}).`,
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-fg",
											children: bench.text
										})
									]
								}) : null
							]
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex min-h-0 flex-1 flex-col lg:flex-row",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						ref: stageRef,
						className: "relative min-h-0 flex-1 bg-bg",
						children: mode === "practice" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex h-full min-h-0 flex-col",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between border-b border-fg/10 px-4 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs font-medium tracking-wide text-muted",
									children: "Sample app"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-serif text-lg",
									children: "Field notes"
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted",
									children: "Selected section"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								ref: scrollerRef,
								className: "min-h-0 flex-1 overflow-y-auto px-5 py-5",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mx-auto flex max-w-xl flex-col gap-5",
									children: PRACTICE_BLOCKS.map((block) => block.kind === "h" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										"data-line": true,
										className: "font-serif text-2xl leading-tight text-balance",
										children: block.text
									}, block.text) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										"data-line": true,
										className: "font-serif text-lg leading-relaxed text-pretty",
										children: block.text
									}, block.text))
								})
							})]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
							ref: videoRef,
							autoPlay: true,
							playsInline: true,
							muted: true,
							className: "pointer-events-none h-full w-full object-contain"
						}), picture ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							ref: overlayRef,
							className: "absolute overflow-hidden",
							style: {
								left: picture.left,
								top: picture.top,
								width: picture.width,
								height: picture.height
							},
							onPointerMove: onRegionMove,
							onPointerUp: () => {
								dragRef.current = null;
							},
							onPointerCancel: () => {
								dragRef.current = null;
							},
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								role: "group",
								"aria-label": "Selected section",
								className: "region-frame absolute border-2 border-tally",
								style: {
									left: `${region.x * 100}%`,
									top: `${region.y * 100}%`,
									width: `${region.w * 100}%`,
									height: `${region.h * 100}%`
								},
								onPointerDown: (event) => beginDrag(event, "move"),
								children: live ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Handle, {
										label: "Resize from top left",
										className: "-top-5 -left-5",
										onDown: (event) => beginDrag(event, "nw")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Handle, {
										label: "Resize from top right",
										className: "-top-5 -right-5",
										onDown: (event) => beginDrag(event, "ne")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Handle, {
										label: "Resize from bottom left",
										className: "-bottom-5 -left-5",
										onDown: (event) => beginDrag(event, "sw")
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Handle, {
										label: "Resize from bottom right",
										className: "-bottom-5 -right-5",
										onDown: (event) => beginDrag(event, "se")
									})
								] })
							})
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "absolute inset-x-0 bottom-4 text-center text-sm text-muted",
							children: "Waiting for the shared picture…"
						})] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
						className: "flex h-64 shrink-0 flex-col border-t border-fg/10 lg:h-auto lg:w-1/2 lg:border-t-0 lg:border-l",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2 border-b border-fg/10 px-4 py-3",
								children: [
									!live ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: primaryBtn,
										onClick: startReading,
										disabled: mode === "screen" && !picture,
										children: "Read this section"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: primaryBtn,
										onClick: () => void stopAndSave(),
										disabled: saving,
										children: [saving ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Square, { className: "size-4 fill-current" }), "Stop and save"]
									}),
									live ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: ghostBtn,
										onClick: () => void pass(true),
										disabled: saving,
										children: "Read again"
									}) : null,
									mode === "practice" && live ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										type: "button",
										className: ghostBtn,
										onClick: toggleScroll,
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDown, { className: "size-4" }), scrolling ? "Stop scroll" : "Scroll"]
									}) : null
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "px-4 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									"data-seam": "status",
									"aria-live": "polite",
									className: "text-sm leading-relaxed text-muted",
									children: statusCopy({
										live,
										saving,
										motion,
										error,
										lastMs,
										mode,
										words
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-1 text-sm tabular-nums text-muted",
									children: [
										reads,
										" ",
										reads === 1 ? "pass" : "passes",
										" · ",
										words,
										" words",
										lastMs > 0 ? ` · last pass ${formatMs(lastMs)}` : ""
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								ref: transcriptRef,
								"data-seam": "transcript",
								className: "min-h-0 flex-1 overflow-y-auto px-4 pb-4",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Manuscript, { text: body })
							})
						]
					})]
				})]
			}) : null,
			view === "file" && openFile ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileView, {
				file: openFile,
				editing,
				draft,
				titleDraft,
				confirmDelete,
				onBack: () => setView("library"),
				onDraft: setDraft,
				onTitle: setTitleDraft,
				onEdit: () => {
					setDraft(openFile.text);
					setTitleDraft(openFile.title);
					setEditing(true);
				},
				onCancel: () => setEditing(false),
				onConfirmDelete: setConfirmDelete,
				onSave: async () => {
					try {
						const next = withText(openFile, draft, titleDraft.trim() || openFile.title);
						await putFile(next);
						setFiles((current) => current?.map((item) => item.id === next.id ? next : item) ?? [next]);
						setTitleDraft(next.title);
						setEditing(false);
						toast("Changes saved");
					} catch {
						toast("Couldn't save the changes.");
					}
				},
				onDelete: async () => {
					try {
						await removeFile(openFile.id);
						setFiles((current) => current?.filter((item) => item.id !== openFile.id) ?? []);
						setView("library");
					} catch {
						toast("Couldn't delete that file.");
					}
				}
			}) : null
		]
	});
}
function Library({ files, onStart, onOpen }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-5 py-6 sm:px-8 sm:py-10",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex items-center justify-between gap-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "grid size-9 place-items-center rounded-full bg-tally text-bg",
					"aria-hidden": "true",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2.5 rounded-full bg-bg" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-serif text-xl",
					children: "Seam"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: "Saved on this device"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-10 grid flex-1 gap-12 lg:mt-16 lg:grid-cols-2 lg:gap-16",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm font-medium tracking-wide text-tally",
					children: "Screen section reader"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-3 font-serif text-4xl leading-tight text-balance sm:text-5xl",
					children: "Copy the text on screen. Keep going when it scrolls."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-5 max-w-prose text-base leading-relaxed text-pretty text-muted",
					children: "Draw a section of a shared screen. Seam reads what’s already there — usually a couple of seconds once the reader is warm — then waits. Scroll that section and pause. It lines the new text up with the last lines it kept, and only adds what it hasn’t seen."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: `${primaryBtn} mt-8`,
					onClick: onStart,
					children: "Start a capture"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-10 grid gap-4",
					children: STEPS.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "grid size-8 shrink-0 place-items-center rounded-full border border-fg/15 font-medium tabular-nums text-tally",
							children: index + 1
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "pt-1 text-sm leading-relaxed text-fg",
							children: step
						})]
					}, step))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
					className: "mt-8 border-l-2 border-tally pl-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: "What a website can and can’t do"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-sm leading-relaxed text-pretty text-muted",
						children: "Seam can’t open other apps by itself or read text they haven’t drawn. You share a window or the whole screen, then draw the part that matters. On a phone, split screen is the workable setup. This preview often blocks sharing, so the practice page is here."
					})]
				})
			] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-serif text-2xl",
					children: "Library"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm tabular-nums text-muted",
					children: files === null ? "…" : `${files.length} ${files.length === 1 ? "file" : "files"}`
				})]
			}), files === null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 text-sm text-muted",
				children: "Opening the library…"
			}) : files.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 rounded-2xl border border-fg/10 bg-surface px-5 py-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-serif text-xl",
					children: "No files yet"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm leading-relaxed text-muted",
					children: "When you stop a capture, Seam stores a Markdown file here. You can also download it as .md or .txt. Nothing is uploaded."
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-4",
				children: files.map((file) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "border-b border-fg/10",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "flex w-full items-center gap-3 py-4 text-left",
						onClick: () => onOpen(file.id),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate font-serif text-lg",
									children: file.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "mt-1 block text-sm text-muted tabular-nums",
									children: [
										format(file.createdAt, "d MMM · HH:mm"),
										" · ",
										file.words,
										" words ·",
										" ",
										file.source === "screen" ? "Screen" : "Practice"
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-medium tracking-wide text-muted",
								children: "MD"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-5 shrink-0 text-muted" })
						]
					})
				}, file.id))
			})] })]
		})]
	});
}
function FileView({ file, editing, draft, titleDraft, confirmDelete, onBack, onDraft, onTitle, onEdit, onCancel, onSave, onDelete, onConfirmDelete }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-5 py-6 sm:px-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex items-center justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: quietBtn,
				onClick: onBack,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-5" }), "Library"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs font-medium tracking-wide text-muted",
				children: "Markdown"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
			className: "mt-8",
			children: [
				editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					value: titleDraft,
					onChange: (event) => onTitle(event.target.value),
					"aria-label": "Title",
					className: "w-full bg-transparent font-serif text-4xl leading-tight text-fg outline-none"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-serif text-4xl leading-tight text-balance",
					children: file.title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-3 text-sm text-muted tabular-nums",
					children: [
						format(file.createdAt, "d MMM yyyy · HH:mm"),
						" · ",
						file.source === "screen" ? "Screen section" : "Practice page",
						" ·",
						" ",
						file.words,
						" words · ",
						file.reads,
						" ",
						file.reads === 1 ? "pass" : "passes"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: ghostBtn,
							onClick: () => {
								navigator.clipboard.writeText(file.markdown).then(() => toast("Copied Markdown"), () => toast("Couldn’t copy from this browser"));
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "size-4" }), "Copy"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: ghostBtn,
							onClick: () => downloadText(`${slugify(file.title)}.md`, file.markdown, "text/markdown"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), ".md"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: ghostBtn,
							onClick: () => downloadText(`${slugify(file.title)}.txt`, file.text, "text/plain"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), ".txt"]
						}),
						editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: primaryBtn,
							onClick: () => void onSave(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-4" }), "Save"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: quietBtn,
							onClick: onCancel,
							children: "Cancel"
						})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							className: quietBtn,
							onClick: onEdit,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-4" }), "Edit"]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-8",
					children: editing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: draft,
						onChange: (event) => onDraft(event.target.value),
						"aria-label": "Note",
						className: "min-h-80 w-full resize-y rounded-2xl border border-fg/10 bg-surface p-4 font-serif text-lg leading-relaxed text-fg outline-none focus-visible:border-tally"
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Manuscript, { text: file.text })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-10 border-t border-fg/10 pt-6",
					children: confirmDelete ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: "Delete this file from the library?"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: primaryBtn,
								onClick: () => void onDelete(),
								children: "Delete"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								className: quietBtn,
								onClick: () => onConfirmDelete(false),
								children: "Keep"
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: quietBtn,
						onClick: () => onConfirmDelete(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), "Delete"]
					})
				})
			]
		})]
	});
}
function Manuscript({ text }) {
	const parts = text.split(/\n\n+/).filter((part) => part.trim().length > 0);
	if (!parts.length) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-sm leading-relaxed text-muted",
		children: "The manuscript shows up here."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex flex-col gap-4",
		children: parts.map((part, index) => part.startsWith(">") ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("blockquote", {
			className: "border-l-2 border-tally pl-4 text-sm leading-relaxed text-muted",
			children: part.replace(/^>\s*/, "")
		}, `${index}-${part.slice(0, 12)}`) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-serif text-lg leading-relaxed text-pretty break-words",
			children: part
		}, `${index}-${part.slice(0, 12)}`))
	});
}
function Handle({ label, className, onDown }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		"aria-label": label,
		className: `absolute grid size-11 place-items-center ${className}`,
		onPointerDown: onDown,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-3 rounded-sm bg-tally" })
	});
}
function statusCopy({ live, saving, motion, error, lastMs, mode, words }) {
	if (saving) return "Saving the note…";
	if (motion === "error") return error || "The reader hit a problem.";
	if (!live) return mode === "screen" ? "Drag the frame over the text. Only that rectangle is read." : "This page is the section. Start, then scroll — Seam keeps only the new lines.";
	if (motion === "reading" && words === 0) return "Reading what’s already on screen…";
	if (motion === "reading") return "Reading the new lines…";
	if (motion === "moving") return "Scrolling. Seam continues from the last line when the screen stops.";
	if (motion === "gap") return "Caught up. A gap is marked where a flick skipped a screen.";
	if (words === 0) return "No text in this section yet. Move the frame, or scroll text into it.";
	return `Caught up${lastMs > 0 ? ` in ${formatMs(lastMs)}` : ""}. Scroll and pause to continue.`;
}
function readerLabel(phase) {
	if (phase === "ready") return "Optical reader is ready on this device. A still section should land in a couple of seconds. Nothing is uploaded.";
	if (phase === "loading") return "Warming the optical reader. It stays on this device. The first screen read is faster once this finishes.";
	if (phase === "error") return "The optical reader didn’t load, so screen reading is unavailable. The practice page still works.";
	return "The optical reader loads on this device. Nothing is uploaded.";
}
function formatMs(ms) {
	if (ms <= 0) return "—";
	if (ms < 1e3) return `${Math.max(1, Math.round(ms))} ms`;
	return `${(ms / 1e3).toFixed(1)} s`;
}
function formatElapsed(ms) {
	const total = Math.max(0, Math.floor(ms / 1e3));
	return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, "0")}`;
}
function drift(a, b) {
	const count = Math.min(a.length, b.length);
	if (!count) return 0;
	let sum = 0;
	for (let i = 0; i < count; i++) sum += Math.abs(a[i] - b[i]);
	return sum / count;
}
function clamp(value, min, max) {
	return Math.min(max, Math.max(min, value));
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SeamApp, {});
}
//#endregion
export { Home as component };
