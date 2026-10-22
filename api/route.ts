// app/api/tutor/route.ts
import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { TUTOR_SYSTEM_PROMPT } from '@/lib/prompts/tutor-prompt';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Extract data from the frontend request
    const { questionStem, userAnswer, correctAnswer, conceptNote, officialExplanation } = await req.json();

    // Format the user prompt with the specific question data
    const userPrompt = `
      Question: ${questionStem}
      User Chose: ${userAnswer}
      Correct Answer: ${correctAnswer}
      Key Concept: ${conceptNote}
      Official Explanation: ${officialExplanation}
    `;

    // Call the LLM using Vercel AI SDK
    const result = streamText({
      model: openai('gpt-4o-mini'), // Fast and cost-effective for the hackathon
      system: TUTOR_SYSTEM_PROMPT,
      prompt: userPrompt,
    });

    // Return the streamed response to the frontend
    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error('AI Tutor API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate tutor response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}