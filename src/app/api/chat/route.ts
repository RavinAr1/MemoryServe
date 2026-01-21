import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export async function POST(req: NextRequest) {
  try {
    const { question, sessionId } = await req.json();

    if (!question || !sessionId) {
      return NextResponse.json({ error: "Missing question or sessionId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("memory_db");
    const collection = db.collection("notes");

    // Embed the Question
    const embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: "text-embedding-004",
      apiKey: process.env.GOOGLE_API_KEY,
    });
    const questionVector = await embeddings.embedQuery(question);

    // Vector Search in MongoDB
    const pipeline = [
      {
        $vectorSearch: {
          index: "vector_index", 
          path: "embedding",
          queryVector: questionVector,
          numCandidates: 100,
          limit: 3,
          filter: { owner_id: sessionId },
        },
      },
      {
        $project: { text: 1, score: { $meta: "vectorSearchScore" } },
      },
    ];

    const results = await collection.aggregate(pipeline).toArray();




    // Prepare Context
    const context = results.map((r) => r.text).join("\n");
    
    // Construct the Prompt
    const prompt = `
      You are a helpful AI assistant with a "Second Brain" memory.
      
      I will provide you with some "Context" from the user's database.
      
      INSTRUCTIONS:
      1. Check the "Context" below. If it contains the answer to the user's question, use it explicitly.
      2. If the "Context" is empty or irrelevant (e.g., the user says "Hi" or asks "What is 2+2?"), IGNORE the context and answer normally using your general knowledge.
      3. Do NOT mention "I checked the database" or "According to the context" unless you actually found a memory. Just chat naturally.

      Context from Database:
      ${context || "No relevant memories found."}
      
      User's Question:
      ${question}
    `;

    // Generate Answer using Gemini
    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-flash-lite-latest", // Gemini model
      apiKey: process.env.GOOGLE_API_KEY,
    });

    const response = await llm.invoke(prompt);
    
    return NextResponse.json({ 
      answer: response.content,
    });

  } catch (error) {
    console.error("Error generating answer:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}