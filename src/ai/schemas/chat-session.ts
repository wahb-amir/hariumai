/**
 * @fileOverview Defines the Zod schemas and TypeScript types for chat session operations.
 */
import { z } from 'genkit';

export const GetChatSessionsInputSchema = z.object({
    userId: z.string().describe("The user ID (can be an anonymous ID)."),
});

export const GetChatSessionsOutputSchema = z.array(
    z.object({
        sessionId: z.string(),
        title: z.string(),
    })
).describe("The list of chat sessions for the user.");
