
'use server';

import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';

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
    return await collection.find({ sessionId }).sort({ timestamp: 1 }).limit(50).toArray();
}

export type Session = {
    _id?: ObjectId; // MongoDB ID
    sessionId: string;
    userId: string;
    title: string;
    chatMode: 'chit-chat' | 'search-web' | 'deep-research';
    model?: string;
    timestamp?: Date;
}

export async function createSession(session: Omit<Session, 'timestamp' | '_id'>) {
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
    return JSON.parse(JSON.stringify(sessionDoc));
}

export async function getSessions(userId: string) {
    const database = await connectToDb();
    const collection = database.collection('sessions');
    const sessions = await collection.find({ userId }).sort({ timestamp: -1 }).toArray();
    return JSON.parse(JSON.stringify(sessions));
}

export async function renameSession(sessionId: string, userId: string, newTitle: string) {
    const database = await connectToDb();
    const collection = database.collection('sessions');
    // Ensure user can only rename their own sessions
    return await collection.updateOne({ sessionId, userId }, { $set: { title: newTitle } });
}

export async function deleteSession(sessionId: string, userId: string) {
    const database = await connectToDb();
    const sessionsCollection = database.collection('sessions');
    const historyCollection = database.collection('history');

    // Ensure user can only delete their own sessions
    const deleteSessionResult = await sessionsCollection.deleteOne({ sessionId, userId });

    if (deleteSessionResult.deletedCount > 0) {
        // Also delete the associated chat history
        await historyCollection.deleteMany({ sessionId });
    }

    return deleteSessionResult;
}

export async function deleteAllSessions(userId: string) {
    const database = await connectToDb();
    const sessionsCollection = database.collection('sessions');
    const historyCollection = database.collection('history');
    
    // Find all sessions for the user
    const sessionsToDelete = await sessionsCollection.find({ userId }, { projection: { sessionId: 1 } }).toArray();
    const sessionIdsToDelete = sessionsToDelete.map(s => s.sessionId);

    // Delete all history for those sessions
    if (sessionIdsToDelete.length > 0) {
        await historyCollection.deleteMany({ sessionId: { $in: sessionIdsToDelete } });
    }
    
    // Delete all sessions for the user
    return await sessionsCollection.deleteMany({ userId });
}
