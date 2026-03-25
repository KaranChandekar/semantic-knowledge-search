# Knowledge Search — Semantic Document Search Engine

A full-stack Next.js 15 application that lets users upload documents (PDF, DOCX, TXT, MD) and search them **by meaning, not keywords**. The system creates vector embeddings for every document chunk and uses cosine similarity to find semantically relevant results — even when the exact words don't match. An interactive D3.js knowledge graph visualizes connections between documents, and a RAG-powered chat lets users ask natural language questions about their uploads.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-pgvector-green?logo=supabase)
![Gemini](https://img.shields.io/badge/Google-Gemini-orange?logo=google)

---

## How It Works — End-to-End Flow

### 1. Document Upload Pipeline

```
User drops file → Extract text → Split into chunks → Generate embeddings → Store in Supabase
```

When a user uploads a document through the drag-and-drop interface:

1. **File parsing** (`lib/pdf-parser.ts`): The file is sent to `POST /api/upload`. Based on file type, text is extracted using:
   - **PDF** → `pdf-parse` library parses the binary and extracts raw text
   - **DOCX** → `mammoth` converts Word documents to plain text
   - **TXT / MD** → Read directly as UTF-8 string

2. **Document storage**: The full document (title, content, file type) is inserted into the `documents` table in Supabase.

3. **Chunking** (`lib/chunking.ts`): The extracted text is split into ~500-character chunks with 50-character overlap using LangChain's `RecursiveCharacterTextSplitter`. It splits on paragraph breaks first, then sentences, then words — preserving semantic boundaries. The overlap ensures context isn't lost between chunks.

4. **Embedding generation** (`lib/embeddings.ts`): Each chunk is sent to Google's `text-embedding-004` model, which returns a 768-dimensional vector representing the chunk's meaning. Chunks are processed in batches of 5 to respect rate limits.

5. **Vector storage**: Each chunk is stored in the `chunks` table alongside its embedding vector. Supabase's `pgvector` extension enables efficient similarity search via an IVFFlat index.

### 2. Semantic Search

```
User types query → Embed query → Cosine similarity search → Ranked results with scores
```

When a user searches:

1. **Query embedding**: The search query is converted to a 768-dimensional vector using the same Gemini embedding model (`POST /api/search`).

2. **Vector similarity search**: The query embedding is compared against all stored chunk embeddings using the `match_chunks` PostgreSQL function. It computes cosine similarity (`1 - cosine_distance`) and returns chunks above a configurable threshold (default: 0.7).

3. **Result enrichment**: Each matching chunk is joined with its parent document title to provide context.

4. **Display**: Results are rendered as cards sorted by relevance, each showing the document title, matching passage, and a percentage relevance score. Scores above 90% get a green badge, 80%+ get a primary badge, and others get an outline badge.

### 3. Knowledge Graph Visualization

```
Fetch all documents + chunks → Compute cross-document similarity → Render force-directed graph
```

The knowledge graph (`GET /api/graph`) reveals hidden connections:

1. **Data collection**: All documents and their chunks (with embeddings) are fetched from Supabase.

2. **Graph construction** (`lib/graph-builder.ts`):
   - **Document nodes** are created with sizes proportional to their chunk count
   - **Chunk nodes** are created as smaller satellite nodes
   - Each chunk is linked to its parent document (similarity = 1.0)
   - **Cross-document links**: Every chunk pair from *different* documents is compared via cosine similarity. Pairs exceeding the threshold (default: 0.75) get an edge, revealing which ideas appear across documents

3. **D3.js rendering** (`components/knowledge-graph.tsx`): A force-directed simulation positions nodes:
   - `forceLink` pulls connected nodes together (distance inversely proportional to similarity)
   - `forceManyBody` pushes all nodes apart to prevent overlap
   - `forceCenter` keeps the graph centered
   - `forceCollide` prevents node overlap based on radius
   - Nodes are color-coded per document, have glow effects, and support drag, zoom, and pan
   - Hovering a node shows its label and type in an overlay card

### 4. RAG Chat (Ask Your Documents)

```
User asks question → Embed question → Retrieve relevant chunks → Inject as context → Stream AI answer
```

The chat sidebar (`POST /api/chat`) implements Retrieval-Augmented Generation:

1. **Question embedding**: The user's message is embedded using the same Gemini model.

2. **Context retrieval**: The top 5 most similar chunks are retrieved via `match_chunks` (threshold: 0.6, lower than search to cast a wider net).

3. **Prompt construction**: Retrieved chunks are formatted with source numbers and relevance scores, then injected into the system prompt.

4. **Streaming response**: Google Gemini (`gemini-2.5-flash`) generates an answer using the Vercel AI SDK's `streamText()`. The AI is instructed to cite source numbers and be honest when context is insufficient.

5. **Real-time display**: The response streams token-by-token into the chat panel with typing indicators.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 15 (App Router) | Server/client rendering, API routes |
| Language | TypeScript (strict) | Type safety across the stack |
| Database | Supabase (PostgreSQL + pgvector) | Document storage + vector similarity search |
| Embeddings | Google Gemini `text-embedding-004` | 768-dim semantic vectors |
| LLM | Google Gemini `gemini-2.5-flash` | RAG chat responses |
| AI SDK | Vercel AI SDK + `@ai-sdk/google` | Streaming chat, model abstraction |
| Visualization | D3.js | Force-directed knowledge graph |
| Text Splitting | LangChain `RecursiveCharacterTextSplitter` | Smart document chunking |
| PDF Parsing | `pdf-parse` | Extract text from PDFs |
| DOCX Parsing | `mammoth` | Extract text from Word documents |
| UI | shadcn/ui + Tailwind CSS | Component library + styling |
| Animations | Framer Motion | Page transitions, micro-interactions |
| Icons | Lucide React | Consistent icon set |

---

## Project Structure

```
app/
├── layout.tsx                    # Root layout with Geist font
├── page.tsx                      # Main page — search, upload, graph tabs
├── globals.css                   # Tailwind theme with indigo color palette
└── api/
    ├── upload/route.ts           # POST — parse, chunk, embed, store documents
    ├── search/route.ts           # POST — semantic vector search
    ├── chat/route.ts             # POST — RAG chat with streaming
    └── graph/route.ts            # GET  — knowledge graph data

components/
├── document-upload.tsx           # Drag-and-drop upload with progress bar
├── search-bar.tsx                # Search input with gradient button
├── search-results.tsx            # Result cards with relevance badges
├── knowledge-graph.tsx           # D3.js force-directed graph
├── chat-sidebar.tsx              # Floating RAG chat panel
└── ui/                           # shadcn/ui components (button, card, input, etc.)

lib/
├── embeddings.ts                 # Gemini embedding API (single + batch)
├── chunking.ts                   # RecursiveCharacterTextSplitter wrapper
├── graph-builder.ts              # Cosine similarity + graph construction
├── pdf-parser.ts                 # PDF/DOCX/TXT/MD text extraction
└── supabase.ts                   # Client + service role Supabase clients

types/
└── index.ts                      # TypeScript interfaces for all data models
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Google AI Studio](https://aistudio.google.com/apikey) API key

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the project root:

```env
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
```

### 3. Set Up the Database

Run the SQL in `supabase-setup.sql` in your Supabase SQL Editor. This creates:

- `documents` table — stores uploaded file metadata and full text
- `chunks` table — stores text chunks with 768-dim vector embeddings
- `match_chunks()` function — performs cosine similarity search
- IVFFlat index — accelerates vector search queries

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start uploading documents and searching.

---

## Database Schema

```sql
documents
├── id          uuid (PK, auto-generated)
├── title       text
├── content     text (full extracted text)
├── file_type   text
└── created_at  timestamptz

chunks
├── id           uuid (PK, auto-generated)
├── document_id  uuid (FK → documents.id, cascade delete)
├── content      text (chunk text)
├── chunk_index  int
├── embedding    vector(768)
└── metadata     jsonb
```

The `match_chunks()` function accepts a query vector and returns matching chunks ranked by cosine similarity above a configurable threshold.

---

## Key Design Decisions

- **Chunk size of 500 chars with 50 overlap**: Balances granularity (specific enough to be relevant) with context (enough surrounding text to be meaningful). The overlap prevents important sentences from being split across chunks.

- **Cosine similarity over Euclidean distance**: Cosine measures directional similarity between vectors regardless of magnitude, which is more meaningful for text embeddings where the "angle" between concepts matters more than absolute distance.

- **Server-side embeddings via Gemini**: While the project includes `@xenova/transformers` as a dependency for potential browser-side embedding (privacy-first option), the default path uses Gemini's `text-embedding-004` for higher quality 768-dimensional vectors.

- **Separate similarity thresholds**: Search uses 0.7 (precision-focused) while chat uses 0.6 (recall-focused) — search should show only highly relevant results, while chat benefits from broader context.

- **IVFFlat index**: Approximate nearest neighbor search that's fast enough for interactive use. With 100 lists, it partitions the vector space into clusters and only searches relevant ones.
