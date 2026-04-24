"use client";

import Link from "next/link";
import { Fragment, ReactNode } from "react";
import { DragEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { useDebounce } from "use-debounce";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { isAdminUser } from "@/lib/auth-user";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";
import { Folder } from "@/lib/types";

interface GlobalFindItem {
  id: string;
  filename: string;
  content?: Array<{
    page: number;
    content: string;
  }>;
}

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

interface AssistantTypingState {
  messageId: string;
  fullText: string;
  cursor: number;
  referencedPages: ChatReferenceLink[];
}

const PAGE_CHUNK_SIZE = 5;

export function FolderBrowser() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const admin = isAdminUser(user);
  const urlKeyword = searchParams.get("keyword") ?? "";
  const [globalSearch, setGlobalSearch] = useState(urlKeyword);
  const [newFolderName, setNewFolderName] = useState("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [folderNameDraft, setFolderNameDraft] = useState("");
  const [orderedFolders, setOrderedFolders] = useState<Folder[]>([]);
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
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
  const chatViewportRef = useRef<HTMLDivElement | null>(null);
  const requestSequenceRef = useRef(0);
  const blockedRequestIdsRef = useRef<Set<number>>(new Set());

  const [debouncedGlobalSearch] = useDebounce(globalSearch, 300);

  const foldersQuery = useQuery({
    queryKey: ["folders"],
    queryFn: async () => (await api.get<Folder[]>("/folders")).data,
  });

  const globalSearchQuery = useQuery({
    queryKey: ["global-file-search", debouncedGlobalSearch],
    queryFn: async () =>
      (await api.get<GlobalFindItem[]>("/files/find", { params: { keyword: debouncedGlobalSearch } })).data,
    enabled: debouncedGlobalSearch.trim().length > 0,
  });

  const chatModelsQuery = useQuery({
    queryKey: ["chatbot", "chat", "models"],
    queryFn: async () => {
      const { data } = await api.get<unknown>("/chatbot/chat/models");
      return normalizeChatModels(data);
    },
    enabled: isChatOpen,
    staleTime: 60_000,
  });

  const createFolderMutation = useMutation({
    mutationFn: async (foldername: string) => api.post("/folders", { foldername }),
    onSuccess: () => {
      setNewFolderName("");
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  const renameFolderMutation = useMutation({
    mutationFn: async ({ folderId, foldername }: { folderId: string; foldername: string }) =>
      api.patch(`/folders/${folderId}`, { foldername }),
    onSuccess: () => {
      setEditingFolderId(null);
      setFolderNameDraft("");
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["folder"] });
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (folderId: string) => api.delete(`/folders/${folderId}`),
    onSuccess: () => {
      setEditingFolderId(null);
      setFolderNameDraft("");
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

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
      const body = model ? { model, message } : { message };
      const response = await api.post("/chatbot/chat", body);
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

  const serverFolderOrderSignature = useMemo(
    () => (foldersQuery.data ?? []).map((folder) => folder.id).join("|"),
    [foldersQuery.data]
  );
  const searchContextHref = useMemo(() => {
    const params = new URLSearchParams();
    const trimmed = globalSearch.trim();
    if (trimmed) {
      params.set("keyword", trimmed);
    }
    const queryString = params.toString();
    return queryString ? `${pathname}?${queryString}` : pathname;
  }, [globalSearch, pathname]);

  useEffect(() => {
    setGlobalSearch(urlKeyword);
  }, [urlKeyword]);

  useEffect(() => {
    setOrderedFolders(foldersQuery.data ?? []);
  }, [serverFolderOrderSignature, foldersQuery.data]);

  useEffect(() => {
    const models = chatModelsQuery.data;
    if (!models?.length) {
      setSelectedModelId("");
      return;
    }
    setSelectedModelId((current) => {
      if (current && models.some((m) => m.id === current)) {
        return current;
      }
      return models[0]?.id ?? "";
    });
  }, [chatModelsQuery.data]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const trimmed = debouncedGlobalSearch.trim();
    if (trimmed) {
      params.set("keyword", trimmed);
    } else {
      params.delete("keyword");
    }

    const currentQuery = searchParams.toString();
    const nextQuery = params.toString();
    if (currentQuery === nextQuery) {
      return;
    }

    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [debouncedGlobalSearch, pathname, router, searchParams]);

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
    const models = chatModelsQuery.data ?? [];
    const modelRequired = models.length > 0;
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

  const onFolderDrop = (event: DragEvent<HTMLElement>, targetFolderId: string) => {
    event.preventDefault();
    if (!admin || !draggedFolderId || draggedFolderId === targetFolderId) {
      setDragOverFolderId(null);
      return;
    }

    setOrderedFolders((previous) => {
      const fromIndex = previous.findIndex((item) => item.id === draggedFolderId);
      const toIndex = previous.findIndex((item) => item.id === targetFolderId);
      if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
        return previous;
      }
      return moveFolder(previous, fromIndex, toIndex);
    });

    setDragOverFolderId(null);
    setDraggedFolderId(null);
  };

  return (
    <section className="space-y-5">
      <div className="ui-card p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              🔍
            </span>
            <input
              id="globalSearch"
              value={globalSearch}
              onChange={(event) => setGlobalSearch(event.target.value)}
              className="ui-search-input"
              placeholder="Search files by keyword..."
            />
          </div>
          {admin && (
            <button
              onClick={() => setShowCreateFolder((prev) => !prev)}
              title="Create folder"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-lg text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <span className="relative inline-flex items-center justify-center">
                <span>📁</span>
                <span className="absolute -right-2 -top-2 inline-flex h-4 w-4 items-center justify-center rounded-full bg-slate-900 text-[10px] text-white">
                  +
                </span>
              </span>
            </button>
          )}
        </div>

        {admin && showCreateFolder && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3">
            <input
              id="newFolder"
              value={newFolderName}
              onChange={(event) => setNewFolderName(event.target.value)}
              className="ui-input w-full max-w-sm"
              placeholder="Folder name"
            />
            <button
              onClick={() => createFolderMutation.mutate(newFolderName)}
              disabled={!newFolderName.trim() || createFolderMutation.isPending}
              className="ui-btn-primary"
            >
              {createFolderMutation.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        )}

        {globalSearchQuery.isLoading && <p className="mt-2 text-xs text-slate-500">Searching...</p>}
        {globalSearchQuery.data && (
          <ul className="mt-3 space-y-2">
            {globalSearchQuery.data.map((item) => (
              <GlobalSearchItem
                key={item.id}
                item={item}
                keyword={debouncedGlobalSearch}
                returnTo={encodeURIComponent(searchContextHref)}
              />
            ))}
            {!globalSearchQuery.data.length && <li className="text-xs text-slate-500">No matching files.</li>}
          </ul>
        )}
      </div>

      {foldersQuery.isLoading && <p className="text-sm text-slate-600">Loading folders...</p>}
      {foldersQuery.error && <p className="text-sm text-red-600">Could not load folders.</p>}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {orderedFolders.map((folder, index) => (
          <Link
            key={folder.id}
            href={`/folders/${folder.id}`}
            draggable={admin}
            onDragStart={() => {
              if (!admin) return;
              setDraggedFolderId(folder.id);
            }}
            onDragOver={(event) => {
              if (!admin) return;
              event.preventDefault();
              if (draggedFolderId !== folder.id) {
                setDragOverFolderId(folder.id);
              }
            }}
            onDrop={(event) => onFolderDrop(event, folder.id)}
            onDragEnd={() => {
              setDragOverFolderId(null);
              setDraggedFolderId(null);
            }}
            className={[
              "block rounded-2xl border bg-white/95 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
              dragOverFolderId === folder.id ? "border-slate-400 bg-slate-100" : "border-slate-200/90",
            ].join(" ")}
          >
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                {admin && <span className="text-sm text-slate-400">⋮⋮</span>}
                <span className="text-xl">📁</span>
                <span className="text-sm font-semibold text-slate-900">{folder.foldername}</span>
              </div>
              {admin && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={(event) => {
                      event.preventDefault();
                      setEditingFolderId((prev) => (prev === folder.id ? null : folder.id));
                      setFolderNameDraft(folder.foldername);
                    }}
                    className="rounded p-1 text-slate-500 hover:bg-slate-100"
                    title="Edit folder"
                  >
                    ✏️
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {folder.files.length} file{folder.files.length === 1 ? "" : "s"}
            </p>
            {admin && editingFolderId === folder.id && (
              <div
                onClick={(event) => event.preventDefault()}
                className="mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5"
              >
                <input
                  value={folderNameDraft}
                  onChange={(event) => setFolderNameDraft(event.target.value)}
                  className="ui-input"
                  placeholder="Rename folder"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() =>
                      renameFolderMutation.mutate({ folderId: folder.id, foldername: folderNameDraft })
                    }
                    className="ui-btn-primary px-3 py-1.5 text-xs"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => deleteFolderMutation.mutate(folder.id)}
                    className="inline-flex items-center justify-center rounded-full bg-rose-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-rose-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </Link>
        ))}
      </div>

      <button
        onClick={() => setIsChatOpen((previous) => !previous)}
        title={isChatOpen ? "Hide chatbot" : "Open chatbot"}
        className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#1677ff] text-2xl text-white shadow-[0_12px_28px_rgba(22,119,255,0.45)] transition hover:scale-105 hover:bg-[#0f68e8]"
      >
        💬
      </button>

      {isChatOpen && (
        <div className="fixed bottom-20 right-5 z-40 flex h-[34rem] w-[23rem] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-[#fafafc] shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white">
                AI
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-slate-900">AI Assistant</p>
                <p className="text-[11px] text-emerald-600">Active now</p>
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              title="Close chatbot"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500 transition hover:bg-slate-200 hover:text-slate-700"
            >
              ✕
            </button>
          </div>
          <div ref={chatViewportRef} className="flex-1 space-y-2.5 overflow-y-auto bg-[#f3f4f8] px-3 py-4">
            {chatMessages.map((message) => (
              (() => {
                const isTypingMessage = assistantTyping?.messageId === message.id;
                return (
                  <div
                    key={message.id}
                    className={[
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "w-fit max-w-[82%] rounded-[1.25rem] px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm",
                        message.role === "user"
                          ? "rounded-br-md bg-[#1980ff] text-white"
                          : "rounded-bl-md bg-[#e5e7ef] text-slate-800",
                      ].join(" ")}
                    >
                      <div className="break-words">
                        {isTypingMessage ? (
                          <p className="whitespace-pre-wrap break-words leading-relaxed">{message.text}</p>
                        ) : (
                          renderMessageText(message.text, message.role)
                        )}
                        {message.role === "assistant" && message.referencedPages && message.referencedPages.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
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
                    </div>
                  </div>
                );
              })()
            ))}
            {chatMutation.isPending && (
              <div className="flex justify-start pl-2">
                <LoadingBlinkDot />
              </div>
            )}
          </div>
          <form onSubmit={submitChatMessage} className="border-t border-slate-200 bg-white p-3">
            <div className="mb-2 flex flex-col gap-1">
              <label htmlFor="chat-model" className="text-[11px] font-medium text-slate-500">
                Model
              </label>
              <select
                id="chat-model"
                value={selectedModelId}
                onChange={(event) => setSelectedModelId(event.target.value)}
                disabled={chatModelsQuery.isLoading || chatMutation.isPending || Boolean(assistantTyping)}
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs text-slate-800 outline-none focus:border-slate-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {chatModelsQuery.isLoading && <option value="">Loading models…</option>}
                {chatModelsQuery.isError && <option value="">Could not load models</option>}
                {!chatModelsQuery.isLoading &&
                  !chatModelsQuery.isError &&
                  (chatModelsQuery.data?.length ?? 0) === 0 && <option value="">No models available</option>}
                {chatModelsQuery.data?.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1.5">
              <button
                type="button"
                aria-label="Add attachment"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-lg text-slate-600 shadow-sm"
              >
                +
              </button>
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="iMessage"
                className="h-9 flex-1 border-0 bg-transparent px-2 text-sm text-slate-800 outline-none placeholder:text-slate-500"
              />
              <button
                type={isConversationRunning ? "button" : "submit"}
                onClick={isConversationRunning ? stopConversation : undefined}
                disabled={
                  !isConversationRunning &&
                  (!chatInput.trim() ||
                    ((chatModelsQuery.data?.length ?? 0) > 0 && !selectedModelId))
                }
                title={isConversationRunning ? "Stop conversation" : "Send message"}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#1980ff] text-sm font-semibold text-white transition hover:bg-[#0f68e8] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
              >
                {isConversationRunning ? "■" : "↑"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function moveFolder(folders: Folder[], fromIndex: number, toIndex: number): Folder[] {
  const cloned = [...folders];
  const [picked] = cloned.splice(fromIndex, 1);
  if (!picked) {
    return folders;
  }
  cloned.splice(toIndex, 0, picked);
  return cloned;
}

function highlightKeyword(text: string, keyword: string): ReactNode {
  const trimmedKeyword = keyword.trim();
  if (!trimmedKeyword) {
    return text;
  }

  const escapedKeyword = trimmedKeyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escapedKeyword})`, "gi");
  const segments = text.split(regex);

  return segments.map((segment, index) =>
    segment.toLowerCase() === trimmedKeyword.toLowerCase() ? (
      <mark key={`${segment}-${index}`} className="rounded bg-amber-200 px-0.5">
        {segment}
      </mark>
    ) : (
      <Fragment key={`${segment}-${index}`}>{segment}</Fragment>
    )
  );
}

function GlobalSearchItem({ item, keyword, returnTo }: { item: GlobalFindItem; keyword: string; returnTo: string }) {
  const [pageChunk, setPageChunk] = useState(0);
  const pageEntries = useMemo(
    () =>
      Array.from(
        new Map(
          (item.content ?? []).map((entry) => [
            Math.max(1, entry.page + 1),
            {
              page: Math.max(1, entry.page + 1),
              snippet: extractSentencePreview(entry.content, keyword),
            },
          ])
        ).values()
      ).sort((a, b) => a.page - b.page),
    [item.content]
  );
  const totalChunks = Math.max(1, Math.ceil(pageEntries.length / PAGE_CHUNK_SIZE));
  const pageStart = pageChunk * PAGE_CHUNK_SIZE;
  const pagedEntries = pageEntries.slice(pageStart, pageStart + PAGE_CHUNK_SIZE);

  return (
    <li className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
      <Link href={`/files/${item.id}`} className="break-keep break-words text-base font-semibold text-slate-900 hover:underline sm:text-lg">
        {item.filename}
      </Link>
      {pagedEntries.length > 0 && (
        <div className="mt-2 space-y-2">
          <ul className="space-y-1 text-xs">
            {pagedEntries.map((entry) => (
              <li key={`${item.id}-${entry.page}`}>
                <Link
                  href={`/files/${item.id}?page=${entry.page}&keyword=${encodeURIComponent(keyword)}&returnTo=${returnTo}`}
                  className="block rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 transition hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-slate-800 sm:text-base">Page {entry.page}</span>
                    <span className="text-[11px] text-slate-500">Open</span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-relaxed text-slate-700 sm:text-sm">
                    {highlightKeyword(entry.snippet, keyword)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          {pageEntries.length > PAGE_CHUNK_SIZE && (
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setPageChunk((prev) => Math.max(0, prev - 1))}
                disabled={pageChunk === 0}
                className="rounded border border-slate-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Prev
              </button>
              <span className="text-slate-500">
                {pageChunk + 1} / {totalChunks}
              </span>
              <button
                onClick={() => setPageChunk((prev) => Math.min(totalChunks - 1, prev + 1))}
                disabled={pageChunk >= totalChunks - 1}
                className="rounded border border-slate-300 px-2 py-1 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function extractSentencePreview(content: string, keyword: string): string {
  const normalized = normalizePreviewText(content);
  if (!normalized) {
    return "...";
  }
  const lowerKeyword = keyword.trim().toLowerCase();
  const maxLength = 220;
  const contextRadius = 110;

  if (!lowerKeyword) {
    return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
  }

  const matchIndex = normalized.toLowerCase().indexOf(lowerKeyword);
  if (matchIndex < 0) {
    return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
  }

  const start = Math.max(0, matchIndex - contextRadius);
  const end = Math.min(normalized.length, matchIndex + lowerKeyword.length + contextRadius);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < normalized.length ? "..." : "";
  return `${prefix}${normalized.slice(start, end)}${suffix}`;
}

function normalizePreviewText(content: string): string {
  return content
    .replace(/\s+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z0-9])([^\x00-\x7F])/g, "$1 $2")
    .replace(/([^\x00-\x7F])([A-Za-z0-9])/g, "$1 $2")
    .replace(/([,.;:!?])(?=\S)/g, "$1 ")
    .trim();
}

function normalizeChatModels(payload: unknown): ChatModelOption[] {
  if (Array.isArray(payload)) {
    return payload.map((entry, index) => chatModelFromUnknown(entry, index)).filter(Boolean) as ChatModelOption[];
  }
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const record = payload as Record<string, unknown>;
  const nested =
    record.models ??
    record.data ??
    record.items ??
    record.results ??
    record.modelList;
  if (Array.isArray(nested)) {
    return nested.map((entry, index) => chatModelFromUnknown(entry, index)).filter(Boolean) as ChatModelOption[];
  }
  return [];
}

function chatModelFromUnknown(entry: unknown, index: number): ChatModelOption | null {
  if (typeof entry === "string" && entry.trim()) {
    const id = entry.trim();
    return { id, label: id };
  }
  if (!entry || typeof entry !== "object") {
    return null;
  }
  const o = entry as Record<string, unknown>;
  const id =
    (typeof o.id === "string" && o.id.trim()) ||
    (typeof o.model === "string" && o.model.trim()) ||
    (typeof o.name === "string" && o.name.trim()) ||
    (typeof o.value === "string" && o.value.trim()) ||
    "";
  if (!id) {
    return null;
  }
  const labelRaw =
    (typeof o.label === "string" && o.label.trim()) ||
    (typeof o.title === "string" && o.title.trim()) ||
    (typeof o.displayName === "string" && o.displayName.trim()) ||
    id;
  return { id, label: labelRaw };
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

function renderMessageText(text: string, role: ChatMessage["role"]): ReactNode {
  const isUser = role === "user";
  const inlineCodeClass = isUser
    ? "rounded bg-blue-500/70 px-1 py-0.5 font-mono text-[12px] text-white"
    : "rounded bg-slate-200 px-1 py-0.5 font-mono text-[12px] text-slate-800";
  return (
    <ReactMarkdown
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
          className={[
            "rounded-md px-2 py-1 text-[11px] font-semibold transition",
            copied ? "bg-emerald-600 text-white" : "bg-black text-white hover:bg-slate-800",
          ].join(" ")}
        >
          {copied ? "Copied" : "Copy"}
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
