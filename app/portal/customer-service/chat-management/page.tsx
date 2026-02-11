"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { getSellerChatMessages, getSellerChatThreads, sendSellerChatMessage, sendSellerChatTyping } from "@/lib/api-client";

type Thread = {
  id: string;
  buyerName: string;
  buyerEmail?: string;
  lastMessage: string;
  lastMessageAt: string;
  unread: boolean;
};

type ChatMessage = {
  id: string;
  text: string;
  sender_type: string;
  timestamp: string;
};

export default function ChatManagementPage() {
  const [loading, setLoading] = useState(true);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const typingRef = useRef(0);

  const fetchThreads = () => {
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
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    getSellerChatMessages(selectedId)
      .then((res) => setMessages(res.messages || []))
      .catch(() => setMessages([]));
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const base = process.env.NEXT_PUBLIC_API_URL;
    if (!base) return;
    const lastId = messagesRef.current
      .map((m) => Number(m.id))
      .filter((id) => !Number.isNaN(id))
      .reduce((max, id) => (id > max ? id : max), 0);
    const url = `${base}/api/v1/seller/chat/threads/${selectedId}/stream${lastId && lastId > 0 ? `?last_id=${lastId}` : ""}`;
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
  }, [selectedId]);

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
  }, []);

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
    if (!selectedId || !input.trim()) return;
    const text = input.trim();
    setInput("");
    const tempId = `tmp-${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempId, text, sender_type: "seller", timestamp: "now" }]);
    const res = await sendSellerChatMessage(selectedId, text);
    sendSellerChatTyping(selectedId, false).catch(() => {});
    setMessages((prev) => [
      ...prev.filter((m) => m.id !== tempId),
      { id: res.message.id, text: res.message.text, sender_type: "seller", timestamp: res.message.timestamp },
    ]);
    fetchThreads();
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm text-gray-500">Customer Service</div>
        <h1 className="text-xl font-semibold text-gray-900">Chat Management</h1>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer or email..."
            className="h-9 px-3 border border-gray-200 rounded text-sm w-full md:w-72"
          />
          <button onClick={fetchThreads} className="h-9 px-3 border border-gray-200 rounded text-sm hover:bg-gray-50">Refresh</button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex h-[520px]">
          <div className="w-64 border-r border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">Inbox</div>
            {loading ? (
              <div className="p-4 text-sm text-gray-500">Loading chats...</div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No chats yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
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
                    <div className="text-xs text-gray-500 truncate">{thread.lastMessage}</div>
                    {thread.unread && <span className="inline-block mt-1 text-[10px] text-white bg-red-500 px-2 py-0.5 rounded-full">New</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 text-sm font-medium text-gray-700">
              {selected ? `Chat with ${selected.buyerName}` : "Select a conversation"}
            </div>
            <div ref={listRef} className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {selected ? (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                        msg.sender_type === "seller" ? "ml-auto bg-orange-600 text-white" : "bg-white text-gray-800"
                      }`}
                    >
                      <div>{msg.text}</div>
                      <div className={`mt-1 text-xs ${msg.sender_type === "seller" ? "text-orange-100" : "text-gray-400"}`}>
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
              <form onSubmit={onSend} className="border-t border-gray-200 p-3 flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a reply..."
                  className="flex-1 h-9 px-3 border border-gray-200 rounded text-sm"
                />
                <button className="h-9 px-4 bg-orange-600 text-white rounded text-sm hover:bg-orange-700">Send</button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
