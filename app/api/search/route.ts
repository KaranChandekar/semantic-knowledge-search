import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/embeddings";
import { getServiceClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { query, threshold = 0.7, limit = 10 } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "Query string is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();

    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);

    // Search for similar chunks using pgvector
    const { data: results, error } = await supabase.rpc("match_chunks", {
      query_embedding: JSON.stringify(queryEmbedding),
      match_threshold: threshold,
      match_count: limit,
    });

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }

    // Fetch document titles for each result
    const documentIds = [...new Set(results.map((r: { document_id: string }) => r.document_id))];
    const { data: documents } = await supabase
      .from("documents")
      .select("id, title")
      .in("id", documentIds);

    const titleMap = new Map(
      documents?.map((d: { id: string; title: string }) => [d.id, d.title]) ?? []
    );

    const enrichedResults = results.map((r: { id: string; document_id: string; content: string; similarity: number }) => ({
      ...r,
      document_title: titleMap.get(r.document_id) ?? "Unknown",
    }));

    return NextResponse.json({ results: enrichedResults });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}
