"use client";

import { useState, useEffect, useRef } from "react";
import { generateSessionId } from "@/lib/utils";
import { 
  Send, 
  Brain, 
  Sparkles, 
  User, 
  Bot, 
  Zap,
  Loader2,
  History,
  Clock,
} from "lucide-react"; 




type Message = {
  role: "user" | "ai" | "system";
  content: string;
};




export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<"teach" | "ask">("ask");
  const [sessionId, setSessionId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Cooldown State
  const [cooldown, setCooldown] = useState(0); 

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Session
  useEffect(() => {
    const storedId = localStorage.getItem("sessionId");
    if (storedId) {
      setSessionId(storedId);
    } else {
      const newId = generateSessionId();
      localStorage.setItem("sessionId", newId);
      setSessionId(newId);
    }
    setMessages([{ role: "ai", content: "Hello! I am your Second Brain. You can teach me facts or ask me questions about your memories." }]);
  }, []);




  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);





  // Cooldown Timer Effect
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);



  // Handle Send Message
  const handleSend = async () => {
    if (!input.trim() || !sessionId || cooldown > 0) return; // Block if cooling down


  
    const userText = input;
    setInput("");
    setIsLoading(true);
    setCooldown(4); // Start 4-second cooldown



    // Add user message to chat
    setMessages((prev) => [...prev, { role: "user", content: userText }]);

    try {
      if (mode === "teach") {
        const res = await fetch("/api/add-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: userText, sessionId }),
        });
        
        if (res.ok) {
          setMessages((prev) => [...prev, { role: "system", content: "Memory saved successfully!" }]);
        } else {
          setMessages((prev) => [...prev, { role: "system", content: "Failed to save memory." }]);
        }

      } else {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: userText, sessionId }),
        });



        
        // Handle model rate limiting
        if (res.status === 429) {
             setMessages((prev) => [...prev, { role: "system", content: "🛑 Too fast! Please wait a moment before asking again." }]);
        } else {
            const data = await res.json();
            setMessages((prev) => [...prev, { role: "ai", content: data.answer }]);
        }
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => [...prev, { role: "system", content: "Connection error." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!sessionId) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;

  const isCyanMode = mode === "ask";



  return (
    <main className="flex flex-col min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 
    to-black text-white font-sans overflow-hidden transition-colors duration-700">


      
      {/* Background Styling */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse 
        transition-colors duration-1000 ${
          isCyanMode ? 'bg-cyan-500' : 'bg-emerald-500'
        }`}></div>
        <div className={`absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-20 blur-3xl animate-pulse 
        transition-colors duration-1000 ${
          isCyanMode ? 'bg-blue-500' : 'bg-teal-500'
        }`}></div>
      </div>




      {/* HEADER */}
      <header className="fixed top-0 w-full bg-slate-950/40 backdrop-blur-2xl border-b border-slate-800/50 shadow-2xl z-20">
        <div className="px-6 py-4 max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-gradient-to-br border backdrop-blur-xl transition-all duration-500 ${
              isCyanMode 
                ? 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30' 
                : 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30'
            }`}>
              <Brain className={`w-5 h-5 transition-colors duration-500 ${isCyanMode ? 'text-cyan-400' : 'text-emerald-400'}`} />
            </div>
            <div>
              <h1 className={`text-xl font-black tracking-tight bg-gradient-to-r text-transparent bg-clip-text 
              transition-all duration-500 ${
                isCyanMode 
                  ? 'from-cyan-400 via-blue-400 to-purple-400' 
                  : 'from-emerald-400 via-teal-400 to-cyan-400'
              }`}>
                MemoryServe
              </h1>
              <p className="text-xs text-slate-500 font-medium">Your Second Brain</p>
            </div>
          </div>



          
          <div className="bg-slate-900/60 p-1.5 rounded-xl flex gap-1 border border-slate-700/50 backdrop-blur-xl">
            <button
              onClick={() => setMode("teach")}
              className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 font-semibold text-sm ${
                !isCyanMode 
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/50" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >

              <Brain className="w-4 h-4" /> Teach
            </button>
            <button
              onClick={() => setMode("ask")}
              className={`px-4 py-2 rounded-lg transition-all duration-300 flex items-center gap-2 font-semibold text-sm ${
                isCyanMode 
                  ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50" 
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-4 h-4" /> Ask
            </button>
          </div>
        </div>
      </header>





      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto pt-28 pb-40 px-6 max-w-4xl mx-auto w-full space-y-5 relative z-10 scroll-smooth">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in 
          fade-in slide-in-from-bottom-2 duration-500`}>
            {msg.role !== "user" && (
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 flex-col border 
                backdrop-blur-xl shadow-lg transition-colors duration-300 ${
                msg.role === "system" 
                  ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" 
                  : isCyanMode
                  ? "bg-cyan-500/20 border-cyan-500/30 text-cyan-400"
                  : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"
              }`}>
                {msg.role === "system" ? <Zap size={18} /> : <Bot size={18} />}
              </div>
            )}
            <div className={`px-5 py-4 rounded-2xl max-w-lg text-sm leading-relaxed font-medium backdrop-blur-xl 
            border transition-all duration-300 ${
              msg.role === "user" 
                ? `bg-gradient-to-r ${isCyanMode ? 'from-cyan-600/40 to-blue-600/40 border-cyan-500/50 text-cyan-50' : 
                  'from-emerald-600/40 to-teal-600/40 border-emerald-500/50 text-emerald-50'} rounded-br-sm shadow-lg` 


                : msg.role === "system"


                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-200 rounded-bl-sm"
                : `bg-slate-800/60 border-slate-700/50 text-slate-100 rounded-bl-sm`
            }`}>
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br text-white flex items-center justify-center 
                shrink-0 border backdrop-blur-xl transition-all duration-300 ${
                 isCyanMode 
                 ? "from-cyan-600/40 to-blue-600/40 border-cyan-500/30 text-cyan-200"
                 : "from-emerald-600/40 to-teal-600/40 border-emerald-500/30 text-emerald-200"
              }`}>
                <User size={18} />
              </div>
            )}
          </div>
        ))}
        


        
        {isLoading && (
          <div className="flex gap-4 justify-start animate-in fade-in duration-300">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-col border 
              backdrop-blur-xl ${isCyanMode ? 'bg-cyan-500/20 border-cyan-500/30' : 'bg-emerald-500/20 border-emerald-500/30'}`}>
                
              <Loader2 size={18} className={`animate-spin ${isCyanMode ? 'text-cyan-400' : 'text-emerald-400'}`} />
            </div>
            <div className="px-5 py-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 
            text-slate-300 text-sm rounded-bl-sm backdrop-blur-xl">
              <div className="flex items-center gap-2">
                Thinking...
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>



      {/* Input Area */}
      <div className="fixed bottom-0 w-full bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent 
      pt-8 pb-8 px-6 z-20 backdrop-blur-sm border-t border-slate-800/20">
        <div className="max-w-4xl mx-auto">
          <div className="relative group">
            {/* Glow */}
            <div className={`absolute inset-0 rounded-2xl opacity-0 group-focus-within:opacity-100 
            transition-opacity duration-500 ${
              isCyanMode 
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 blur-xl' 
                : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 blur-xl'
            }`}></div>
            
            <div className="relative flex items-center bg-slate-900/80 border border-slate-700/50 rounded-2xl 
            backdrop-blur-xl hover:border-slate-600/50 transition-all duration-300 shadow-xl">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={!isCyanMode ? "Teach me something..." : "Ask me anything..."}
                className="flex-1 bg-transparent text-white text-sm px-6 py-4 focus:outline-none placeholder-slate-500"
                autoComplete="off"
                disabled={cooldown > 0} // Disable input during cooldown
              />



              
              {/* Send Button */}
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim() || cooldown > 0}
                className={`mr-2 w-10 h-10 rounded-xl transition-all duration-300 font-semibold flex items-center justify-center ${
                  cooldown > 0 
                    ? "bg-slate-700 text-slate-400 cursor-not-allowed" // Gray for cooling down period
                    : isCyanMode
                    ? "bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:shadow-lg hover:shadow-cyan-500/50"
                    : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/50"
                }`}
              >
                {cooldown > 0 ? (
                  <span className="text-xs font-bold">{cooldown}</span>
                ) : (
                  <Send size={18} />
                )}
              </button>
            </div>
          </div>

          

          <div className="flex items-center justify-between mt-4 px-2">
             <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-wider font-medium">
              <div className={`w-1.5 h-1.5 rounded-full ${isCyanMode ? 'bg-cyan-500' : 'bg-emerald-500'} animate-pulse`}></div>
              <span>{isCyanMode ? "AI Read Mode" : "Database Write Mode"}</span>
             </div>
             
             <div className="flex items-center gap-1 text-[10px] text-slate-600">
               <History size={10} />
               <span>ID: {sessionId.slice(0,6)}</span>
             </div>
          </div>
        </div>
      </div>
    </main>
  );
}