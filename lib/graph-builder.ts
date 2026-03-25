import type { GraphData, GraphNode, GraphLink } from "@/types";

interface DocumentWithChunks {
  id: string;
  title: string;
  chunks: {
    id: string;
    content: string;
    embedding: number[];
  }[];
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function buildGraphData(
  documents: DocumentWithChunks[],
  similarityThreshold = 0.75
): GraphData {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const colors = new Map<string, number>();
  let colorIndex = 0;

  // Create document nodes and chunk nodes
  for (const doc of documents) {
    if (!colors.has(doc.id)) {
      colors.set(doc.id, colorIndex++);
    }
    const group = colors.get(doc.id)!;

    nodes.push({
      id: doc.id,
      label: doc.title,
      type: "document",
      group,
      size: 20 + doc.chunks.length * 2,
    });

    for (const chunk of doc.chunks) {
      nodes.push({
        id: chunk.id,
        label: chunk.content.slice(0, 60) + "...",
        type: "chunk",
        document_id: doc.id,
        group,
        size: 8,
      });

      // Link chunk to its document
      links.push({
        source: doc.id,
        target: chunk.id,
        similarity: 1,
      });
    }
  }

  // Find cross-document similarities between chunks
  const allChunks = documents.flatMap((doc) =>
    doc.chunks.map((chunk) => ({ ...chunk, document_id: doc.id }))
  );

  for (let i = 0; i < allChunks.length; i++) {
    for (let j = i + 1; j < allChunks.length; j++) {
      // Skip chunks from the same document
      if (allChunks[i].document_id === allChunks[j].document_id) continue;

      const sim = cosineSimilarity(
        allChunks[i].embedding,
        allChunks[j].embedding
      );

      if (sim >= similarityThreshold) {
        links.push({
          source: allChunks[i].id,
          target: allChunks[j].id,
          similarity: sim,
        });
      }
    }
  }

  return { nodes, links };
}
