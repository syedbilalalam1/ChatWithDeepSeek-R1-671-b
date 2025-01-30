import { type CreateMessage } from "ai";
import OpenAI from "openai";
import { StreamingTextResponse } from "ai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL,
    "X-Title": process.env.SITE_NAME,
  }
});

export async function POST(req: Request) {
  const { messages }: { messages: CreateMessage[] } = await req.json();

  try {
    const response = await openai.chat.completions.create({
      model: "deepseek/deepseek-r1:free",
      messages: messages.map(m => {
        const role = m.role === 'user' ? 'user' : 
                    m.role === 'assistant' ? 'assistant' : 
                    m.role === 'system' ? 'system' : 'user'
        return {
          role,
          content: m.content
        }
      }),
      stream: true,
      temperature: 0.7,
      max_tokens: 1000
    });

    // Convert the response into a ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content
          if (content) {
            controller.enqueue(new TextEncoder().encode(content))
          }
        }
        controller.close()
      }
    })

    // Return a StreamingTextResponse, which can be consumed by the client
    return new StreamingTextResponse(stream)
  } catch (error) {
    console.error("Error:", error);
    if (error instanceof OpenAI.APIError) {
      const { name, status, headers, message } = error;
      return new Response(
        JSON.stringify({
          name,
          status,
          headers,
          message,
        }),
        { status: status || 500 }
      );
    } else {
      return new Response(
        JSON.stringify({
          error: "An error occurred while processing your request"
        }),
        { status: 500 }
      );
    }
  }
}

