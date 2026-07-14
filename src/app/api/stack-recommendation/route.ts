import { NextResponse } from "next/server";
import {
  formatAnswersForPrompt,
  isHardStop,
  type Answers,
} from "@/content/stackFinder";
import { site } from "@/content/site";
import {
  buildStackPrompt,
  extractJsonObject,
  parseStackRecommendation,
} from "@/lib/stackFinder/prompt";
import type { StackRecommendationResponse } from "@/lib/stackFinder/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "z-ai/glm-5.2";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

const HARD_STOP_DISCLAIMER =
  "For research and educational purposes only. Not medical advice. Not for human consumption. Peptide Protocol materials are laboratory research reagents only.";

function isAnswers(value: unknown): value is Answers {
  if (!value || typeof value !== "object") return false;
  return Object.values(value as Record<string, unknown>).every(
    (v) =>
      typeof v === "string" ||
      (Array.isArray(v) && v.every((item) => typeof item === "string")),
  );
}

export async function POST(request: Request): Promise<NextResponse<StackRecommendationResponse>> {
  try {
    const body = (await request.json()) as { answers?: unknown };
    if (!isAnswers(body.answers)) {
      return NextResponse.json(
        { ok: false, error: "Invalid questionnaire answers." },
        { status: 400 },
      );
    }

    const answers = body.answers;

    if (!answers.ack || answers.ack !== "accept") {
      return NextResponse.json(
        { ok: false, error: "Research framing acknowledgment is required." },
        { status: 400 },
      );
    }

    if (isHardStop(answers)) {
      return NextResponse.json({
        ok: true,
        hardStop: true,
        title: "Educational recommendations paused",
        message:
          "Because pregnancy, trying to conceive, or breastfeeding was selected, this tool will not generate a peptide stack suggestion. That is a deliberate safety boundary for an educational research tool — not a clinical assessment. If you are seeking personal health guidance, speak with a qualified clinician.",
        disclaimer: HARD_STOP_DISCLAIMER,
      });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Stack recommendations are temporarily unavailable (missing server configuration).",
        },
        { status: 503 },
      );
    }

    const { system, user } = buildStackPrompt(answers);

    const upstream = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": site.url,
        "X-OpenRouter-Title": `${site.name} Stack Finder`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        max_tokens: 2500,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        provider: {
          order: ["novita"],
          allow_fallbacks: false,
          quantizations: ["fp8"],
        },
      }),
    });

    if (!upstream.ok) {
      const detail = await upstream.text().catch(() => "");
      console.error("OpenRouter error", upstream.status, detail);
      return NextResponse.json(
        {
          ok: false,
          error:
            "The recommendation service could not complete this request. Please try again in a moment.",
        },
        { status: 502 },
      );
    }

    const payload = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { ok: false, error: "Empty response from recommendation model." },
        { status: 502 },
      );
    }

    const recommendation = parseStackRecommendation(extractJsonObject(content));

    // Keep a server-side audit trail of answer keys only (not full PII dump beyond questionnaire).
    console.info("stack-recommendation generated", {
      answerKeys: Object.keys(answers),
      answerSummary: formatAnswersForPrompt(answers).slice(0, 500),
      peptideCount: recommendation.peptides.length,
    });

    return NextResponse.json({ ok: true, recommendation });
  } catch (error) {
    console.error("stack-recommendation failure", error);
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error generating recommendation.",
      },
      { status: 500 },
    );
  }
}
