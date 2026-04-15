import { NextResponse } from 'next/server';

import { formatAIContextPrefix, type AIContextPayload, type AIRequestEnvelope, type AIWeatherCondition } from '../../../src/service/AI_Service';

type AIChatRequest = AIRequestEnvelope & {
  question?: string;
  api_key?: string;
  context?: AIContextPayload;
};

const isWeatherCondition = (value: unknown): value is AIWeatherCondition => {
  return value === 'clear' || value === 'rainy' || value === 'typhoon';
};

const normalizeContext = (context: unknown): AIContextPayload | null => {
  if (!context || typeof context !== 'object') return null;

  const candidate = context as Partial<AIContextPayload>;
  const activeTrafficSegments = Number(candidate.activeTrafficSegments);
  const reportedIncidents = Number(candidate.reportedIncidents);
  const proneAreas = Number(candidate.proneAreas);
  const avgResponseTime = Number(candidate.avgResponseTime);

  if (
    !Number.isFinite(activeTrafficSegments) ||
    !Number.isFinite(reportedIncidents) ||
    !Number.isFinite(proneAreas) ||
    !Number.isFinite(avgResponseTime) ||
    !isWeatherCondition(candidate.weatherCondition)
  ) {
    return null;
  }

  return {
    activeTrafficSegments: Math.max(0, Math.round(activeTrafficSegments)),
    reportedIncidents: Math.max(0, Math.round(reportedIncidents)),
    proneAreas: Math.max(0, Math.round(proneAreas)),
    weatherCondition: candidate.weatherCondition,
    avgResponseTime: Math.max(0, Number(avgResponseTime.toFixed(1))),
  };
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AIChatRequest;
    const question = (body?.question || '').trim();
    const context = normalizeContext(body?.context);

    if (!question) {
      return NextResponse.json({ error: 'Missing question' }, { status: 400 });
    }

    const enhancedQuestion = context
      ? `${formatAIContextPrefix(context)} | ${question}`
      : question;

    const apiUrl =
      process.env.AI_MICROSERVICE_URL ||
      process.env.NEXT_PUBLIC_AI_MICROSERVICE_URL ||
      'https://innovatechservicesph.com/management/microservices.php?service=ai-chat';

    const apiKey =
      body?.api_key ||
      process.env.AI_MICROSERVICE_API_KEY ||
      process.env.NEXT_PUBLIC_AI_MICROSERVICE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI API key missing. Set AI_MICROSERVICE_API_KEY or NEXT_PUBLIC_AI_MICROSERVICE_API_KEY.' },
        { status: 500 }
      );
    }

    const upstream = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        question: enhancedQuestion,
      }),
      cache: 'no-store',
    });

    const rawText = await upstream.text();
    let parsed: unknown = null;

    try {
      parsed = rawText ? JSON.parse(rawText) : null;
    } catch {
      parsed = null;
    }

    if (!upstream.ok) {
      return NextResponse.json(
        {
          error: 'AI upstream request failed',
          status: upstream.status,
          statusText: upstream.statusText,
          details: parsed || rawText || null,
        },
        { status: upstream.status }
      );
    }

    return NextResponse.json(
      parsed || {
        answer: typeof rawText === 'string' ? rawText : 'No response body from AI service.',
        credits_used: 0,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return NextResponse.json({ error: 'AI proxy failure', details: message }, { status: 500 });
  }
}
