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

export type Message = {
    role: 'user' | 'assistant';
    content: string;
    sessionId: string;
    timestamp?: Date;
}

export async function saveMessage(message: Message) {
  const database = await connectToDb();
  const collection = database.collection('history');
  return await collection.insertOne({ ...message, timestamp: new Date() });
}

export async function getHistory(sessionId: string) {
    const database = await connectToDb();
    const collection = database.collection('history');
    return await collection.find({ sessionId }).sort({ timestamp: 1 }).limit(20).toArray();
}

export type Session = {
    sessionId: string;
    userId: string;
    title: string;
    chatMode: 'chit-chat' | 'search-web' | 'deep-research';
    timestamp?: Date;
}

export async function createSession(session: Omit<Session, 'timestamp'>) {
    const database = await connectToDb();
    const collection = database.collection('sessions');
    return await collection.insertOne({ ...session, timestamp: new Date() });
}

export async function getSession(sessionId: string): Promise<Session | null> {
    const database = await connectToDb();
    const collection = database.collection('sessions');
    const sessionDoc = await collection.findOne({ sessionId });
    if (!sessionDoc) {
        return null;
    }
    // Convert the MongoDB document to a plain object to avoid serialization issues.
    return {
        sessionId: sessionDoc.sessionId,
        userId: sessionDoc.userId,
        title: sessionDoc.title,
        chatMode: sessionDoc.chatMode,
        timestamp: sessionDoc.timestamp,
    };
}

export async function getSessions(userId: string) {
    const database = await connectToDb();
    const collection = database.collection('sessions');
    return await collection.find({ userId }).sort({ timestamp: -1 }).toArray();
}
