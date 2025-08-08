'use server';
/**
 * @fileOverview A Genkit flow to generate a title for a new chat session.
 *
 * - generateChatTitle - A function that handles generating the chat title.
 * - GenerateChatTitleInput - The input type for the generateChatTitle function.
 * - GenerateChatTitleOutput - The return type for the generateChatTitle function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const GenerateChatTitleInputSchema = z.object({
  prompt: z.string().describe('The initial user prompt for the conversation.'),
});
export type GenerateChatTitleInput = z.infer<typeof GenerateChatTitleInputSchema>;

export const GenerateChatTitleOutputSchema = z.string().describe('A short, descriptive title for the chat (max 5 words).');
export type GenerateChatTitleOutput = z.infer<typeof GenerateChatTitleOutputSchema>;

export async function generateChatTitle(input: GenerateChatTitleInput): Promise<GenerateChatTitleOutput> {
  return generateChatTitleFlow(input);
}

const generateChatTitlePrompt = ai.definePrompt({
    name: 'generateChatTitlePrompt',
    input: { schema: GenerateChatTitleInputSchema },
    output: { schema: GenerateChatTitleOutputSchema },
    prompt: `Based on the following user prompt, create a short, descriptive title for a new chat session. The title should be no more than 5 words.

Prompt: {{{prompt}}}

Title:`,
});

const generateChatTitleFlow = ai.defineFlow(
  {
    name: 'generateChatTitleFlow',
    inputSchema: GenerateChatTitleInputSchema,
    outputSchema: GenerateChatTitleOutputSchema,
  },
  async ({ prompt }) => {
    const { output } = await generateChatTitlePrompt({ prompt });
    return output || "New Chat";
  }
);
