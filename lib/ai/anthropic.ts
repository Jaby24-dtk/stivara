import Anthropic from '@anthropic-ai/sdk'

export function isAnthropicConfigured(): boolean {
  const key = process.env.ANTHROPIC_API_KEY ?? ''
  return key.length > 0 && !key.includes('your-anthropic-api-key-here')
}

let client: Anthropic | null = null
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  return client
}

export async function chat(params: {
  system?: string
  messages: { role: 'user' | 'assistant'; content: string }[]
  maxTokens?: number
}): Promise<string> {
  const response = await getClient().messages.create({
    model: 'claude-sonnet-5',
    max_tokens: params.maxTokens ?? 1024,
    system: params.system,
    messages: params.messages,
  })
  const textBlock = response.content.find((block) => block.type === 'text')
  return textBlock?.type === 'text' ? textBlock.text : ''
}
