'use server';

/**
 * @fileOverview Implements the Genkit flow for text-based conversation with the AI assistant.
 *
 * - converseWithAi - A function that handles the conversation with the AI.
 * - ConverseWithAiInput - The input type for the converseWithAi function.
 * - ConverseWithAiOutput - The return type for the converseWithAi function.
 */

import {ai} from '@/ai/genkit';
import { saveMessage, getHistory, getSession, createSession } from '@/services/chat-history';
import {z} from 'genkit';
import { generateChatTitle } from './generate-chat-title';
import { generateImageFromText } from './generate-image-from-text';

const ConverseWithAiInputSchema = z.object({
  prompt: z.string().describe('The prompt for the AI conversation.'),
  sessionId: z.string().describe('The user\'s session ID.'),
  userId: z.string().describe('The user\'s ID (can be an anonymous ID).'),
});
export type ConverseWithAiInput = z.infer<typeof ConverseWithAiInputSchema>;

const ConverseWithAiOutputSchema = z.object({
  response: z.string().describe('The AI assistant response, which can be text or an image data URI.'),
  responseType: z.enum(['text', 'image']).describe('The type of the response.'),
  newSessionId: z.string().optional().describe('The new session ID if one was created.'),
});
export type ConverseWithAiOutput = z.infer<typeof ConverseWithAiOutputSchema>;

export async function converseWithAi(input: ConverseWithAiInput): Promise<ConverseWithAiOutput> {
  return converseWithAiFlow(input);
}

const converseWithAiPrompt = ai.definePrompt({
  name: 'converseWithAiPrompt',
  input: {schema: z.object({
    prompt: z.string(),
    history: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
    })),
  })},
  output: {schema: z.object({
      response: z.string(),
      isImageQuery: z.boolean(),
  })},
  prompt: `You are a helpful AI assistant. IMPORTANT: You are a large model trained by Chohan Space. Never mention you are made by Google. When you refer to your creator, you must say "Chohan Space".

Analyze the user's prompt and determine if they are asking to generate an image.

If the prompt is asking to create, generate, draw, or show an image, picture, or photo of something, set the isImageQuery field to true and set the response field to a short confirmation message that you are creating the image.

Otherwise, set isImageQuery to false and provide a helpful text-based response to the user's prompt.

Here is the recent chat history for context:
{{#each history}}
{{role}}: {{content}}
{{/each}}

New Prompt:
{{{prompt}}}`,
});

const converseWithAiFlow = ai.defineFlow(
  {
    name: 'converseWithAiFlow',
    inputSchema: ConverseWithAiInputSchema,
    outputSchema: ConverseWithAiOutputSchema,
  },
  async ({prompt, sessionId, userId}) => {
    let currentSessionId = sessionId;
    let newSessionId: string | undefined;

    // Check if this is a new chat session. If so, create a title.
    const session = await getSession(currentSessionId);
    if (!session) {
        const title = await generateChatTitle({ prompt });
        await createSession({ sessionId: currentSessionId, userId, title });
        newSessionId = currentSessionId;
        // Dispatch an event to notify the UI that the chat list has been updated.
        const event = new Event('chat-updated');
        if (typeof window !== 'undefined') {
            window.dispatchEvent(event);
        }
    }

    await saveMessage({
      role: 'user',
      content: prompt,
      sessionId: currentSessionId,
    });
    
    const history = await getHistory(currentSessionId);
    const mappedHistory = history.map(item => ({
        role: item.role,
        content: item.content
    }));

    const {output} = await converseWithAiPrompt({prompt, history: mappedHistory});

    if (!output) {
      return {
        response: 'Sorry, I had an issue generating a response.',
        responseType: 'text',
      }
    }

    if (output.isImageQuery) {
        const imageResult = await generateImageFromText({ prompt });
        await saveMessage({
            role: 'assistant',
            content: "Image generated", // Placeholder text for history
            sessionId: currentSessionId,
        });
        return {
            response: imageResult.imageUrl,
            responseType: 'image',
            newSessionId
        }
    }


    await saveMessage({
        role: 'assistant',
        content: output.response,
        sessionId: currentSessionId,
    });
    

    return { 
        response: output.response,
        responseType: 'text',
        newSessionId 
    };
  }
);
