# 🧠 MemoryServe

MemoryServe is a **Retrieval-Augmented Generation (RAG)** application. It allows users to securely upload documents or type notes, storing them in a vector database to give the AI long-term memory for future conversations.

## 🚀Features

* **PDF Ingestion:** Drag & drop PDF files to chat with your documents.
* **Long-Term Memory:** Stores text and embeddings in MongoDB Atlas.
* **Contextual Recall:** Uses vector search to find relevant notes based on meaning.
* **Memory Vault:** A dedicated Dashboard to view and delete specific memories.
* **Secure & Private:** Implements Server-Side Authorization.
* **Guest Mode:** Allows users to test the app without creating an account.
* **Persistent Chat:** Chat history only saved locally(to manage free storage limits)

## 🛠️ Tech Stack

* **Framework:** Next.js & TypeScript
* **Authentication:** Clerk
* **Database:** MongoDB Atlas (Vector Search)
* **AI:** Google Gemini API
* **Orchestration:** LangChain.js
* **Styling:** Tailwind CSS

## ⚡Getting Started

### 1. Clone the repo
 
```bash
git clone https://github.com/RavinAr1/MemoryServe.git

cd MemoryServe

npm install
```

### 2. Environment Setup
Create a `.env.local` file in the root directory. You need credentials from MongoDB, Google Gemini, and Clerk.
```
# Database (MongoDB Atlas)
MONGODB_URI=<your mongodb connection string>

# AI Model (Google Gemini)
GOOGLE_API_KEY=<your gemini api key>

# Clerk URLs
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your clerk publishable key>
CLERK_SECRET_KEY=<your clerk secret key>


```


### 3. Database Setup

1. Create a database named 'memory_db' and a collection named `notes`.

2. Create a Vector Search Index on the 'notes' collection using the Json Editor and add the below:

```json
{
  "fields": [
    {
      "numDimensions": 768,
      "path": "embedding",
      "similarity": "cosine",
      "type": "vector"
    },
    {
      "path": "owner_id",
      "type": "filter"
    }
  ]
}
```


### 4. Run the App
```
npm run dev
```
