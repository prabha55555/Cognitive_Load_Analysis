import { AlertCircle, CheckCircle, Copy, ExternalLink, Key, Settings } from 'lucide-react';
import { useState } from 'react';
import { isApiKeyAvailable } from '../config/api';

interface ApiKeyStatusProps {
  onClose?: () => void;
}

export const ApiKeyStatus: React.FC<ApiKeyStatusProps> = ({ onClose }) => {
  const [showSetup, setShowSetup] = useState(false);

  const openaiAvailable = isApiKeyAvailable('openai');
  const grokAvailable = isApiKeyAvailable('grok');
  const googleAvailable = isApiKeyAvailable('google');

  const copyEnvTemplate = () => {
    const envTemplate = `# API Keys for Cognitive Load Analysis Platform

# OpenAI ChatGPT API Key
VITE_OPENAI_API_KEY=your_openai_api_key_here

# xAI Grok API Key
VITE_GROK_API_KEY=your_grok_api_key_here

# Environment Configuration
VITE_ENVIRONMENT=development
VITE_API_BASE_URL=http://localhost:3000

# Optional: Google Custom Search API
VITE_GOOGLE_SEARCH_API_KEY=your_google_search_api_key_here
VITE_GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id_here`;

    navigator.clipboard.writeText(envTemplate);
    alert('Environment template copied to clipboard!');
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <Key className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">API Key Status</h3>
            <p className="text-sm text-gray-600">Check your API key configuration</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="sr-only">Close</span>
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent border-r-transparent transform rotate-45"></div>
          </button>
        )}
      </div>

      {/* API Key Status */}
      <div className="space-y-4 mb-6">
        <div className={`flex items-center justify-between p-4 rounded-xl border ${
          openaiAvailable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-3">
            {openaiAvailable ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <div>
              <h4 className="font-semibold text-gray-800">OpenAI ChatGPT</h4>
              <p className="text-sm text-gray-600">VITE_OPENAI_API_KEY</p>
            </div>
          </div>
          <span className={`text-sm font-medium ${
            openaiAvailable ? 'text-green-700' : 'text-red-700'
          }`}>
            {openaiAvailable ? 'Configured' : 'Missing'}
          </span>
        </div>

        <div className={`flex items-center justify-between p-4 rounded-xl border ${
          grokAvailable ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-3">
            {grokAvailable ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <div>
              <h4 className="font-semibold text-gray-800">xAI Grok</h4>
              <p className="text-sm text-gray-600">VITE_GROK_API_KEY</p>
            </div>
          </div>
          <span className={`text-sm font-medium ${
            grokAvailable ? 'text-green-700' : 'text-red-700'
          }`}>
            {grokAvailable ? 'Configured' : 'Missing'}
          </span>
        </div>

        <div className={`flex items-center justify-between p-4 rounded-xl border ${
          googleAvailable ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center space-x-3">
            {googleAvailable ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Settings className="h-5 w-5 text-gray-600" />
            )}
            <div>
              <h4 className="font-semibold text-gray-800">Google Search (Optional)</h4>
              <p className="text-sm text-gray-600">VITE_GOOGLE_SEARCH_API_KEY</p>
            </div>
          </div>
          <span className={`text-sm font-medium ${
            googleAvailable ? 'text-green-700' : 'text-gray-700'
          }`}>
            {googleAvailable ? 'Configured' : 'Optional'}
          </span>
        </div>
      </div>

      {/* Setup Instructions */}
      {(!openaiAvailable || !grokAvailable) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-800 mb-2">Setup Required</h4>
              <p className="text-sm text-blue-700 mb-3">
                You need to configure API keys to use the AI research assistants. Follow these steps:
              </p>
              
              <div className="space-y-2 text-sm text-blue-700">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                  <span>Create a <code className="bg-blue-100 px-1 rounded">.env</code> file in the project root</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                  <span>Add your API keys to the file</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                  <span>Restart the development server</span>
                </div>
              </div>

              <div className="flex space-x-3 mt-4">
                <button
                  onClick={copyEnvTemplate}
                  className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy Template</span>
                </button>
                <button
                  onClick={() => setShowSetup(!showSetup)}
                  className="flex items-center space-x-2 px-3 py-2 bg-white border border-blue-300 text-blue-700 text-sm rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>{showSetup ? 'Hide' : 'Show'} Setup Guide</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Setup Guide */}
      {showSetup && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <h4 className="font-semibold text-gray-800 mb-3">Detailed Setup Guide</h4>
          
          <div className="space-y-4 text-sm">
            <div>
              <h5 className="font-medium text-gray-700 mb-2">1. Get OpenAI API Key</h5>
              <div className="flex items-center space-x-2">
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                >
                  <span>Visit OpenAI Platform</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-gray-700 mb-2">2. Get Grok API Key</h5>
              <div className="flex items-center space-x-2">
                <a
                  href="https://console.x.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                >
                  <span>Visit xAI Console</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div>
              <h5 className="font-medium text-gray-700 mb-2">3. Create .env File</h5>
              <p className="text-gray-600 mb-2">Create a file named <code className="bg-gray-200 px-1 rounded">.env</code> in the project root directory.</p>
              <p className="text-gray-600">Replace the placeholder values with your actual API keys.</p>
            </div>

            <div>
              <h5 className="font-medium text-gray-700 mb-2">4. Restart Development Server</h5>
              <p className="text-gray-600">Stop the current server (Ctrl+C) and restart it with <code className="bg-gray-200 px-1 rounded">npm run dev</code></p>
            </div>
          </div>
        </div>
      )}

      {/* Status Summary */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Overall Status:</span>
          <span className={`text-sm font-medium ${
            openaiAvailable && grokAvailable ? 'text-green-700' : 'text-orange-700'
          }`}>
            {openaiAvailable && grokAvailable ? 'Ready' : 'Setup Required'}
          </span>
        </div>
      </div>
    </div>
  );
};
