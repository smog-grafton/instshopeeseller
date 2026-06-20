"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getApiBaseUrl, getSellerChatMessages, getSellerChatThreads, getSellerOrder, getSellerSupportThread, sendSellerChatMessage, sendSellerChatTyping } from "@/lib/api-client";
import { normalizeCurrencySymbol } from "@/lib/utils";

type Thread = {
  id: string;
  buyerName: string;
  buyerEmail?: string;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageBy?: string;
  unread: boolean;
};

type ChatMessage = {
  id: string;
  text: string;
  sender_type: string;
  sender_label?: string;
  timestamp: string;
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
  const [supportOrder, setSupportOrder] = useState<SupportOrder | null>(null);
  const [supportError, setSupportError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
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
          setMessages((prev) => [...prev, ...res.messages]);
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

  const onSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedId || !input.trim() || sending) return;
    const text = input.trim();
    setInput("");
    setSending(true);
    setSendError(null);
    const tempId = `tmp-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, text, sender_type: "seller", sender_label: "You", timestamp: "now" }]);
    try {
      const topic = searchParams.get("topic");
      const meta = supportOrder && topic === "frozen_order_unlock"
        ? { order_id: supportOrder.id, topic }
        : undefined;
      const res = await sendSellerChatMessage(selectedId, text, meta);
      sendSellerChatTyping(selectedId, false).catch(() => {});
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        {
          id: res.message.id,
          text: res.message.text,
          sender_type: "seller",
          sender_label: res.message.sender_label,
          timestamp: res.message.timestamp,
        },
      ]);
      fetchThreads();
    } catch (error) {
      setInput(text);
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
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer or email..."
            className="h-10 w-full rounded border border-gray-300 bg-white px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 md:w-72"
          />
          <button onClick={fetchThreads} className="h-9 px-3 border border-gray-200 text-sm hover:bg-gray-50">Refresh</button>
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
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">{thread.buyerName}</span>
                      <span className="text-xs text-gray-400">{thread.lastMessageAt}</span>
                    </div>
                    <div className="line-clamp-2 break-words text-xs leading-5 text-gray-500">{thread.lastMessage}</div>
                    {thread.unread && <span className="inline-block mt-1 text-[10px] text-white bg-red-500 px-2 py-0.5 rounded-full">New</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col">
            <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">
              {supportOrder ? "Frozen Order Review Request" : selected ? `Chat with ${selected.buyerName}` : "Select a conversation"}
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
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
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
                    className="h-12 shrink-0 rounded bg-orange-600 px-5 text-sm font-semibold text-white hover:bg-orange-700 disabled:cursor-not-allowed disabled:bg-orange-300"
                    disabled={sending || !input.trim()}
                  >
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
