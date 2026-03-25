export interface Document {
  id: string;
  title: string;
  content: string;
  file_type: string;
  created_at: string;
}

export interface Chunk {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  embedding: number[];
  metadata: Record<string, unknown>;
}

export interface SearchResult {
  id: string;
  document_id: string;
  content: string;
  similarity: number;
  document_title?: string;
}

export interface GraphNode {
  id: string;
  label: string;
  type: "document" | "chunk";
  document_id?: string;
  group: number;
  size: number;
}

export interface GraphLink {
  source: string;
  target: string;
  similarity: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface UploadProgress {
  stage: "parsing" | "chunking" | "embedding" | "storing" | "complete" | "error";
  progress: number;
  message: string;
}
