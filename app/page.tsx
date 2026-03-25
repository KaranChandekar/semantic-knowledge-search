"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Upload,
  Search,
  Network,
  Sparkles,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentUpload } from "@/components/document-upload";
import { SearchBar } from "@/components/search-bar";
import { SearchResults } from "@/components/search-results";
import { KnowledgeGraph } from "@/components/knowledge-graph";
import { ChatSidebar } from "@/components/chat-sidebar";
import type { SearchResult } from "@/types";

export default function Home() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState("search");

  const handleUploadComplete = useCallback(() => {
    // Could refresh graph or show notification
  }, []);

  return (
    <main className="flex-1">
      {/* Header */}
      <header className="border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center gap-3">
          <div className="rounded-xl bg-gradient-to-br from-primary to-primary/80 p-2 shadow-lg shadow-primary/25">
            <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight">
              Knowledge Search
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              Search your documents by meaning, not keywords
            </p>
          </div>
        </div>
      </header>

      {/* Hero section with gradient background */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.04] via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/[0.06] rounded-full blur-3xl pointer-events-none" />

        <div className="container relative mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-6 max-w-4xl">
          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-6 sm:mb-8"
          >
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">
              <Sparkles className="h-3 w-3" />
              Powered by AI embeddings
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              Understand your documents
              <br />
              <span className="bg-gradient-to-r from-primary to-chart-5 bg-clip-text text-transparent">
                like never before
              </span>
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-lg mx-auto">
              Upload documents and search by meaning. Find connections you never
              knew existed.
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8"
          >
            <SearchBar onResults={setResults} onSearching={setIsSearching} />
          </motion.div>
        </div>
      </div>

      {/* Tabs content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-16 max-w-4xl">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 w-full sm:w-auto grid grid-cols-3 sm:inline-flex">
            <TabsTrigger value="search" className="gap-1.5 text-xs sm:text-sm">
              <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Results</span>
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-1.5 text-xs sm:text-sm">
              <Upload className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Upload</span>
            </TabsTrigger>
            <TabsTrigger value="graph" className="gap-1.5 text-xs sm:text-sm">
              <Network className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Knowledge </span>
              <span>Graph</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search">
            <SearchResults results={results} isSearching={isSearching} />
            {!isSearching && results.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 sm:py-16"
              >
                <div className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 p-5 mb-5">
                  <Search className="h-8 w-8 sm:h-10 sm:w-10 text-primary/60" />
                </div>
                <h2 className="text-base sm:text-lg font-semibold text-foreground">
                  Search your knowledge base
                </h2>
                <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
                  Upload documents and search by meaning — find content even
                  when the exact words don&apos;t match
                </p>
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="upload">
            <DocumentUpload onUploadComplete={handleUploadComplete} />
          </TabsContent>

          <TabsContent value="graph">
            <KnowledgeGraph />
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat sidebar */}
      <ChatSidebar />
    </main>
  );
}
