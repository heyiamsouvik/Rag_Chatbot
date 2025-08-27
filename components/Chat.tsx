"use client";

import { FormEvent, useEffect, useRef, useState, useTransition } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Loader2Icon } from "lucide-react";
import { useCollection } from "react-firebase-hooks/firestore";
import { useUser } from "@clerk/nextjs";
import { collection, orderBy, query } from "firebase/firestore";
import { db } from "@/firebase";
import askQuestion from "@/actions/askQuestion";
import ChatMessage from "./ChatMessage";

export type Message = {
  id?: string;
  role: "human" | "ai";
  message: string;
  createdAt: Date;
};

function Chat({ id }: { id: string }) {
  const { user } = useUser();
  const [input, setInput] = useState("");
  const [pendingMessage, setPendingMessage] = useState<Message | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomOfChatRef = useRef<HTMLDivElement>(null);

  // Firestore snapshot for messages
  const [snapshot, loading] = useCollection(
    user &&
      query(
        collection(db, "users", user?.id, "files", id, "chat"),
        orderBy("createdAt", "asc")
      )
  );

  // Scroll to bottom when messages update
  useEffect(() => {
    bottomOfChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [snapshot, pendingMessage]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;

    setInput("");

    // show placeholder while waiting
    setPendingMessage({
      role: "ai",
      message: "Thinking...",
      createdAt: new Date(),
    });

    startTransition(async () => {
      const { success, message } = await askQuestion(id, q);

      if (!success) {
        // replace placeholder with error
        setPendingMessage({
          role: "ai",
          message: `Whoops... ${message}`,
          createdAt: new Date(),
        });
      } else {
        // once Firestore updates with AI reply, clear pending
        setPendingMessage(null);
      }
    });
  };

  const messages =
    snapshot?.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        role: data.role,
        message: data.message,
        createdAt: data.createdAt?.toDate?.() ?? new Date(),
      } as Message;
    }) ?? [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center mt-20">
            <Loader2Icon className="animate-spin h-10 w-10 text-indigo-600" />
          </div>
        ) : (
          <>
            {messages.length === 0 && !pendingMessage && (
              <ChatMessage
                key="placeholder"
                message={{
                  role: "ai",
                  message: "Ask me anything about the document.",
                  createdAt: new Date(),
                }}
              />
            )}
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {pendingMessage && (
              <ChatMessage key="pending" message={pendingMessage} />
            )}
            <div ref={bottomOfChatRef} />
          </>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 p-4 border-t bg-white"
      >
        <Input
          type="text"
          placeholder="Ask a question..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={!input || isPending}>
          {isPending ? <Loader2Icon className="animate-spin h-5 w-5" /> : "Ask"}
        </Button>
      </form>
    </div>
  );
}

export default Chat;
