import { MongoClient } from 'mongodb';

// Check if the MongoDB URI is provided in environment variables
if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}


// Create a new MongoClient and connect to the database
const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise: Promise<MongoClient>;

// A gloabl variable is used in the development mode
if (process.env.NODE_ENV === 'development') {

  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode a global variable is not used
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;