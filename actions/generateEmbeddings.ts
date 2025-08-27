"use server";

import { generateEmbeddingsInPineconeVectorstore } from "@/lib/langchain";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function generateEmbeddings(docId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  try {
  await generateEmbeddingsInPineconeVectorstore(docId);
} catch (err) {
  console.error("Embedding generation failed:", err);
  throw new Error("Failed to generate embeddings. Please try again.");
}
  revalidatePath("/dashboard");

  return {
    completed: true,
  };
}
