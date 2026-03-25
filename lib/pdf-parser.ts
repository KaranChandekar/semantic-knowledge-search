import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";

export async function extractText(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  switch (fileType) {
    case "application/pdf":
    case "pdf": {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      await parser.destroy();
      return result.text;
    }
    case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    case "docx": {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }
    case "text/plain":
    case "text/markdown":
    case "txt":
    case "md":
      return buffer.toString("utf-8");
    default:
      return buffer.toString("utf-8");
  }
}
