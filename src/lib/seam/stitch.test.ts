import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cleanLines,
  countWords,
  manuscript,
  stitchDocument,
  suggestTitle,
} from "./stitch.ts";

describe("stitchDocument", () => {
  it("starts a document from the first frame", () => {
    const result = stitchDocument([], ["Alpha one", "Beta two"]);
    assert.deepEqual(result.lines, ["Alpha one", "Beta two"]);
    assert.equal(result.gap, false);
  });

  it("appends only the new tail when the screen scrolls down", () => {
    const doc = ["Alpha one", "Beta two", "Gamma three", "Delta four"];
    const result = stitchDocument(doc, [
      "Gamma three",
      "Delta four",
      "Epsilon five",
      "Zeta six",
    ]);
    assert.deepEqual(result.lines, [...doc, "Epsilon five", "Zeta six"]);
    assert.deepEqual(result.added, ["Epsilon five", "Zeta six"]);
    assert.equal(result.gap, false);
  });

  it("does not duplicate a frame it already has", () => {
    const doc = ["Alpha one", "Beta two", "Gamma three"];
    const result = stitchDocument(doc, [...doc]);
    assert.deepEqual(result.lines, doc);
    assert.deepEqual(result.added, []);
  });

  it("ignores a frame that is already inside the captured text", () => {
    const doc = ["A", "Beta line two here", "Gamma line three here", "D", "E"];
    const result = stitchDocument(doc, [
      "Beta line two here",
      "Gamma line three here",
    ]);
    assert.deepEqual(result.lines, doc);
    assert.deepEqual(result.added, []);
  });

  it("upgrades a truncated line instead of adding a second copy", () => {
    const doc = ["Opening stable line", "The harbor lights were"];
    const result = stitchDocument(doc, [
      "Opening stable line",
      "The harbor lights were still on",
    ]);
    assert.equal(result.lines[1], "The harbor lights were still on");
    assert.deepEqual(result.added, []);
    assert.equal(result.upgraded, 1);
  });

  it("prepends unseen lines when the scroll moves back past the start", () => {
    const doc = ["Gamma three stays", "Delta four stays"];
    const result = stitchDocument(doc, [
      "Alpha one new",
      "Beta two new",
      "Gamma three stays",
      "Delta four stays",
    ]);
    assert.deepEqual(result.lines, [
      "Alpha one new",
      "Beta two new",
      "Gamma three stays",
      "Delta four stays",
    ]);
  });

  it("marks a gap when a flick skips every shared line", () => {
    const result = stitchDocument(
      ["Alpha one is a full line", "Beta two is a full line"],
      ["Much later line with no overlap", "Another later line after the skip"],
    );
    assert.equal(result.gap, true);
    assert.ok(result.lines.some((line) => line.includes("lost the overlap")));
    assert.ok(result.lines.at(-1)?.includes("Another later"));
  });

  it("treats a one-character OCR slip as the same line", () => {
    const doc = ["The quick brown fox jumps over the dog"];
    const result = stitchDocument(doc, ["The quick brown fox jumps over the d0g"]);
    assert.equal(result.lines.length, 1);
    assert.deepEqual(result.added, []);
  });
});

describe("manuscript", () => {
  it("joins wrapped body lines and keeps short labels apart", () => {
    const text = manuscript([
      "Settings",
      "The harbor lights were still on when the last",
      "boat cleared the bar and the market closed.",
    ]);
    assert.match(text, /^Settings\n\nThe harbor lights were still on when the last boat/);
  });

  it("joins a hyphenated word", () => {
    assert.deepEqual(cleanLines(["inter-", "national trade"]), ["international trade"]);
  });

  it("titles and counts from the manuscript", () => {
    const text = "Field notes from the night market and the ferry";
    assert.equal(suggestTitle(text).startsWith("Field notes"), true);
    assert.equal(countWords("one two three"), 3);
  });
});
