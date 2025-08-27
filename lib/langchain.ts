import { ChatOpenAI } from "@langchain/openai";
// i did the change here
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { ChatGroq } from "@langchain/groq";



import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
//i have changed here....... from openai to ollama
import { OpenAIEmbeddings } from "@langchain/openai";
import { OllamaEmbeddings } from "@langchain/community/embeddings/ollama";

import { createStuffDocumentsChain } from "langchain/chains/combine_documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createRetrievalChain } from "langchain/chains/retrieval";
import { createHistoryAwareRetriever } from "langchain/chains/history_aware_retriever";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import pineconeClient from "./pinecone";

import { PineconeStore } from "@langchain/pinecone";
import { PineconeConflictError } from "@pinecone-database/pinecone/dist/errors";
import { Index, RecordMetadata } from "@pinecone-database/pinecone";
import { adminDb } from "../firebaseAdmin";
import { auth } from "@clerk/nextjs/server";
import { doc } from "firebase/firestore";
import { Console } from "console";

// -------------------- Step 1: Define LLM --------------------

// const model = new ChatOpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
//   modelName: "gpt-4o",
// });

// const model = new ChatOllama({
//   baseUrl: "http://localhost:11434", // local Ollama server
//   model: "mistral:7b",
//   temperature: 0.1,
// });

const model = new ChatGroq({
  apiKey: process.env.GROQCLOUD_API_KEY!,
  model: "llama-3.1-8b-instant", // or llama3-70b, etc.
  temperature: 0.1,
});

// -------------------- Step 2: Namespace --------------------

// export const indexName = "souvik";
export const indexName = "ollama";

async function fetchMessagesFormDB(docId: string) {
  //const LIMIT = 6;

  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not found!");
  }
  console.log("---- fetching the chat history from firestore database -----");
  const chats = await adminDb
    .collection("users")
    .doc(userId)
    .collection("files")
    .doc(docId)
    .collection("chat")
    .orderBy("createdAt", "desc")
    //.limit(LIMIT)
    .get();

  const chatHistory = chats.docs.map((doc) =>
    doc.data().role === "human"
      ? new HumanMessage(doc.data().message)
      : new AIMessage(doc.data().message)
  );
  console.log(
    `--- featched last ${chatHistory.length} meesage successfully ----`
  );
  console.log(chatHistory.map((msg) => msg.content.toString()));

  return chatHistory;
}

// -------------------- Step 3: Generate Documents --------------------
export async function generateDocs(docId: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not found!");
  }
  console.log("--- featching the download url from firebase -----");
  const firebaseRef = await adminDb
    .collection("users")
    .doc(userId)
    .collection("files")
    .doc(docId)
    .get();

  const downloadUrl = firebaseRef.data()?.cloudinaryUrl;
  if (!downloadUrl) {
    throw new Error("Download URL  not found!");
  }
  console.log(`Download Url: ${downloadUrl}`);

  // PDF TO PDF OBJECT
  const response = await fetch(downloadUrl);
  const data = await response.blob();

  // LOAD THE PDF DOCUMENT FOM THE SPECIFIC PATH
  console.log(`----------loading pdf doc-------`);
  const loader = new PDFLoader(data);
  const docs = await loader.load();

  //split the docs into smaller parts for

  console.log(`----------splitting pdf doc-------`);
  const splitter = new RecursiveCharacterTextSplitter();
  const splitDocs = await splitter.splitDocuments(docs);
  console.log(`==split into ${splitDocs.length} parts ---`);

  return splitDocs;
}

// -------------------- Step 4: Pinecone Helpers --------------------
async function namespaceExists(
  index: Index<RecordMetadata>,
  namespace: string
) {
  if (namespace === null) {
    throw new Error("No namespace value provided.");
  }
  const { namespaces } = await index.describeIndexStats();
  return namespaces?.[namespace] != undefined;
}

// -------------------- Generate Embeddings + Store --------------------
export async function generateEmbeddingsInPineconeVectorstore(docId: string) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("User not found!");
  }
  let pineconeVectorStore;

  console.log("---generating embeddings from the split documents -------");

  // const embeddings = new OpenAIEmbeddings();
  //here is the change below:
  const embeddings = new OllamaEmbeddings({
    model: "nomic-embed-text",
    baseUrl: "http://localhost:11434",
  });

  const index = await pineconeClient.index(indexName);
  const namespaceAlreadyExists = await namespaceExists(index, docId);

  if (namespaceAlreadyExists) {
    console.log(
      `---- namespace ${docId} already exists , returning existing emebeddings -----`
    );
    pineconeVectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      namespace: docId,
    });
    return pineconeVectorStore;
  } else {
    //download pdf and generate embeddings

    const splitDocs = await generateDocs(docId);

    console.log(
      `----storing the embeddinggs in nmaespace ${docId} in the ${indexName} pinecone Vector store--------`
    );

    pineconeVectorStore = await PineconeStore.fromDocuments(
      splitDocs,
      embeddings,
      {
        pineconeIndex: index,
        namespace: docId,
      }
    );

    return pineconeVectorStore;
  }
}


// -------------------- Step 5: LangChain Completion --------------------
const generateLangchaincompletion = async (docId: string, question: string) => {
  

  const pineconeVectorStore = await generateEmbeddingsInPineconeVectorstore(docId);
  //create a retriver  to search throug the vector store
  if (!pineconeVectorStore) {
    throw new Error("Pinecone vector store not found");
  }

  console.log("----- creating a retriver --------");
  const retriever = pineconeVectorStore.asRetriever();

  //featching the chat history from DB;
  const chatHistory = await fetchMessagesFormDB(docId);

  //Prompt template
  console.log("----- defining a prompt temnplate  --------");
  const historyAwarePrompt = ChatPromptTemplate.fromMessages([
    ...chatHistory,
    ["user", "{input}"],
    [
      "user",
      "given the abouve convesation generate a search query to look up in order to get information relevant to the conversation",
    ],
  ]);

  // Create a history-aware retriever chain that uses the model, retriever, and prompt

  console.log("- Creating a history-aware retriever chain... -");

  const historyAwareRetrieverChain = await createHistoryAwareRetriever({
    llm: model,
    retriever,
    rephrasePrompt: historyAwarePrompt,
  });

  console.log("- Defining a prompt template for answering questions...");

  const historyAwareRetrievalPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "Answer the user's questions based on the below context:\n\n{context}",
    ],
    ...chatHistory,
    ["user", "{input}"],
  ]);

  console.log("Creating a document combining chain...");
  const historyAwareCombineDocsChain = await createStuffDocumentsChain({
    llm: model,
    prompt: historyAwareRetrievalPrompt,
  });

  // Create the main retrieval chain that combines the history-aware retriever and document combining chains
  console.log(" --- Creating the main retrieval chain ... -- ");
  const conversationalRetrievalChain = await createRetrievalChain({
    retriever: historyAwareRetrieverChain,
    combineDocsChain: historyAwareCombineDocsChain,
  });

  console.log(" --- Running the chain with a sample conversation ... --- ");

  const reply = await conversationalRetrievalChain.invoke({
    chat_history: chatHistory,
    input: question,
  });

  console.log(reply.answer);
  return reply.answer;
};

export { model, generateLangchaincompletion };
