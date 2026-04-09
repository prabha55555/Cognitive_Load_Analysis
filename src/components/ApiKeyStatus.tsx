import { AlertCircle, CheckCircle, Copy, ExternalLink, Key, Settings } from 'lucide-react';
import { useState } from 'react';
import { API_CONFIG } from '../config/apiConfig';

interface ApiKeyStatusProps {
  onClose?: () => void;
}

export const ApiKeyStatus: React.FC<ApiKeyStatusProps> = ({ onClose }) => {
  const [showSetup, setShowSetup] = useState(false);

  // Check if API keys are available
  const openaiAvailable = !!API_CONFIG.OPENAI.API_KEY;
  const grokAvailable = !!API_CONFIG.GROK.API_KEY;
  const geminiAvailable = !!API_CONFIG.GEMINI?.API_KEY;

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
    <div className="cla-surface max-w-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-500/20">
            <Key className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">API Key Status</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">Check your API key configuration</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-full p-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="sr-only">Close</span>
            <div className="h-4 w-4 rotate-45 transform border-2 border-slate-400 border-r-transparent border-t-transparent"></div>
          </button>
        )}
      </div>

      {/* API Key Status */}
      <div className="space-y-4 mb-6">
        <div className={`flex items-center justify-between p-4 rounded-xl border ${
          openaiAvailable
            ? 'border-emerald-200/70 bg-emerald-500/10 dark:border-emerald-500/30'
            : 'border-rose-200/70 bg-rose-500/10 dark:border-rose-500/30'
        }`}>
          <div className="flex items-center space-x-3">
            {openaiAvailable ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">OpenAI ChatGPT</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">VITE_OPENAI_API_KEY</p>
            </div>
          </div>
          <span className={`text-sm font-medium ${
            openaiAvailable ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
          }`}>
            {openaiAvailable ? 'Configured' : 'Missing'}
          </span>
        </div>

        <div className={`flex items-center justify-between p-4 rounded-xl border ${
          grokAvailable
            ? 'border-emerald-200/70 bg-emerald-500/10 dark:border-emerald-500/30'
            : 'border-rose-200/70 bg-rose-500/10 dark:border-rose-500/30'
        }`}>
          <div className="flex items-center space-x-3">
            {grokAvailable ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">xAI Grok</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">VITE_GROK_API_KEY</p>
            </div>
          </div>
          <span className={`text-sm font-medium ${
            grokAvailable ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
          }`}>
            {grokAvailable ? 'Configured' : 'Missing'}
          </span>
        </div>

        <div className={`flex items-center justify-between p-4 rounded-xl border ${
          geminiAvailable
            ? 'border-emerald-200/70 bg-emerald-500/10 dark:border-emerald-500/30'
            : 'border-slate-200/70 bg-slate-100/80 dark:border-slate-700 dark:bg-slate-800/80'
        }`}>
          <div className="flex items-center space-x-3">
            {geminiAvailable ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <Settings className="h-5 w-5 text-slate-600 dark:text-slate-300" />
            )}
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100">Google Gemini (ChatGPT Interface)</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">VITE_GEMINI_API_KEY</p>
            </div>
          </div>
          <span className={`text-sm font-medium ${
            geminiAvailable ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'
          }`}>
            {geminiAvailable ? 'Configured' : 'Required'}
          </span>
        </div>
      </div>

      {/* Setup Instructions */}
      {(!openaiAvailable || !grokAvailable) && (
        <div className="mb-6 rounded-xl border border-blue-200/70 bg-blue-500/10 p-4 dark:border-blue-500/30">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="mb-2 font-semibold text-blue-900 dark:text-blue-200">Setup Required</h4>
              <p className="mb-3 text-sm text-blue-800 dark:text-blue-200/90">
                You need to configure API keys to use the AI research assistants. Follow these steps:
              </p>
              
              <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200/90">
                <div className="flex items-center space-x-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-200 text-xs font-bold dark:bg-blue-500/30">1</span>
                  <span>Create a <code className="rounded bg-blue-100 px-1 dark:bg-blue-500/20">.env</code> file in the project root</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-200 text-xs font-bold dark:bg-blue-500/30">2</span>
                  <span>Add your API keys to the file</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-200 text-xs font-bold dark:bg-blue-500/30">3</span>
                  <span>Restart the development server</span>
                </div>
              </div>

              <div className="flex space-x-3 mt-4">
                <button
                  onClick={copyEnvTemplate}
                  className="flex items-center space-x-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy Template</span>
                </button>
                <button
                  onClick={() => setShowSetup(!showSetup)}
                  className="flex items-center space-x-2 rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-blue-700 transition-colors hover:bg-blue-50 dark:border-blue-500/40 dark:bg-slate-900 dark:text-blue-200 dark:hover:bg-slate-800"
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
        <div className="rounded-xl border border-slate-200/70 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/70">
          <h4 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">Detailed Setup Guide</h4>
          
          <div className="space-y-4 text-sm">
            <div>
              <h5 className="mb-2 font-medium text-slate-700 dark:text-slate-200">1. Get OpenAI API Key</h5>
              <div className="flex items-center space-x-2">
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                >
                  <span>Visit OpenAI Platform</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div>
              <h5 className="mb-2 font-medium text-slate-700 dark:text-slate-200">2. Get Grok API Key</h5>
              <div className="flex items-center space-x-2">
                <a
                  href="https://console.x.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
                >
                  <span>Visit xAI Console</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            <div>
              <h5 className="mb-2 font-medium text-slate-700 dark:text-slate-200">3. Create .env File</h5>
              <p className="mb-2 text-slate-600 dark:text-slate-300">Create a file named <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">.env</code> in the project root directory.</p>
              <p className="text-slate-600 dark:text-slate-300">Replace the placeholder values with your actual API keys.</p>
            </div>

            <div>
              <h5 className="mb-2 font-medium text-slate-700 dark:text-slate-200">4. Restart Development Server</h5>
              <p className="text-slate-600 dark:text-slate-300">Stop the current server (Ctrl+C) and restart it with <code className="rounded bg-slate-200 px-1 dark:bg-slate-700">npm run dev</code></p>
            </div>
          </div>
        </div>
      )}

      {/* Status Summary */}
      <div className="mt-6 border-t border-slate-200/70 pt-4 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600 dark:text-slate-300">Overall Status:</span>
          <span className={`text-sm font-medium ${
            openaiAvailable && grokAvailable ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'
          }`}>
            {openaiAvailable && grokAvailable ? 'Ready' : 'Setup Required'}
          </span>
        </div>
      </div>
    </div>
  );
};
