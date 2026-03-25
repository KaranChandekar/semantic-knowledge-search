"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CloudUpload,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { UploadProgress } from "@/types";

interface DocumentUploadProps {
  onUploadComplete?: () => void;
}

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const handleUpload = useCallback(
    async (file: File) => {
      setProgress({
        stage: "parsing",
        progress: 10,
        message: "Parsing document...",
      });

      const formData = new FormData();
      formData.append("file", file);

      try {
        setProgress({
          stage: "embedding",
          progress: 50,
          message: "Generating embeddings...",
        });

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Upload failed");
        }

        const result = await response.json();
        setProgress({
          stage: "complete",
          progress: 100,
          message: result.message,
        });
        setUploadedFiles((prev) => [...prev, file.name]);
        onUploadComplete?.();

        setTimeout(() => setProgress(null), 3000);
      } catch (error) {
        setProgress({
          stage: "error",
          progress: 0,
          message: error instanceof Error ? error.message : "Upload failed",
        });
      }
    },
    [onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  return (
    <div className="space-y-4">
      <Card
        className={`relative border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-300 cursor-pointer rounded-2xl ${
          isDragging
            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10 scale-[1.01]"
            : "border-border/50 hover:border-primary/40 hover:bg-primary/[0.02] hover:shadow-md"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept=".pdf,.docx,.txt,.md"
          onChange={handleFileSelect}
          className="hidden"
        />

        <motion.div
          animate={{ scale: isDragging ? 1.05 : 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 p-5 shadow-inner">
            <CloudUpload
              className={`h-8 w-8 sm:h-10 sm:w-10 transition-colors ${
                isDragging ? "text-primary" : "text-primary/60"
              }`}
            />
          </div>
          <div>
            <p className="text-base sm:text-lg font-semibold text-foreground">
              Drop your documents here
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              PDF, DOCX, TXT, MD — up to 10MB
            </p>
            <p className="text-xs text-muted-foreground/60 mt-2">
              or click to browse files
            </p>
          </div>
        </motion.div>
      </Card>

      <AnimatePresence>
        {progress && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Card className="p-4 border-border/50">
              <div className="flex items-center gap-3">
                {progress.stage === "error" ? (
                  <div className="rounded-lg bg-destructive/10 p-2">
                    <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  </div>
                ) : progress.stage === "complete" ? (
                  <div className="rounded-lg bg-green-500/10 p-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  </div>
                ) : (
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {progress.message}
                  </p>
                  {progress.stage !== "error" &&
                    progress.stage !== "complete" && (
                      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress.progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            Uploaded documents
          </p>
          {uploadedFiles.map((name) => (
            <div
              key={name}
              className="flex items-center gap-2.5 text-sm p-2.5 rounded-lg bg-muted/50"
            >
              <div className="rounded-md bg-primary/10 p-1.5">
                <FileText className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="text-foreground font-medium truncate">
                {name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
