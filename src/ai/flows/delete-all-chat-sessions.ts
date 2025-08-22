
'use server';

/**
 * @fileOverview A Genkit flow to delete all chat sessions for a given user.
 */

import { ai } from '@/ai/genkit';
import { deleteAllSessions as deleteAllSessionsFromDb } from '@/services/chat-history';
import { z } from 'genkit';

const DeleteAllChatSessionsInputSchema = z.object({
    userId: z.string().describe("The user ID for whom to delete all sessions."),
});
export type DeleteAllChatSessionsInput = z.infer<typeof DeleteAllChatSessionsInputSchema>;

const DeleteAllChatSessionsOutputSchema = z.object({
    success: z.boolean(),
    deletedCount: z.number(),
});
export type DeleteAllChatSessionsOutput = z.infer<typeof DeleteAllChatSessionsOutputSchema>;


export async function deleteAllChatSessions(input: DeleteAllChatSessionsInput): Promise<DeleteAllChatSessionsOutput> {
    return deleteAllChatSessionsFlow(input);
}

const deleteAllChatSessionsFlow = ai.defineFlow(
  {
    name: 'deleteAllChatSessionsFlow',
    inputSchema: DeleteAllChatSessionsInputSchema,
    outputSchema: DeleteAllChatSessionsOutputSchema,
  },
  async ({ userId }) => {
    const result = await deleteAllSessionsFromDb(userId);
    return {
        success: result.acknowledged,
        deletedCount: result.deletedCount
    };
  }
);
