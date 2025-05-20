import fetch, { Headers, RequestInit } from 'node-fetch';
import { Agent, AgentConfig, ChatResponse, StreamChatResponse, RhunClientConfig } from './types';

export class RhunClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: RhunClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.rhun.ai';
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = new Headers({
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    });

    const requestOptions: RequestInit = {
      ...options,
      headers,
    };

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async createAgent(config: AgentConfig): Promise<Agent> {
    return this.request<Agent>('/agents', {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async getAgent(agentId: string): Promise<Agent> {
    return this.request<Agent>(`/agents/${agentId}`);
  }

  async updateAgent(agentId: string, config: Partial<AgentConfig>): Promise<Agent> {
    return this.request<Agent>(`/agents/${agentId}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async deleteAgent(agentId: string): Promise<void> {
    await this.request(`/agents/${agentId}`, {
      method: 'DELETE',
    });
  }

  async listAgents(): Promise<Agent[]> {
    return this.request<Agent[]>('/agents');
  }

  async chat(agentId: string, message: string): Promise<ChatResponse> {
    return this.request<ChatResponse>(`/agents/${agentId}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async streamChat(agentId: string, message: string, onChunk: (chunk: StreamChatResponse) => void): Promise<void> {
    const response = await fetch(`${this.baseUrl}/agents/${agentId}/chat/stream`, {
      method: 'POST',
      headers: new Headers({
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify({ message }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = (response.body as any).getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          onChunk(data);
        }
      }
    }
  }
} 