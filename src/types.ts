export interface AgentConfig {
  name: string;
  description: string;
  image?: Buffer | string; // Buffer for file data, string for file path
  imageUrl?: string; // URL of the uploaded image
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  coreCapabilities?: string;
  interactionStyle?: string;
  analysisApproach?: string;
  riskCommunication?: string;
  responseFormat?: string;
  limitationsDisclaimers?: string;
  prohibitedBehaviors?: string;
  knowledgeUpdates?: string;
  styleGuide?: string;
  specialInstructions?: string;
  responsePriorityOrder?: string;
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
  messageId?: string;
}

export interface ToolInvocation {
  toolName: string;
  input: Record<string, any>;
  output?: any;
  error?: string;
  toolCallId?: string;
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