import { type CreateMessage } from "ai";
import OpenAI from "openai";
import { StreamingTextResponse } from "ai";

// Initialize OpenAI client with OpenRouter configuration
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": process.env.SITE_URL,
    "X-Title": process.env.SITE_NAME,
  }
});

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = 50; // Maximum requests per window
const requestTimestamps: number[] = [];

// Rate limiting function
function isRateLimited(): boolean {
  const now = Date.now();
  // Remove timestamps outside the current window
  while (
    requestTimestamps.length > 0 &&
    requestTimestamps[0] < now - RATE_LIMIT_WINDOW
  ) {
    requestTimestamps.shift();
  }
  // Check if we're over the limit
  if (requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  // Add current timestamp
  requestTimestamps.push(now);
  return false;
}

// Exponential backoff retry
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        // If it's a rate limit error and we haven't exhausted retries
        if (error.status === 429 && i < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, i); // Exponential backoff
          console.log(`Rate limited. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      throw error; // Re-throw if it's not a rate limit error or we're out of retries
    }
  }
  throw new Error('Max retries exceeded');
}

export async function POST(req: Request) {
  try {
    // Check rate limiting
    if (isRateLimited()) {
      return new Response(
        JSON.stringify({
          error: "Too many requests. Please try again later."
        }),
        { status: 429 }
      );
    }

    const { messages }: { messages: CreateMessage[] } = await req.json();

    // Validate input
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Invalid request: messages array is required"
        }),
        { status: 400 }
      );
    }

    // Make API call with retry logic
    const response = await withRetry(async () => {
      return await openai.chat.completions.create({
        model: "deepseek/deepseek-r1:free",
        messages: messages.map(m => ({
          role: m.role === 'user' ? 'user' : 
                m.role === 'assistant' ? 'assistant' : 
                m.role === 'system' ? 'system' : 'user',
          content: m.content
        })),
        stream: true,
        temperature: 0.7,
        max_tokens: 1000,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });
    });

    // Convert the response into a ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(new TextEncoder().encode(content));
            }
          }
          controller.close();
        } catch (error) {
          console.error("Stream error:", error);
          controller.error(error);
        }
      }
    });

    // Return the streaming response
    return new StreamingTextResponse(stream);
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
          suggestion: "Please try again in a few moments"
        }),
        { 
          status: status || 500,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '5'
          }
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "An error occurred while processing your request",
        suggestion: "Please try again later"
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '5'
        }
      }
    );
  }
}

