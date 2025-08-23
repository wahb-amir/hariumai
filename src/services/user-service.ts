
'use server';

import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db: any;

async function connectToDb() {
  if (db) {
    return db;
  }
  await client.connect();
  db = client.db('harium-ai-chat');
  return db;
}

export type User = {
    userId: string; // From Firebase Auth
    name: string;
    email: string;
    createdAt?: Date;
}

export async function createUser(user: Omit<User, 'createdAt'>): Promise<User> {
  const database = await connectToDb();
  const collection = database.collection('users');
  
  // Check if user already exists
  const existingUser = await collection.findOne({ userId: user.userId });
  if (existingUser) {
    // Return the existing user as a plain object to avoid serialization errors
    return JSON.parse(JSON.stringify(existingUser));
  }

  const newUser = { ...user, createdAt: new Date() };
  await collection.insertOne(newUser);
  // Return the newly created user as a plain object
  return JSON.parse(JSON.stringify(newUser));
}

export async function getUser(userId: string): Promise<User | null> {
    const database = await connectToDb();
    const collection = database.collection('users');
    const userDoc = await collection.findOne({ userId });
    if (!userDoc) {
        return null;
    }
    return JSON.parse(JSON.stringify(userDoc));
}
