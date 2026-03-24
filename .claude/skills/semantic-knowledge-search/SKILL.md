---
name: semantic-knowledge-search
description: "Build a semantic knowledge search engine where users upload documents and search by meaning (not keywords), with an interactive knowledge graph visualization. Use this skill whenever the user wants to work on the knowledge search project, mentions RAG, vector search, embeddings, pgvector, knowledge graph, semantic search, document Q&A, or wants to build/extend/debug any part of this application. Also trigger when the user mentions Transformers.js, Supabase vectors, D3 force layout, or document similarity in the context of this project."
---

# Semantic Knowledge Search Engine

## What You're Building

A Next.js application where users upload documents (PDFs, notes, articles, markdown), and the system creates semantic embeddings. Users search by meaning — "how does photosynthesis work" finds content about chloroplasts and light reactions even if those exact words weren't used. Results display as an interactive knowledge graph showing connections between documents and ideas.

## Architecture Overview

```
app/
├── layout.tsx
├── page.tsx                      # Upload + search landing
├── api/
│   ├── upload/route.ts           # Document processing pipeline
│   ├── search/route.ts           # Semantic search endpoint
│   ├── chat/route.ts             # Chat with your knowledge base
│   └── graph/route.ts            # Knowledge graph data
├── components/
│   ├── document-upload.tsx        # Drag-and-drop with progress
│   ├── search-bar.tsx            # Semantic search input
│   ├── search-results.tsx        # Results with relevance scores
│   ├── knowledge-graph.tsx       # D3.js force-directed graph
│   ├── document-viewer.tsx       # Read with highlighted passages
│   ├── chat-sidebar.tsx          # Ask questions about docs
│   └── annotation-panel.tsx      # Highlight and note passages
├── lib/
│   ├── embeddings.ts             # Embedding generation (Transformers.js or API)
│   ├── supabase.ts               # Supabase client + pgvector queries
│   ├── chunking.ts               # Document splitting strategies
│   ├── graph-builder.ts          # Build graph from embeddings
│   └── pdf-parser.ts             # Extract text from uploads
└── types/
    └── index.ts
```

## Tech Stack & Setup

```bash
npx create-next-app@latest knowledge-search --typescript --tailwind --eslint --app
cd knowledge-search

# Core
npm install ai @ai-sdk/google zod
npm install @supabase/supabase-js @supabase/ssr

# Embeddings (pick one approach)
npm install @xenova/transformers           # Browser-side embeddings (privacy-first)
# OR use Google Gemini embedding API       # Server-side, faster

# Document processing
npm install pdf-parse mammoth              # PDF and DOCX parsing
npm install langchain @langchain/textsplitters  # Smart text chunking

# Visualization
npm install d3 @types/d3                   # Knowledge graph

# UI
npm install framer-motion lucide-react
npx shadcn@latest init
npx shadcn@latest add button card input dialog tabs badge command
```

### Environment Variables

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
```

### Supabase Setup

Run this SQL in Supabase SQL Editor to enable vector search:

```sql
-- Enable pgvector extension
create extension if not exists vector;

-- Documents table
create table documents (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  file_type text,
  created_at timestamptz default now()
);

-- Chunks with embeddings
create table chunks (
  id uuid default gen_random_uuid() primary key,
  document_id uuid references documents(id) on delete cascade,
  content text not null,
  chunk_index int not null,
  embedding vector(768),  -- Matches Gemini embedding dimension
  metadata jsonb default '{}'
);

-- Similarity search function
create or replace function match_chunks(
  query_embedding vector(768),
  match_threshold float default 0.7,
  match_count int default 10
) returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float
) language sql stable as $$
  select
    chunks.id,
    chunks.document_id,
    chunks.content,
    1 - (chunks.embedding <=> query_embedding) as similarity
  from chunks
  where 1 - (chunks.embedding <=> query_embedding) > match_threshold
  order by chunks.embedding <=> query_embedding
  limit match_count;
$$;

-- Index for fast similarity search
create index on chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);
```

## Core Implementation Strategy

### 1. Document Processing Pipeline

When a user uploads a document, process it through: parse text → split into chunks → generate embeddings → store in Supabase.

```typescript
// lib/chunking.ts
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

export async function chunkDocument(text: string) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 500,        // ~500 chars per chunk
    chunkOverlap: 50,      // Overlap for context continuity
    separators: ["\n\n", "\n", ". ", " "],
  });
  return splitter.createDocuments([text]);
}
```

### 2. Embedding Generation

**Option A — Browser-side with Transformers.js (privacy-first):**
```typescript
import { pipeline } from "@xenova/transformers";
const extractor = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
const output = await extractor(text, { pooling: "mean", normalize: true });
```

**Option B — Server-side with Gemini Embedding API (faster, higher quality):**
```typescript
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent?key=${API_KEY}`,
  { method: "POST", body: JSON.stringify({ content: { parts: [{ text }] } }) }
);
```

### 3. Semantic Search

Convert the user's query to an embedding, then find the nearest chunks in the vector database using cosine similarity.

### 4. Knowledge Graph with D3.js

Build a force-directed graph where nodes are documents/chunks and edges represent semantic similarity above a threshold.

```typescript
// components/knowledge-graph.tsx
"use client";
import * as d3 from "d3";
import { useEffect, useRef } from "react";

export function KnowledgeGraph({ nodes, links }) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));
    // ... render with zoom, drag, click-to-expand
  }, [nodes, links]);

  return <svg ref={svgRef} className="w-full h-[600px]" />;
}
```

### 5. Chat with Your Knowledge Base (RAG)

Use Vercel AI SDK's `streamText()` with retrieved context injected into the system prompt.

```typescript
// app/api/chat/route.ts
import { streamText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(req) {
  const { messages } = await req.json();
  const lastMessage = messages[messages.length - 1].content;

  // 1. Embed the question
  const queryEmbedding = await generateEmbedding(lastMessage);

  // 2. Find relevant chunks
  const { data: chunks } = await supabase.rpc("match_chunks", {
    query_embedding: queryEmbedding,
    match_count: 5,
  });

  // 3. Stream answer with context
  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: `Answer based on these sources:\n${chunks.map(c => c.content).join("\n---\n")}`,
    messages,
  });
  return result.toDataStreamResponse();
}
```

## Implementation Phases

### Phase 1: Core RAG Pipeline (Week 1)
- Document upload (PDF, DOCX, TXT, MD)
- Text extraction and chunking
- Embedding generation and storage in Supabase pgvector
- Basic semantic search with relevance scores
- Search results display with highlighted matching passages

### Phase 2: Knowledge Graph (Week 2)
- Build graph data from document embeddings
- D3.js force-directed graph visualization
- Click node to preview document content
- Zoom, pan, and drag interactions
- Color-code by document or topic cluster

### Phase 3: Chat & Polish (Week 3)
- RAG chat interface (ask questions about your docs)
- Citation links back to source passages
- Document annotations and highlights
- Responsive design and dark mode
- Performance optimization (lazy loading, virtualization)

## Free Resources

| Resource | Purpose | Free Tier |
|----------|---------|-----------|
| Google Gemini API | LLM + Embeddings | ~1M tokens/day |
| Supabase | Postgres + pgvector | 500MB DB, 1GB storage |
| Transformers.js | Browser embeddings | Open source, free |
| D3.js | Graph visualization | Open source |
| Vercel | Hosting | 100GB bandwidth |

## Resume Talking Points

- **RAG architecture**: The #1 most in-demand AI pattern. Explain embeddings → vector search → context injection → generation.
- **pgvector + cosine similarity**: Real vector database experience, not just calling an API.
- **Browser-native ML**: Running Transformers.js client-side for privacy shows you can reduce server costs to zero.
- **D3.js force layout**: Advanced data visualization beyond standard charts.
- **Chunking strategies**: Explain why chunk size, overlap, and separators matter for retrieval quality.
