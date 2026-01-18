"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ChatList from "../components/ChatList";
import ChatWindow from "../components/ChatWindow";
import PageHeader from "../components/PageHeader";

function ChatPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial conversation or userId from URL
  const initialConversationId = searchParams.get("conversation");
  const targetUserId = searchParams.get("userId");

  const [selectedConversationId, setSelectedConversationId] = useState<
    number | null
  >(initialConversationId ? parseInt(initialConversationId) : null);
  const [isMobileView, setIsMobileView] = useState<boolean | null>(null);
  const [showConversation, setShowConversation] = useState(
    !!initialConversationId
  );
  const [startingChat, setStartingChat] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

  // Check authentication via cookie-based session
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/user/me`, {
          credentials: "include",
        });
        setIsAuthenticated(response.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [API_BASE]);

  // Redirect if not authenticated
  useEffect(() => {
    if (isAuthenticated === false) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  // Start a new conversation if userId is provided
  useEffect(() => {
    const startNewConversation = async () => {
      if (!targetUserId || !isAuthenticated || startingChat) return;

      setStartingChat(true);
      try {
        const response = await fetch(`${API_BASE}/api/chat/conversations`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sellerId: parseInt(targetUserId),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // Handle both old format (conversationId) and new format (conversation.id)
          const convoId = data.conversation?.id || data.conversationId;
          setSelectedConversationId(convoId);
          setShowConversation(true);

          // Update URL to use conversation ID instead of userId
          const url = new URL(window.location.href);
          url.searchParams.delete("userId");
          url.searchParams.set("conversation", convoId.toString());
          window.history.replaceState({}, "", url.toString());
        } else {
          const errData = await response.json();
          console.error(
            "Failed to start conversation:",
            errData.error || errData.message
          );
          // If it's a "can't chat with yourself" error, redirect back
          if (errData.error?.includes("yourself")) {
            alert("You cannot start a conversation with yourself");
            router.back();
          }
        }
      } catch (error) {
        console.error("Error starting conversation:", error);
      } finally {
        setStartingChat(false);
      }
    };

    startNewConversation();
  }, [targetUserId, isAuthenticated, API_BASE, startingChat, router]);

  // Handle responsive layout and mounted state
  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSelectConversation = (id: number) => {
    setSelectedConversationId(id);
    setShowConversation(true);

    // Update URL without navigation
    const url = new URL(window.location.href);
    url.searchParams.set("conversation", id.toString());
    window.history.replaceState({}, "", url.toString());
  };

  const handleBackToList = () => {
    setShowConversation(false);

    // Remove conversation param from URL
    const url = new URL(window.location.href);
    url.searchParams.delete("conversation");
    window.history.replaceState({}, "", url.toString());
  };

  if (
    !mounted ||
    isAuthenticated !== true ||
    startingChat ||
    isMobileView === null
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          {startingChat && (
            <p className="mt-4 text-gray-600">Starting conversation...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
      <PageHeader
        title="Messages"
        description="Stay connected with buyers and sellers."
        actions={
          <div className="flex items-center gap-3">
            {isMobileView && showConversation ? (
              <button
                onClick={handleBackToList}
                className="flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </button>
            ) : (
              <a
                href="/dashboard"
                className="flex items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
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
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Dashboard
              </a>
            )}
          </div>
        }
      />

      {/* Main Content */}
      <div className="mt-6 flex min-h-[calc(100vh-220px)] md:h-[calc(100vh-180px)]">
        {/* Desktop Layout */}
        {!isMobileView && (
          <>
            {/* Conversations List */}
            <div className="w-80 border-r border-gray-200 flex-shrink-0">
              <ChatList
                selectedConversationId={selectedConversationId}
                onSelectConversation={handleSelectConversation}
                className="h-full"
              />
            </div>

            {/* Chat Window */}
            <div className="flex-1">
              <ChatWindow
                conversationId={selectedConversationId}
                className="h-full"
              />
            </div>
          </>
        )}

        {/* Mobile Layout */}
        {isMobileView && (
          <>
            {!showConversation ? (
              <ChatList
                selectedConversationId={selectedConversationId}
                onSelectConversation={handleSelectConversation}
                className="w-full h-full"
              />
            ) : (
              <ChatWindow
                conversationId={selectedConversationId}
                onClose={handleBackToList}
                className="w-full h-full"
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
