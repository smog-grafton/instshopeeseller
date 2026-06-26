"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getApiBaseUrl, getSellerChatMessages, getSellerChatThreads, getSellerOrder, getSellerSupportThread, sendSellerChatMessage, sendSellerChatTyping } from "@/lib/api-client";
import { normalizeCurrencySymbol } from "@/lib/utils";

type ChatProduct = {
  id?: number;
  title: string;
  image: string;
  price: string;
  originalPrice?: string | null;
  href?: string;
};

type ChatAttachment = {
  id?: string;
  name: string;
  mime?: string;
  size?: number;
  type: "image" | "file";
  url: string;
};

type Thread = {
  id: string;
  buyerName: string;
  buyerEmail?: string;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageBy?: string;
  unread: boolean;
  product?: ChatProduct | null;
  recentProducts?: ChatProduct[];
};

type ChatMessage = {
  id: string;
  text: string;
  sender_type: string;
  sender_label?: string;
  timestamp: string;
  meta?: {
    product_id?: number;
    product?: ChatProduct;
    attachments?: ChatAttachment[];
    [key: string]: unknown;
  } | null;
};

type SupportOrder = {
  id: number;
  order_number: string;
  status: string;
  total_payment: number;
  fulfillment_cost?: number | null;
  currency_symbol?: string | null;
  created_at: string;
  frozen_at?: string | null;
  frozen_at_display?: string | null;
  frozen_reason?: string | null;
  is_frozen?: boolean;
  user?: { name?: string | null; email?: string | null };
};

const SUPPORT_EMAIL = "shopeecustomerservice58@gmail.com";
const CUSTOMER_FRONTEND_ORIGIN = (process.env.NEXT_PUBLIC_CUSTOMER_APP_URL ?? "").replace(/\/+$/, "");
const EMOJIS = ["😊", "👍", "🙏", "🔥", "❤️", "✅", "📦", "💬"];

const formatMoney = (amount: number, currencySymbol = "$") =>
  `${normalizeCurrencySymbol(currencySymbol)}${Number(amount || 0).toFixed(2)}`;

const formatDateTime = (value?: string | null) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString();
};

const buildFrozenOrderDraft = (order: SupportOrder) => {
  const currencySymbol = normalizeCurrencySymbol(order.currency_symbol || "$");
  return `Hello Shopee Support,

I would like to request a review and unlock for this frozen order.

Order Number: ${order.order_number}
Order Total: ${formatMoney(Number(order.total_payment || 0), currencySymbol)}
Frozen Reason: The 24-hour seller processing window passed before the order was processed.
Current Status: ${order.status}

Please review this order and advise if it can be unlocked for processing.

Thank you.`;
};

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function Icon({ name }: { name: "search" | "refresh" | "smile" | "image" | "camera" | "paperclip" | "send" | "user" | "box" }) {
  const common = "h-4 w-4";
  if (name === "search") return <svg className={common} viewBox="0 0 24 24" fill="none"><path d="m21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
  if (name === "refresh") return <svg className={common} viewBox="0 0 24 24" fill="none"><path d="M20 6v5h-5M4 18v-5h5M18.2 9A7 7 0 0 0 6.8 6.7M5.8 15A7 7 0 0 0 17.2 17.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (name === "smile") return <svg className={common} viewBox="0 0 24 24" fill="none"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8.5 10h.01M15.5 10h.01M8 14a5 5 0 0 0 8 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
  if (name === "image") return <svg className={common} viewBox="0 0 24 24" fill="none"><path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6Zm4 8 2.5-2.5L14 15l2-2 4 4M8.5 9h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (name === "camera") return <svg className={common} viewBox="0 0 24 24" fill="none"><path d="M4 8a2 2 0 0 1 2-2h2l1.5-2h5L16 6h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Zm8 9a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (name === "paperclip") return <svg className={common} viewBox="0 0 24 24" fill="none"><path d="m21 11-8.5 8.5a6 6 0 0 1-8.5-8.5L13 2a4 4 0 0 1 5.7 5.7l-9 9a2 2 0 1 1-2.8-2.8L15 5.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (name === "send") return <svg className={common} viewBox="0 0 24 24" fill="currentColor"><path d="M2 21 22 12 2 3v7l14 2-14 2v7Z" /></svg>;
  if (name === "box") return <svg className={common} viewBox="0 0 24 24" fill="none"><path d="m21 8-9-5-9 5 9 5 9-5ZM3 8v8l9 5 9-5V8M12 13v8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /></svg>;
  return <svg className={common} viewBox="0 0 24 24" fill="none"><path d="M20 21a8 8 0 0 0-16 0M12 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}

function productHref(product?: ChatProduct | null) {
  if (!product?.href) return undefined;
  if (product.href.startsWith("http")) return product.href;
  return CUSTOMER_FRONTEND_ORIGIN ? `${CUSTOMER_FRONTEND_ORIGIN}${product.href}` : product.href;
}

function attachmentKind(file: File): "image" | "file" {
  return file.type.startsWith("image/") ? "image" : "file";
}

function renderAttachments(attachments?: ChatAttachment[] | null, sellerMessage = false) {
  if (!attachments?.length) return null;

  return (
    <div className="mt-2 space-y-2">
      {attachments.map((attachment, index) => {
        const key = attachment.id || `${attachment.url}-${index}`;
        if (attachment.type === "image") {
          return (
            <a key={key} href={attachment.url} target="_blank" rel="noreferrer" className="block max-w-72 overflow-hidden rounded border border-white/30 bg-black/5">
              <img src={attachment.url} alt={attachment.name} className="max-h-64 w-full object-contain" />
            </a>
          );
        }

        return (
          <a
            key={key}
            href={attachment.url}
            download={attachment.name}
            target="_blank"
            rel="noreferrer"
            className={`flex max-w-72 items-center gap-2 rounded border px-3 py-2 text-xs font-medium no-underline ${
              sellerMessage ? "border-orange-200 bg-orange-500 text-white" : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            <Icon name="paperclip" />
            <span className="min-w-0 flex-1 truncate">{attachment.name}</span>
          </a>
        );
      })}
    </div>
  );
}

function ProductContextCard({ product, compact = false }: { product: ChatProduct; compact?: boolean }) {
  const href = productHref(product);
  return (
    <div className={`rounded border border-orange-100 bg-orange-50/60 ${compact ? "mt-2 p-2" : "p-3"}`}>
      <div className="flex items-center gap-3">
        <img src={product.image} alt="" className={`${compact ? "h-10 w-10" : "h-14 w-14"} shrink-0 rounded border border-white object-cover`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-orange-600">
            <Icon name="box" />
            Product Inquiry
          </div>
          <div className="mt-1 truncate text-sm font-semibold text-gray-900">{product.title}</div>
          <div className="mt-0.5 text-sm text-orange-600">
            {product.price}
            {product.originalPrice ? <span className="ml-2 text-xs text-gray-400 line-through">{product.originalPrice}</span> : null}
          </div>
        </div>
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="hidden h-8 shrink-0 items-center justify-center rounded bg-orange-600 px-3 text-xs font-semibold text-white no-underline hover:bg-orange-700 sm:inline-flex">
            View
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default function ChatManagementPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [supportOrder, setSupportOrder] = useState<SupportOrder | null>(null);
  const [supportError, setSupportError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const typingRef = useRef(0);
  const supportOpenedRef = useRef(false);

  const fetchThreads = useCallback(() => {
    setLoading(true);
    getSellerChatThreads()
      .then((res) => {
        const data = res.threads || [];
        setThreads(data);
        if (!selectedId && data.length > 0) {
          setSelectedId(data[0].id);
        }
      })
      .finally(() => setLoading(false));
  }, [selectedId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      fetchThreads();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchThreads]);

  useEffect(() => {
    const supportRequested = searchParams.get("support") === "1";
    const topic = searchParams.get("topic");
    const orderId = searchParams.get("order_id");
    const frozenOrderRequested = topic === "frozen_order_unlock" && Boolean(orderId);

    if ((!supportRequested && !frozenOrderRequested) || supportOpenedRef.current) return;
    supportOpenedRef.current = true;
    const timeoutId = window.setTimeout(() => {
      setLoading(true);
      Promise.all([
        getSellerSupportThread(),
        frozenOrderRequested ? getSellerOrder(orderId as string) : Promise.resolve(null),
      ])
        .then(([res, orderRes]) => {
          const thread = res.thread;
          if (thread) {
            setThreads((current) => {
              const existing = current.some((item) => item.id === thread.id);
              return existing ? current.map((item) => (item.id === thread.id ? thread : item)) : [thread, ...current];
            });
            setSelectedId(thread.id);
          }

          const order = orderRes?.order as SupportOrder | undefined;
          if (!order) return;

          if (!order.is_frozen && order.status !== "FROZEN") {
            setSupportError("This order is not frozen, so an unlock request is not available.");
            return;
          }

          setSupportOrder(order);
          setInput((current) => current || buildFrozenOrderDraft(order));
        })
        .catch((error) => {
          setSupportError(error instanceof Error ? error.message : "Unable to prepare this support request.");
        })
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [searchParams]);

  useEffect(() => {
    if (!selectedId) return;
    getSellerChatMessages(selectedId)
      .then((res) => setMessages(res.messages || []))
      .catch(() => setMessages([]));
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const base = getApiBaseUrl();
    if (!base) return;
    const lastId = messagesRef.current
      .map((m) => Number(m.id))
      .filter((id) => !Number.isNaN(id))
      .reduce((max, id) => (id > max ? id : max), 0);
    const url = `${base}/seller/chat/threads/${selectedId}/stream${lastId && lastId > 0 ? `?last_id=${lastId}` : ""}`;
    const source = new EventSource(url, { withCredentials: true });
    source.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev;
          return [...prev, data];
        });
        fetchThreads();
      } catch {
        // ignore malformed events
      }
    });
    source.onerror = () => {
      source.close();
    };
    return () => {
      source.close();
    };
  }, [fetchThreads, selectedId]);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!selectedAttachment || !selectedAttachment.type.startsWith("image/")) {
      setAttachmentPreview(null);
      return;
    }

    const url = URL.createObjectURL(selectedAttachment);
    setAttachmentPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedAttachment]);

  useEffect(() => {
    if (!selectedId) return;
    const trimmed = input.trim();
    const now = Date.now();
    if (!trimmed) {
      sendSellerChatTyping(selectedId, false).catch(() => {});
      return;
    }
    if (now - typingRef.current < 1500) return;
    typingRef.current = now;
    sendSellerChatTyping(selectedId, true).catch(() => {});
  }, [input, selectedId]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchThreads();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchThreads]);

  useEffect(() => {
    if (!selectedId) return;
    const interval = setInterval(() => {
      const lastId = messagesRef.current
        .map((m) => Number(m.id))
        .filter((id) => !Number.isNaN(id))
        .reduce((max, id) => (id > max ? id : max), 0);
      getSellerChatMessages(selectedId, lastId && lastId > 0 ? lastId : undefined)
        .then((res) => {
          if (!res.messages || res.messages.length === 0) return;
          setMessages((prev) => {
            const existing = new Set(prev.map((message) => String(message.id)));
            const incoming = res.messages.filter((message) => !existing.has(String(message.id)));
            return incoming.length ? [...prev, ...incoming] : prev;
          });
        })
        .catch(() => {});
    }, 4500);
    return () => clearInterval(interval);
  }, [selectedId]);

  const filteredThreads = useMemo(() => {
    if (!search.trim()) return threads;
    const q = search.trim().toLowerCase();
    return threads.filter((t) => t.buyerName.toLowerCase().includes(q) || t.buyerEmail?.toLowerCase().includes(q));
  }, [threads, search]);

  const selected = selectedId ? threads.find((t) => t.id === selectedId) : null;
  const selectedProduct = selected?.product || messages.find((message) => message.meta?.product)?.meta?.product || null;
  const appendEmoji = (emoji: string) => {
    setInput((value) => `${value}${value ? " " : ""}${emoji}`);
    setShowEmojiPicker(false);
  };

  const handleAttachmentSelect = (file?: File) => {
    if (!file) return;
    setSelectedAttachment(file);
    setShowEmojiPicker(false);
  };

  const onSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedId || sending || (!input.trim() && !selectedAttachment)) return;
    const text = input.trim();
    const attachment = selectedAttachment;
    setInput("");
    setSelectedAttachment(null);
    setSending(true);
    setSendError(null);
    const tempId = `tmp-${Date.now()}`;
    const tempAttachment = attachment
      ? {
          name: attachment.name,
          mime: attachment.type,
          size: attachment.size,
          type: attachmentKind(attachment),
          url: attachmentPreview || "",
        }
      : null;
    setMessages((prev) => [
      ...prev,
      {
        id: tempId,
        text: text || "Sending attachment...",
        sender_type: "seller",
        sender_label: "You",
        timestamp: "now",
        meta: tempAttachment ? { attachments: [tempAttachment] } : null,
      },
    ]);
    try {
      const topic = searchParams.get("topic");
      const meta = supportOrder && topic === "frozen_order_unlock"
        ? { order_id: supportOrder.id, topic }
        : undefined;
      const res = await sendSellerChatMessage(selectedId, text, meta, attachment ?? undefined);
      sendSellerChatTyping(selectedId, false).catch(() => {});
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        {
          id: res.message.id,
          text: res.message.text,
          sender_type: "seller",
          sender_label: res.message.sender_label,
          timestamp: res.message.timestamp,
          meta: res.message.meta ?? null,
        },
      ]);
      fetchThreads();
    } catch (error) {
      setInput(text);
      setSelectedAttachment(attachment);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setSendError(error instanceof Error ? error.message : "Message could not be sent.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-full space-y-6 overflow-x-hidden">
      <div>
        <div className="text-sm text-gray-500">Customer Service</div>
        <h1 className="text-xl font-semibold text-gray-900">Chat Management</h1>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-1 inline-block text-sm font-medium text-orange-600">
          {SUPPORT_EMAIL}
        </a>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative w-full md:w-72">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon name="search" />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customer or email..."
              className="h-10 w-full rounded border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            />
          </div>
          <button onClick={fetchThreads} className="inline-flex h-10 items-center gap-2 rounded border border-gray-200 px-3 text-sm hover:bg-gray-50">
            <Icon name="refresh" />
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex min-h-[640px] flex-col md:h-[620px] md:min-h-0 md:flex-row">
          <div className="w-full shrink-0 border-b border-gray-200 md:w-72 md:border-b-0 md:border-r">
            <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">Inbox</div>
            {loading ? (
              <div className="p-4 text-sm text-gray-500">Loading chats...</div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No chats yet.</div>
            ) : (
              <div className="max-h-64 divide-y divide-gray-100 overflow-y-auto md:max-h-none">
                {filteredThreads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => setSelectedId(thread.id)}
                    className={`w-full text-left px-4 py-3 text-sm ${selectedId === thread.id ? "bg-orange-50" : "hover:bg-gray-50"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex min-w-0 items-center gap-2 font-medium text-gray-800">
                        <Icon name="user" />
                        <span className="truncate">{thread.buyerName}</span>
                      </span>
                      <span className="text-xs text-gray-400">{thread.lastMessageAt}</span>
                    </div>
                    <div className="line-clamp-2 break-words text-xs leading-5 text-gray-500">{thread.lastMessage}</div>
                    {thread.product ? (
                      <div className="mt-2 flex items-center gap-2 rounded border border-orange-100 bg-white p-2">
                        <img src={thread.product.image} alt="" className="h-8 w-8 shrink-0 rounded object-cover" />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[11px] font-medium text-gray-700">{thread.product.title}</div>
                          <div className="text-[11px] text-orange-600">{thread.product.price}</div>
                        </div>
                      </div>
                    ) : null}
                    {thread.unread && <span className="inline-block mt-1 text-[10px] text-white bg-red-500 px-2 py-0.5 rounded-full">New</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="border-b border-gray-200 px-4 py-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-800">
                    {supportOrder ? "Frozen Order Review Request" : selected ? selected.buyerName : "Select a conversation"}
                  </div>
                  {selected?.buyerEmail ? <div className="text-xs text-gray-500">{selected.buyerEmail}</div> : null}
                </div>
                {selected?.unread ? <span className="w-fit rounded-full bg-red-500 px-2 py-0.5 text-[11px] font-semibold text-white">Unread</span> : null}
              </div>
              {!supportOrder && selectedProduct ? <div className="mt-3"><ProductContextCard product={selectedProduct} /></div> : null}
            </div>
            <div ref={listRef} className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {supportError ? (
                <div className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{supportError}</div>
              ) : null}
              {selected ? (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`max-w-[92%] overflow-hidden break-words rounded-lg px-3 py-2 text-sm leading-6 shadow-sm md:max-w-[75%] ${
                        msg.sender_type === "seller"
                          ? "ml-auto bg-orange-600 text-white"
                          : msg.sender_type === "admin"
                            ? "bg-blue-50 text-blue-900 border border-blue-100"
                            : "bg-white text-gray-800"
                      }`}
                    >
                      {msg.sender_type !== "seller" && (
                        <div className={`mb-1 text-[11px] font-medium uppercase tracking-[0.08em] ${
                          msg.sender_type === "admin" ? "text-blue-600" : "text-gray-400"
                        }`}>
                          {msg.sender_label || (msg.sender_type === "admin" ? "Customer Support" : selected?.buyerName || "Buyer")}
                        </div>
                      )}
                      <div className="whitespace-pre-wrap break-words">{msg.text}</div>
                      {renderAttachments(msg.meta?.attachments, msg.sender_type === "seller")}
                      {msg.meta?.product ? <ProductContextCard product={msg.meta.product} compact /> : null}
                      <div className={`mt-1 text-xs ${
                        msg.sender_type === "seller"
                          ? "text-orange-100"
                          : msg.sender_type === "admin"
                            ? "text-blue-500"
                            : "text-gray-400"
                      }`}>
                        {msg.timestamp}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-gray-500">Choose a chat to start replying.</div>
              )}
            </div>
            {selected && (
              <form onSubmit={onSend} className="flex flex-col gap-2 border-t border-gray-200 p-3">
                {supportOrder ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-950">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="font-semibold">Frozen Order Review Request</div>
                        <div className="mt-1 text-xs leading-5 text-red-800">
                          This order is frozen because the processing deadline has passed.
                        </div>
                      </div>
                      <Link
                        href="/portal/orders/my-orders"
                        className="inline-flex h-8 w-fit items-center justify-center rounded border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 no-underline hover:bg-red-100"
                      >
                        View Orders
                      </Link>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs leading-5 sm:grid-cols-2 lg:grid-cols-3">
                      <div><span className="font-semibold">Order number:</span> {supportOrder.order_number}</div>
                      <div><span className="font-semibold">Order date:</span> {formatDateTime(supportOrder.created_at)}</div>
                      <div><span className="font-semibold">Frozen date:</span> {formatDateTime(supportOrder.frozen_at_display || supportOrder.frozen_at)}</div>
                      <div><span className="font-semibold">Buyer:</span> {supportOrder.user?.name || supportOrder.user?.email || "Customer"}</div>
                      <div><span className="font-semibold">Order total:</span> {formatMoney(Number(supportOrder.total_payment || 0), supportOrder.currency_symbol || "$")}</div>
                      <div><span className="font-semibold">Processing amount:</span> {formatMoney(Number(supportOrder.fulfillment_cost || 0), supportOrder.currency_symbol || "$")}</div>
                      <div><span className="font-semibold">Status:</span> {supportOrder.status}</div>
                      <div><span className="font-semibold">Reason:</span> {supportOrder.frozen_reason || "Processing deadline passed"}</div>
                    </div>
                  </div>
                ) : null}
                {sendError ? <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{sendError}</div> : null}
                {!supportOrder && selectedProduct ? <ProductContextCard product={selectedProduct} compact /> : null}
                {selectedAttachment ? (
                  <div className="flex items-center gap-3 rounded border border-gray-200 bg-gray-50 p-2">
                    {attachmentPreview ? <img src={attachmentPreview} alt="" className="h-12 w-12 rounded object-cover" /> : <span className="inline-flex h-12 w-12 items-center justify-center rounded bg-white text-gray-500"><Icon name="paperclip" /></span>}
                    <div className="min-w-0 flex-1 text-xs">
                      <div className="truncate font-semibold text-gray-800">{selectedAttachment.name}</div>
                      <div className="text-gray-500">{Math.ceil(selectedAttachment.size / 1024)} KB</div>
                    </div>
                    <button type="button" onClick={() => setSelectedAttachment(null)} className="h-8 rounded border border-gray-200 bg-white px-3 text-xs font-semibold text-gray-600 hover:bg-gray-100">
                      Remove
                    </button>
                  </div>
                ) : null}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                  <div className="relative flex gap-2 sm:pb-1">
                    <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleAttachmentSelect(event.target.files?.[0])} />
                    <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => handleAttachmentSelect(event.target.files?.[0])} />
                    <input ref={fileInputRef} type="file" className="hidden" onChange={(event) => handleAttachmentSelect(event.target.files?.[0])} />
                    <IconButton label="Insert emoji" onClick={() => setShowEmojiPicker((value) => !value)} disabled={sending}>
                      <Icon name="smile" />
                    </IconButton>
                    {showEmojiPicker ? (
                      <div className="absolute bottom-11 left-0 z-10 grid grid-cols-4 gap-1 rounded-lg border border-gray-200 bg-white p-2 shadow-lg">
                        {EMOJIS.map((emoji) => (
                          <button key={emoji} type="button" onClick={() => appendEmoji(emoji)} className="h-8 w-8 rounded text-lg hover:bg-gray-100">
                            {emoji}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <IconButton label="Attach image" onClick={() => imageInputRef.current?.click()} disabled={sending}>
                      <Icon name="image" />
                    </IconButton>
                    <IconButton label="Open camera" onClick={() => cameraInputRef.current?.click()} disabled={sending}>
                      <Icon name="camera" />
                    </IconButton>
                    <IconButton label="Attach file" onClick={() => fileInputRef.current?.click()} disabled={sending}>
                      <Icon name="paperclip" />
                    </IconButton>
                  </div>
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a reply..."
                    rows={2}
                    maxLength={10000}
                    className="min-h-12 flex-1 resize-y rounded border border-gray-300 bg-white px-3 py-2 text-sm leading-6 text-gray-900 placeholder:text-gray-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-100 disabled:text-gray-500"
                    disabled={sending}
                  />
                  <button
                    className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded bg-orange-600 px-5 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300"
                    disabled={sending || (!input.trim() && !selectedAttachment)}
                  >
                    <Icon name="send" />
                    {sending ? "Sending..." : "Send"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
