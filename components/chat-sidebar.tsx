"use client";

import { useChat, Chat } from "@ai-sdk/react";
import { useMemo, useState } from "react";
import { DefaultChatTransport } from "ai";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, X, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export function ChatSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const chat = useMemo(
    () =>
      new Chat({
        transport: new DefaultChatTransport({ api: "/api/chat" }),
      }),
    []
  );
  const { messages, sendMessage, status } = useChat({ chat });

  const isLoading = status === "streaming" || status === "submitted";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    sendMessage({ text: inputValue.trim() });
    setInputValue("");
  };

  return (
    <>
      {/* Toggle button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 rounded-full h-12 w-12 sm:h-14 sm:w-14 shadow-xl shadow-primary/25 bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        size="icon"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <MessageSquare className="h-5 w-5" />
        )}
      </Button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-96"
          >
            <Card className="flex flex-col h-[400px] sm:h-[500px] shadow-2xl shadow-primary/10 rounded-2xl overflow-hidden border-border/50">
              {/* Header */}
              <div className="p-4 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                <h3 className="font-semibold flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-1.5">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  Ask your documents
                </h3>
                <p className="text-xs text-muted-foreground mt-1 ml-9">
                  Chat with your uploaded knowledge base
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-3">
                    <div className="rounded-2xl bg-primary/10 p-4">
                      <Bot className="h-6 w-6 text-primary/50" />
                    </div>
                    <p className="text-sm text-muted-foreground text-center max-w-[200px]">
                      Ask a question about your uploaded documents
                    </p>
                  </div>
                )}
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-2 ${
                      message.role === "user"
                        ? "justify-end"
                        : "justify-start"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="rounded-lg bg-primary/10 p-1 h-fit shrink-0 mt-1">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={`rounded-2xl px-3.5 py-2.5 max-w-[80%] text-sm leading-relaxed ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground rounded-br-md"
                          : "bg-muted rounded-bl-md"
                      }`}
                    >
                      {message.parts?.map((part, i) =>
                        part.type === "text" ? (
                          <span key={i}>{part.text}</span>
                        ) : null
                      )}
                    </div>
                    {message.role === "user" && (
                      <div className="rounded-lg bg-muted p-1 h-fit shrink-0 mt-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2 items-center">
                    <div className="rounded-lg bg-primary/10 p-1">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:0.1s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce [animation-delay:0.2s]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <form
                onSubmit={handleSubmit}
                className="p-3 sm:p-4 border-t border-border/50"
              >
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about your documents..."
                    disabled={isLoading}
                    className="rounded-xl text-sm"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isLoading || !inputValue.trim()}
                    className="rounded-xl shrink-0 bg-gradient-to-r from-primary to-primary/90 shadow-md shadow-primary/20"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
