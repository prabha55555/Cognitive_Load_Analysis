import { useEffect, useState } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import { AdminDashboard } from './components/AdminDashboard';
import { AuthPage } from './components/AuthPage';
import { LandingPage } from './components/LandingPage';
import { ParticipantDashboard } from './components/ParticipantDashboard';
import { mockParticipants, researchTopics } from './data/mockData';
import { authService } from './services/authService';
import { Participant } from './types';

function App() {
  const [currentUser, setCurrentUser] = useState<{
    email: string;
    name: string;
    type: 'participant' | 'admin';
    participant?: Participant;
  } | null>(null);

  const [showLanding, setShowLanding] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const handleJoinStudy = () => {
    setShowLanding(false);
  };

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
    
    // Hide landing page after login
    setShowLanding(false);
  };

  // Check for existing session on mount and handle OAuth callback
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if this is an OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const isCallback = window.location.pathname.includes('/auth/callback') || 
                          urlParams.has('code') || 
                          window.location.hash.includes('access_token');
        
        if (isCallback) {
          console.log('[AUTH] Handling OAuth callback...');
          const authResponse = await authService.handleOAuthCallback();
          
          if (authResponse) {
            handleLogin(authResponse.user.email, authResponse.user.name, authResponse.user.role as 'participant' | 'admin');
            // Clean up URL
            window.history.replaceState({}, document.title, '/');
          }
        } else {
          // Check for existing session
          const session = await authService.getCurrentSession();
          if (session) {
            handleLogin(session.user.email, session.user.name, session.user.role as 'participant' | 'admin');
          }
        }
      } catch (error) {
        console.error('[AUTH] Auth check failed:', error);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePhaseComplete = (phase: string) => {
    console.log('==========================================');
    console.log('📍 PHASE COMPLETE - UPDATING PARTICIPANT');
    console.log('New phase:', phase);
    console.log('Current user:', currentUser);
    console.log('Current participant:', currentUser?.participant);
    console.log('Current participant topic:', currentUser?.participant?.researchTopic);
    console.log('==========================================');
    
    if (currentUser && currentUser.participant) {
      const updatedParticipant = {
        ...currentUser.participant,
        currentPhase: phase as any,
        isActive: phase !== 'completed'
      };
      
      console.log('==========================================');
      console.log('✅ UPDATED PARTICIPANT');
      console.log('New phase:', updatedParticipant.currentPhase);
      console.log('Research Topic:', updatedParticipant.researchTopic);
      console.log('Full updated participant:', updatedParticipant);
      console.log('==========================================');
      
      setCurrentUser({
        ...currentUser,
        participant: updatedParticipant
      });
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setShowLanding(true);
  };

  // Show loading while checking auth
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page if no user is logged in and landing should be shown
  if (showLanding && !currentUser) {
    return <LandingPage onJoinStudy={handleJoinStudy} />;
  }

  // Show login if no user is logged in
  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} />;
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

        {/* Enhanced Logout Button */}
        <button
          onClick={handleLogout}
          className="fixed bottom-6 right-6 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 z-50 font-medium"
        >
          Logout
        </button>
      </div>
    </Router>
  );
}

export default App;