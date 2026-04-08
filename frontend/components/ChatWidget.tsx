"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

interface Message {
    role: "user" | "assistant";
    content: string;
    products?: number[];
    actionLog?: ActionStep[];
}

interface ActionStep {
    step: number;
    action: string;
    reasoning?: string;
    tool?: string;
    tool_input?: Record<string, unknown>;
    final?: boolean;
}

interface AgentResponse {
    reply: string;
    action_log: ActionStep[];
    products: number[];
}

export default function ChatWidget() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content:
                "Hi! 👋 I'm your **ShopNest AI Assistant**. I can help you find products, get recommendations, compare prices, and more.\n\nTry asking me something like:\n• \"Find laptops under $500\"\n• \"Show me categories\"\n• \"Best products\"\n• \"Compare headphones\"\n• \"Show my orders from this week\"\n• \"What did I order last month?\"",
        },
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [showLog, setShowLog] = useState<number | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, showLog]);

    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    async function handleSend() {
        const msg = input.trim();
        if (!msg || loading) return;

        const userMsg: Message = { role: "user", content: msg };
        setMessages((prev) => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const data = await apiFetch<AgentResponse>("/agent/chat", {
                method: "POST",
                body: JSON.stringify({ message: msg }),
            });

            const assistantMsg: Message = {
                role: "assistant",
                content: data.reply,
                products: data.products,
                actionLog: data.action_log,
            };
            setMessages((prev) => [...prev, assistantMsg]);
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: "Sorry, something went wrong. Please try again." },
            ]);
        } finally {
            setLoading(false);
        }
    }

    function formatContent(text: string) {
        // Convert markdown bold and product IDs to links
        const parts = text.split(/(\*\*[^*]+\*\*|\[(\d+)\])/g);
        return parts.map((part, i) => {
            if (!part) return null;
            // Bold
            if (part.startsWith("**") && part.endsWith("**")) {
                return (
                    <strong key={i} className="font-semibold">
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            // Product ID link [3]
            const idMatch = part.match(/^\[(\d+)\]$/);
            if (idMatch) {
                return (
                    <Link
                        key={i}
                        href={`/products/${idMatch[1]}`}
                        className="text-primary hover:underline font-medium"
                        onClick={() => setOpen(false)}
                    >
                        [#{idMatch[1]}]
                    </Link>
                );
            }
            return part;
        });
    }

    return (
        <>
            {/* Floating button */}
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
                    aria-label="Open AI assistant"
                >
                    <MessageCircle className="h-6 w-6" />
                </button>
            )}

            {/* Chat panel */}
            {open && (
                <div className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:h-[560px]">
                    {/* Header */}
                    <div className="flex items-center gap-3 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/20">
                            <Bot className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold">ShopNest AI Assistant</p>
                            <p className="text-xs opacity-80">Powered by Agentic AI</p>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="rounded-lg p-1 transition-colors hover:bg-primary-foreground/20"
                            aria-label="Close chat"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                        {messages.map((msg, i) => (
                            <div key={i}>
                                <div
                                    className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    {msg.role === "assistant" && (
                                        <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                            <Sparkles className="h-3.5 w-3.5" />
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-line ${msg.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-br-md"
                                            : "bg-muted rounded-bl-md"
                                            }`}
                                    >
                                        {formatContent(msg.content)}
                                    </div>
                                    {msg.role === "user" && (
                                        <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                                            <User className="h-3.5 w-3.5" />
                                        </div>
                                    )}
                                </div>

                                {/* Action log toggle */}
                                {msg.role === "assistant" && msg.actionLog && msg.actionLog.length > 0 && (
                                    <div className="ml-8 mt-1">
                                        <button
                                            onClick={() => setShowLog(showLog === i ? null : i)}
                                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <ChevronDown
                                                className={`h-3 w-3 transition-transform ${showLog === i ? "rotate-180" : ""}`}
                                            />
                                            {showLog === i ? "Hide" : "Show"} agent reasoning
                                            ({msg.actionLog.length} step{msg.actionLog.length > 1 ? "s" : ""})
                                        </button>
                                        {showLog === i && (
                                            <div className="mt-1 rounded-lg border border-border bg-muted/50 p-2 text-xs space-y-1">
                                                {msg.actionLog.map((step) => (
                                                    <div key={step.step} className="flex gap-1.5">
                                                        <span className="font-mono text-muted-foreground">
                                                            {step.step}.
                                                        </span>
                                                        <div>
                                                            {step.tool && (
                                                                <span className="inline-flex items-center rounded bg-primary/10 px-1.5 py-0.5 text-primary font-medium mr-1">
                                                                    🔧 {step.tool}
                                                                </span>
                                                            )}
                                                            {step.reasoning && (
                                                                <span className="text-muted-foreground">{step.reasoning}</span>
                                                            )}
                                                            {step.final && (
                                                                <span className="text-green-600 dark:text-green-400 font-medium">
                                                                    ✓ Done
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {loading && (
                            <div className="flex gap-2">
                                <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <Sparkles className="h-3.5 w-3.5 animate-spin" />
                                </div>
                                <div className="max-w-[80%] rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-sm">
                                    <span className="inline-flex gap-1">
                                        <span className="animate-bounce">●</span>
                                        <span className="animate-bounce" style={{ animationDelay: "0.1s" }}>●</span>
                                        <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>●</span>
                                    </span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="border-t border-border p-3">
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleSend();
                            }}
                            className="flex gap-2"
                        >
                            <input
                                ref={inputRef}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask me anything..."
                                disabled={loading}
                                maxLength={500}
                                className="flex-1 rounded-xl border border-border bg-muted/50 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 disabled:opacity-50"
                            />
                            <Button
                                type="submit"
                                size="icon"
                                disabled={!input.trim() || loading}
                            >
                                <Send className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
