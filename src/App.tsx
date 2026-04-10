import { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";
import { AdminDashboard } from "./components/AdminDashboard";
import { LandingPage } from "./components/LandingPage";
import { Login } from "./components/Login";
import { ParticipantDashboard } from "./components/ParticipantDashboard";
import { mockParticipants, researchTopics } from "./data/mockData";
import { authService } from "./services/authService";
import { Participant } from "./types";

function App() {
  const [currentUser, setCurrentUser] = useState<{
    email: string;
    name: string;
    type: "participant" | "admin";
    participant?: Participant;
  } | null>(null);

  const [showLanding, setShowLanding] = useState(true);
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  useEffect(() => {
    // Set body background
    document.body.style.backgroundColor = "#090a0c";

    const restoreSession = async () => {
      const user = await authService.getCurrentUser();

      if (!user) {
        setIsRestoringSession(false);
        return;
      }

      handleLogin(user.email, user.name, user.role);
      setShowLanding(false);
      setIsRestoringSession(false);
    };

    restoreSession();
  }, []);

  const handleJoinStudy = () => {
    setShowLanding(false);
  };

  const handleLogin = (
    email: string,
    name: string,
    userType: "participant" | "admin",
  ) => {
    const targetPath = userType === "admin" ? "/admin" : "/participant";

    // Ensure UI state and URL are in sync immediately after auth succeeds.
    setShowLanding(false);
    setIsRestoringSession(false);
    if (window.location.pathname !== targetPath) {
      window.history.replaceState(null, "", targetPath);
    }

    if (userType === "participant") {
      // For demo purposes, create a new participant or use existing one
      let participant = mockParticipants.find((p) => p.email === email);

      if (!participant) {
        // Create new participant with random assignment
        const platforms: ("chatgpt" | "google")[] = ["chatgpt", "google"];
        const randomPlatform =
          platforms[Math.floor(Math.random() * platforms.length)];
        const randomTopic =
          researchTopics[Math.floor(Math.random() * researchTopics.length)];

        participant = {
          id: `p${Date.now()}`,
          name,
          email,
          assignedPlatform: randomPlatform,
          currentPhase: "research",
          sessionStart: new Date(),
          researchTopic: randomTopic.title,
          cognitiveLoadScore: 0,
          creativityScore: 0,
          isActive: true,
        };
      }

      setCurrentUser({
        email,
        name,
        type: userType,
        participant,
      });
    } else {
      setCurrentUser({
        email,
        name,
        type: userType,
      });
    }
  };

  const handlePhaseComplete = (phase: Participant["currentPhase"]) => {
    if (currentUser && currentUser.participant) {
      const updatedParticipant = {
        ...currentUser.participant,
        currentPhase: phase,
        isActive: phase !== "completed",
      };

      setCurrentUser({
        ...currentUser,
        participant: updatedParticipant,
      });
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setShowLanding(true);
    if (window.location.pathname !== "/") {
      window.history.replaceState(null, "", "/");
    }
  };

  if (isRestoringSession) {
    return null;
  }

  // Show landing page if no user is logged in and landing should be shown
  if (showLanding && !currentUser) {
    return <LandingPage onJoinStudy={handleJoinStudy} />;
  }

  // Show login if no user is logged in
  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="min-h-[100dvh] text-white">
        <Routes>
          <Route
            path="/"
            element={
              currentUser.type === "admin" ? (
                <Navigate to="/admin" replace />
              ) : (
                <Navigate to="/participant" replace />
              )
            }
          />

          <Route
            path="/participant"
            element={
              currentUser.type === "participant" && currentUser.participant ? (
                <ParticipantDashboard
                  participant={currentUser.participant}
                  onPhaseComplete={handlePhaseComplete}
                  onLogout={handleLogout}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route
            path="/admin"
            element={
              currentUser.type === "admin" ? (
                <AdminDashboard onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
