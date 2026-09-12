/**
 * IBM Granite LLM Integration Layer
 * Uses @ibm-cloud/watsonx-ai SDK
 * Falls back to deterministic mock responses when credentials are not configured
 */

const MOCK_MODE = !process.env.IBM_WATSONX_API_KEY || process.env.IBM_WATSONX_API_KEY === 'your_ibm_watsonx_api_key_here';

let watsonxClient = null;

async function getWatsonxClient() {
  if (MOCK_MODE) return null;
  if (watsonxClient) return watsonxClient;

  try {
    const { WatsonXAI } = require('@ibm-cloud/watsonx-ai');
    const { IamAuthenticator } = require('ibm-cloud-sdk-core');

    watsonxClient = WatsonXAI.newInstance({
      version: '2024-05-31',
      serviceUrl: process.env.IBM_WATSONX_URL || 'https://us-south.ml.cloud.ibm.com',
      authenticator: new IamAuthenticator({ apikey: process.env.IBM_WATSONX_API_KEY }),
    });
    return watsonxClient;
  } catch (err) {
    console.warn('⚠️  watsonx client init failed, using mock mode:', err.message);
    return null;
  }
}

async function callGranite(prompt, maxTokens = 512) {
  const client = await getWatsonxClient();

  if (!client) {
    return { text: null, mock: true };
  }

  const start = Date.now();
  try {
    const response = await client.generateText({
      modelId: process.env.GRANITE_MODEL_ID || 'ibm/granite-13b-chat-v2',
      projectId: process.env.IBM_WATSONX_PROJECT_ID,
      input: prompt,
      parameters: {
        max_new_tokens: maxTokens,
        min_new_tokens: 10,
        temperature: 0.3,
        top_p: 0.9,
        repetition_penalty: 1.1,
      },
    });
    const text = response.result?.results?.[0]?.generated_text || '';
    return { text, latencyMs: Date.now() - start, mock: false };
  } catch (err) {
    console.error('Granite API error:', err.message);
    return { text: null, mock: true };
  }
}

module.exports = { callGranite, MOCK_MODE };
