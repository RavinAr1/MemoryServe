# 🧠 MemoryServe

MemoryServe is a **Retrieval-Augmented Generation (RAG)** project. It allows an AI assistant to remember facts by storing user input in a vector database and retrieving relevant information during future conversations.

## 🚀Features

* **Long-Term Memory:** Stores text inputs in MongoDB Atlas.
* **Contextual Recall:** Uses vector search to find relevant notes based on meaning, not just keywords.
* **Hybrid Chat:** Can handle both general questions and database-specific queries.
* **Rate Limiting:** Includes basic handling for API quotas.

## 🛠️ Tech Stack

* **Framework:** Next.js & TypeScript
* **Database:** MongoDB Atlas 
* **AI:** Google Gemini API
* **Integration:** LangChain.js

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