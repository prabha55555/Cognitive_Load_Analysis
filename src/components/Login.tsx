import React, { useState } from 'react';
import { Brain, Users, FlaskConical } from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, name: string, userType: 'participant' | 'admin') => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [userType, setUserType] = useState<'participant' | 'admin'>('participant');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && name) {
      onLogin(email, name, userType);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="flex min-h-screen items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center">
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="h-12 w-12 text-blue-600" />
                <FlaskConical className="h-10 w-10 text-purple-600" />
              </div>
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              EEG Research Platform
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Cognitive Load vs Creativity Study
            </p>
            <p className="text-xs text-gray-500 mt-1">
              ChatGPT vs Google Search Comparison
            </p>
          </div>

          {/* Login Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="space-y-6">
                {/* User Type Selection */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Login As</label>
                  <div className="mt-2 flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="participant"
                        checked={userType === 'participant'}
                        onChange={(e) => setUserType(e.target.value as 'participant' | 'admin')}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        Participant
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="admin"
                        checked={userType === 'admin'}
                        onChange={(e) => setUserType(e.target.value as 'participant' | 'admin')}
                        className="h-4 w-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                      />
                      <span className="ml-2 text-sm text-gray-700 flex items-center">
                        <FlaskConical className="h-4 w-4 mr-1" />
                        Researcher
                      </span>
                    </label>
                  </div>
                </div>

                {/* Name Field */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="your.email@university.edu"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6">
                <button
                  type="submit"
                  disabled={!email || !name}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {userType === 'participant' ? 'Join Study' : 'Access Dashboard'}
                </button>
              </div>
            </div>
          </form>

          {/* Study Information */}
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Study Information</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Duration: Approximately 30-45 minutes</p>
              <p>• Tasks: Research topic, complete creativity assessments</p>
              <p>• EEG monitoring: Real-time cognitive load measurement</p>
              <p>• Platforms: Random assignment to ChatGPT or Google Search</p>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              This study has been approved by the Institutional Review Board.
              Your participation is voluntary and data will be anonymized.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};