import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import PDFParser from "pdf2json";
import { auth } from "@clerk/nextjs/server";



// Function to parse PDF and extract text
function parsePDF(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {

    // Initialize PDFParser
    const parser = new PDFParser(null, true);  

    parser.on("pdfParser_dataError", (errData: any) => {
      console.error(errData.parserError);
      reject(errData.parserError);
    });

    parser.on("pdfParser_dataReady", (pdfData: any) => {
      
      
      // Extract raw text content
      const text = (parser as any).getRawTextContent();
      resolve(text);
    });

    parser.parseBuffer(buffer);
  });
}



// Function to chunk text into smaller pieces
function chunkText(text: string, chunkSize: number = 1000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize));
  }
  return chunks;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const clientSessionId = formData.get("sessionId") as string;

    // --- Security Check ---
    const { userId } = await auth();  // Verified user ID from Clerk
    let finalSessionId = clientSessionId;


    if (userId) {
      
      // If logged in, override the session id with Clerk user ID
      finalSessionId = userId;
    } else {
      
      // For guests, ensure sessionId starts with "guest-"
      if (!clientSessionId || !clientSessionId.startsWith("guest-")) {
         return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
      }
    }
    // --- Security Check End ---

    if (!file || !finalSessionId) {
      return NextResponse.json({ error: "Missing file or user ID" }, { status: 400 });
    }





    
    // Read file as Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    

    // Extract text from PDF
    console.log("📄 Parsing PDF...");
    const fullText = await parsePDF(buffer);
    console.log(`✅ Extracted ${fullText.length} characters.`);

    
    
    // Chunk text
    const chunks = chunkText(fullText);

    const client = await clientPromise;
    const db = client.db("memory_db");
    const collection = db.collection("notes");

    const embeddings = new GoogleGenerativeAIEmbeddings({
      modelName: "gemini-embedding-001",
      apiKey: process.env.GOOGLE_API_KEY,
    });

   
    

    // Process and store each chunk
    let savedCount = 0;
    
    for (const chunk of chunks) {
      if (chunk.trim().length < 20) continue; 

      const vector = await embeddings.embedQuery(chunk);

      await collection.insertOne({
        text: chunk,
        source: file.name,
        type: "document",
        owner_id: finalSessionId, 
        embedding: vector,
        createdAt: new Date(),
      });
      savedCount++;
    }


    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: `Processed ${savedCount} chunks from ${file.name}` 
    });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}