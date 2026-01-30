import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { auth } from "@clerk/nextjs/server";



// Function to securely get sessionId
async function getSecureSessionId(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const clientSessionId = searchParams.get("sessionId");
  const { userId } = await auth();

  // Security check
  if (userId) return userId;  // Logged-in users from Clerk
  if (clientSessionId?.startsWith("guest-")) return clientSessionId;  // Allow guest sessions
  return null;  // Reject others
}




// Retrieve notes for a specific session
export async function GET(req: NextRequest) {
  
  // Securely get a valid sessionId
  const sessionId = await getSecureSessionId(req);

  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await clientPromise;
    const db = client.db("memory_db");
    
    // Fetch notes for the session
    const notes = await db.collection("notes")
      .find({ owner_id: sessionId })
      .sort({ _id: -1 })
      .toArray();

    // Return the notes
    return NextResponse.json(notes);
  } catch (error) {
    return NextResponse.json({ error: "Database error" }, { status: 500 }); 
  }
}



// Delete a note by ID or by source filename
export async function DELETE(req: NextRequest) {
  const sessionId = await getSecureSessionId(req);  // Securely get a valid sessionId

  if (!sessionId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }



  // Extract parameters
  const { searchParams } = new URL(req.url);
  const noteId = searchParams.get("id");
  const source = searchParams.get("source");
  const deleteManual = searchParams.get("deleteManual"); 
  const timeRange = searchParams.get("timeRange");       




  // Validate parameters
  if (!noteId && !source && !deleteManual) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  // Perform deletion
  try {
    const client = await clientPromise;
    const db = client.db("memory_db");
    
    let result;

    if (noteId) {
      
       // Delete by note ID
       result = await db.collection("notes").deleteOne({ 
        _id: new ObjectId(noteId),
        owner_id: sessionId 
      });

    } else if (source) {
       // Delete by file source
       result = await db.collection("notes").deleteMany({
         source: source,
         owner_id: sessionId 
       });


    } else if (deleteManual === "true") {
       // Delete Manual Entries with Time Filter
       const query: any = { owner_id: sessionId, source: { $exists: false } }; // Entries without source
       

       // Apply time range filter if provided
       if (timeRange && timeRange !== "all") {
         const now = new Date();
         const cutoff = new Date();
         
         if (timeRange === "1h") cutoff.setHours(now.getHours() - 1);
         if (timeRange === "24h") cutoff.setHours(now.getHours() - 24);
         if (timeRange === "7d") cutoff.setDate(now.getDate() - 7);

         query.createdAt = { $gte: cutoff };
       }

       result = await db.collection("notes").deleteMany(query);
    }

    return NextResponse.json({ success: true, deletedCount: result?.deletedCount });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}