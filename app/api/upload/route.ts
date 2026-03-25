import { NextRequest, NextResponse } from "next/server";
import { extractText } from "@/lib/pdf-parser";
import { chunkDocument } from "@/lib/chunking";
import { generateEmbeddings } from "@/lib/embeddings";
import { getServiceClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const supabase = getServiceClient();

    // 1. Parse the document
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileType = file.type || file.name.split(".").pop() || "txt";
    const text = await extractText(buffer, fileType);

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Could not extract text from document" },
        { status: 400 }
      );
    }

    // 2. Store the document
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        title: file.name,
        content: text,
        file_type: fileType,
      })
      .select()
      .single();

    if (docError) {
      throw new Error(`Failed to store document: ${docError.message}`);
    }

    // 3. Chunk the text
    const chunks = await chunkDocument(text);

    // 4. Generate embeddings
    const embeddings = await generateEmbeddings(chunks);

    // 5. Store chunks with embeddings
    const chunkRecords = chunks.map((content, index) => ({
      document_id: doc.id,
      content,
      chunk_index: index,
      embedding: JSON.stringify(embeddings[index]),
      metadata: {},
    }));

    const { error: chunkError } = await supabase
      .from("chunks")
      .insert(chunkRecords);

    if (chunkError) {
      throw new Error(`Failed to store chunks: ${chunkError.message}`);
    }

    return NextResponse.json({
      id: doc.id,
      title: doc.title,
      chunks: chunks.length,
      message: `Successfully processed "${file.name}" into ${chunks.length} chunks`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 }
    );
  }
}
