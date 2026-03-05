import { NextRequest } from "next/server";
import type { AIModel } from "@/types";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are an expert LaTeX assistant integrated into a LaTeX editor (similar to Cursor for code).

Your role:
- Help users write, fix, and improve LaTeX documents
- Explain LaTeX errors from compile logs
- Suggest LaTeX commands, packages, and best practices
- Generate LaTeX code snippets when asked
- Help structure documents (articles, reports, theses, presentations)

When providing LaTeX code:
- Always wrap code blocks in \`\`\`latex ... \`\`\`
- Provide complete, working snippets
- Explain what each part does when helpful

When explaining errors:
- Point to the specific cause
- Provide the corrected code
- Suggest how to avoid the issue in the future

Be concise, technical, and accurate.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, context, model, apiKey } = body as {
      messages: Array<{ role: string; content: string }>;
      context: string;
      model: AIModel;
      apiKey: string;
    };

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const userMessages = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Inject context into last user message if provided
    const messagesWithContext =
      context && userMessages.length > 0
        ? userMessages.map((m, i) =>
            i === userMessages.length - 1 && m.role === "user"
              ? {
                  ...m,
                  content: `${m.content}\n\n<current_file>\n${context}\n</current_file>`,
                }
              : m
          )
        : userMessages;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (model === "claude") {
            await streamAnthropic(
              controller,
              encoder,
              messagesWithContext,
              apiKey
            );
          } else {
            await streamOpenAI(
              controller,
              encoder,
              messagesWithContext,
              apiKey
            );
          }
          controller.close();
        } catch (err: unknown) {
          const error = err as Error;
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: error.message })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function streamAnthropic(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  apiKey: string
) {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey });

  const stream = await client.messages.stream({
    model: "claude-opus-4-5",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages,
  });

  for await (const chunk of stream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`
        )
      );
    }
  }
}

async function streamOpenAI(
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  apiKey: string
) {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey });

  const stream = await client.chat.completions.create({
    model: "gpt-4o",
    stream: true,
    messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? "";
    if (text) {
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
      );
    }
  }
}
