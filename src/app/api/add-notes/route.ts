import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"; 
export async function POST(req: NextRequest) {
  try {
    const { text, sessionId } = await req.json();

    if (!text || !sessionId) {
      return NextResponse.json({ error: "Missing text or sessionId" }, { status: 400 });
    }

    // Connect to Database
    const client = await clientPromise;
    const db = client.db("memory_db");
    const collection = db.collection("notes");

    // Generate Embedding
       const embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: "text-embedding-004", 
      apiKey: process.env.GOOGLE_API_KEY,
    });
    const vector = await embeddings.embedQuery(text);

    // Save to MongoDB
    await collection.insertOne({
      text,
      owner_id: sessionId,
      embedding: vector,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving note:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}