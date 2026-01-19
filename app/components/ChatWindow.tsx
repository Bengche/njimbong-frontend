"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// Helper function to get full image URL
const getImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
};

interface ReplyTo {
  id: number;
  content: string | null;
  message_type: string;
  sender_name: string;
}

interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  content: string | null;
  message_type: "text" | "image" | "system";
  image_url: string | null;
  status: "sent" | "delivered" | "read";
  created_at: string;
  sender_name: string;
  sender_picture: string | null;
  is_mine: boolean;
  is_edited?: boolean;
  is_deleted?: boolean;
  reply_to_id?: number | null;
  reply_to_content?: string | null;
  reply_to_message_type?: string;
  reply_to_sender_name?: string;
  reply_to_image_url?: string | null;
}

interface Participant {
  id: number;
  name: string;
  profile_picture: string | null;
  verified?: boolean;
}

interface Listing {
  id: number;
  title: string;
  price: number;
  currency: string;
  image: string | null;
}

interface Conversation {
  id: number;
  participant: Participant;
  listing: Listing | null;
  status: string;
  created_at: string;
  is_blocked_by_me: boolean;
  is_blocked_by_other: boolean;
}

interface ChatWindowProps {
  conversationId: number | null;
  onClose?: () => void;
  className?: string;
}

export default function ChatWindow({
  conversationId,
  onClose,
  className = "",
}: ChatWindowProps) {
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ReplyTo | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    messageId: number;
    x: number;
    y: number;
    isMine: boolean;
  } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<number | null>(null);
  const isAtBottomRef = useRef(true);
  const initialLoadRef = useRef(true);

  // Get current user ID
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/user/me`, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentUserId(data.id);
        }
      } catch {
        // Silent fail
      }
    };
    fetchCurrentUser();
  }, []);

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior });
      isAtBottomRef.current = true;
    }, 100);
  }, []);

  const updateIsAtBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    const threshold = 120;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isAtBottomRef.current = distanceFromBottom <= threshold;
  }, []);

  // Sort messages by created_at and ID to ensure consistent ordering
  const sortMessages = useCallback((msgs: Message[]): Message[] => {
    return [...msgs].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      if (dateA !== dateB) return dateA - dateB;
      return a.id - b.id;
    });
  }, []);

  // Transform message from API response
  const transformMessage = useCallback(
    (msg: Record<string, unknown>, userId: number | null): Message => {
      return {
        id: msg.id as number,
        conversation_id: msg.conversation_id as number,
        sender_id: msg.sender_id as number,
        content: msg.content as string | null,
        message_type:
          (msg.message_type as "text" | "image" | "system") || "text",
        image_url: msg.image_url as string | null,
        status: (msg.status as "sent" | "delivered" | "read") || "sent",
        created_at: msg.created_at as string,
        sender_name: msg.sender_name as string,
        sender_picture: msg.sender_picture as string | null,
        is_mine: userId !== null && msg.sender_id === userId,
        is_edited: msg.is_edited as boolean | undefined,
        is_deleted: msg.is_deleted as boolean | undefined,
        reply_to_id: msg.reply_to_id as number | null | undefined,
        reply_to_content: msg.reply_to_content as string | null | undefined,
        reply_to_message_type: msg.reply_to_message_type as string | undefined,
        reply_to_sender_name: msg.reply_to_sender_name as string | undefined,
        reply_to_image_url: msg.reply_to_image_url as string | null | undefined,
      };
    },
    []
  );

  const fetchConversation = useCallback(async () => {
    if (!conversationId || currentUserId === null) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/chat/conversations/${conversationId}`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConversation(data.conversation);

        // Transform and sort messages
        const transformedMessages = data.messages.map(
          (msg: Record<string, unknown>) => transformMessage(msg, currentUserId)
        );
        const sortedMessages = sortMessages(transformedMessages);
        setMessages(sortedMessages);

        if (sortedMessages.length > 0) {
          lastMessageIdRef.current =
            sortedMessages[sortedMessages.length - 1].id;
        }
        setError("");

        // Mark as read
        await fetch(
          `${API_BASE}/api/chat/conversations/${conversationId}/read`,
          {
            method: "PUT",
            credentials: "include",
          }
        );

        scrollToBottom("auto");
      } else {
        const errData = await response.json();
        setError(errData.error || "Failed to load conversation");
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setLoading(false);
    }
  }, [
    conversationId,
    currentUserId,
    transformMessage,
    sortMessages,
    scrollToBottom,
  ]);

  const pollNewMessages = useCallback(async () => {
    if (!conversationId || currentUserId === null) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/chat/conversations/${conversationId}/messages?limit=50`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        const transformedMessages = data.messages.map(
          (msg: Record<string, unknown>) => transformMessage(msg, currentUserId)
        );
        const sortedMessages = sortMessages(transformedMessages);

        if (sortedMessages.length > 0) {
          const newestMessage = sortedMessages[sortedMessages.length - 1];
          const newestId = newestMessage.id;
          if (lastMessageIdRef.current !== newestId) {
            const shouldAutoScroll =
              isAtBottomRef.current ||
              (currentUserId !== null && newestMessage.sender_id === currentUserId);
            setMessages(sortedMessages);
            lastMessageIdRef.current = newestId;
            if (shouldAutoScroll) {
              scrollToBottom();
            }

            // Mark as read
            await fetch(
              `${API_BASE}/api/chat/conversations/${conversationId}/read`,
              {
                method: "PUT",
                credentials: "include",
              }
            );
          }
        }
      }
    } catch {
      // Polling error - silent fail
    }
  }, [
    conversationId,
    currentUserId,
    sortMessages,
    transformMessage,
    scrollToBottom,
  ]);

  // Poll for read receipts to update message statuses
  const pollReadReceipts = useCallback(async () => {
    if (!conversationId || currentUserId === null) return;

    try {
      const response = await fetch(
        `${API_BASE}/api/chat/conversations/${conversationId}/read-receipts`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Update message statuses based on read receipts
        if (data.receipts && data.receipts.length > 0) {
          setMessages((prevMessages) =>
            prevMessages.map((msg) => {
              if (msg.is_mine) {
                const receipt = data.receipts.find(
                  (r: { id: number; status: string }) => r.id === msg.id
                );
                if (receipt && receipt.status !== msg.status) {
                  return { ...msg, status: receipt.status };
                }
              }
              return msg;
            })
          );
        }
      }
    } catch {
      // Silent fail for read receipt polling
    }
  }, [conversationId, currentUserId]);

  useEffect(() => {
    if (conversationId && currentUserId !== null) {
      setLoading(true);
      setMessages([]);
      setConversation(null);
      setReplyingTo(null);
      setHasMore(true);
      initialLoadRef.current = true;
      isAtBottomRef.current = true;
      fetchConversation();

      // Start polling every 3 seconds for new messages
      pollingRef.current = setInterval(() => {
        pollNewMessages();
        pollReadReceipts();
      }, 3000);
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [
    conversationId,
    currentUserId,
    fetchConversation,
    pollNewMessages,
    pollReadReceipts,
  ]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      if (initialLoadRef.current || isAtBottomRef.current) {
        scrollToBottom("auto");
        initialLoadRef.current = false;
      }
    }
  }, [loading, messages, scrollToBottom]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const loadMoreMessages = async () => {
    if (
      !conversationId ||
      loadingMore ||
      !hasMore ||
      messages.length === 0 ||
      currentUserId === null
    )
      return;

    setLoadingMore(true);
    try {
      const oldestMessageId = messages[0].id;

      const response = await fetch(
        `${API_BASE}/api/chat/conversations/${conversationId}/messages?before=${oldestMessageId}&limit=20`,
        {
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.messages.length === 0) {
          setHasMore(false);
        } else {
          const transformedMessages = data.messages.map(
            (msg: Record<string, unknown>) =>
              transformMessage(msg, currentUserId)
          );
          setMessages((prev) =>
            sortMessages([...transformedMessages, ...prev])
          );
        }
      }
    } catch {
      // Load more error - silent fail
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    updateIsAtBottom();
    if (container && container.scrollTop < 50 && hasMore && !loadingMore) {
      loadMoreMessages();
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newMessage.trim() ||
      !conversationId ||
      sending ||
      currentUserId === null
    )
      return;

    const messageContent = newMessage.trim();
    const replyTo = replyingTo;

    // Clear input immediately for better UX
    setNewMessage("");
    setReplyingTo(null);
    setSending(true);

    // Create optimistic message
    const tempId = Date.now();
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: messageContent,
      message_type: "text",
      image_url: null,
      status: "sent",
      created_at: new Date().toISOString(),
      sender_name: "You",
      sender_picture: null,
      is_mine: true,
      reply_to_id: replyTo?.id,
      reply_to_content: replyTo?.content,
      reply_to_message_type: replyTo?.message_type,
      reply_to_sender_name: replyTo?.sender_name,
    };

    setMessages((prev) => sortMessages([...prev, optimisticMessage]));
    scrollToBottom();

    try {
      const response = await fetch(
        `${API_BASE}/api/chat/conversations/${conversationId}/messages`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: messageContent,
            replyToId: replyTo?.id,
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Replace optimistic message with real one
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempId);
          const realMessage = transformMessage(data.message, currentUserId);
          return sortMessages([...filtered, realMessage]);
        });
        lastMessageIdRef.current = data.message.id;
      } else {
        // Remove optimistic message on failure
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        const errData = await response.json();
        setError(errData.error || "Failed to send message");
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const sendImage = async (file: File) => {
    if (!conversationId || uploadingImage || currentUserId === null) return;

    setUploadingImage(true);

    // Create optimistic message
    const tempId = Date.now();
    const tempUrl = URL.createObjectURL(file);
    const optimisticMessage: Message = {
      id: tempId,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: null,
      message_type: "image",
      image_url: tempUrl,
      status: "sent",
      created_at: new Date().toISOString(),
      sender_name: "You",
      sender_picture: null,
      is_mine: true,
    };

    setMessages((prev) => sortMessages([...prev, optimisticMessage]));
    scrollToBottom();

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `${API_BASE}/api/chat/conversations/${conversationId}/images`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        const msg = data.message || data; // Handle both formats
        // Replace optimistic message with real one
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.id !== tempId);
          const realMessage: Message = {
            id: msg.id,
            conversation_id: conversationId,
            sender_id: currentUserId,
            content: msg.content,
            message_type: "image",
            image_url: msg.image_url || msg.imageUrl,
            status: "sent",
            created_at: msg.created_at || msg.createdAt,
            sender_name: msg.sender_name || "You",
            sender_picture: msg.sender_picture || null,
            is_mine: true,
          };
          return sortMessages([...filtered, realMessage]);
        });
        lastMessageIdRef.current = msg.id;
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        const errData = await response.json();
        setError(errData.error || "Failed to send image");
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setError("Failed to send image");
    } finally {
      setUploadingImage(false);
      URL.revokeObjectURL(tempUrl);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }
      sendImage(file);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, message: Message) => {
    e.preventDefault();
    if (message.is_deleted) return;
    setContextMenu({
      messageId: message.id,
      x: e.clientX,
      y: e.clientY,
      isMine: message.is_mine,
    });
  };

  const handleReply = (message: Message) => {
    setReplyingTo({
      id: message.id,
      content: message.content,
      message_type: message.message_type,
      sender_name: message.is_mine ? "yourself" : message.sender_name,
    });
    setContextMenu(null);
    inputRef.current?.focus();
  };

  const handleDelete = async (messageId: number) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/chat/messages/${messageId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  is_deleted: true,
                  content: "This message was deleted",
                  image_url: null,
                }
              : m
          )
        );
      } else {
        const errData = await response.json();
        setError(errData.error || "Failed to delete message");
      }
    } catch {
      setError("Failed to delete message");
    }
    setDeleteConfirm(null);
    setContextMenu(null);
  };

  const handleCopyText = (content: string | null) => {
    if (content) {
      navigator.clipboard.writeText(content);
    }
    setContextMenu(null);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "long" });
    }
    return date.toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const isBlocked =
    conversation?.is_blocked_by_me || conversation?.is_blocked_by_other;

  // No conversation selected
  if (!conversationId) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-50 ${className}`}
      >
        <div className="text-center text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
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
          <p className="text-lg font-medium">Select a conversation</p>
          <p className="text-sm">
            Choose a chat from the list to start messaging
          </p>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading || currentUserId === null) {
    return (
      <div className={`flex items-center justify-center bg-white ${className}`}>
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
      </div>
    );
  }

  // Error state
  if (error && !conversation) {
    return (
      <div className={`flex items-center justify-center bg-white ${className}`}>
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={fetchConversation}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex items-center space-x-3">
          <a
            href={`/profile/${conversation?.participant?.id}`}
            className="relative"
          >
            {conversation?.participant?.profile_picture ? (
              <img
                src={
                  getImageUrl(conversation.participant.profile_picture) || ""
                }
                alt={conversation.participant?.name || "User"}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-yellow-500 flex items-center justify-center text-white font-semibold">
                {getInitials(conversation?.participant?.name || "?")}
              </div>
            )}
            {conversation?.participant?.verified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-2.5 h-2.5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                </svg>
              </div>
            )}
          </a>
          <div>
            <a
              href={`/profile/${conversation?.participant?.id}`}
              className="font-semibold text-gray-900 hover:text-green-600 transition-colors"
            >
              {conversation?.participant?.name}
            </a>
            {conversation?.listing && (
              <p className="text-xs text-gray-500 truncate max-w-[200px]">
                Re: {conversation.listing.title}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {conversation?.listing && (
            <a
              href={`/listing/${conversation.listing.id}`}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              title="View listing"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Listing Preview */}
      {conversation?.listing && (
        <a
          href={`/listing/${conversation.listing.id}`}
          className="flex items-center space-x-3 px-4 py-2 bg-gray-50 border-b border-gray-200 hover:bg-gray-100 transition-colors"
        >
          {conversation.listing.image ? (
            <img
              src={getImageUrl(conversation.listing.image) || ""}
              alt={conversation.listing.title}
              className="w-12 h-12 rounded-lg object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {conversation.listing.title}
            </p>
            <p className="text-sm font-semibold text-green-600">
              {conversation.listing.currency}{" "}
              {Number(conversation.listing.price).toLocaleString()}
            </p>
          </div>
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </a>
      )}

      {/* Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-100 text-red-600 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError("")}
            className="text-red-800 hover:text-red-900"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Blocked Banner */}
      {isBlocked && (
        <div className="px-4 py-2 bg-yellow-50 border-b border-yellow-100 text-yellow-800 text-sm text-center">
          {conversation?.is_blocked_by_me
            ? "You have blocked this user. Unblock to send messages."
            : "You cannot reply to this conversation."}
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-1 bg-gray-50"
      >
        {loadingMore && (
          <div className="text-center py-2">
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
          </div>
        )}

        {hasMore && messages.length > 0 && !loadingMore && (
          <button
            onClick={loadMoreMessages}
            className="w-full text-center text-sm text-green-600 hover:text-green-700 py-2"
          >
            Load older messages
          </button>
        )}

        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-300"
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
            <p className="font-medium">No messages yet</p>
            <p className="text-sm">Send a message to start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const showDate =
              index === 0 ||
              new Date(message.created_at).toDateString() !==
                new Date(messages[index - 1].created_at).toDateString();

            const showAvatar =
              !message.is_mine &&
              (index === messages.length - 1 ||
                messages[index + 1].is_mine ||
                messages[index + 1].sender_id !== message.sender_id);

            return (
              <div key={message.id}>
                {showDate && (
                  <div className="text-center my-4">
                    <span className="px-3 py-1 bg-white text-gray-500 text-xs rounded-full shadow-sm">
                      {formatDate(message.created_at)}
                    </span>
                  </div>
                )}

                {message.message_type === "system" ? (
                  <div className="text-center my-2">
                    <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                      {message.content}
                    </span>
                  </div>
                ) : (
                  <div
                    className={`flex ${
                      message.is_mine ? "justify-end" : "justify-start"
                    } mb-1 group`}
                    onContextMenu={(e) => handleContextMenu(e, message)}
                    onDoubleClick={() =>
                      !message.is_deleted && handleReply(message)
                    }
                  >
                    <div
                      className={`flex items-end max-w-[75%] ${
                        message.is_mine ? "flex-row-reverse" : ""
                      }`}
                    >
                      {/* Avatar space */}
                      {!message.is_mine && (
                        <div className="w-8 flex-shrink-0 mr-2">
                          {showAvatar &&
                            (message.sender_picture ? (
                              <img
                                src={getImageUrl(message.sender_picture) || ""}
                                alt=""
                                className="w-7 h-7 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-yellow-500 flex items-center justify-center text-white text-xs font-semibold">
                                {getInitials(message.sender_name)}
                              </div>
                            ))}
                        </div>
                      )}

                      <div className={message.is_mine ? "mr-2" : ""}>
                        {/* Reply preview */}
                        {message.reply_to_id && message.reply_to_content && (
                          <div
                            className={`text-xs px-3 py-1 mb-1 rounded-t-lg border-l-2 ${
                              message.is_mine
                                ? "bg-green-700/50 text-green-100 border-green-300 ml-auto"
                                : "bg-gray-200 text-gray-600 border-gray-400"
                            }`}
                            style={{ maxWidth: "fit-content" }}
                          >
                            <span className="font-medium">
                              {message.reply_to_sender_name}
                            </span>
                            <p className="truncate max-w-[200px]">
                              {message.reply_to_message_type === "image"
                                ? "📷 Photo"
                                : message.reply_to_content}
                            </p>
                          </div>
                        )}

                        {/* Message bubble */}
                        <div
                          className={`rounded-2xl px-4 py-2 relative ${
                            message.is_deleted
                              ? "bg-gray-200 text-gray-500 italic"
                              : message.is_mine
                              ? "bg-green-600 text-white"
                              : "bg-white text-gray-900 shadow-sm"
                          } ${
                            message.is_mine ? "rounded-br-md" : "rounded-bl-md"
                          }`}
                        >
                          {/* Quick reply button on hover */}
                          {!message.is_deleted && (
                            <button
                              className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-black/10 ${
                                message.is_mine ? "-left-8" : "-right-8"
                              }`}
                              onClick={() => handleReply(message)}
                              title="Reply"
                            >
                              <svg
                                className="w-4 h-4 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                                />
                              </svg>
                            </button>
                          )}

                          {message.message_type === "image" &&
                            message.image_url &&
                            !message.is_deleted && (
                              <a
                                href={getImageUrl(message.image_url) || ""}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img
                                  src={getImageUrl(message.image_url) || ""}
                                  alt="Shared image"
                                  className="max-w-[250px] rounded-lg mb-1"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23999' stroke-width='1'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                                  }}
                                />
                              </a>
                            )}
                          {message.content && !message.is_deleted && (
                            <p className="whitespace-pre-wrap break-words">
                              {message.content}
                            </p>
                          )}
                          {message.is_deleted && (
                            <p className="flex items-center gap-1">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                                />
                              </svg>
                              This message was deleted
                            </p>
                          )}
                          <div
                            className={`flex items-center justify-end space-x-1 mt-1 ${
                              message.is_deleted
                                ? "text-gray-400"
                                : message.is_mine
                                ? "text-green-100"
                                : "text-gray-400"
                            }`}
                          >
                            {message.is_edited && !message.is_deleted && (
                              <span className="text-xs italic">edited</span>
                            )}
                            <span className="text-xs">
                              {formatTime(message.created_at)}
                            </span>
                            {message.is_mine && !message.is_deleted && (
                              <span
                                className={`text-xs flex items-center ${
                                  message.status === "read"
                                    ? "text-blue-300"
                                    : message.status === "delivered"
                                    ? "text-green-200"
                                    : "text-green-100"
                                }`}
                                title={
                                  message.status === "read"
                                    ? "Read"
                                    : message.status === "delivered"
                                    ? "Delivered"
                                    : "Sent"
                                }
                              >
                                {message.status === "read" ? (
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
                                  </svg>
                                ) : message.status === "delivered" ? (
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41z" />
                                  </svg>
                                ) : (
                                  <svg
                                    className="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                  </svg>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Read Receipt Indicator - shows when the last message from current user has been read */}
        {messages.length > 0 &&
          (() => {
            // Find the last message sent by current user
            const myMessages = messages.filter(
              (m) => m.is_mine && !m.is_deleted
            );
            const lastMyMessage = myMessages[myMessages.length - 1];

            // Only show if the last message in the conversation is from current user and is read
            const lastMessage = messages[messages.length - 1];
            if (
              lastMyMessage &&
              lastMessage?.is_mine &&
              lastMyMessage.status === "read" &&
              conversation?.participant
            ) {
              return (
                <div className="flex justify-end px-4 pb-2">
                  <span className="text-xs text-blue-500 flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" />
                    </svg>
                    Seen by {conversation.participant.name}
                  </span>
                </div>
              );
            }
            return null;
          })()}

        <div ref={messagesEndRef} />
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-50 min-w-[140px]"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 160),
            top: Math.min(contextMenu.y, window.innerHeight - 150),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={() => {
              const msg = messages.find((m) => m.id === contextMenu.messageId);
              if (msg) handleReply(msg);
            }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
              />
            </svg>
            Reply
          </button>
          {messages.find((m) => m.id === contextMenu.messageId)?.content && (
            <button
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              onClick={() => {
                const msg = messages.find(
                  (m) => m.id === contextMenu.messageId
                );
                handleCopyText(msg?.content || null);
              }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              Copy text
            </button>
          )}
          {contextMenu.isMine && (
            <button
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              onClick={() => setDeleteConfirm(contextMenu.messageId)}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Message?</h3>
            <p className="text-gray-600 mb-4">
              This message will be deleted for everyone. This action cannot be
              undone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                className="w-full sm:w-auto px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reply Preview */}
      {replyingTo && (
        <div className="px-4 py-2 bg-gray-100 border-t border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-1 h-10 bg-green-600 rounded-full flex-shrink-0"></div>
            <div className="min-w-0">
              <p className="text-xs text-green-600 font-medium">
                Replying to {replyingTo.sender_name}
              </p>
              <p className="text-sm text-gray-600 truncate">
                {replyingTo.message_type === "image"
                  ? "📷 Photo"
                  : replyingTo.content}
              </p>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 hover:bg-gray-200 rounded-full transition-colors"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Input */}
      {!isBlocked && (
        <form
          onSubmit={sendMessage}
          className="px-4 py-3 border-t border-gray-200 bg-white"
        >
          <div className="flex items-end space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="p-2 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded-full disabled:opacity-50 transition-colors"
              title="Send image"
            >
              {uploadingImage ? (
                <div className="w-6 h-6 animate-spin rounded-full border-2 border-gray-300 border-t-green-600"></div>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              )}
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage(e);
                  }
                }}
                placeholder="Type a message..."
                rows={1}
                className="w-full px-4 py-2 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                style={{ maxHeight: "120px" }}
              />
            </div>

            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? (
                <div className="w-6 h-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
