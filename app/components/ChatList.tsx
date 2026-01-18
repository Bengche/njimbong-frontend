"use client";

import { useState, useEffect, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// Helper function to get full image URL
const getImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
};

interface Participant {
  id: number;
  name: string;
  profile_picture: string | null;
}

interface Listing {
  id: number;
  title: string;
  image: string | null;
}

interface LastMessage {
  content: string;
  message_type: string;
  sender_name: string;
  is_mine: boolean;
  created_at: string;
}

interface Conversation {
  id: number;
  participant: Participant;
  listing: Listing | null;
  last_message: LastMessage | null;
  unread_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface ChatListProps {
  selectedConversationId: number | null;
  onSelectConversation: (id: number) => void;
  className?: string;
}

export default function ChatList({
  selectedConversationId,
  onSelectConversation,
  className = "",
}: ChatListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/chat/conversations`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
        setError("");
      } else {
        const errData = await response.json();
        setError(errData.message || "Failed to load conversations");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getLastMessagePreview = (msg: LastMessage | null) => {
    if (!msg) return "No messages yet";

    const prefix = msg.is_mine ? "You: " : "";

    if (msg.message_type === "image") {
      return prefix + "📷 Photo";
    }

    const maxLength = 30;
    const content = msg.content || "";
    if (content.length > maxLength) {
      return prefix + content.slice(0, maxLength) + "...";
    }
    return prefix + content;
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-white ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-white p-4 ${className}`}
      >
        <p className="text-red-600 text-sm mb-2">{error}</p>
        <button
          onClick={fetchConversations}
          className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-white p-6 ${className}`}
      >
        <svg
          className="w-16 h-16 text-gray-300 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p className="text-gray-500 text-center">No conversations yet</p>
        <p className="text-gray-400 text-sm text-center mt-1">
          Start chatting with sellers on listings you&apos;re interested in
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={`w-full flex items-center px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 ${
              selectedConversationId === conversation.id
                ? "bg-green-50 border-l-4 border-l-green-600"
                : ""
            }`}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {conversation.participant?.profile_picture ? (
                <img
                  src={
                    getImageUrl(conversation.participant.profile_picture) || ""
                  }
                  alt={conversation.participant?.name || "User"}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-yellow-500 flex items-center justify-center text-white font-semibold">
                  {getInitials(conversation.participant?.name || "U")}
                </div>
              )}
              {/* Unread Badge */}
              {conversation.unread_count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center px-1 bg-red-500 text-white text-xs font-bold rounded-full">
                  {conversation.unread_count > 99
                    ? "99+"
                    : conversation.unread_count}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 ml-3 text-left">
              <div className="flex items-center justify-between">
                <h3
                  className={`font-medium truncate ${
                    conversation.unread_count > 0
                      ? "text-gray-900"
                      : "text-gray-700"
                  }`}
                >
                  {conversation.participant?.name || "Unknown User"}
                </h3>
                <span
                  className={`text-xs flex-shrink-0 ml-2 ${
                    conversation.unread_count > 0
                      ? "text-green-600 font-medium"
                      : "text-gray-400"
                  }`}
                >
                  {conversation.last_message
                    ? formatTime(conversation.last_message.created_at)
                    : formatTime(conversation.created_at)}
                </span>
              </div>

              {/* Listing Reference */}
              {conversation.listing && (
                <p className="text-xs text-gray-500 truncate">
                  📦 {conversation.listing.title}
                </p>
              )}

              {/* Last Message Preview */}
              <p
                className={`text-sm truncate ${
                  conversation.unread_count > 0
                    ? "text-gray-900 font-medium"
                    : "text-gray-500"
                }`}
              >
                {getLastMessagePreview(conversation.last_message)}
              </p>
            </div>

            {/* Listing Thumbnail */}
            {conversation.listing?.image && (
              <div className="flex-shrink-0 ml-3">
                <img
                  src={conversation.listing.image}
                  alt=""
                  className="w-10 h-10 rounded-lg object-cover"
                />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
