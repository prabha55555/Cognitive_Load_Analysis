import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './components/Login';
import { ParticipantDashboard } from './components/ParticipantDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { mockParticipants, researchTopics } from './data/mockData';
import { Participant } from './types';

function App() {
  const [currentUser, setCurrentUser] = useState<{
    email: string;
    name: string;
    type: 'participant' | 'admin';
    participant?: Participant;
  } | null>(null);

  const handleLogin = (email: string, name: string, userType: 'participant' | 'admin') => {
    if (userType === 'participant') {
      // For demo purposes, create a new participant or use existing one
      let participant = mockParticipants.find(p => p.email === email);
      
      if (!participant) {
        // Create new participant with random assignment
        const platforms: ('chatgpt' | 'google')[] = ['chatgpt', 'google'];
        const randomPlatform = platforms[Math.floor(Math.random() * platforms.length)];
        const randomTopic = researchTopics[Math.floor(Math.random() * researchTopics.length)];
        
        participant = {
          id: `p${Date.now()}`,
          name,
          email,
          assignedPlatform: randomPlatform,
          currentPhase: 'research',
          sessionStart: new Date(),
          researchTopic: randomTopic.title,
          cognitiveLoadScore: 0,
          creativityScore: 0,
          isActive: true
        };
      }

      setCurrentUser({
        email,
        name,
        type: userType,
        participant
      });
    } else {
      setCurrentUser({
        email,
        name,
        type: userType
      });
    }
  };

  const handlePhaseComplete = (phase: string) => {
    if (currentUser && currentUser.participant) {
      const updatedParticipant = {
        ...currentUser.participant,
        currentPhase: phase as any,
        isActive: phase !== 'completed'
      };
      
      setCurrentUser({
        ...currentUser,
        participant: updatedParticipant
      });
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route 
            path="/" 
            element={
              currentUser.type === 'admin' ? (
                <Navigate to="/admin" replace />
              ) : (
                <Navigate to="/participant" replace />
              )
            } 
          />
          
          <Route 
            path="/participant" 
            element={
              currentUser.type === 'participant' && currentUser.participant ? (
                <ParticipantDashboard 
                  participant={currentUser.participant}
                  onPhaseComplete={handlePhaseComplete}
                />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          
          <Route 
            path="/admin" 
            element={
              currentUser.type === 'admin' ? (
                <AdminDashboard />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Logout Button (Fixed Position) */}
        <button
          onClick={handleLogout}
          className="fixed bottom-4 right-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg transition-colors z-50"
        >
          Logout
        </button>
      </div>
    </Router>
  );
}

export default App;