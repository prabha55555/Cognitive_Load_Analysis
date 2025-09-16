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

  // Google Gemini API
  GEMINI: {
    API_KEY: import.meta.env.VITE_GEMINI_API_KEY || '',
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    MAX_TOKENS: 500,
    TEMPERATURE: 0.7
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
export const getApiKey = (service: 'openai' | 'grok' | 'google' | 'gemini') => {
  switch (service) {
    case 'openai':
      return API_CONFIG.OPENAI.API_KEY;
    case 'grok':
      return API_CONFIG.GROK.API_KEY;
    case 'gemini':
      return API_CONFIG.GEMINI.API_KEY;
    case 'google':
      return API_CONFIG.GOOGLE.SEARCH_API_KEY;
    default:
      return '';
  }
};

// Check if API key is available
export const isApiKeyAvailable = (service: 'openai' | 'grok' | 'google' | 'gemini') => {
  const key = getApiKey(service);
  
  // For grok, check if we have the actual API key (not placeholder)
  if (service === 'grok') {
    return key && key.startsWith('xai-') && key.length > 10;
  }
  
  // For gemini, check if we have actual Google API key
  if (service === 'gemini') {
    return key && key.startsWith('AIza') && key.length > 20;
  }
  
  // For openai, check if we have actual key (not placeholder)
  if (service === 'openai') {
    return key && key !== 'your_openai_api_key_here' && key.length > 10;
  }
  
  // For google, it's optional
  if (service === 'google') {
    return key && key !== 'your_google_search_api_key_here' && key.length > 10;
  }
  
  return false;
};
