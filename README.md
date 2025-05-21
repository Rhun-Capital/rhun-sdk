# Rhun SDK

A TypeScript SDK for interacting with Rhun AI Agents.

## Installation

```bash
npm install @rhun/sdk
```

## Getting Started

### 1. Get Your API Key

1. Visit [https://beta.rhun.io](https://beta.rhun.io)
2. Connect your wallet
3. Your API key will be available in the account section
4. Store your API key securely - never commit it to version control

### 2. Set Up Environment Variables

Create a `.env` file in your project root:

```bash
RHUN_API_KEY=your_api_key_here
```

## Development Setup

If you want to build the SDK from source:

1. Clone the repository:
```bash
git clone https://github.com/rhun-ai/rhun-sdk.git
cd rhun-sdk
```

2. Install dependencies:
```bash
npm install
```

3. Build the project:
```bash
npm run build
```

4. Run tests:
```bash
npm test
```

## Usage

```typescript
import { RhunClient } from '@rhun/sdk';

// Initialize the client
const client = new RhunClient({
  apiKey: process.env.RHUN_API_KEY, // Best practice: use environment variables
  baseUrl: 'https://beta.rhun.io'
});

// Create a crypto research agent
const agent = await client.createAgent({
  name: 'Token Scout',
  description: 'Crypto research specialist focusing on token discovery, market analysis, and due diligence. Equipped with comprehensive token database access and real-time market data.',
  coreCapabilities: 'Token search and analysis, market data aggregation, contract verification, liquidity analysis',
  interactionStyle: 'Informative and precise, with clear risk disclaimers',
  analysisApproach: 'Multi-factor analysis combining on-chain data, market metrics, and social signals',
  riskCommunication: 'Detailed risk assessment with contract audit status and liquidity metrics',
  responseFormat: 'Token summary followed by key metrics and risk factors'
});

// Example: Search for tokens and analyze market data
await client.streamChat(agent.id, 'Find new DeFi tokens and analyze their metrics', (chunk) => {
  if (chunk.type === 'message') {
    // Handle narrative responses
    console.log('Analysis:', chunk.data.content);
  } else if (chunk.type === 'tool_invocation') {
    const tool = chunk.data;
    switch (tool.tool) {
      case 'getRecentlyLaunchedCoins':
        // Handle newly launched tokens
        console.log('New tokens:', tool.output.tokens.map(t => ({
          name: t.name,
          chain: t.chain,
          launchDate: t.launchDate
        })));
        break;
      case 'getTokenInfo':
        // Handle detailed token information
        console.log('Token details:', {
          price: tool.output.price,
          volume24h: tool.output.volume24h,
          marketCap: tool.output.marketCap,
          holders: tool.output.holders
        });
        break;
      case 'getTopHolders':
        // Handle holder distribution analysis
        console.log('Top holders:', tool.output.holders.map(h => ({
          address: h.address,
          percentage: h.percentage,
          balance: h.balance
        })));
        break;
      case 'getFearAndGreedIndex':
        // Handle market sentiment data
        console.log('Market sentiment:', tool.output.value, tool.output.classification);
        break;
    }
  }
});

// Example: Get technical analysis with TradingView charts
const response = await client.chat(agent.id, 'Show me technical analysis for SOL');
console.log('Analysis:', response.message.content);

// Update agent with enhanced capabilities
const updatedAgent = await client.updateAgent(agent.id, {
  description: 'Advanced market analyst with real-time technical analysis and sentiment tracking',
  coreCapabilities: 'Technical analysis, market sentiment, holder analysis, trend prediction'
});
```

## API Reference

### RhunClient

The main client class for interacting with the Rhun API.

#### Constructor

```typescript
new RhunClient(config: RhunClientConfig)
```

- `config.apiKey`: Your Rhun API key (will be sent as a Bearer token)
- `config.baseUrl`: (optional) The base URL for the API. Defaults to https://beta.rhun.io

#### Methods

- `createAgent(config: AgentConfig): Promise<Agent>`
- `getAgent(agentId: string): Promise<Agent>`
- `updateAgent(agentId: string, config: Partial<AgentConfig>): Promise<Agent>`
- `deleteAgent(agentId: string): Promise<void>`
- `listAgents(): Promise<Agent[]>`
- `chat(agentId: string, message: string): Promise<ChatResponse>`
- `streamChat(agentId: string, message: string, onChunk: (chunk: StreamChatResponse) => void): Promise<void>`

### Types

#### AgentConfig
Configuration for creating/updating an agent:

Required fields:
- `name: string` - Agent name
- `description: string` - Agent description

Optional fields:
- `image?: Buffer | string` - Agent profile image (Buffer or file path)

Advanced Configuration (all optional):
- `coreCapabilities?: string` - Core capabilities and knowledge domains
- `interactionStyle?: string` - How the agent should interact
- `analysisApproach?: string` - How the agent should analyze problems
- `riskCommunication?: string` - How to communicate risks
- `responseFormat?: string` - Structure for responses
- `limitationsDisclaimers?: string` - Agent limitations
- `prohibitedBehaviors?: string` - What the agent must not do
- `knowledgeUpdates?: string` - How to handle knowledge updates
- `styleGuide?: string` - Communication style guidelines
- `specialInstructions?: string` - Special handling instructions
- `responsePriorityOrder?: string` - Priority order for responses

System-managed fields (do not set these manually):
- `userId?: string` - Set automatically from authentication
- `createdAt?: string` - Set automatically on creation
- `updatedAt?: string` - Set automatically on updates

Other Types:
- `Agent`: An agent instance
- `ChatMessage`: A message in a chat
- `ToolInvocation`: A tool invocation by an agent
- `ChatResponse`: Response from a chat request
- `StreamChatResponse`: Response chunk from a streaming chat request


## License

MIT 