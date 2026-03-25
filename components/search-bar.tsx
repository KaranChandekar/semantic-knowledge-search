"use client";

import { useState, useCallback } from "react";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SearchResult } from "@/types";

interface SearchBarProps {
  onResults: (results: SearchResult[]) => void;
  onSearching?: (searching: boolean) => void;
}

export function SearchBar({ onResults, onSearching }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    onSearching?.(true);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      onResults(data.results);
    } catch (error) {
      console.error("Search error:", error);
      onResults([]);
    } finally {
      setIsSearching(false);
      onSearching?.(false);
    }
  }, [query, onResults, onSearching]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-card shadow-lg shadow-primary/[0.04] p-1.5 sm:p-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all">
        <Search className="ml-2 sm:ml-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
        <Input
          placeholder="Search by meaning... e.g. 'how does photosynthesis work?'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm sm:text-base placeholder:text-muted-foreground/60"
        />
        <Button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="rounded-xl px-3 sm:px-5 h-9 sm:h-10 gap-1.5 shrink-0 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-md shadow-primary/20"
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <span className="hidden sm:inline text-sm">Search</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
