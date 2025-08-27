"use server";

import { Message } from "@/components/Chat";
import { adminDb } from "@/firebaseAdmin";
import { generateLangchaincompletion } from "@/lib/langchain";
import { auth } from "@clerk/nextjs/server";


const FREE_LIMIT = 3;
const PRO_LIMIT = 100;

export async function askQuestion(id: string, question: string) {
  auth.protect();
  const { userId } = await auth();

  const chatRref = await adminDb
    .collection("users")
    .doc(userId!)
    .collection("files")
    .doc(id)
    .collection("chat");

  const chatSnapshot = await chatRref.get();
  const userMessages = chatSnapshot.docs.filter(
    (doc) => doc.data().role === "human"
  );

  const userMessage: Message = {
    role: "human",
    message: question,
    createdAt: new Date(),
  };
  await chatRref.add(userMessage);

  // generate AI response
  const reply = await generateLangchaincompletion(id, question);

  const aiMessage: Message = {
    role: "ai",
    message: reply,
    createdAt: new Date(),
  };
  await chatRref.add(aiMessage);
  return {
    success: true,
    message: null,
  };
}

export default askQuestion;
