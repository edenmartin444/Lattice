import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

export interface SuggestedConnection {
  fromId: string;
  toId: string;
  label: string;
  type: "causes" | "contradicts" | "extends" | "example_of" | "analogous_to" | "related";
  strength: number;
  reasoning: string;
}

export interface ExtractedConcept {
  title: string;
  description: string;
  domain: string;
  tags: string[];
}

export interface AIProvider {
  generateSuggestions(prompt: string): Promise<SuggestedConnection[]>;
  extractConcepts(prompt: string): Promise<ExtractedConcept[]>;
}

export class AnthropicProvider implements AIProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateSuggestions(prompt: string): Promise<SuggestedConnection[]> {
    const response = await this.client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    return parseJSON<SuggestedConnection[]>(text) || [];
  }

  async extractConcepts(prompt: string): Promise<ExtractedConcept[]> {
    const response = await this.client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });
    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    return parseJSON<ExtractedConcept[]>(text) || [];
  }
}

export class OpenAIProvider implements AIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateSuggestions(prompt: string): Promise<SuggestedConnection[]> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2048,
    });
    const text = response.choices[0]?.message?.content || "";
    return parseJSON<SuggestedConnection[]>(text) || [];
  }

  async extractConcepts(prompt: string): Promise<ExtractedConcept[]> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2048,
    });
    const text = response.choices[0]?.message?.content || "";
    return parseJSON<ExtractedConcept[]>(text) || [];
  }
}

function parseJSON<T>(text: string): T | null {
  // Try to extract JSON from text (may be wrapped in markdown code blocks)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return null;
  try {
    return JSON.parse(jsonMatch[0]) as T;
  } catch {
    return null;
  }
}

export function getProvider(provider: string): AIProvider {
  if (provider === "openai") {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new Error("OPENAI_API_KEY not configured");
    return new OpenAIProvider(key);
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not configured");
  return new AnthropicProvider(key);
}
