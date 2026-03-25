const GEMINI_EMBEDDING_URL =
  "https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent";

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  }

  const response = await fetch(`${GEMINI_EMBEDDING_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: { parts: [{ text }] },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error: ${error}`);
  }

  const data = await response.json();
  return data.embedding.values;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  // Process in batches of 5 to avoid rate limits
  const batchSize = 5;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const embeddings = await Promise.all(
      batch.map((text) => generateEmbedding(text))
    );
    results.push(...embeddings);
  }

  return results;
}
