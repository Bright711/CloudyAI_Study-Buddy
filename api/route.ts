// app/api/tutor/route.ts

export async function POST(req: Request) {
  try {
    // Extract data from the frontend request
    const { questionStem, userAnswer, correctAnswer, conceptNote, officialExplanation } = await req.json();

    // --- MOCK AI RESPONSE (No API Key Needed!) ---
    // In the future, this will be replaced by the real AI call.
    const mockResponse = {
      encouragement: "Great attempt! This is a very common mix-up, so let's clear it up.",
      explanation: `You chose "${userAnswer}", but the correct concept is: ${conceptNote}. ${officialExplanation}`,
      analogy: "Think of it like renting an unfurnished apartment. The landlord maintains the building, but you are responsible for everything inside your specific unit.",
      follow_up_question: "Based on this, if the scenario changed to PaaS instead of IaaS, who do you think would manage the operating system?"
    };

    // Return the mock JSON response
    return new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('AI Tutor API Error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate tutor response' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}