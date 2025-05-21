import fetch, { Headers, RequestInit } from 'node-fetch';
import { Agent, AgentConfig, ChatResponse, StreamChatResponse, RhunClientConfig, ToolInvocation } from './types';
import FormData from 'form-data';
import fs from 'fs';

export class RhunClient {
  private apiKey: string;
  private baseUrl: string;
  private userId: string | null = null;

  constructor(config: RhunClientConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://beta.rhun.io';
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}/api${path}`;
    const headers = new Headers({
      'Authorization': `Bearer ${this.apiKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    });

    const requestOptions: RequestInit = {
      ...options,
      headers,
    };

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const error = JSON.parse(errorText);
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      } catch (e) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
    }

    const data = await response.json();
    
    // Extract user ID from the response if it's included
    if (data.userId) {
      this.userId = data.userId;
    }

    return data;
  }

  async createAgent(config: AgentConfig): Promise<Agent> {
    const url = `${this.baseUrl}/api/agents`;
    let headers: Headers;
    let body: any;

    if (config.image) {
      // Handle multipart/form-data for image upload
      const formData = new FormData();
      formData.append('data', JSON.stringify({
        name: config.name,
        description: config.description,
        coreCapabilities: config.coreCapabilities,
        interactionStyle: config.interactionStyle
      }));
      
      if (Buffer.isBuffer(config.image)) {
        // If image is a Buffer, append it directly
        formData.append('image', config.image, {
          filename: 'image.png',
          contentType: 'image/png'
        });
      } else if (typeof config.image === 'string') {
        // If image is a file path, create a read stream
        formData.append('image', fs.createReadStream(config.image));
      }

      // Get the form-data headers
      headers = new Headers({
        ...formData.getHeaders(),
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json'
      });

      body = formData;
    } else {
      // Handle regular JSON request
      headers = new Headers({
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      });

      body = JSON.stringify(config);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const error = JSON.parse(errorText);
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      } catch (e) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
    }

    const data = await response.json();
    
    // Extract user ID from the response if it's included
    if (data.userId) {
      this.userId = data.userId;
    }

    return {
      id: data.agentId,
      userId: data.userId,
      config: {
        ...config,
        imageUrl: data.imageUrl
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async getAgent(agentId: string): Promise<Agent> {
    if (!this.userId) {
      throw new Error('User ID not set. Call listAgents() first.');
    }
    return this.request<Agent>(`/agents/${this.userId}/${agentId}`);
  }

  async updateAgent(agentId: string, config: Partial<AgentConfig>): Promise<Agent> {
    if (!this.userId) {
      throw new Error('User ID not set. Call listAgents() first.');
    }
    return this.request<Agent>(`/agents/${this.userId}/${agentId}`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async deleteAgent(agentId: string): Promise<void> {
    if (!this.userId) {
      throw new Error('User ID not set. Call listAgents() first.');
    }
    await this.request(`/agents/${this.userId}/${agentId}`, {
      method: 'DELETE',
    });
  }

  async listAgents(): Promise<Agent[]> {
    // First, create a test agent to get the user ID
    const testAgent = await this.createAgent({
      name: 'Test Agent',
      description: 'A test agent to get user ID',
      coreCapabilities: 'Basic test capabilities',
      interactionStyle: 'Professional'
    });

    // Store the user ID
    this.userId = testAgent.userId;

    // Then, list the agents for this user
    return this.request<Agent[]>(`/agents/${this.userId}`);
  }

  async chat(agentId: string, message: string): Promise<ChatResponse> {
    if (!this.userId) {
      throw new Error('User ID not set. Call listAgents() first.');
    }

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: new Headers({
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      }),
      body: JSON.stringify({ 
        messages: [{
          role: 'user',
          content: message
        }],
        agent: {
          id: agentId,
          userId: this.userId
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const error = JSON.parse(errorText);
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      } catch (e) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
    }

    const text = await response.text();
    const lines = text.split('\n').filter(Boolean);
    let content = '';

    for (const line of lines) {
      if (line.startsWith('0:')) {
        // Extract the text content from the chunk
        const chunkContent = line.slice(2);
        // Remove the surrounding quotes
        const textContent = chunkContent.slice(1, -1);
        content += textContent;
      }
    }

    return {
      message: {
        role: 'assistant',
        content: content
      }
    };
  }

  async streamChat(agentId: string, message: string, onChunk: (chunk: StreamChatResponse) => void): Promise<void> {
    if (!this.userId) {
      throw new Error('User ID not set. Call listAgents() first.');
    }

    console.log('Sending request to:', `${this.baseUrl}/api/chat`);
    console.log('Request body:', JSON.stringify({ 
      messages: [{
        role: 'user',
        content: message
      }],
      agent: {
        id: agentId,
        userId: this.userId
      }
    }, null, 2));

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: new Headers({
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      }),
      body: JSON.stringify({ 
        messages: [{
          role: 'user',
          content: message
        }],
        agent: {
          id: agentId,
          userId: this.userId
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response not OK. Status:', response.status);
      console.error('Response headers:', response.headers);
      console.error('Response body:', errorText);
      try {
        const error = JSON.parse(errorText);
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      } catch (e) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    let buffer = '';
    let currentToolCall: ToolInvocation | null = null;
    
    // Use Node.js stream
    response.body.on('data', (chunk: Buffer) => {
      const rawChunk = chunk.toString();
      console.log('Received chunk:', rawChunk);
      buffer += rawChunk;
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          console.log('Processing line:', line);
          if (line.startsWith('f:')) {
            // Handle message ID prefix
            const messageData = JSON.parse(line.slice(2));
            onChunk({
              type: 'message',
              data: {
                role: 'assistant',
                content: '',
                messageId: messageData.messageId
              }
            });
          } else if (line.startsWith('0:')) {
            // Handle text content
            const content = JSON.parse(line.slice(2));
            onChunk({
              type: 'message',
              data: {
                role: 'assistant',
                content
              }
            });
          } else if (line.startsWith('9:') || line.startsWith('t:')) {
            // Handle tool call (both 9: and t: prefixes)
            const toolData = JSON.parse(line.slice(2));
            console.log('Tool call data:', toolData);
            currentToolCall = {
              toolName: toolData.toolName,
              input: toolData.args,
              toolCallId: toolData.toolCallId
            };
            onChunk({
              type: 'tool_invocation',
              data: currentToolCall
            });
          } else if (line.startsWith('a:')) {
            // Handle tool result
            const resultData = JSON.parse(line.slice(2));
            console.log('Tool result data:', resultData);
            if (currentToolCall) {
              if (resultData.error) {
                onChunk({
                  type: 'tool_invocation',
                  data: {
                    ...currentToolCall,
                    error: resultData.error
                  }
                });
              } else {
                onChunk({
                  type: 'tool_invocation',
                  data: {
                    ...currentToolCall,
                    output: resultData.result
                  }
                });
              }
              currentToolCall = null;
            }
          } else if (line.startsWith('e:')) {
            // Handle error - only if it's not a normal finish
            const data = JSON.parse(line.slice(2));
            if (!data.finishReason || data.finishReason === 'error') {
              console.error('Received error:', data);
              onChunk({
                type: 'error',
                data: data.message || 'Unknown error'
              });
            }
          } else if (line.startsWith('d:')) {
            // Handle done message - no need to send to client
            console.log('Stream completed');
          }
        } catch (e: any) {
          console.error('Error processing chunk:', e);
          onChunk({
            type: 'error',
            data: `Failed to parse server response: ${e.message}`
          });
        }
      }
    });

    // Handle any remaining buffer content when the stream ends
    response.body.on('end', () => {
      console.log('Stream ended. Remaining buffer:', buffer);
      if (buffer.trim()) {
        try {
          const content = JSON.parse(buffer);
          onChunk({
            type: 'message',
            data: {
              role: 'assistant',
              content
            }
          });
        } catch (e) {
          console.error('Error processing final buffer:', e);
          onChunk({
            type: 'error',
            data: 'Failed to parse final response'
          });
        }
      }
    });

    // Handle stream errors
    response.body.on('error', (error) => {
      console.error('Stream error:', error);
      onChunk({
        type: 'error',
        data: error.message || 'Stream error occurred'
      });
    });

    // Wait for the stream to complete
    return new Promise((resolve, reject) => {
      response.body.on('end', resolve);
      response.body.on('error', reject);
    });
  }
} 