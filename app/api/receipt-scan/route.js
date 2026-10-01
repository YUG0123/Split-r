import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });

// Free-tier Gemini occasionally returns 503 "high demand" errors that
// resolve themselves within seconds. Retry a couple of times with a
// short backoff before giving up, rather than failing the whole scan
// on a transient blip.
async function generateWithRetry(contentParts, maxRetries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await model.generateContent(contentParts);
    } catch (err) {
      lastError = err;
      if (err?.status !== 503 || attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
  throw lastError;
}

// Must match the ids in lib/expense-categories.js exactly, or the UI
// dropdown won't recognize the value coming back from Gemini.
const VALID_CATEGORIES = [
  "foodDrink", "coffee", "groceries", "shopping", "travel", "transportation",
  "housing", "entertainment", "tickets", "utilities", "water", "education",
  "health", "personal", "gifts", "technology", "bills", "baby", "music",
  "books", "other", "general",
];

export async function POST(req) {
  try {
    const { imageBase64, mimeType } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const prompt = `Extract the following from this receipt image and return
ONLY strict JSON — no markdown code fences, no commentary, no explanation:

{
  "description": string (merchant or store name, short),
  "amount": number (the final total, no currency symbol, no commas),
  "date": string (ISO 8601 date, e.g. "2026-03-15"),
  "category": one of exactly these values: ${VALID_CATEGORIES.join(", ")}
}

If a field can't be confidently read, use null for that field rather than guessing.`;

    const result = await generateWithRetry([
      {
        inlineData: {
          data: imageBase64,
          mimeType: mimeType || "image/jpeg",
        },
      },
      prompt,
    ]);

    const raw = result.response.text();
    const cleaned = raw.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Could not read that receipt clearly. Try a sharper photo." },
        { status: 422 },
      );
    }

    // Defensive: Gemini can still hallucinate a category outside the list
    // despite the prompt constraint — never let an invalid value reach
    // the UI, since the dropdown won't recognize it.
    if (!VALID_CATEGORIES.includes(parsed.category)) {
      parsed.category = "other";
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Receipt scan error:", err);
    return NextResponse.json(
      { error: "Receipt scanning failed. Please enter details manually." },
      { status: 500 },
    );
  }
}
