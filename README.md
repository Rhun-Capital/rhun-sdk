# Rhun SDK

A TypeScript SDK for interacting with Rhun AI Agents.

## Installation

```bash
npm install @rhun/sdk
```

## Usage

```typescript
import { RhunClient } from '@rhun/sdk';

// Initialize the client
const client = new RhunClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.rhun.ai' // optional
});

// Create an agent
const agent = await client.createAgent({
  name: 'My Agent',
  description: 'A helpful AI agent',
  tools: ['search', 'calculator'],
  model: 'gpt-4',
  temperature: 0.7
});

// Chat with the agent
const response = await client.chat(agent.id, 'Hello!');
console.log(response.message.content);

// Stream chat responses
await client.streamChat(agent.id, 'Tell me a story', (chunk) => {
  if (chunk.type === 'message') {
    console.log(chunk.data.content);
  } else if (chunk.type === 'tool_invocation') {
    console.log('Tool used:', chunk.data.tool);
  }
});

// List all agents
const agents = await client.listAgents();

// Update an agent
const updatedAgent = await client.updateAgent(agent.id, {
  temperature: 0.8
});

// Delete an agent
await client.deleteAgent(agent.id);
```

## API Reference

### RhunClient

The main client class for interacting with the Rhun API.

#### Constructor

```typescript
new RhunClient(config: RhunClientConfig)
```

- `config.apiKey`: Your Rhun API key
- `config.baseUrl`: (optional) The base URL for the API

#### Methods

- `createAgent(config: AgentConfig): Promise<Agent>`
- `getAgent(agentId: string): Promise<Agent>`
- `updateAgent(agentId: string, config: Partial<AgentConfig>): Promise<Agent>`
- `deleteAgent(agentId: string): Promise<void>`
- `listAgents(): Promise<Agent[]>`
- `chat(agentId: string, message: string): Promise<ChatResponse>`
- `streamChat(agentId: string, message: string, onChunk: (chunk: StreamChatResponse) => void): Promise<void>`

### Types

- `AgentConfig`: Configuration for creating/updating an agent
- `Agent`: An agent instance
- `ChatMessage`: A message in a chat
- `ToolInvocation`: A tool invocation by an agent
- `ChatResponse`: Response from a chat request
- `StreamChatResponse`: Response chunk from a streaming chat request

## Error Handling

All API calls can throw errors. Wrap them in try-catch blocks:

```typescript
try {
  const agent = await client.createAgent(config);
} catch (error) {
  console.error('Failed to create agent:', error);
}
```

## License

MIT 