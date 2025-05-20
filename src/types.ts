export interface AgentConfig {
  name: string;
  description: string;
  tools: string[];
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export interface Agent {
  id: string;
  userId: string;
  config: AgentConfig;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  toolInvocations?: ToolInvocation[];
}

export interface ToolInvocation {
  tool: string;
  input: Record<string, any>;
  output?: any;
  error?: string;
}

export interface ChatResponse {
  message: ChatMessage;
  toolInvocations?: ToolInvocation[];
}

export interface StreamChatResponse {
  type: 'message' | 'tool_invocation' | 'error';
  data: ChatMessage | ToolInvocation | string;
}

export interface RhunClientConfig {
  apiKey: string;
  baseUrl?: string;
} 