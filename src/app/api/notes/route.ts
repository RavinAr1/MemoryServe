import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Retrieve notes for a specific session
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("memory_db");
    
    // Fetch notes for the session
    const notes = await db.collection("notes")
      .find({ owner_id: sessionId })
      .sort({ _id: -1 }) // Newest first
      .toArray();

    return NextResponse.json(notes);
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}



// Delete a note by ID or by source filename
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const noteId = searchParams.get("id");
  const source = searchParams.get("source");  // Delete by source filename
  const sessionId = searchParams.get("sessionId");

  if (!sessionId || (!noteId && !source)) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("memory_db");
    
    let result;

    if (noteId) {
       // Delete a single chunk
       result = await db.collection("notes").deleteOne({ 
        _id: new ObjectId(noteId),
        owner_id: sessionId
      });
    } else if (source) {
       

      // Delete a whole file's chunks
       result = await db.collection("notes").deleteMany({
         source: source,
         owner_id: sessionId
       });
    }

    return NextResponse.json({ success: true, deletedCount: result?.deletedCount });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}