"use client";

import Link from "next/link";
import { Fragment, ReactNode } from "react";
import { FormEvent, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { api } from "@/lib/api";
import {
  READER_CHAT_ROOM,
  getReaderChatFonts,
  getReaderChatRoomStyles,
} from "@/lib/reader-chat-room";
import { useFixedChromeInverseScale } from "@/lib/hooks/use-fixed-chrome-inverse-scale";
import { rehypeAppendStreamCursor } from "@/lib/rehype-append-stream-cursor";


interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  referencedPages?: ChatReferenceLink[];
}

interface ChatReferenceLink {
  label: string;
  href: string;
}

interface ChatModelOption {
  id: string;
  label: string;
}

/**
 * Chatbot endpoint URLs per chat context. Centralized so each surface (home library,
 * folder page, PDF reader) routes its `/chatbot/chat` POSTs through a clearly-named
 * variable; if any one needs to swap to a different backend route in the future,
 * change it here without touching the widget body.
 */
const CHATBOT_REQUEST_URLS = {
  /** Home library chat (no folder context). */
  library: "/chatbot/chat",
  /** Folder page chat (folder-scoped). */
  folder: "/chatbot/chat",
  /** PDF reader chat (file/folder-scoped). */
  reader: "/chatbot/chat",
} as const;

type ChatRequestContext = keyof typeof CHATBOT_REQUEST_URLS;

function resolveChatRequestContext(folderId: string, layout: "default" | "reader"): ChatRequestContext {
  if (layout === "reader") {
    return "reader";
  }
  return folderId ? "folder" : "library";
}

interface DocumentChatWidgetProps {
  /** Current folder for document-scoped chat; use "" on the home library. */
  folderId?: string;
  /** Z-index classes for fixed launcher + panel (use above fullscreen layers, e.g. `z-[70]`). */
  stackZClass?: string;
  /** Slightly larger panel + launcher (e.g. PDF book viewer). */
  layout?: "default" | "reader";
  /** Reader layout only: render at full size when the PDF is fullscreen. Non-fullscreen reader uses the halved-down sizing. */
  readerFullscreen?: boolean;
}

const CHAT_MODEL_OPTIONS: readonly ChatModelOption[] = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
  { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
];

interface AssistantTypingState {
  messageId: string;
  fullText: string;
  cursor: number;
  referencedPages: ChatReferenceLink[];
}

export function DocumentChatWidget({
  folderId = "",
  stackZClass = "z-40",
  layout = "default",
  readerFullscreen = false,
}: DocumentChatWidgetProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [selectedModelId, setSelectedModelId] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "assistant-greeting",
      role: "assistant",
      text: "Hello! Ask me anything about your documents.",
    },
  ]);
  const [assistantTyping, setAssistantTyping] = useState<AssistantTypingState | null>(null);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const chatViewportRef = useRef<HTMLDivElement | null>(null);
  const modelMenuRef = useRef<HTMLDivElement | null>(null);
  const requestSequenceRef = useRef(0);
  const blockedRequestIdsRef = useRef<Set<number>>(new Set());
  const chatRequestContext = resolveChatRequestContext(folderId, layout);
  const chatRequestUrl = CHATBOT_REQUEST_URLS[chatRequestContext];

  const chatMutation = useMutation({
    mutationFn: async ({
      message,
      requestId,
      model,
    }: {
      message: string;
      requestId: number;
      model: string;
    }) => {
      const body = model
        ? { folderId, model, message }
        : { folderId, message };
      const response = await api.post(chatRequestUrl, body);
      const resolved = resolveChatbotResponse(response.data);
      return { ...resolved, requestId };
    },
    onSuccess: ({ answer, referencedPages, requestId }) => {
      if (blockedRequestIdsRef.current.has(requestId)) {
        blockedRequestIdsRef.current.delete(requestId);
        return;
      }
      const assistantMessageId = `${Date.now()}-assistant`;
      const resolvedText = answer || "I couldn't generate a response. Please try again.";
      setAssistantTyping({
        messageId: assistantMessageId,
        fullText: resolvedText,
        cursor: 0,
        referencedPages,
      });
    },
    onError: (error, variables) => {
      if (blockedRequestIdsRef.current.has(variables.requestId)) {
        blockedRequestIdsRef.current.delete(variables.requestId);
        return;
      }
      setChatMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-assistant-error`,
          role: "assistant",
          text: getChatbotErrorMessage(error),
        },
      ]);
    },
  });

  useEffect(() => {
    setSelectedModelId((current) => {
      if (current && CHAT_MODEL_OPTIONS.some((m) => m.id === current)) {
        return current;
      }
      return CHAT_MODEL_OPTIONS[0]?.id ?? "";
    });
  }, []);

  useEffect(() => {
    if (!isChatOpen) {
      setIsModelMenuOpen(false);
    }
  }, [isChatOpen]);

  useEffect(() => {
    if (!isModelMenuOpen) {
      return;
    }
    const onPointerDown = (event: MouseEvent) => {
      const el = modelMenuRef.current;
      if (el && !el.contains(event.target as Node)) {
        setIsModelMenuOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModelMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isModelMenuOpen]);

  useEffect(() => {
    if (!chatViewportRef.current) {
      return;
    }
    chatViewportRef.current.scrollTo({
      top: chatViewportRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [chatMessages, chatMutation.isPending, isChatOpen]);

  useEffect(() => {
    if (!assistantTyping) {
      return;
    }
    if (assistantTyping.cursor >= assistantTyping.fullText.length) {
      setAssistantTyping(null);
      return;
    }

    const currentChar = assistantTyping.fullText.charAt(assistantTyping.cursor);
    const delay = /[,.!?]/.test(currentChar) ? 85 : /\s/.test(currentChar) ? 22 : 14;

    const timer = window.setTimeout(() => {
      const nextCursor = assistantTyping.cursor + 1;
      const nextText = assistantTyping.fullText.slice(0, nextCursor);
      setChatMessages((previous) => {
        const messageIndex = previous.findIndex((message) => message.id === assistantTyping.messageId);
        if (messageIndex < 0) {
          return [
            ...previous,
            {
              id: assistantTyping.messageId,
              role: "assistant",
              text: nextText,
              referencedPages: assistantTyping.referencedPages,
            },
          ];
        }
        return previous.map((message) =>
          message.id === assistantTyping.messageId
            ? {
                ...message,
                text: nextText,
              }
            : message
        );
      });
      setAssistantTyping((previous) =>
        previous && previous.messageId === assistantTyping.messageId
          ? { ...previous, cursor: nextCursor }
          : previous
      );
    }, delay);

    return () => window.clearTimeout(timer);
  }, [assistantTyping]);

  const submitChatMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedMessage = chatInput.trim();
    const modelRequired = CHAT_MODEL_OPTIONS.length > 0;
    if (
      !trimmedMessage ||
      chatMutation.isPending ||
      assistantTyping ||
      (modelRequired && !selectedModelId)
    ) {
      return;
    }
    const requestId = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestId;
    setChatMessages((previous) => [
      ...previous,
      {
        id: `${Date.now()}-user`,
        role: "user",
        text: trimmedMessage,
      },
    ]);
    setChatInput("");
    chatMutation.mutate({ message: trimmedMessage, requestId, model: selectedModelId });
  };

  const stopConversation = () => {
    if (chatMutation.isPending) {
      blockedRequestIdsRef.current.add(requestSequenceRef.current);
    }
    setAssistantTyping(null);
  };

  const isConversationRunning = chatMutation.isPending || Boolean(assistantTyping);
  const selectedModelLabel =
    CHAT_MODEL_OPTIONS.find((m) => m.id === selectedModelId)?.label ?? CHAT_MODEL_OPTIONS[0]?.label ?? "";
  const modelPickerDisabled = chatMutation.isPending || Boolean(assistantTyping);

  const isReaderLayout = layout === "reader";
  /**
   * All chat surfaces (home library, folder page, PDF reader fullscreen + non-fullscreen)
   * render at the same "book preview" size — i.e. the halved reader geometry. Anchoring
   * to a single sizing keeps the AI circle and panel visually consistent everywhere.
   *
   * `readerCompact` is also forced on so the panel uses the compact CSS branches
   * (smaller padding, gaps, header chrome) regardless of where the widget renders.
   */
  const readerCompact = true;
  const chatGeometry = getReaderChatRoomStyles({ fullscreen: false });
  const chatFont = getReaderChatFonts(false);
  const fixedChromeInverseScale = useFixedChromeInverseScale();

  return (
    <>
            <button
              onClick={() => setIsChatOpen((previous) => !previous)}
              title={isChatOpen ? "Hide chatbot" : "Open chatbot"}
              style={{
                ...chatGeometry.fab,
                // Match book-preview FAB icon scale across every chat surface.
                fontSize: `${READER_CHAT_ROOM.fabIconFontRem * 0.5}rem`,
                ...(fixedChromeInverseScale !== 1
                  ? {
                      transform: `scale(${fixedChromeInverseScale})`,
                      transformOrigin: "bottom right",
                    }
                  : {}),
              }}
              className={[
                "fixed inline-flex items-center justify-center rounded-full bg-[#1677ff] text-white shadow-[0_12px_28px_rgba(22,119,255,0.45)] transition hover:bg-[#0f68e8]",
                isReaderLayout ? "" : "font-bold tracking-wide hover:scale-105",
                stackZClass,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="font-bold tracking-wide leading-none">AI</span>
            </button>

            {isChatOpen && (
              <div
                style={{
                  ...chatGeometry.panel,
                  ...(fixedChromeInverseScale !== 1
                    ? {
                        transform: `scale(${fixedChromeInverseScale})`,
                        transformOrigin: "bottom right",
                      }
                    : {}),
                }}
                className={[
                  "fixed flex flex-col overflow-hidden border border-slate-200 bg-[#fafafc] shadow-[0_30px_80px_rgba(15,23,42,0.18)]",
                  readerCompact ? "rounded-3xl" : "rounded-[2rem]",
                  stackZClass,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <div
                  className={[
                    "relative z-30 flex items-center justify-between overflow-visible border-b border-slate-200 bg-white",
                    readerCompact ? "px-2 py-2" : "px-4 py-3.5",
                  ].join(" ")}
                >
                  <div className={["flex min-w-0 flex-1 items-center", readerCompact ? "gap-1.5" : "gap-2.5"].join(" ")}>
                    <div
                      className={[
                        "inline-flex shrink-0 items-center justify-center rounded-lg bg-slate-700 font-bold tracking-wide text-white",
                        readerCompact ? "h-5 px-1.5 text-[9px]" : "h-9 px-2.5 text-xs",
                      ].join(" ")}
                    >
                      AI
                    </div>
                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="relative w-full min-w-0" ref={modelMenuRef}>
                        <button
                          type="button"
                          id="chat-model-trigger"
                          aria-haspopup="listbox"
                          aria-expanded={isModelMenuOpen}
                          aria-label={`Model: ${selectedModelLabel}. Change model`}
                          disabled={modelPickerDisabled}
                          onClick={() => {
                            if (!modelPickerDisabled) {
                              setIsModelMenuOpen((open) => !open);
                            }
                          }}
                          className={[
                            "inline-flex max-w-full min-w-0 items-center gap-1 rounded-lg py-0.5 pl-0.5 pr-0 text-left font-semibold text-slate-900 outline-none ring-sky-500/40 transition hover:bg-slate-100 focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50",
                            readerCompact ? "text-[11px]" : "text-sm",
                          ].join(" ")}
                        >
                          <span className="min-w-0 truncate">{selectedModelLabel}</span>
                          <svg
                            className={[
                              "shrink-0 text-slate-500 transition",
                              readerCompact ? "h-3 w-3" : "h-3.5 w-3.5",
                              isModelMenuOpen ? "rotate-180" : "",
                            ].join(" ")}
                            fill="none"
                            viewBox="0 0 20 20"
                            stroke="currentColor"
                            strokeWidth={2.25}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                          >
                            <path d="M5 7.5 10 12.5 15 7.5" />
                          </svg>
                        </button>
                        {isModelMenuOpen && (
                          <ul
                            role="listbox"
                            aria-labelledby="chat-model-trigger"
                            className="absolute left-0 top-full z-[100] mt-1.5 w-max min-w-0 max-w-[13.5rem] list-none space-y-0.5 overflow-hidden rounded-xl border border-slate-200/90 bg-white/95 p-1 shadow-[0_10px_40px_-4px_rgba(15,23,42,0.18),0_4px_16px_-4px_rgba(15,23,42,0.1)] ring-1 ring-slate-900/5 backdrop-blur-sm"
                          >
                            {CHAT_MODEL_OPTIONS.map((option) => {
                              const isSelected = option.id === selectedModelId;
                              return (
                                <li key={option.id} role="presentation">
                                  <button
                                    type="button"
                                    id={`chat-model-option-${option.id}`}
                                    role="option"
                                    aria-selected={isSelected}
                                    onClick={() => {
                                      setSelectedModelId(option.id);
                                      setIsModelMenuOpen(false);
                                    }}
                                    className={[
                                      "flex w-full min-w-0 items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] font-medium leading-snug transition",
                                      isSelected
                                        ? "bg-sky-500 text-white"
                                        : "text-slate-700 hover:bg-slate-100",
                                    ].join(" ")}
                                  >
                                    <span className="min-w-0 break-words">{option.label}</span>
                                    {isSelected && (
                                      <svg
                                        className="h-3.5 w-3.5 shrink-0 text-white/90"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                        aria-hidden
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 9.5a.75.75 0 0 1-1.106.04l-4.5-4.5a.75.75 0 1 1 1.06-1.06l3.894 3.893 7.48-8.885a.75.75 0 0 1 1.029-.04Z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    )}
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                      <p className={readerCompact ? "text-[9px] text-emerald-600" : "text-[11px] text-emerald-600"}>Active now</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsChatOpen(false)}
                    title="Close chatbot"
                    className={[
                      "ml-1 inline-flex shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700",
                      readerCompact ? "h-5 w-5 text-[10px]" : "h-7 w-7 text-xs",
                    ].join(" ")}
                  >
                    ✕
                  </button>
                </div>
                <div
                  ref={chatViewportRef}
                  className={[
                    "relative z-0 flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#f3f4f8]",
                    readerCompact ? "space-y-1.5 px-2 py-2" : isReaderLayout ? "space-y-3 px-4 py-4" : "space-y-2.5 px-3 py-4",
                  ].join(" ")}
                >
                  {chatMessages.map((message) => {
                    const isTypingMessage = assistantTyping?.messageId === message.id;
                    const isAssistant = message.role === "assistant";
                    return (
                      <div
                        key={message.id}
                        className={["flex w-full shrink-0", message.role === "user" ? "justify-end" : "justify-start"].join(" ")}
                      >
                        <div
                          style={{ fontSize: `${chatFont.messagePx}px` }}
                          className={[
                            "w-fit max-w-[82%] leading-relaxed shadow-sm",
                            readerCompact ? "rounded-2xl px-2 py-1.5" : "rounded-[1.25rem] px-3.5 py-2.5",
                            message.role === "user"
                              ? "rounded-br-md bg-[#1980ff] text-white"
                              : "rounded-bl-md bg-[#e5e7ef] text-slate-800",
                          ].join(" ")}
                        >
                          <div className="break-words">
                            {isAssistant && isTypingMessage && !message.text ? (
                              <span className="chat-typing-cursor-line" aria-hidden />
                            ) : isAssistant && isTypingMessage ? (
                              <div className="chat-typing-md">
                                {renderMessageText(message.text, "assistant", { streamCursor: true })}
                              </div>
                            ) : (
                              renderMessageText(message.text, message.role)
                            )}
                            {isAssistant &&
                              !isTypingMessage &&
                              message.referencedPages &&
                              message.referencedPages.length > 0 && (
                                <div
                                  className="mt-2 flex flex-wrap gap-1.5"
                                  style={{ fontSize: `${chatFont.referenceLinkPx}px` }}
                                >
                                  {message.referencedPages.map((reference) => (
                                    <Link
                                      key={`${message.id}-${reference.href}-${reference.label}`}
                                      href={reference.href}
                                      className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-slate-700 underline underline-offset-2 hover:bg-slate-100"
                                    >
                                      {reference.label}
                                    </Link>
                                  ))}
                                </div>
                              )}
                          </div>
                          {message.text.trim() !== "" &&
                            (message.role === "user" || !isTypingMessage) && (
                              <div
                                className={[
                                  "mt-1.5 flex",
                                  message.role === "user" ? "justify-end" : "justify-start",
                                ].join(" ")}
                              >
                                <MessageCopyButton
                                  text={message.text}
                                  variant={message.role === "user" ? "user" : "assistant"}
                                  compact={readerCompact}
                                />
                              </div>
                            )}
                        </div>
                      </div>
                    );
                  })}
                  {chatMutation.isPending && (
                    <div className={readerCompact ? "flex justify-start pl-1" : "flex justify-start pl-2"}>
                      <LoadingBlinkDot />
                    </div>
                  )}
                </div>
                <form
                  onSubmit={submitChatMessage}
                  className={[
                    "border-t border-slate-100 bg-white/95 backdrop-blur",
                    readerCompact ? "px-2 pb-2 pt-1.5" : isReaderLayout ? "px-4 pb-4 pt-3" : "px-3 pb-3.5 pt-2.5",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "group flex items-center gap-2 rounded-2xl border border-slate-200/90 bg-white shadow-sm transition focus-within:border-slate-300/80 focus-within:shadow-md focus-within:shadow-slate-900/5",
                      readerCompact ? "min-h-[26px] px-2 py-0.5" : isReaderLayout ? "min-h-[52px] px-3 py-1.5" : "min-h-[48px] px-3 py-1",
                    ].join(" ")}
                  >
                    <input
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      placeholder="Ask about your documents…"
                      style={{ fontSize: `${chatFont.inputTextPx}px` }}
                      className={[
                        "flex-1 border-0 bg-transparent py-2 leading-snug text-slate-800 outline-none ring-0 placeholder:text-slate-400 focus:outline-none focus:ring-0",
                        readerCompact ? "min-h-[22px] py-1" : isReaderLayout ? "min-h-[44px]" : "min-h-[40px]",
                      ].join(" ")}
                    />
                    <button
                      type={isConversationRunning ? "button" : "submit"}
                      onClick={isConversationRunning ? stopConversation : undefined}
                      disabled={
                        !isConversationRunning &&
                        (!chatInput.trim() || (CHAT_MODEL_OPTIONS.length > 0 && !selectedModelId))
                      }
                      title={isConversationRunning ? "Stop conversation" : "Send message"}
                      className={[
                        "inline-flex shrink-0 items-center justify-center rounded-xl bg-sky-500 text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500",
                        readerCompact ? "h-5 w-5" : isReaderLayout ? "h-10 w-10" : "h-9 w-9",
                      ].join(" ")}
                    >
                      {isConversationRunning ? (
                        <span className={readerCompact ? "text-[8px] font-bold" : "text-xs font-bold"} aria-hidden>
                          ■
                        </span>
                      ) : (
                        <svg
                          className={readerCompact ? "h-2.5 w-2.5 translate-x-px" : "h-4 w-4 translate-x-px"}
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden
                        >
                          <path d="M3.478 2.404a.75.75 0 0 0-.926.94l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
    </>
  );
}

function getChatbotErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; error?: string; detail?: string }
      | string
      | undefined;
    if (typeof data === "string" && data.trim()) {
      return data.trim();
    }
    if (data && typeof data === "object") {
      if (typeof data.message === "string" && data.message.trim()) {
        return data.message.trim();
      }
      if (typeof data.error === "string" && data.error.trim()) {
        return data.error.trim();
      }
      if (typeof data.detail === "string" && data.detail.trim()) {
        return data.detail.trim();
      }
    }
    const status = error.response?.status;
    if (status) {
      const statusText = error.response?.statusText?.trim();
      return statusText ? `Request failed (${status} ${statusText})` : `Request failed (${status})`;
    }
    if (typeof error.message === "string" && error.message.trim()) {
      return error.message.trim();
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  return "Something went wrong while contacting the chatbot. Please try again.";
}

function resolveChatbotResponse(payload: unknown): { answer: string; referencedPages: ChatReferenceLink[] } {
  if (typeof payload === "string") {
    return { answer: payload, referencedPages: [] };
  }
  if (!payload || typeof payload !== "object") {
    return { answer: "", referencedPages: [] };
  }

  const recordPayload = payload as Record<string, unknown>;
  const directAnswer = recordPayload.answer;
  const directMessage = recordPayload.message;
  const directResponse = recordPayload.response;
  const answer =
    (typeof directAnswer === "string" && directAnswer) ||
    (typeof directMessage === "string" && directMessage) ||
    (typeof directResponse === "string" && directResponse) ||
    "";

  const directReferencedPages = normalizeReferencedPages(recordPayload.referencedPages);
  if (directReferencedPages.length > 0) {
    return { answer, referencedPages: directReferencedPages };
  }

  const data = recordPayload.data;
  if (data && typeof data === "object") {
    const nestedData = data as Record<string, unknown>;
    const nestedAnswer =
      (typeof nestedData.answer === "string" && nestedData.answer) ||
      (typeof nestedData.message === "string" && nestedData.message) ||
      (typeof nestedData.response === "string" && nestedData.response) ||
      answer;
    const nestedReferencedPages = normalizeReferencedPages(nestedData.referencedPages);
    return { answer: nestedAnswer, referencedPages: nestedReferencedPages };
  }

  return { answer, referencedPages: [] };
}

function normalizeReferencedPages(value: unknown): ChatReferenceLink[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry, index) => toReferenceLink(entry, index))
    .filter((entry): entry is ChatReferenceLink => entry !== null);
}

function toReferenceLink(entry: unknown, index: number): ChatReferenceLink | null {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const record = entry as Record<string, unknown>;
  const hrefCandidate = record.href ?? record.url ?? record.link;
  if (typeof hrefCandidate === "string" && hrefCandidate.trim()) {
    return {
      href: hrefCandidate,
      label: typeof record.label === "string" && record.label.trim() ? record.label : `Reference ${index + 1}`,
    };
  }

  const fileIdCandidate = record.fileId ?? record.file_id ?? record.id;
  if (typeof fileIdCandidate !== "string" || !fileIdCandidate.trim()) {
    return null;
  }

  const pageCandidate = record.page ?? record.pageNumber;
  const pageNumber =
    typeof pageCandidate === "number" && Number.isFinite(pageCandidate)
      ? pageCandidate
      : typeof pageCandidate === "string" && pageCandidate.trim() && Number.isFinite(Number(pageCandidate))
        ? Number(pageCandidate)
        : null;

  const params = new URLSearchParams();
  if (pageNumber && pageNumber > 0) {
    params.set("page", String(pageNumber));
  }
  const href = params.toString() ? `/files/${fileIdCandidate}?${params.toString()}` : `/files/${fileIdCandidate}`;
  const filename = typeof record.filename === "string" ? record.filename.trim() : "";
  const label =
    typeof record.label === "string" && record.label.trim()
      ? record.label
      : filename
        ? pageNumber
          ? `${filename} - Page ${pageNumber}`
          : filename
        : pageNumber
          ? `Page ${pageNumber}`
          : `Reference ${index + 1}`;

  return { href, label };
}

function ClipboardCopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function MessageCopyButton({
  text,
  variant,
  compact = false,
}: {
  text: string;
  variant: "user" | "assistant";
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = variant === "user";

  useEffect(() => {
    if (!copied) {
      return;
    }
    const t = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(t);
  }, [copied]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const label = copied ? "Copied" : "Copy message";

  return (
    <button
      type="button"
      onClick={() => void onCopy()}
      aria-label={label}
      title={label}
      className={[
        "inline-flex shrink-0 items-center justify-center rounded-md transition",
        compact ? "h-4 w-4" : "h-7 w-7",
        isUser
          ? copied
            ? "text-emerald-200"
            : "text-white/85 hover:text-white"
          : copied
            ? "text-emerald-700"
            : "text-slate-500 hover:text-slate-800",
      ].join(" ")}
    >
      {copied ? (
        <CheckIcon className={compact ? "h-3 w-3" : "h-4 w-4"} />
      ) : (
        <ClipboardCopyIcon className={compact ? "h-3 w-3" : "h-4 w-4"} />
      )}
    </button>
  );
}

function renderMessageText(
  text: string,
  role: ChatMessage["role"],
  options?: { streamCursor?: boolean }
): ReactNode {
  const { streamCursor = false } = options ?? {};
  const isUser = role === "user";
  const inlineCodeClass = isUser
    ? "rounded bg-blue-500/70 px-1 py-0.5 font-mono text-[12px] text-white"
    : "rounded bg-slate-200 px-1 py-0.5 font-mono text-[12px] text-slate-800";
  return (
    <ReactMarkdown
      rehypePlugins={streamCursor ? [rehypeAppendStreamCursor] : undefined}
      components={{
        h1: ({ children }) => <h1 className="mb-2 text-lg font-bold leading-snug last:mb-0">{children}</h1>,
        h2: ({ children }) => <h2 className="mb-2 text-base font-bold leading-snug last:mb-0">{children}</h2>,
        h3: ({ children }) => <h3 className="mb-2 text-sm font-semibold leading-snug last:mb-0">{children}</h3>,
        p: ({ children }) => <p className="mb-2 whitespace-pre-wrap break-words leading-relaxed last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>,
        li: ({ children }) => <li>{children}</li>,
        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
        code: ({ children, className }) => {
          const codeText = String(children).replace(/\n$/, "");
          const isBlockCode = Boolean(className) || codeText.includes("\n");
          if (isBlockCode) {
            return <ChatCodeBlock codeText={codeText} role={role} />;
          }
          return <code className={inlineCodeClass}>{children}</code>;
        },
        pre: ({ children }) => <>{children}</>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}

function ChatCodeBlock({ codeText, role }: { codeText: string; role: ChatMessage["role"] }) {
  const [copied, setCopied] = useState(false);
  const isUser = role === "user";

  useEffect(() => {
    if (!copied) {
      return;
    }
    const timer = window.setTimeout(() => setCopied(false), 1200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className={[
        "mb-2 rounded-lg border p-2.5 font-mono text-[12px] leading-relaxed last:mb-0",
        isUser ? "border-blue-300/40 bg-blue-500/55 text-white" : "border-slate-300 bg-white/75 text-slate-800",
      ].join(" ")}
    >
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={() => void onCopy()}
          aria-label={copied ? "Copied" : "Copy code"}
          title={copied ? "Copied" : "Copy"}
          className={[
            "inline-flex h-8 w-8 items-center justify-center rounded-md transition",
            copied ? "bg-emerald-600 text-white" : "bg-black text-white hover:bg-slate-800",
          ].join(" ")}
        >
          {copied ? <CheckIcon className="h-4 w-4" /> : <ClipboardCopyIcon className="h-4 w-4" />}
        </button>
      </div>
      <pre className="overflow-x-auto">
        <code>{codeText}</code>
      </pre>
    </div>
  );
}

function LoadingBlinkDot() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIsVisible((previous) => !previous);
    }, 420);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center py-1">
      <span
        className={[
          "h-2.5 w-2.5 rounded-full bg-slate-500 transition-opacity duration-200",
          isVisible ? "opacity-100" : "opacity-15",
        ].join(" ")}
      />
    </div>
  );
}
