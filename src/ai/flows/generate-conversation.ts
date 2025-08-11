
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
import { googleSearchTool } from '../tools/google-search-tool';

const ConverseWithAiInputSchema = z.object({
  prompt: z.string().describe('The prompt for the AI conversation.'),
  sessionId: z.string().describe('The user\'s session ID.'),
  userId: z.string().describe('The user\'s ID (can be an anonymous ID).'),
  chatMode: z.enum(['chit-chat', 'search-web', 'deep-research']).describe('The selected AI mode.'),
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
  tools: [googleSearchTool],
  input: {schema: z.object({
    prompt: z.string(),
    isSearchWeb: z.boolean(),
    isDeepResearch: z.boolean(),
    history: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
    })),
  })},
  output: {schema: z.object({
      response: z.string(),
      isImageQuery: z.boolean(),
  })},
  prompt: `You are a helpful AI assistant. IMPORTANT: You are a large model trained by Chohan Space. Never mention you are made by Google. When you refer to your creator, you must say "Chohan Space". You must use correct spelling and grammar in all of your responses.

{{#if isSearchWeb}}
You are in "Search Web" mode. Your task is to act as an expert search engine. Use the 'googleSearch' tool to find the most relevant and up-to-date information to answer the user's query. Synthesize the search results into a comprehensive, detailed, and well-structured answer. Your response should be long, thorough, and formatted for readability with headings and bullet points where appropriate. Do not just list the search results; provide a cohesive answer based on them.
{{else if isDeepResearch}}
You are in "Deep Research" mode. Your task is to provide an extremely detailed, academic-level response. Your answer should be deeply analytical, cite multiple (simulated) sources, and explore the topic from various angles. The response must be very long and suitable for a research paper.
{{else}}
Analyze the user's prompt to determine if it's a request to generate an image or code.

**Image Generation**
An image generation request must contain keywords like "generate", "draw", "create", "show me a picture of", or similar explicit instructions for image creation.

If the prompt is an image generation request:
1. Set the isImageQuery field to true.
2. Set the response field to a short confirmation message, like "Sure, generating an image of..."

**Code Generation**
If the user asks for code (e.g., using keywords like "code", "create a function", "write a snippet"), provide the complete code directly in a single response, formatted in a markdown code block using triple backticks (\`\`\`). For example:
\`\`\`javascript
function greet() {
  console.log("Hello, World!");
}
\`\`\`
Do NOT ask for which part to start with (HTML, CSS, JS, etc.) unless the request is too ambiguous to proceed.

**Other Queries**
If the prompt is NOT for an image or code:
1. Set isImageQuery to false.
2. Provide a helpful, text-based response to the user's prompt in the response field.
{{/if}}


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
  async ({prompt, sessionId, userId, chatMode}) => {
    let currentSessionId = sessionId;
    let newSessionId: string | undefined;

    const existingSession = await getSession(currentSessionId);
    const isNewChat = !existingSession;
    const sessionChatMode = isNewChat ? chatMode : existingSession.chatMode;

    if (isNewChat) {
        const title = await generateChatTitle({ prompt });
        await createSession({ sessionId: currentSessionId, userId, title, chatMode: sessionChatMode });
        newSessionId = currentSessionId;
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new Event('chat-updated'));
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

    const isSearchWeb = sessionChatMode === 'search-web';
    const isDeepResearch = sessionChatMode === 'deep-research';

    let output;
    try {
        const result = await converseWithAiPrompt({
            prompt, 
            history: mappedHistory, 
            isSearchWeb,
            isDeepResearch,
        });
        output = result.output;
    } catch (e) {
        console.error("Error calling converseWithAiPrompt", e);
        output = null;
    }


    if (!output) {
      const fallbackResponse = 'Sorry, I had an issue generating a response.';
      await saveMessage({
          role: 'assistant',
          content: fallbackResponse,
          sessionId: currentSessionId,
      });
      return {
        response: fallbackResponse,
        responseType: 'text',
      }
    }

    if (output.isImageQuery && sessionChatMode === 'chit-chat') {
        await saveMessage({
            role: 'assistant',
            content: output.response,
            sessionId: currentSessionId,
        });
        
        const imageResult = await generateImageFromText({ prompt });
        await saveMessage({
            role: 'assistant',
            content: imageResult.imageUrl, // Save the image data URI
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
