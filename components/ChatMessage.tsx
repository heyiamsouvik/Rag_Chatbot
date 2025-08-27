"use client";

import { useUser } from "@clerk/nextjs";
import { Message } from "./Chat";
import Image from "next/image";
import { BotIcon, Loader2Icon } from "lucide-react";
import Markdown from "react-markdown";

function ChatMessage({ message }: { message: Message }) {
  const isHuman = message.role === "human";
  const { user } = useUser();

  return (
    <div
      className={`flex items-start gap-3 mb-4 ${
        isHuman ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        {isHuman && user?.imageUrl ? (
          <Image
            src={user.imageUrl}
            alt="User Avatar"
            width={40}
            height={40}
            className="rounded-full"
            unoptimized
          />
        ) : (
          <div className="h-10 w-10 bg-indigo-600 flex items-center justify-center rounded-full">
            <BotIcon className="text-white h-6 w-6" />
          </div>
        )}
      </div>

      {/* Message Bubble */}
      <div
        className={`p-3 rounded-lg max-w-[80%] text-sm whitespace-pre-wrap ${
          isHuman ? "bg-indigo-600 text-white" : "bg-blue-950 text-white"
        }`}
      >
        {message.message.startsWith("Thinking") ? (
          <span className="flex items-center gap-2">
            <Loader2Icon
              className={`animate-spin h-5 w-5 ${
                isHuman ? "text-white" : "text-indigo-600"
              }`}
            />
            Thinking...
          </span>
        ) : (
          <div className="prose prose-sm max-w-none">
            <Markdown>{message.message}</Markdown>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatMessage;
