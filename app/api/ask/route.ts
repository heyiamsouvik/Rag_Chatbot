// import { NextResponse } from "next/server";
// import { ChatOllama } from "@langchain/community/chat_models/ollama";

// export async function POST(req: Request) {
//   try {
//     const { question } = await req.json();

//     const llm = new ChatOllama({
//       model: "llama3:7b",  // or mistral:7b, phi3
//       baseUrl: "http://localhost:11434", // Ollama running locally
//     });

//     const response = await llm.invoke(question);

//     return NextResponse.json({ answer: response.content });
//   } catch (error: unknown) {
//     console.error("Ollama API error:", error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }
