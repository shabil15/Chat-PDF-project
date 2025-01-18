import OpenAI from 'openai';

let openaiInstance: OpenAI | null = null;

export function initializeOpenAI(apiKey: string) {
  openaiInstance = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  });
  return openaiInstance;
}

export function getOpenAIInstance() {
  if (!openaiInstance) {
    throw new Error('OpenAI not initialized. Please set up your API key first.');
  }
  return openaiInstance;
}

export async function processMessage(content: string, pdfContent?: string) {
  const openai = getOpenAIInstance();
  
  let systemPrompt = "You are a helpful assistant.";
  if (pdfContent) {
    systemPrompt = `You are a helpful assistant. Use the following PDF content to answer questions: ${pdfContent}. If the question cannot be answered using the PDF content, say so.`;
  }

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content }
    ],
  });

  return response.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
}