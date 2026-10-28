export type PracticeBlock = {
  kind: "h" | "p";
  text: string;
};

export const PRACTICE_BLOCKS: PracticeBlock[] = [
  { kind: "h", text: "Field notes from a scrolling screen" },
  {
    kind: "p",
    text: "Start where the section already is. The first pass should take the words that are visible and then stop, instead of reading the same rectangle again.",
  },
  {
    kind: "p",
    text: "A ferry timetable is a good test. The eye lands on the next boat, the one after, and the note about the last crossing before dark. None of those lines should be copied twice.",
  },
  {
    kind: "p",
    text: "When the page moves, the top lines leave and new ones arrive at the bottom. A careful reader keeps the overlap, finds the last line it already trusts, and continues from there.",
  },
  {
    kind: "p",
    text: "Market boards work the same way. Prices are rewritten over old prices. You want the newest sentence, not a second copy of the sentence that was already in the notebook.",
  },
  {
    kind: "p",
    text: "If the scroll pauses, that pause is the moment to read. Motion blurs letters. A still section is sharp, and a sharp section can be finished in a couple of seconds.",
  },
  {
    kind: "p",
    text: "Bus windows repeat the same route number. Repetition is not new text. The stitcher has to tell a repeated sign from a line it has never stored.",
  },
  {
    kind: "p",
    text: "Scroll back toward the beginning and the opening can still be missing. If those earlier lines were never captured, they belong at the top, not pasted on the end.",
  },
  {
    kind: "p",
    text: "A heading is short. A wrapped sentence is long. Keep the heading on its own line, and join the wrapped sentence so the saved note reads like a page instead of a stack of cuts.",
  },
  {
    kind: "p",
    text: "Someone flicks too fast and a whole screen never settles. Say so in the note. A marked gap is more honest than a paragraph invented to hide the skip.",
  },
  {
    kind: "p",
    text: "The harbor lights were still on when the last boat cleared the bar. That sentence is a landmark. If a later pass only sees the end of it, replace the short version with the full one.",
  },
  {
    kind: "p",
    text: "Phone screens and desktop windows share one rule here: only the rectangle you chose is in play. Chrome around it, and the tool's own buttons, should stay outside the frame.",
  },
  {
    kind: "p",
    text: "Stop the session and the manuscript is the file. Markdown stays in the library on this device. A text download is the same words without the title block.",
  },
  {
    kind: "p",
    text: "Read this closing once. If the scroller is still moving, wait until the last paragraph is fully in view, then catch it and go quiet. That quiet is the reader being done.",
  },
  {
    kind: "p",
    text: "Nothing below this line is part of the sample. If it shows up in the note, the section was taller than the page, and the extra words came from outside the field guide.",
  },
];
