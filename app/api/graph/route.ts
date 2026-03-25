import { NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { buildGraphData } from "@/lib/graph-builder";

export async function GET() {
  try {
    const supabase = getServiceClient();

    // Fetch all documents
    const { data: documents, error: docError } = await supabase
      .from("documents")
      .select("id, title");

    if (docError) {
      throw new Error(`Failed to fetch documents: ${docError.message}`);
    }

    if (!documents?.length) {
      return NextResponse.json({ nodes: [], links: [] });
    }

    // Fetch all chunks with embeddings
    const { data: chunks, error: chunkError } = await supabase
      .from("chunks")
      .select("id, document_id, content, embedding");

    if (chunkError) {
      throw new Error(`Failed to fetch chunks: ${chunkError.message}`);
    }

    // Build graph data structure
    const documentsWithChunks = documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      chunks: (chunks ?? [])
        .filter((c) => c.document_id === doc.id)
        .map((c) => ({
          id: c.id,
          content: c.content,
          embedding: typeof c.embedding === "string"
            ? JSON.parse(c.embedding)
            : c.embedding,
        })),
    }));

    const graphData = buildGraphData(documentsWithChunks);

    return NextResponse.json(graphData);
  } catch (error) {
    console.error("Graph error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to build graph" },
      { status: 500 }
    );
  }
}
