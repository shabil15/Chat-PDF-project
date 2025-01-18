import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

export type AIProvider = 'openai' | 'anthropic' | 'google';

interface AIClient {
  processMessage: (content: string, pdfContent?: string) => Promise<string>;
}

class OpenAIClient implements AIClient {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  async processMessage(content: string, pdfContent?: string): Promise<string> {
    let systemPrompt = "You are a helpful assistant.";
    if (pdfContent) {
      systemPrompt = `You are a helpful assistant. Use the following PDF content to answer questions: ${pdfContent}. If the question cannot be answered using the PDF content, say so.`;
    }

    const response = await this.client.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content }
      ],
    });

    return response.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
  }
}

class AnthropicClient implements AIClient {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
    });
  }

  async processMessage(content: string, pdfContent?: string): Promise<string> {
    let prompt = content;
    if (pdfContent) {
      prompt = `Use the following PDF content to answer questions: ${pdfContent}\n\nQuestion: ${content}`;
    }

    const response = await this.client.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    return response.content[0].text || "Sorry, I couldn't generate a response.";
  }
}

class GoogleAIClient implements AIClient {
  constructor(apiKey: string) {
    // Initialize Google AI API client when available
  }

  async processMessage(content: string, pdfContent?: string): Promise<string> {
    return "Google AI integration coming soon!";
  }
}

export class AIClientFactory {
  static createClient(provider: AIProvider, apiKey: string): AIClient {
    switch (provider) {
      case 'openai':
        return new OpenAIClient(apiKey);
      case 'anthropic':
        return new AnthropicClient(apiKey);
      case 'google':
        return new GoogleAIClient(apiKey);
      default:
        throw new Error(`Unsupported AI provider: ${provider}`);
    }
  }
}