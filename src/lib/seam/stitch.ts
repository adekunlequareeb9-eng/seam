export const GAP_LINE =
  "Seam lost the overlap here. A fast flick may have skipped a screen.";

const MATCH_WINDOW = 100;

export function normLine(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanLines(raw: string[]): string[] {
  const out: string[] = [];
  for (const piece of raw) {
    for (const bit of piece.split(/\n+/)) {
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
  }
  return out;
}

function ratio(a: string, b: string): number {
  if (a === b) return 1;
  const m = a.length;
  const n = b.length;
  if (!m || !n) return 0;
  const limit = Math.ceil(Math.max(m, n) * 0.2);
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

export function linesMatch(a: string, b: string): boolean {
  const na = normLine(a);
  const nb = normLine(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const short = na.length <= nb.length ? na : nb;
  const long = na.length <= nb.length ? nb : na;
  if (short.length >= 14 && long.startsWith(short) && short.length / long.length >= 0.62) {
    return true;
  }
  if (short.length < 12) return false;
  return ratio(na, nb) >= 0.86;
}

export function preferLine(current: string, incoming: string): string {
  const c = current.trim();
  const n = incoming.trim();
  if (!n) return c;
  if (!c) return n;
  if (!linesMatch(c, n)) return c;
  return n.length > c.length ? n : c;
}

export type StitchOutcome = {
  lines: string[];
  added: string[];
  upgraded: number;
  gap: boolean;
};

type Candidate = {
  len: number;
  i: number;
  j: number;
  reachesEnd: boolean;
};

function better(next: Candidate, best: Candidate | null): boolean {
  if (!best) return true;
  if (next.len !== best.len) return next.len > best.len;
  if (next.reachesEnd !== best.reachesEnd) return next.reachesEnd;
  return next.i > best.i;
}

export function stitchDocument(doc: string[], incomingRaw: string[]): StitchOutcome {
  const incoming = cleanLines(incomingRaw);
  if (incoming.length === 0) {
    return { lines: doc, added: [], upgraded: 0, gap: false };
  }
  if (doc.length === 0) {
    return { lines: incoming, added: [...incoming], upgraded: 0, gap: false };
  }

  const start = Math.max(0, doc.length - MATCH_WINDOW);
  const tail = doc.slice(start);
  let best: Candidate | null = null;

  for (let i = 0; i < tail.length; i++) {
    for (let j = 0; j < incoming.length; j++) {
      if (!linesMatch(tail[i], incoming[j])) continue;
      let len = 1;
      while (
        i + len < tail.length &&
        j + len < incoming.length &&
        linesMatch(tail[i + len], incoming[j + len])
      ) {
        len++;
      }
      const candidate = {
        len,
        i,
        j,
        reachesEnd: i + len === tail.length,
      };
      if (better(candidate, best)) best = candidate;
    }
  }

  const anchorLong = !!best && best.len === 1 && normLine(incoming[best.j]).length >= 18;
  const confident = !!best && (best.len >= 2 || anchorLong);

  if (!best || !confident) {
    let hits = 0;
    for (const line of incoming) {
      if (tail.some((existing) => linesMatch(existing, line))) hits++;
    }
    if (hits / incoming.length >= 0.65) {
      return { lines: doc, added: [], upgraded: 0, gap: false };
    }
    if (incoming.length === 1 && normLine(incoming[0]).length < 12) {
      return { lines: doc, added: [], upgraded: 0, gap: false };
    }
    return {
      lines: [...doc, GAP_LINE, ...incoming],
      added: [...incoming],
      upgraded: 0,
      gap: true,
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

  const added: string[] = [];
  const overlapEnd = start + best.i + best.len;
  const after = next.slice(overlapEnd);

  if (after.length === 0) {
    for (let j = best.j + best.len; j < incoming.length; j++) {
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
  }

  if (best.j > 0 && start + best.i === 0) {
    const prefix: string[] = [];
    for (let j = 0; j < best.j; j++) {
      const line = incoming[j];
      if (!next.slice(0, best.j + 4).some((existing) => linesMatch(existing, line))) {
        prefix.push(line);
      }
    }
    if (prefix.length) {
      next.unshift(...prefix);
      added.unshift(...prefix);
    }
  }

  return { lines: next, added, upgraded, gap: false };
}

export function manuscript(lines: string[]): string {
  const paras: string[] = [];
  let buf = "";
  const flush = () => {
    const trimmed = buf.trim();
    if (trimmed) paras.push(trimmed);
    buf = "";
  };
  for (const line of lines) {
    if (line.includes("Seam lost the overlap here")) {
      flush();
      paras.push(
        "> Seam lost the overlap here. A fast flick may have skipped a screen.",
      );
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

export function countWords(text: string): number {
  const bare = text.replace(/^>.*$/gm, " ");
  const matches = bare.match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu);
  return matches?.length ?? 0;
}

export function suggestTitle(text: string): string {
  const line = text
    .split("\n")
    .map((item) => item.replace(/^>\s*/, "").trim())
    .find((item) => item.length > 0 && !item.startsWith("Seam lost the overlap"));
  if (!line) return "Untitled capture";
  const words = line.split(/\s+/).slice(0, 8);
  const title = words.join(" ");
  return line.split(/\s+/).length > 8 ? `${title}…` : title;
}
