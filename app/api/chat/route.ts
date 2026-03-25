import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { generateEmbedding } from "@/lib/embeddings";
import { getServiceClient } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1].content;

    const supabase = getServiceClient();

    // 1. Embed the question
    const queryEmbedding = await generateEmbedding(lastMessage);

    // 2. Find relevant chunks
    const { data: chunks } = await supabase.rpc("match_chunks", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: 0.6,
      match_count: 5,
    });

    const context = chunks?.length
      ? chunks
          .map(
            (c: { content: string; similarity: number }, i: number) =>
              `[Source ${i + 1} (${(c.similarity * 100).toFixed(0)}% relevant)]:\n${c.content}`
          )
          .join("\n\n---\n\n")
      : "No relevant documents found. Answer based on general knowledge and let the user know.";

    // 3. Stream answer with context
    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: `You are a helpful knowledge assistant. Answer questions based on the user's uploaded documents.

Use the following retrieved context to answer. Always cite which source number you're referencing.
If the context doesn't contain relevant information, say so honestly.

Context from user's documents:
${context}`,
      messages,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Chat failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
