/*
  REAL testimonials only.

  This is a trust / Integrity dissertation artefact, so every entry here must be
  a genuine quote, used with the author's permission. Never invent or pad this
  list — the Testimonials section renders nothing at all when the array is empty,
  so it is always safe to ship with fewer (or zero) real quotes.

  Shape of each entry:
  {
    quote:   "The buyer's words, verbatim.",          // required
    author:  "First name, or full name with permission", // required
    context: "What they bought / who they are",        // optional — e.g. "Commissioned an oil portrait"
    location:"City or country",                        // optional — e.g. "Rotterdam"
    source:  "Where it came from",                     // optional — e.g. "via Instagram", "Etsy review"
  }
*/
export const TESTIMONIALS = [
  {
    quote:
      "I have commissioned an oil painting of my dog that has recently passed away. Anne kept me in the loop with constant updates and the result was simply amazing. I can't wait to frame and hang the painting in the living room.",
    author: "Helena L.",
    context: "Commissioned an oil painting",
    location: "England",
    source: "via Instagram",
  },
  {
    quote:
      "Anne knows how much I love my cats, and one day she surprised me with some really funny stickers of them.",
    author: "Karina S.",
    context: "Sticker commission, a gift",
    source: "in person",
  },
  {
    quote:
      "A close friend surprised me on my birthday with a digital painting of my cat. Apparently she commissioned it from Anne. It brought tears to my eyes and I have it as my screensaver ever since. Thank you!",
    author: "Alexandra B.",
    context: "Digital painting commission, a birthday gift",
    source: "in person",
  },
];
