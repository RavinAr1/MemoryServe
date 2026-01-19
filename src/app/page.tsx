"use client"; 
import { useState } from "react";
import { generateSessionId } from "@/lib/utils";

export default function Home() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("");

  const handleSave = async () => {
    if (!input) return;
    setStatus("Saving...");
    
    try {
      // Generate a temporary ID for the session
      const sessionId = generateSessionId();

      // Call the API to save notes
      const response = await fetch("/api/add-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, sessionId }),
      });

      if (response.ok) {
        setStatus("Success! Check your MongoDB Atlas Dashboard.");
        setInput("");
      } else {
        setStatus("Error: API failed.");
      }
    } catch (err) {
      console.error(err);
      setStatus("Error: Connection failed.");
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      <h1 className="text-4xl font-bold mb-8">MemoryServe Debugger</h1>
      
      <div className="flex gap-2">
        <input
          className="border border-gray-300 p-2 rounded text-black w-96"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a fact (e.g., 'My favorite food is Pizza')"
        />
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded"
          onClick={handleSave}
        >
          Save Memory
        </button>
      </div>
      
      <p className="mt-4 text-yellow-400">{status}</p>
    </main>
  );
}