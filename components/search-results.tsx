"use client";

import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SearchResult } from "@/types";

interface SearchResultsProps {
  results: SearchResult[];
  isSearching: boolean;
}

function relevanceColor(similarity: number) {
  if (similarity > 0.9) return "bg-green-500/10 text-green-700 border-green-200";
  if (similarity > 0.8) return "bg-primary/10 text-primary border-primary/20";
  return "bg-muted text-muted-foreground border-border";
}

export function SearchResults({ results, isSearching }: SearchResultsProps) {
  if (isSearching) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card
            key={i}
            className="p-4 sm:p-5 animate-pulse border-border/50"
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded-md w-3/4" />
                <div className="h-3 bg-muted rounded-md w-full" />
                <div className="h-3 bg-muted rounded-md w-5/6" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground font-medium">
        {results.length} result{results.length !== 1 ? "s" : ""} found
      </p>
      {results.map((result, index) => (
        <motion.div
          key={result.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card className="p-4 sm:p-5 hover:shadow-md hover:border-primary/20 transition-all duration-200 group border-border/50">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="rounded-lg bg-primary/10 p-2 shrink-0 group-hover:bg-primary/15 transition-colors">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm sm:text-base truncate">
                    {result.document_title}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                    {result.content}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={`shrink-0 font-semibold text-xs tabular-nums ${relevanceColor(result.similarity)}`}
              >
                {(result.similarity * 100).toFixed(0)}%
              </Badge>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
