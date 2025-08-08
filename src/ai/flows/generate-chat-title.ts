'use server';
/**
 * @fileOverview A Genkit flow to generate a title for a new chat session.
 *
 * - generateChatTitle - A function that handles generating the chat title.
 */

import { ai } from '@/ai/genkit';
import { GenerateChatTitleInput, GenerateChatTitleInputSchema, GenerateChatTitleOutput, GenerateChatTitleOutputSchema } from '@/ai/schemas/chat-title';
import { z } from 'genkit';

export async function generateChatTitle(input: GenerateChatTitleInput): Promise<GenerateChatTitleOutput> {
  return generateChatTitleFlow(input);
}

const generateChatTitlePrompt = ai.definePrompt({
    name: 'generateChatTitlePrompt',
    input: { schema: GenerateChatTitleInputSchema },
    output: { schema: z.object({ title: GenerateChatTitleOutputSchema }) },
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
    if (!output?.title) {
      return "New Chat";
    }
    return output.title;
  }
);
