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
  Lock, 
  Ghost,
  Database,
  ChevronUp,
  Square,
  Trash2
} from "lucide-react"; 
import { useUser, SignInButton, UserButton } from "@clerk/nextjs"; 
import Link from "next/link"


import ReactMarkdown from "react-markdown"; 
import remarkGfm from "remark-gfm"; 

type Message = {
  role: "user" | "ai" | "system";
  content: string;
};

export default function Home() {
  const { user, isLoaded } = useUser(); 
  const [isGuest, setIsGuest] = useState(false);
  const [guestId, setGuestId] = useState(""); 

  
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [mode, setMode] = useState<"teach" | "ask">("ask");
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0); 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null); 


  const [selectedModel, setSelectedModel] = useState("gemini-flash-lite-latest"); //Latest Gemini flash lite as the Default model

  // ChatHistory Loading State
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  
// Load history from LocalStorage when app starts
  useEffect(() => {
    const saved = localStorage.getItem("chatHistory");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (e) {
        console.error("Failed to parse chat history", e);
      }
    }
    // Mark history as loaded to allow other effects to run
    setIsHistoryLoaded(true);
  }, []);





  // Save history to LocalStorage whenever messages change
  useEffect(() => {
    
    if (isHistoryLoaded && messages.length > 0) {
      localStorage.setItem("chatHistory", JSON.stringify(messages));
    }
  }, [messages, isHistoryLoaded]);




  // Clear Chat History
  const handleClearChat = () => {
    if (confirm("Clear this conversation history? (Your Memory Vault data will stay safe)")) {
      setMessages([]); 
      localStorage.removeItem("chatHistory"); 
      
      const name = user ? (user.firstName || user.username || 'there') : 'Guest';
      setMessages([{ role: "ai", content: `Hello ${name}! Teach me something new or ask me anything.` }]);
    }
  };




  // Auto resize textarea
  useEffect(() => {
    if (textareaRef.current) {
    
      // Set height to content height
      textareaRef.current.style.height = "auto";
      // Set height to scroll height
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);






  // Dropdown state for model selection
  const [showModelMenu, setShowModelMenu] = useState(false);

  // Model options for the dropdown
  const modelOptions = [
    { id: "gemini-flash-lite-latest", label: "⚡ Flash Lite (Auto)", desc: "Fastest & Efficient Updated to the latest Flash Lite model" },
    { id: "gemini-2.5-flash", label: "⚡ Flash 2.5", desc: "Balanced Performance" },
    { id: "gemini-2.5-pro", label: "🧠 Pro 2.5", desc: "Complex Reasoning" },
    { id: "gemini-3-flash-preview", label: "🚀 Flash 3.0", desc: "Preview / Cutting Edge" },
  ];

  // Get the label of the currently selected model
  const currentModelLabel = modelOptions.find(m => m.id === selectedModel)?.label || "Select Model";



  // Generate Guest ID
  useEffect(() => {
    
    let id = localStorage.getItem("guestSessionId");  
    if (!id) {
      id = generateSessionId();
      localStorage.setItem("guestSessionId", id || "guest-user"); 
    }
    setGuestId(id || "guest-user");
  }, []);

  

  // Determine Active Session ID
  const activeSessionId = user ? user.id : guestId;
  const showChat = !!user || isGuest;   // Show chat if logged in or guest mode



  // Initial Greeting
  useEffect(() => {
    if (showChat && isHistoryLoaded && messages.length === 0) {
      const name = user ? (user.firstName || user.username || 'there') : 'Guest';
      setMessages([{ role: "ai", content: `Hello ${name}! Teach me something new or ask me anything.` }]);
    }
  }, [showChat, user, messages.length, isHistoryLoaded]);

  

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  


  // Cooldown Timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);



// --- Stop Message Generation ---
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort(); // Cancel the fetch request
      abortControllerRef.current = null;  
    }
    setIsLoading(false); // Stop the spinner
    setCooldown(0);     
  };










// Handle Send Message
  const handleSend = async () => {
    if (!input.trim() || !activeSessionId || cooldown > 0) return;

    const userText = input;
    setInput("");
    setIsLoading(true);
    setCooldown(4); 

  
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setMessages((prev) => [...prev, { role: "user", content: userText }]);

    try {
      const endpoint = mode === "teach" ? "/api/add-notes" : "/api/chat";
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          [mode === "teach" ? "text" : "question"]: userText, 
          sessionId: activeSessionId,
          model: selectedModel
        }),
        signal: controller.signal, 
      });




      if (mode === "teach") {
        if (res.ok) {
          setMessages((prev) => [...prev, { role: "system", content: "Memory saved successfully!" }]);
        } else {
          setMessages((prev) => [...prev, { role: "system", content: "Failed to save memory." }]);
        }
      } else {
        if (res.status === 429) {
             setMessages((prev) => [...prev, { role: "system", content: "🛑 Too fast! API limit reached. Try again later." }]);
        } else {
            const data = await res.json();
            setMessages((prev) => [...prev, { role: "ai", content: data.answer }]);
        }
      }
    } catch (error: any) {
      // Handle Abort Error
      if (error.name === "AbortError") {

        console.log("Generation stopped by user");
        
        setMessages((prev) => [...prev, { role: "system", content: "Stopped by user." }]);
        
      } else {
        console.error(error);
        setMessages((prev) => [...prev, { role: "system", content: "Connection error." }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };


  
  // Loading while Clerk authentication is in progress
  if (!isLoaded) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;

  const isCyanMode = mode === "ask";

  

  
  // --- LANDING PAGE ---
  if (!showChat) {
    return (
      <main className="flex flex-col min-h-screen bg-black text-white font-sans items-center justify-center p-6 
      text-center relative overflow-hidden">


         {/* Background Glow */}
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125
         bg-cyan-500/20 rounded-full blur-[120px] pointer-events-none" />

         
         
         <div className="z-10 flex flex-col items-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            <div className="w-24 h-24 bg-slate-900 border border-slate-700 rounded-3xl 
            flex items-center justify-center shadow-2xl">
              
              <Lock className="w-10 h-10 text-cyan-400" />
            </div>
            
            
            <div className="space-y-2">
              <h1 className="text-5xl font-black tracking-tight bg-linear-to-r from-cyan-400 via-blue-500 
              to-purple-500 text-transparent bg-clip-text">
                MemoryServe
              </h1>
              <p className="text-slate-400 text-lg">Your AI Second Brain.</p>
            </div>



            
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
              {/* Login Button */}
              <SignInButton mode="modal">
                <button className="flex-1 bg-white text-black py-3 px-6 rounded-xl font-bold hover:bg-gray-200 
                transition-all flex items-center justify-center gap-2">
                   <User size={18} /> Sign In
                </button>
              </SignInButton>



              {/* Guest Button */}
              <button 
                onClick={() => setIsGuest(true)}
                className="flex-1 bg-slate-800 text-white py-3 px-6 rounded-xl font-bold hover:bg-slate-700 
                border border-slate-700 transition-all flex items-center justify-center gap-2"
              >
                 <Ghost size={18} /> Guest Mode
              </button>
            </div>
            
            



         </div>
      </main>
    );
  }





  // --- CHAT APP ---
  return (
    <main className="flex flex-col min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-black text-white 
    font-sans overflow-hidden transition-colors duration-700">
      


      {/* --- BACKGROUND --- */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className={`absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-20 blur-3xl animate-pulse 
          transition-colors duration-1000 ${isCyanMode ? 'bg-cyan-500' : 'bg-emerald-500'}`}></div>

        <div className={`absolute -bottom-20 -left-20 w-80 h-80 rounded-full opacity-20 blur-3xl animate-pulse 
          transition-colors duration-1000 ${isCyanMode ? 'bg-blue-500' : 'bg-teal-500'}`}></div>
      </div>

      {/* --- HEADER --- */}
      <header className="fixed top-0 w-full bg-slate-950/40 backdrop-blur-2xl border-b border-slate-800/50 shadow-2xl z-20">
        <div className="px-6 py-4 max-w-5xl mx-auto flex justify-between items-center">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-linear-to-br border backdrop-blur-xl transition-all duration-500 
              ${isCyanMode ? 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30' : 
              'from-emerald-500/20 to-teal-500/20 border-emerald-500/30'}`}>


              <Brain className={`w-5 h-5 transition-colors duration-500 ${isCyanMode ? 'text-cyan-400' : 'text-emerald-400'}`} />

            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white">MemoryServe</h1>
            </div>
          </div>




          {/* User Profile / Guest Badge */}
          <div className="flex items-center gap-4">
             {/* Mode Toggle */}
             <div className="bg-slate-900/60 p-1.5 rounded-xl flex gap-1 border border-slate-700/50 backdrop-blur-xl mr-2">
                <button onClick={() => setMode("teach")} className={`px-4 py-2 rounded-lg 
                  transition-all duration-300 flex items-center gap-2 font-semibold text-sm ${!isCyanMode 
                  ? "bg-linear-to-r from-emerald-500 to-teal-500 text-white shadow-lg" : 
                  "text-slate-400 hover:text-slate-200"}`}>


                  <Brain className="w-4 h-4" /> Teach
                </button>
                <button onClick={() => setMode("ask")} className={`px-4 py-2 rounded-lg 
                  transition-all duration-300 flex items-center gap-2 font-semibold text-sm ${isCyanMode ? 
                  "bg-linear-to-r from-cyan-500 to-blue-500 text-white shadow-lg" : "text-slate-400 hover:text-slate-200"}`}>

                  <Sparkles className="w-4 h-4" /> Ask
                </button>
              </div>

          {/* --- CLEAR CHAT --- */}
              <button 
                onClick={handleClearChat}
                className="p-2.5 mr-2 rounded-xl bg-slate-900/60 border border-slate-700/50 
                text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all backdrop-blur-xl"
                title="Clear Conversation"
              >
                <Trash2 size={18} />
              </button>




          {/*  Vault / Dashboard Button */}
             <Link 
               href="/dashboard"
               className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
               title="Open Memory Vault"
             >
               <Database size={20} />
             </Link>


             {user ? (
               <UserButton afterSignOutUrl="/" />
             ) : (
               <div className="flex items-center gap-3">
                 <SignInButton mode="modal">
                   <button className="text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors">
                     Sign In
                   </button>
                 </SignInButton>
                 <div className="flex items-center gap-2 bg-slate-800/50 px-3 py-1.5 rounded-lg 
                 border border-slate-700/50 text-xs font-mono text-slate-400">
                   <Ghost size={14} /> Guest
                 </div>
               </div>
             )}
          </div>

        </div>
      </header>





      {/* --- CHAT AREA --- */}
      <div className="flex-1 overflow-y-auto pt-28 pb-40 px-6 max-w-4xl mx-auto w-full space-y-5 relative z-10 scroll-smooth">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"} 
            animate-in fade-in slide-in-from-bottom-2 duration-500`}>

              
              {msg.role !== "user" && (
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 flex-col 
                border backdrop-blur-xl shadow-lg ${msg.role === "system" ? 
                "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" : isCyanMode ? 
                "bg-cyan-500/20 border-cyan-500/30 text-cyan-400" : "bg-emerald-500/20 border-emerald-500/30 text-emerald-400"}`}>


                  {msg.role === "system" ? <Zap size={18} /> : <Bot size={18} />}
                </div>
              )}





              <div className={`px-5 py-4 rounded-2xl max-w-lg text-sm leading-relaxed font-medium 
              backdrop-blur-xl border transition-all duration-300 ${
                msg.role === "user" 
                  ? `bg-linear-to-r ${isCyanMode ? 
                    'from-cyan-600/40 to-blue-600/40 border-cyan-500/50 text-cyan-50' : 
                    'from-emerald-600/40 to-teal-600/40 border-emerald-500/50 text-emerald-50'} rounded-br-sm shadow-lg` 
                  : `bg-slate-800/60 border-slate-700/50 text-slate-100 rounded-bl-sm`
              }`}>



                {/* MARKDOWN RENDERER START */}
                <div className={`prose prose-sm max-w-none ${msg.role === "user" ? "prose-invert text-slate-50" : 
                  "prose-invert text-slate-200"}`}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" 
                      className="text-cyan-400 hover:underline font-bold" />,
                      ul: ({node, ...props}) => <ul {...props} className="list-disc pl-4 space-y-1" />,
                      ol: ({node, ...props}) => <ol {...props} className="list-decimal pl-4 space-y-1" />,
                      h1: ({node, ...props}) => <h1 {...props} className="text-lg font-bold mt-2 mb-1" />,
                      h2: ({node, ...props}) => <h2 {...props} className="text-base font-bold mt-2 mb-1" />,
                      h3: ({node, ...props}) => <h3 {...props} className="text-sm font-bold mt-2 mb-1" />,
                      strong: ({node, ...props}) => <strong {...props} className="font-extrabold text-white" />,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
                {/* MARKDOWN RENDERER END */}
              </div>

              
              {msg.role === "user" && (
                <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center 
                overflow-hidden border border-slate-500/50">
                  {user ? <UserButton /> : <User size={18} />}
                </div>
              )}
            </div>
          ))}
          
          
          {isLoading && (
            <div className="flex gap-4 justify-start animate-in fade-in duration-300">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-col border backdrop-blur-xl 
                ${isCyanMode ? 'bg-cyan-500/20 border-cyan-500/30' : 'bg-emerald-500/20 border-emerald-500/30'}`}>


                  <Loader2 size={18} className={`animate-spin ${isCyanMode ? 'text-cyan-400' : 'text-emerald-400'}`} />
               </div>

               <div className="px-5 py-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 
               text-slate-300 text-sm rounded-bl-sm backdrop-blur-xl">Thinking...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>




        {/* INPUT AREA */}
        <div className="fixed bottom-0 w-full bg-linear-to-t from-slate-950/90 via-slate-950/60 to-transparent 
        pt-8 pb-8 px-6 z-20 backdrop-blur-sm border-t border-slate-800/20">
          <div className="max-w-4xl mx-auto">
            <div className="relative group">

              <div className={`absolute inset-0 rounded-2xl opacity-0 group-focus-within:opacity-100 
                transition-opacity duration-500 ${isCyanMode ? 
                'bg-linear-to-r from-cyan-500/20 to-blue-500/20 blur-xl' : 
                'bg-linear-to-r from-emerald-500/20 to-teal-500/20 blur-xl'}`}></div>


              {/* Input Container */}
              <div className="relative flex items-end bg-slate-900/80 border border-slate-700/50 
              rounded-2xl backdrop-blur-xl hover:border-slate-600/50 transition-all duration-300 shadow-xl">

                  
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault(); // Send when enter
                      handleSend();       
                    }
                  }}

                  placeholder={!isCyanMode ? "Teach me something..." : "Ask me anything..."}
                  className="flex-1 bg-transparent text-white text-sm px-6 py-4 
                  focus:outline-none placeholder-slate-500 resize-none max-h-48 overflow-y-auto min-h-14"
                  rows={1}
                  disabled={cooldown > 0}
                />




                {/* Input Actions */}
                <div className="flex items-center gap-2 pb-2 pr-2">

                  {/* Model Selector */}
                  <div className="relative">
                    <button
                        onClick={() => setShowModelMenu(!showModelMenu)}
                        disabled={mode === "teach"}
                        className={`flex items-center gap-1 text-[10px] font-medium px-2 py-1.5 rounded-lg 
                          transition-all duration-300 border
                        ${mode === "teach" ? "opacity-50 cursor-not-allowed border-transparent" : "cursor-pointer"}
                        ${showModelMenu 
                            ? "bg-slate-800 border-slate-600 text-white" 
                            : "bg-transparent border-transparent hover:bg-slate-800/50"}
                        ${isCyanMode ? "text-slate-400 hover:text-cyan-400" : "text-slate-400 hover:text-emerald-400"}
                        `}
                    >
                      
                        <span className="hidden sm:inline truncate max-w-20">{currentModelLabel}</span>
                        <ChevronUp size={12} className={`transition-transform duration-300 
                          ${showModelMenu ? "rotate-180" : ""}`} />
                    </button>




                    {/* Dropdown Menu */}
                    {showModelMenu && mode !== "teach" && (
                        <div className="absolute bottom-full right-0 mb-2 w-56 bg-slate-900/95 backdrop-blur-xl 
                        border border-slate-700/50 rounded-xl shadow-2xl overflow-hidden z-50 
                        animate-in slide-in-from-bottom-2 fade-in duration-200">
                           
                           <div className="px-3 py-2 text-[10px] uppercase tracking-wider 
                           text-slate-500 font-bold bg-slate-950/50">
                              Select AI Model
                           </div>


                           {modelOptions.map((option) => (
                              <button
                                key={option.id}
                                onClick={() => {
                                  setSelectedModel(option.id);
                                  setShowModelMenu(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-xs transition-colors duration-200 
                                  flex flex-col gap-0.5
                                  ${selectedModel === option.id 
                                    ? (isCyanMode ? "bg-cyan-900/20 text-cyan-400" : "bg-emerald-900/20 text-emerald-400") 
                                    : "text-slate-300 hover:bg-slate-800"
                                  }`}
                              >

                                <span className="font-semibold flex items-center justify-between">
                                  {option.label}
                                  {selectedModel === option.id && <div className={`w-1.5 h-1.5 rounded-full 
                                    ${isCyanMode ? "bg-cyan-400" : "bg-emerald-400"}`} />}
                                </span>
                                <span className="text-[9px] text-slate-500 font-medium">{option.desc}</span>
                              </button>
                            ))}
                        </div>
                    )}
                  </div>



                  {/* Send and Stop Buttons */}
                  <button 
                    onClick={isLoading ? handleStop : handleSend}
                    disabled={!isLoading && (!input.trim() || cooldown > 0)}
                    className={`w-10 h-10 rounded-xl transition-all duration-300 font-semibold flex items-center 
                        justify-center 
                        ${isLoading 
                            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50 animate-pulse"
                            : cooldown > 0 
                                ? "bg-slate-700 text-slate-400" 
                                : isCyanMode 
                                    ? "bg-linear-to-r from-cyan-500 to-blue-500 text-white" 
                                    : "bg-linear-to-r from-emerald-500 to-teal-500 text-white"
                        }`}
                    >

                      
                    {isLoading ? (
                       <Square size={14} fill="currentColor" />
                    ) : cooldown > 0 ? (
                       <span className="text-xs font-bold">{cooldown}</span>
                    ) : (
                       <Send size={18} />
                    )}
                  </button>
                  

                </div>
              </div>
            </div>
          </div>
        </div>
    </main>
  );
}