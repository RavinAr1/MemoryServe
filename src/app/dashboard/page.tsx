"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { 
  Trash2, 
  ArrowLeft, 
  Database, 
  Loader2, 
  UploadCloud, 
  FileText,
  ChevronDown,
  ChevronUp,
  File,
  Lock,
  ShieldCheck,
  X
} from "lucide-react";
import { useDropzone } from "react-dropzone";

import { useRouter } from "next/navigation";

type Note = {
  _id: string;
  text: string;
  source?: string; 
  createdAt?: string;
};


// Group notes by their source file
type FileGroup = {
  fileName: string;
  notes: Note[];
};


// Main Dashboard Component
export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [notes, setNotes] = useState<Note[]>([]);
  const [fileGroups, setFileGroups] = useState<FileGroup[]>([]);  
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const router = useRouter(); 
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Track expanded/collapsed state of file groups
  const [expandedFiles, setExpandedFiles] = useState<Record<string, boolean>>({});

  // Deletion filters for manual entries
  const [deleteTimeRange, setDeleteTimeRange] = useState("all"); // Default to delete all



  // Set Session ID
  useEffect(() => {
    if (isLoaded) {
      if (user) {
        setSessionId(user.id);
      } else {
        const guestId = localStorage.getItem("guestSessionId");
        if (guestId) setSessionId(guestId);
      }
    }
  }, [isLoaded, user]);



  // Fetch Notes from API
  const fetchNotes = useCallback(async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`/api/notes?sessionId=${sessionId}`);
      const data = await res.json();
      setNotes(data);


      // --- Grouping Logic ---
      const groups: Record<string, Note[]> = {};
      
      data.forEach((note: Note) => {
        const key = note.source || "Manual Entry";
        if (!groups[key]) groups[key] = [];
        groups[key].push(note);
      });



      // Convert grouping object to array
      const groupArray = Object.keys(groups).map(fileName => ({
        fileName,
        notes: groups[fileName]
      }));

      setFileGroups(groupArray);

    } catch (error) {
      console.error("Failed to fetch notes");
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);




  // Handle File Upload
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file || !sessionId) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", sessionId);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (res.ok) {
        const data = await res.json();
        alert(data.message); // Show success message
        fetchNotes(); 
      } else {
        alert("Failed to upload.");
      }
    } catch (error) {
      console.error(error);
      alert("Error uploading file.");
    } finally {
      setIsUploading(false);
    }
  }, [sessionId, fetchNotes]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    accept: { 'application/pdf': ['.pdf'] }, 
    maxFiles: 1
  });




  
  // Handle Deleting Complete File
  const handleDeleteFile = async (fileName: string) => {
    
    // Prevent deletion of Manual Entries
    if (fileName === "Manual Entry") return;
    
    if (!confirm(`Are you sure you want to delete "${fileName}" and all its memories?`)) return;


    // Optimistic UI update
    setFileGroups(prev => prev.filter(g => g.fileName !== fileName));

    try {
      if (fileName === "Manual Entry") {
         

        // Prevent bulk deletion of manual entries
         alert("Please delete manual entries individually.");
         fetchNotes();  // Refresh to revert note removal
         return;
      }

      await fetch(`/api/notes?source=${encodeURIComponent(fileName)}&sessionId=${sessionId}`, { 
        method: "DELETE" 
      });
    } catch (error) {
      alert("Failed to delete file.");
      fetchNotes();
    }
  };





// Handle Deleting Manual Entries with Time Range
  const handleDeleteManual = async () => {
    const rangeText = deleteTimeRange === "all" ? "ALL" : `the last ${deleteTimeRange}`;
    if (!confirm(`Are you sure you want to delete ${rangeText} manual memories?`)) return;

    try {
      await fetch(`/api/notes?deleteManual=true&timeRange=${deleteTimeRange}&sessionId=${sessionId}`, { 
        method: "DELETE" 
      });
      fetchNotes(); // Refresh list
    } catch (error) {
      alert("Failed to delete memories.");
    }
  };






  // Handle Deleting Individual Chunk
  const handleDeleteChunk = async (noteId: string) => {
    if (!confirm("Delete this specific memory snippet?")) return;
    
    await fetch(`/api/notes?id=${noteId}&sessionId=${sessionId}`, { method: "DELETE" });
    fetchNotes(); // Refresh notes after deletion
  };


  // Toggle expand/collapse for file groups
  const toggleExpand = (fileName: string) => {
    setExpandedFiles(prev => ({ ...prev, [fileName]: !prev[fileName] }));
  };

  if (!isLoaded) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>;




// --- Guest Check for Dashboard access---
  // If a user is not logged in, show a locked screen instead of the dashboard
  if (!user) {
    return (
      <main className="min-h-screen bg-[#05050A] text-white font-sans p-6 flex flex-col 
      items-center justify-center relative overflow-hidden">
        


        <div className="z-10 text-center space-y-8 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Lock Icon */}
          <div className="w-24 h-24 bg-slate-900 border border-slate-800 rounded-3xl 
          mx-auto flex items-center justify-center shadow-2xl">
             <ShieldCheck className="w-10 h-10 text-purple-400" />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 text-transparent bg-clip-text">
              Access Restricted
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Guest users can chat, but you need a secure account to upload documents and manage your Memory Vault.
            </p>
          </div>

          <div className="flex flex-col gap-4 pt-4">


             <SignInButton mode="modal">
                <button className="w-full bg-white text-black py-3.5 rounded-xl font-bold hover:bg-gray-200 
                transition-all flex items-center justify-center gap-2">
                   Sign In / Create Account
                </button>
             </SignInButton>
             

             <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm transition-colors">
               ← Return to Chat
             </Link>
          </div>

        </div>
      </main>
    );
  }

  

  return (
    <main className="min-h-screen bg-[#05050A] text-white font-sans p-6 md:p-12">
      
      {/* Header */}
      <header className="max-w-4xl mx-auto flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
             <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 text-transparent bg-clip-text">
               Memory Vault
             </h1>
             <p className="text-slate-400 text-sm">Manage documents and memories.</p>
          </div>
        </div>
      </header>



      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* --- DRAG & DROP AREA--- */}
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 ${
            isDragActive 
              ? "border-cyan-400 bg-cyan-400/10" 
              : "border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-900"
          }`}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-cyan-400" size={32} />
              <p className="text-slate-300">Reading PDF...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="p-3 bg-slate-800 rounded-full">
                <UploadCloud className="text-cyan-400" size={24} />
              </div>
              <p className="text-slate-200 font-medium">Drag & Drop PDF to Teach AI</p>
            </div>
          )}
        </div>



        {/* --- FILES LIST --- */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-slate-300 flex items-center gap-2">
            <Database size={20} /> Knowledge Base ({fileGroups.length} Sources)
          </h2>
          
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-slate-500" size={32} />
            </div>
          ) : fileGroups.length === 0 ? (
             <div className="text-center py-12 border border-slate-800 rounded-2xl bg-slate-900/30">
              <p className="text-slate-500">Vault is empty.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {fileGroups.map((group) => (
                <div key={group.fileName} className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                  


                  {/* FILE HEADERS BAR */}
                  <div className="flex items-center justify-between p-4 bg-slate-900/80">
                     <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${group.fileName === "Manual Entry" ? "bg-cyan-500/10 text-cyan-400" : "bg-purple-500/10 text-purple-400"}`}>
                           {group.fileName === "Manual Entry" ? <FileText size={18} /> : <File size={18} />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-200">{group.fileName}</h3>
                          <p className="text-xs text-slate-500">{group.notes.length} chunks stored</p>
                        </div>
                     </div>





                    {/* FILE NOTES LIST */}
                     <div className="flex items-center gap-2">

                        {/* Expand/Collapse Button */}
                        <button 
                          onClick={() => toggleExpand(group.fileName)}
                          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 transition"
                        >
                          {expandedFiles[group.fileName] ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                        </button>
                        


                        {/* Logic for Manual Entry and Regular Files */}
                        {group.fileName !== "Manual Entry" ? (
                          <button 
                            onClick={() => handleDeleteFile(group.fileName)}
                            className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-slate-500 transition"
                            title="Delete File"
                          >
                            <Trash2 size={18} />
                          </button>
                        ) : (
                          /* Manual Entry Controls */
                          <div className="flex items-center gap-2 bg-slate-950/50 rounded-lg p-1 border border-slate-800">
                             <select 
                               value={deleteTimeRange}
                               onChange={(e) => setDeleteTimeRange(e.target.value)}
                               className="bg-transparent text-[10px] text-slate-400 focus:outline-none px-1"
                             >
                               <option value="all">All Time</option>
                               <option value="1h">Last 1h</option>
                               <option value="24h">Last 24h</option>
                               <option value="7d">Last 7d</option>
                             </select>


                             <button 
                                onClick={handleDeleteManual}
                                className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded-md 
                                text-slate-500 transition"
                                title="Clear Manual Memories"
                              >
                                <Trash2 size={14} />
                              </button>


                          </div>
                        )}
                      </div>
                  </div>





                  {/* EXPANDABLE NOTES/FILE CHUNKS */}
                  {expandedFiles[group.fileName] && (
                    <div className="border-t border-slate-800/50 divide-y divide-slate-800/50">
                      {group.notes.map(note => (
                         <div key={note._id} className="p-4 pl-14 hover:bg-white/5 transition 
                         group flex justify-between items-start">
                            <p className="text-sm text-slate-400 leading-relaxed pr-4">
                              {note.text.substring(0, 200)}...
                            </p>
                            <button 
                              onClick={() => handleDeleteChunk(note._id)}
                              className="text-slate-700 hover:text-red-400 opacity-0 group-hover:opacity-100 transition"
                            >
                               <Trash2 size={14} />
                            </button>
                         </div>
                      ))}
                    </div>
                  )}

                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}