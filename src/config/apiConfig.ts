// API Configuration for Cognitive Load Analysis Platform
// This file contains all API configurations, endpoints, and utility functions

export const API_CONFIG = {
  // OpenAI ChatGPT API Configuration
  OPENAI: {
    API_KEY: import.meta.env.VITE_OPENAI_API_KEY || '',
    BASE_URL: 'https://api.openai.com/v1/chat/completions',
    MODEL: 'gpt-3.5-turbo',
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.7,
    TIMEOUT: 10000 // 10 seconds
  },

  // xAI Grok API Configuration
  GROK: {
    API_KEY: import.meta.env.VITE_GROK_API_KEY || '',
    BASE_URL: 'https://api.x.ai/v1/chat/completions',
    MODEL: 'grok-beta',
    MAX_TOKENS: 1500,
    TEMPERATURE: 0.8,
    API_VERSION: '2024-01-01',
    TIMEOUT: 10000 // 10 seconds
  },

  // Google Gemini API Configuration
  GEMINI: {
    API_KEY: import.meta.env.VITE_GEMINI_API_KEY || '',
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
    MAX_TOKENS: 1000,
    TEMPERATURE: 0.7,
    TIMEOUT: 10000 // 10 seconds
  },

  // Google Search API Configuration (Optional)
  GOOGLE_SEARCH: {
    API_KEY: import.meta.env.VITE_GOOGLE_SEARCH_API_KEY || '',
    ENGINE_ID: import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID || '',
    BASE_URL: 'https://www.googleapis.com/customsearch/v1',
    MAX_RESULTS: 10
  },

  // Backend API Configuration
  BACKEND: {
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
    TIMEOUT: 15000 // 15 seconds
  },

  // EEG Service Configuration
  EEG: {
    WEBSOCKET_URL: import.meta.env.VITE_EEG_WEBSOCKET_URL || 'ws://localhost:8080',
    SAMPLE_RATE: 256,
    CHANNELS: ['Fp1', 'Fp2', 'C3', 'C4', 'P7', 'P8', 'O1', 'O2']
  },

  // Environment Configuration
  ENVIRONMENT: import.meta.env.VITE_ENVIRONMENT || 'development',
  
  // Feature Flags
  FEATURES: {
    ENABLE_EEG: import.meta.env.VITE_ENABLE_EEG === 'true',
    ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    ENABLE_REAL_TIME: import.meta.env.VITE_ENABLE_REAL_TIME === 'true'
  },

  // Timeout Configuration
  TIMEOUTS: {
    API_REQUEST: 10000,    // 10 seconds for API requests
    STREAMING: 15000,      // 15 seconds for streaming responses
    WEBSOCKET: 5000,       // 5 seconds for WebSocket connections
    FILE_UPLOAD: 30000     // 30 seconds for file uploads
  }
};

// Legacy support - expose individual API configurations
export const GEMINI_API_KEY = API_CONFIG.GEMINI.API_KEY;
export const GEMINI_API_URL = API_CONFIG.GEMINI.BASE_URL;
export const GROK_API_KEY = API_CONFIG.GROK.API_KEY;
export const GROK_API_URL = API_CONFIG.GROK.BASE_URL;

/**
 * Validate API keys and return status
 */
export const validateApiKeys = () => {
  const missingKeys: string[] = [];
  const warnings: string[] = [];
  
  // Check OpenAI API key
  if (!API_CONFIG.OPENAI.API_KEY) {
    missingKeys.push('VITE_OPENAI_API_KEY');
  } else if (API_CONFIG.OPENAI.API_KEY === 'your_openai_api_key_here') {
    warnings.push('OpenAI API key appears to be a placeholder');
  }
  
  // Check Grok API key
  if (!API_CONFIG.GROK.API_KEY) {
    missingKeys.push('VITE_GROK_API_KEY');
  } else if (!API_CONFIG.GROK.API_KEY.startsWith('xai-')) {
    warnings.push('Grok API key format may be incorrect (should start with "xai-")');
  }

  // Check Gemini API key
  if (!API_CONFIG.GEMINI.API_KEY) {
    missingKeys.push('VITE_GEMINI_API_KEY');
  } else if (!API_CONFIG.GEMINI.API_KEY.startsWith('AIza')) {
    warnings.push('Gemini API key format may be incorrect (should start with "AIza")');
  }

  // Log results
  if (missingKeys.length > 0) {
    console.warn('❌ Missing API keys:', missingKeys);
    console.warn('Please create a .env file with the required API keys');
  }
  
  if (warnings.length > 0) {
    console.warn('⚠️ API key warnings:', warnings);
  }

  return {
    isValid: missingKeys.length === 0,
    missingKeys,
    warnings,
    hasAllKeys: missingKeys.length === 0 && warnings.length === 0
  };
};

/**
 * Get API key for specific service
 */
export const getApiKey = (service: 'openai' | 'grok' | 'gemini' | 'google') => {
  switch (service) {
    case 'openai':
      return API_CONFIG.OPENAI.API_KEY;
    case 'grok':
      return API_CONFIG.GROK.API_KEY;
    case 'gemini':
      return API_CONFIG.GEMINI.API_KEY;
    case 'google':
      return API_CONFIG.GOOGLE_SEARCH.API_KEY;
    default:
      return '';
  }
};

/**
 * Check if API key is available and properly formatted
 */
export const isApiKeyAvailable = (service: 'openai' | 'grok' | 'gemini' | 'google') => {
  const key = getApiKey(service);
  
  if (!key || key.trim().length === 0) {
    return false;
  }

  switch (service) {
    case 'grok':
      return key.startsWith('xai-') && key.length > 10;
    case 'gemini':
      return key.startsWith('AIza') && key.length > 20;
    case 'openai':
      return key !== 'your_openai_api_key_here' && key.length > 10;
    case 'google':
      return key.length > 10; // Google Search API keys are optional
    default:
      return false;
  }
};

/**
 * Get API configuration for specific service
 */
export const getApiConfig = (service: 'openai' | 'grok' | 'gemini' | 'google') => {
  switch (service) {
    case 'openai':
      return API_CONFIG.OPENAI;
    case 'grok':
      return API_CONFIG.GROK;
    case 'gemini':
      return API_CONFIG.GEMINI;
    case 'google':
      return API_CONFIG.GOOGLE_SEARCH;
    default:
      return null;
  }
};

/**
 * Get available AI services based on API key availability
 */
export const getAvailableServices = () => {
  const services = [];
  
  if (isApiKeyAvailable('gemini')) {
    services.push({
      id: 'gemini',
      name: 'Google Gemini',
      description: 'Advanced AI model from Google',
      available: true
    });
  }
  
  if (isApiKeyAvailable('grok')) {
    services.push({
      id: 'grok',
      name: 'xAI Grok',
      description: 'Witty AI model from xAI',
      available: true
    });
  }
  
  if (isApiKeyAvailable('openai')) {
    services.push({
      id: 'openai',
      name: 'OpenAI ChatGPT',
      description: 'Popular AI model from OpenAI',
      available: true
    });
  }

  return services;
};

/**
 * Initialize API configuration and validate keys
 */
export const initializeApiConfig = () => {
  console.log('🔧 Initializing API Configuration...');
  
  const validation = validateApiKeys();
  const availableServices = getAvailableServices();
  
  console.log(`✅ Available AI Services: ${availableServices.length}`);
  availableServices.forEach(service => {
    console.log(`  - ${service.name} (${service.id})`);
  });
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Configuration warnings:', validation.warnings);
  }
  
  if (!validation.isValid) {
    console.error('❌ Missing required API keys:', validation.missingKeys);
    console.log('💡 To fix this, create a .env file with:');
    validation.missingKeys.forEach(key => {
      console.log(`   ${key}=your_${key.toLowerCase().replace('vite_', '').replace('_', '_')}_here`);
    });
  }
  
  return {
    validation,
    availableServices,
    isReady: validation.isValid && availableServices.length > 0
  };
};

/**
 * Create fetch configuration with timeout and error handling
 */
export const createFetchConfig = (
  service: 'openai' | 'grok' | 'gemini' | 'google',
  customTimeout?: number
) => {
  const config = getApiConfig(service);
  const apiKey = getApiKey(service);
  
  if (!config || !apiKey) {
    throw new Error(`API configuration not available for service: ${service}`);
  }

  // Get timeout from specific service config or use default
  let timeout = customTimeout || API_CONFIG.TIMEOUTS.API_REQUEST;
  if (service !== 'google' && 'TIMEOUT' in config) {
    timeout = customTimeout || config.TIMEOUT;
  }
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  return {
    controller,
    timeoutId,
    signal: controller.signal,
    headers: service === 'gemini' 
      ? { 'Content-Type': 'application/json' }
      : {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
  };
};

// Export default configuration
export default API_CONFIG;
