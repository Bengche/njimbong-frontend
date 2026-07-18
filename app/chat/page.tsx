"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ChatList from "../components/ChatList";
import ChatWindow from "../components/ChatWindow";

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
    !!initialConversationId,
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
            errData.error || errData.message,
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

  // Lock body scroll while on chat page
  useEffect(() => {
    document.body.classList.add("chat-page-active");
    return () => document.body.classList.remove("chat-page-active");
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
      <div className="fixed inset-x-0 top-16 bottom-16 md:bottom-0 z-10 bg-white flex items-center justify-center">
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
    // fixed between navbar (top-16) and mobile bottom nav (bottom-16) / desktop edge (bottom-0)
    // this guarantees height regardless of AppShell min-h-screen wrappers
    <main className="fixed inset-x-0 top-16 bottom-16 md:bottom-0 z-10 flex overflow-hidden bg-white">
      {/* Desktop: conversations list + chat window side by side */}
      {!isMobileView && (
        <>
          <div className="w-80 flex-shrink-0 border-r border-gray-200 overflow-hidden h-full">
            <ChatList
              selectedConversationId={selectedConversationId}
              onSelectConversation={handleSelectConversation}
              className="h-full"
            />
          </div>
          <div className="flex-1 overflow-hidden h-full">
            <ChatWindow
              conversationId={selectedConversationId}
              className="h-full"
            />
          </div>
        </>
      )}

      {/* Mobile: list or window, full screen */}
      {isMobileView && (
        !showConversation ? (
          <ChatList
            selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
            className="h-full w-full"
          />
        ) : (
          <ChatWindow
            conversationId={selectedConversationId}
            onClose={handleBackToList}
            className="h-full w-full"
          />
        )
      )}
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
