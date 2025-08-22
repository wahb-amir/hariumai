
'use server';

/**
 * @fileOverview A Genkit flow to rename a chat session.
 */

import { ai } from '@/ai/genkit';
import { renameSession } from '@/services/chat-history';
import { z } from 'genkit';

const RenameChatSessionInputSchema = z.object({
    sessionId: z.string().describe("The ID of the session to rename."),
    userId: z.string().describe("The user ID who owns the session."),
    newTitle: z.string().describe("The new title for the chat session."),
});
export type RenameChatSessionInput = z.infer<typeof RenameChatSessionInputSchema>;

const RenameChatSessionOutputSchema = z.object({
    success: z.boolean(),
});
export type RenameChatSessionOutput = z.infer<typeof RenameChatSessionOutputSchema>;

export async function renameChatSession(input: RenameChatSessionInput): Promise<RenameChatSessionOutput> {
    return renameChatSessionFlow(input);
}

const renameChatSessionFlow = ai.defineFlow(
  {
    name: 'renameChatSessionFlow',
    inputSchema: RenameChatSessionInputSchema,
    outputSchema: RenameChatSessionOutputSchema,
  },
  async ({ sessionId, userId, newTitle }) => {
    const result = await renameSession(sessionId, userId, newTitle);
    return {
        success: result.modifiedCount > 0,
    };
  }
);
