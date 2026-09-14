import { NextRequest, NextResponse } from "next/server";
import { discoverAvailableModels } from "@/lib/ai-models";

/**
 * Model discovery proxy — fetches available models from an OpenAI-compatible endpoint.
 * POST /api/ai/models { endpointUrl, apiKey }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      endpointUrl?: string;
      apiKey?: string;
    };

    if (!body.endpointUrl || !body.apiKey) {
      return NextResponse.json(
        { error: "endpointUrl and apiKey are required" },
        { status: 400 }
      );
    }

    const models = await discoverAvailableModels({
      endpointUrl: body.endpointUrl,
      apiKey: body.apiKey,
    });

    return NextResponse.json({ models });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
