// API Configuration for Cognitive Load Analysis Platform

export const API_CONFIG = {
  // OpenAI ChatGPT API
  OPENAI: {
    API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
    BASE_URL: 'https://api.openai.com/v1/chat/completions',
    MODEL: 'gpt-3.5-turbo',
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.7
  },

  // xAI Grok API
  GROK: {
    API_KEY: import.meta.env.VITE_GROK_API_KEY || '',
    BASE_URL: 'https://api.x.ai/v1/chat/completions',
    MODEL: 'grok-beta',
    MAX_TOKENS: 1500,
    TEMPERATURE: 0.7,
    API_VERSION: '2024-01-01'
  },

  // Google Search API (Optional)
  GOOGLE: {
    SEARCH_API_KEY: import.meta.env.VITE_GOOGLE_SEARCH_API_KEY || '',
    SEARCH_ENGINE_ID: import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID || '',
    BASE_URL: 'https://www.googleapis.com/customsearch/v1'
  },

  // Environment
  ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT || 'development',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'
};

// API Key validation
export const validateApiKeys = () => {
  const missingKeys = [];
  
  if (!API_CONFIG.OPENAI.API_KEY) {
    missingKeys.push('VITE_OPENAI_API_KEY');
  }
  
  if (!API_CONFIG.GROK.API_KEY) {
    missingKeys.push('VITE_GROK_API_KEY');
  }

  if (missingKeys.length > 0) {
    console.warn('Missing API keys:', missingKeys);
    console.warn('Please create a .env file with the required API keys');
    return false;
  }

  return true;
};

// Get API key for specific service
export const getApiKey = (service: 'openai' | 'grok' | 'google') => {
  switch (service) {
    case 'openai':
      return API_CONFIG.OPENAI.API_KEY;
    case 'grok':
      return API_CONFIG.GROK.API_KEY;
    case 'google':
      return API_CONFIG.GOOGLE.SEARCH_API_KEY;
    default:
      return '';
  }
};

// Check if API key is available
export const isApiKeyAvailable = (service: 'openai' | 'grok' | 'google') => {
  const key = getApiKey(service);
  return key && key !== 'your_api_key_here' && key.length > 0;
};
