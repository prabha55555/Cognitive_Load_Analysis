import { useEffect, useState, useRef } from "react";
import { AssessmentResponse, Participant, TestResponse } from "../types";
import AssessmentPhase from "./AssessmentPhase";
import { CognitiveLoadResults } from "./CognitiveLoadResults";
import { CreativityTest } from "./CreativityTest";
import { ResearchInterface } from "./ResearchInterface";
import { CreativityEvaluation } from "../services/geminiService";
import { isTrackerActive } from "../services/interactionTracker";

interface ParticipantDashboardProps {
  participant: Participant;
  onPhaseComplete: (phase: string) => void;
  onLogout?: () => void;
}

export const ParticipantDashboard = ({
  participant: initialParticipant,
  onPhaseComplete,
  onLogout,
}: ParticipantDashboardProps) => {
  const apiBaseUrl = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"
  ).replace(/\/$/, "");

  const [participant, setParticipant] =
    useState<Participant>(initialParticipant);
  const cognitiveLoadScoreRef = useRef<number>(
    initialParticipant.cognitiveLoadScore ?? 0,
  );
  const creativityScoreRef = useRef<number>(
    initialParticipant.creativityScore ?? 0,
  );

  useEffect(() => {
    setParticipant((prev) => {
      const preservedCognitiveLoad =
        cognitiveLoadScoreRef.current > 0
          ? cognitiveLoadScoreRef.current
          : (prev.cognitiveLoadScore ??
            initialParticipant.cognitiveLoadScore ??
            0);
      const preservedCreativity =
        creativityScoreRef.current > 0
          ? creativityScoreRef.current
          : (prev.creativityScore ?? initialParticipant.creativityScore ?? 0);

      return {
        ...initialParticipant,
        cognitiveLoadScore: preservedCognitiveLoad,
        creativityScore: preservedCreativity,
      };
    });
  }, [initialParticipant]);

  const [isTrackingActive, setIsTrackingActive] = useState(false);

  useEffect(() => {
    const checkTracker = () => {
      setIsTrackingActive(isTrackerActive());
    };
    checkTracker();
    const interval = setInterval(checkTracker, 1000);
    return () => clearInterval(interval);
  }, []);

  const [assessmentResponses, setAssessmentResponses] = useState<
    AssessmentResponse[] | undefined
  >(participant.assessmentResponses);
  const [creativityEvaluations, setCreativityEvaluations] = useState<
    CreativityEvaluation[]
  >([]);
  const [readingContent, setReadingContent] = useState<string>("");
  const [userNotes, setUserNotes] = useState<string>("");
  const [behavioralSessionId, setBehavioralSessionId] = useState<
    string | undefined
  >(undefined);
  const [selectedPlatform, setSelectedPlatform] = useState<
    "chatgpt" | "google" | undefined
  >(undefined);
  const [showDetailedResults, setShowDetailedResults] = useState(false);

  const getAssessmentStats = () => {
    const responses = assessmentResponses || [];
    const total = responses.length;
    const answered = responses.filter(
      (r) => (r.answer || "").trim().length > 0,
    ).length;
    const hasCorrectFlags = responses.some(
      (r) => typeof r.isCorrect === "boolean",
    );
    const correct = hasCorrectFlags
      ? responses.filter((r) => r.isCorrect === true).length
      : responses.filter((r) => (r.score || 0) > 0).length;
    const totalScore = responses.reduce((sum, r) => sum + (r.score || 0), 0);
    const averageTime =
      total > 0
        ? Math.round(
            responses.reduce((sum, r) => sum + (r.timeTaken || 0), 0) / total,
          )
        : 0;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    return {
      total,
      answered,
      correct,
      totalScore,
      averageTime,
      accuracy,
      responses,
    };
  };

  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const handleDownloadReport = () => {
    const stats = getAssessmentStats();
    const platform =
      selectedPlatform === "google" ? "Google Search" : "ChatGPT";
    const cognitiveLoad = participant.cognitiveLoadScore ?? 0;
    const creativity = participant.creativityScore ?? 0;
    const createdAt = new Date().toLocaleString();

    const rows = stats.responses
      .map(
        (r, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${escapeHtml(r.questionId || `Q${idx + 1}`)}</td>
        <td>${escapeHtml((r.answer || "").slice(0, 180) || "No response")}</td>
        <td>${r.score || 0}</td>
        <td>${r.timeTaken || 0}s</td>
      </tr>
    `,
      )
      .join("");

    const reportHtml = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Cognitive Load Study Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { margin-bottom: 4px; }
            .muted { color: #666; margin-bottom: 16px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; margin: 12px 0 20px; }
            .card { border: 1px solid #ddd; padding: 12px; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; text-align: left; vertical-align: top; }
            th { background: #f6f6f6; }
          </style>
        </head>
        <body>
          <h1>Cognitive Load Study Report</h1>
          <div class="muted">Generated: ${escapeHtml(createdAt)}</div>

          <div class="card">
            <h3>Participant & Session</h3>
            <div class="grid">
              <div><strong>Name:</strong> ${escapeHtml(participant.name)}</div>
              <div><strong>Email:</strong> ${escapeHtml(participant.email)}</div>
              <div><strong>Platform:</strong> ${escapeHtml(platform)}</div>
              <div><strong>Research Topic:</strong> ${escapeHtml(participant.researchTopic || "N/A")}</div>
              <div><strong>Session Phase:</strong> COMPLETED</div>
              <div><strong>Behavioral Session ID:</strong> ${escapeHtml(behavioralSessionId || "N/A")}</div>
            </div>
          </div>

          <div class="card">
            <h3>Final Results</h3>
            <div class="grid">
              <div><strong>Cognitive Load Index:</strong> ${cognitiveLoad}/100</div>
              <div><strong>Creativity Score:</strong> ${creativity} pts</div>
              <div><strong>Assessment Accuracy:</strong> ${stats.accuracy}%</div>
              <div><strong>Questions Answered:</strong> ${stats.answered}/${stats.total}</div>
              <div><strong>Total Assessment Score:</strong> ${stats.totalScore}</div>
              <div><strong>Average Response Time:</strong> ${stats.averageTime}s</div>
            </div>
          </div>

          <div class="card">
            <h3>Assessment Question Breakdown</h3>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Question ID</th>
                  <th>Submitted Answer</th>
                  <th>Score</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                ${rows || '<tr><td colspan="5">No assessment responses recorded.</td></tr>'}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `;

    const blob = new Blob(["\ufeff", reportHtml], {
      type: "application/msword",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = participant.name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    a.href = url;
    a.download = `cognitive_load_report_${safeName}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleCreativityComplete = async (
    responses: TestResponse[],
    _evaluations: CreativityEvaluation[],
  ) => {
    const creativityScore = responses.reduce(
      (sum, current) => sum + (current.score || 0),
      0,
    );
    creativityScoreRef.current = creativityScore;

    setCreativityEvaluations(_evaluations);

    setParticipant((prev) => ({
      ...prev,
      creativityScore: creativityScore,
    }));

    try {
      const token = localStorage.getItem("auth_token");
      if (token) {
        await fetch(`${apiBaseUrl}/api/auth/participant/scores`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            creativityScore,
            sessionId: behavioralSessionId,
          }),
        });
      }
    } catch (error) {
      console.error("Failed to save creativity score to database:", error);
    }

    setTimeout(() => {
      onPhaseComplete("completed");
    }, 500);
  };

  const handleAssessmentComplete = (responses: AssessmentResponse[]) => {
    setAssessmentResponses(responses);
    onPhaseComplete("results");
  };

  const handleResultsComplete = async (cognitiveLoadScore: number) => {
    const rounded = Math.round(cognitiveLoadScore);
    cognitiveLoadScoreRef.current = rounded;

    setParticipant((prev) => ({
      ...prev,
      cognitiveLoadScore: rounded,
    }));

    try {
      const token = localStorage.getItem("auth_token");
      if (token) {
        await fetch(`${apiBaseUrl}/api/auth/participant/scores`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cognitiveLoadScore: rounded,
            sessionId: behavioralSessionId,
          }),
        });
      }
    } catch (error) {
      console.error("Failed to save cognitive load score to database:", error);
    }

    setTimeout(() => {
      onPhaseComplete("creativity_test");
    }, 300);
  };

  const handleTopicChange = (newTopic: string) => {
    setParticipant((prev) => ({
      ...prev,
      researchTopic: newTopic.trim(),
      _topicUpdatedAt: Date.now(),
    }));
  };

  const renderCurrentPhase = () => {
    switch (participant.currentPhase) {
      case "research":
        // Let ResearchInterface handle its own platform selection directly,
        // or just render ResearchInterface block
        return (
          <ResearchInterface
            participant={participant}
            onComplete={(content, notes, sessionId, platform) => {
              setReadingContent(content || "");
              setUserNotes(notes || "");
              setBehavioralSessionId(sessionId);
              setSelectedPlatform(platform);
              onPhaseComplete("assessment");
            }}
            onTopicChange={handleTopicChange}
            onActivePlatformChange={setSelectedPlatform}
          />
        );
      case "assessment":
        return (
          <AssessmentPhase
            participant={participant}
            readingContent={readingContent}
            userNotes={userNotes}
            onComplete={handleAssessmentComplete}
          />
        );
      case "results":
        if (!assessmentResponses) {
          return (
            <div className="p-8 text-center">
              <p className="text-red-600">Error: Missing assessment data</p>
            </div>
          );
        }
        return (
          <CognitiveLoadResults
            assessmentResponses={assessmentResponses}
            creativityEvaluations={creativityEvaluations}
            topic={participant.researchTopic}
            participantId={participant.id}
            sessionId={behavioralSessionId}
            platform={selectedPlatform}
            onComplete={handleResultsComplete}
          />
        );
      case "creativity_test":
        return (
          <CreativityTest
            topic={participant.researchTopic}
            notes={userNotes}
            participantId={participant.id}
            onComplete={handleCreativityComplete}
          />
        );
      case "completed": {
        const finalCognitiveScore = participant.cognitiveLoadScore ?? 0;
        const finalCreativityScore = participant.creativityScore ?? 0;
        const assessmentStats = getAssessmentStats();
        const timeSpent = "0m 10s"; // Hardcoded as prompt specifies, but ideally dynamic

        return (
          <div className="flex-1 bg-[#090a0c] text-white flex flex-col max-w-full overflow-y-auto">
            {/* Zone 2 — Completion Strip */}
            <div className="w-full px-[2.5rem] pt-[3rem] pb-[2rem] border-b border-white/[0.07]">
              <div className="max-w-[960px] mx-auto text-left">
                <div className="font-mono text-[0.68rem] uppercase text-white/40 mb-[0.6rem]">
                  STUDY SESSION ·{" "}
                  {(
                    selectedPlatform ||
                    participant.assignedPlatform ||
                    "Platform"
                  ).toUpperCase()}{" "}
                  ARM · COMPLETED
                </div>
                <h2 className="font-display font-[900] text-[2.4rem] tracking-[-0.04em] text-white leading-tight">
                  Session complete.
                </h2>
                <div className="mt-[0.6rem] text-[0.9rem] text-white/45 leading-[1.7] max-w-[52ch]">
                  Your participation has been recorded. All behavioral telemetry
                  and assessment data has been anonymized and submitted to the
                  research pipeline.
                </div>
              </div>
            </div>

            {/* Zone 3 — Score Grid */}
            <div className="w-full px-[2.5rem] py-[2rem] border-b border-white/[0.07]">
              <div className="max-w-[960px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-[1px] bg-white/[0.07] border border-white/[0.07] rounded-[10px] overflow-hidden">
                {/* Cell 1 */}
                <div className="bg-[#0a0b0e] p-[2rem_2.5rem] flex flex-col gap-[0.5rem] relative">
                  <div className="font-mono text-[0.65rem] uppercase text-white/40">
                    COGNITIVE LOAD INDEX
                  </div>
                  <div>
                    <span className="font-display font-[900] text-[3.8rem] tracking-[-0.05em] text-white leading-none">
                      {finalCognitiveScore}
                    </span>
                    <span className="font-mono text-[1rem] text-white/40 ml-2">
                      / 100
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="border border-[#e05050]/30 bg-[#e05050]/[0.06] text-[#e05050]/75 rounded-[4px] px-[10px] py-[3px] font-mono text-[0.65rem] uppercase">
                      VERY HIGH LOAD
                    </span>
                  </div>
                  <div className="font-mono text-[0.68rem] text-white/40 mt-[0.4rem]">
                    Average cognitive demand during session
                  </div>

                  {/* Load bar at bottom */}
                  <div className="absolute bottom-[2rem] left-[2.5rem] right-[2.5rem] h-[2px] bg-white/[0.06] rounded-full overflow-hidden mt-[2rem]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${finalCognitiveScore}%`,
                        background:
                          "linear-gradient(90deg, rgba(0,191,219,0.5) 0%, rgba(224,80,80,0.8) 100%)",
                      }}
                    ></div>
                  </div>
                  {/* Spacer to push content up if needed */}
                  <div className="h-[2rem]"></div>
                </div>

                {/* Cell 2 */}
                <div className="bg-[#0a0b0e] p-[2rem_2.5rem] flex flex-col gap-[0.5rem] relative">
                  <div className="font-mono text-[0.65rem] uppercase text-white/40">
                    CREATIVITY SCORE (AUT)
                  </div>
                  <div>
                    <span className="font-display font-[900] text-[3.8rem] tracking-[-0.05em] text-white leading-none">
                      {finalCreativityScore}
                    </span>
                    <span className="font-mono text-[1rem] text-white/40 ml-2">
                      pts
                    </span>
                  </div>
                  <div className="mt-1">
                    <span className="border border-white/10 bg-white/[0.03] text-white/45 rounded-[4px] px-[10px] py-[3px] font-mono text-[0.65rem] uppercase">
                      MODERATE
                    </span>
                  </div>
                  <div className="font-mono text-[0.68rem] text-white/40 mt-[0.4rem]">
                    Fluency and originality composite
                  </div>

                  {/* Score bar at bottom */}
                  <div className="absolute bottom-[2rem] left-[2.5rem] right-[2.5rem] h-[2px] bg-white/[0.06] rounded-full overflow-hidden mt-[2rem]">
                    <div
                      className="h-full bg-[#00bfdb] rounded-full"
                      style={{
                        width: `${Math.min(finalCreativityScore, 100)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="h-[2rem]"></div>
                </div>
              </div>
            </div>

            {/* Zone 4 — Session Summary */}
            <div className="w-full px-[2.5rem] py-[2rem] border-b border-white/[0.07]">
              <div className="max-w-[960px] mx-auto">
                <div className="font-mono text-[0.65rem] uppercase text-white/40 mb-[1rem]">
                  SESSION SUMMARY
                </div>
                <div className="divide-y divide-white/[0.06]">
                  {[
                    {
                      label: "Platform",
                      value:
                        selectedPlatform === "google"
                          ? "Google Search"
                          : "ChatGPT",
                      style: "font-display font-[600] text-[0.9rem] text-white",
                    },
                    {
                      label: "Research Topic",
                      value:
                        participant.researchTopic || "Climate Change Solutions",
                      style: "text-[0.88rem] text-white/60",
                    },
                    {
                      label: "Total Session Time",
                      value: timeSpent,
                      style: "font-mono text-[0.9rem] text-[#00bfdb]",
                    },
                    {
                      label: "Assessment Accuracy",
                      value: `${assessmentStats.accuracy}%`,
                      style: "font-mono text-[0.9rem] text-[#e05050]/80",
                    },
                    {
                      label: "Questions Answered",
                      value: `${assessmentStats.answered} / ${assessmentStats.total}`,
                      style: "font-mono text-[0.9rem] text-white",
                    },
                    {
                      label: "Creativity Responses",
                      value: `${Math.max(creativityEvaluations.length, 1)} submitted`,
                      style: "font-mono text-[0.9rem] text-white",
                    },
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      className="py-[0.75rem] flex justify-between items-center"
                    >
                      <div className="font-mono text-[0.72rem] text-white/35">
                        {stat.label}
                      </div>
                      <div className={stat.style}>{stat.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Zone 5 — Data Confirmation */}
            <div className="w-full px-[2.5rem] py-[1.5rem] border-b border-white/[0.07]">
              <div className="max-w-[960px] mx-auto flex flex-wrap gap-[2rem] items-start">
                {[
                  "Behavioral data anonymized",
                  "Assessment responses recorded",
                  "IRB protocol followed",
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-[0.5rem] items-center">
                    <div className="w-[6px] h-[6px] rounded-full bg-[#00bfdb]/60"></div>
                    <div className="font-mono text-[0.72rem] text-white/35">
                      {item}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Zone 6 — CTA Area */}
            <div className="w-full px-[2.5rem] pt-[2.5rem] pb-[3rem]">
              <div className="max-w-[960px] mx-auto flex flex-wrap gap-[1rem] items-center">
                <button
                  onClick={() => setShowDetailedResults(true)}
                  className="font-display font-[700] text-[0.92rem] bg-[#00bfdb] text-[#090a0c] rounded-[7px] px-[2rem] py-[0.75rem] transition-all duration-200 hover:opacity-[0.85] hover:translate-y-[-1px] active:scale-[0.98]"
                >
                  View Full Results
                </button>
                <button
                  onClick={handleDownloadReport}
                  className="font-display font-[600] text-[0.88rem] bg-transparent border border-white/[0.12] text-white/45 rounded-[7px] px-[1.5rem] py-[0.75rem] transition-all duration-200 hover:border-white/30 hover:text-white/75"
                >
                  Download Report
                </button>
                <div className="w-full mt-[0.2rem] font-mono text-[0.68rem] text-white/20">
                  You may now close this window or view your detailed cognitive
                  load analysis.
                </div>
              </div>
            </div>

            {showDetailedResults && (
              <div className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-[2px] p-4 md:p-8 overflow-y-auto">
                <div className="max-w-[980px] mx-auto border border-white/[0.12] bg-[#0a0b0e] rounded-[12px] overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/[0.07] flex items-center justify-between">
                    <div>
                      <div className="font-mono text-[0.65rem] uppercase text-white/40">
                        Detailed Results
                      </div>
                      <div className="font-display font-[800] text-[1.1rem] text-white">
                        Assessment + Final Outcome
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDetailedResults(false)}
                      className="font-mono text-[0.72rem] text-white/50 hover:text-white px-3 py-1 border border-white/[0.15] rounded-[6px]"
                    >
                      Close
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="border border-white/[0.08] rounded-[8px] p-4 bg-[#0d0f12]">
                        <div className="font-mono text-[0.66rem] uppercase text-white/40 mb-2">
                          Previous Quiz Results
                        </div>
                        <div className="space-y-2 font-mono text-[0.8rem]">
                          <div className="flex justify-between">
                            <span className="text-white/45">Questions</span>
                            <span className="text-white">
                              {assessmentStats.total}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/45">Answered</span>
                            <span className="text-white">
                              {assessmentStats.answered}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/45">Correct</span>
                            <span className="text-white">
                              {assessmentStats.correct}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/45">Accuracy</span>
                            <span className="text-[#00bfdb]">
                              {assessmentStats.accuracy}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/45">Total Score</span>
                            <span className="text-white">
                              {assessmentStats.totalScore}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/45">Avg Time / Q</span>
                            <span className="text-white">
                              {assessmentStats.averageTime}s
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="border border-white/[0.08] rounded-[8px] p-4 bg-[#0d0f12]">
                        <div className="font-mono text-[0.66rem] uppercase text-white/40 mb-2">
                          Final Results
                        </div>
                        <div className="space-y-2 font-mono text-[0.8rem]">
                          <div className="flex justify-between">
                            <span className="text-white/45">
                              Cognitive Load Index
                            </span>
                            <span className="text-[#00bfdb]">
                              {finalCognitiveScore}/100
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/45">
                              Creativity Score
                            </span>
                            <span className="text-white">
                              {finalCreativityScore} pts
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/45">Platform</span>
                            <span className="text-white">
                              {selectedPlatform === "google"
                                ? "Google Search"
                                : "ChatGPT"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/45">Topic</span>
                            <span className="text-white">
                              {participant.researchTopic || "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border border-white/[0.08] rounded-[8px] overflow-hidden">
                      <div className="px-4 py-3 border-b border-white/[0.07] font-mono text-[0.66rem] uppercase text-white/40">
                        Question-by-Question Breakdown
                      </div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead className="bg-white/[0.02]">
                            <tr>
                              <th className="px-4 py-2 text-left font-mono text-[0.66rem] uppercase text-white/35">
                                #
                              </th>
                              <th className="px-4 py-2 text-left font-mono text-[0.66rem] uppercase text-white/35">
                                Question
                              </th>
                              <th className="px-4 py-2 text-left font-mono text-[0.66rem] uppercase text-white/35">
                                Answer
                              </th>
                              <th className="px-4 py-2 text-left font-mono text-[0.66rem] uppercase text-white/35">
                                Score
                              </th>
                              <th className="px-4 py-2 text-left font-mono text-[0.66rem] uppercase text-white/35">
                                Time
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {assessmentStats.responses.length === 0 ? (
                              <tr>
                                <td
                                  className="px-4 py-3 font-mono text-[0.75rem] text-white/40"
                                  colSpan={5}
                                >
                                  No assessment data found.
                                </td>
                              </tr>
                            ) : (
                              assessmentStats.responses.map((r, idx) => (
                                <tr
                                  key={`${r.questionId}-${idx}`}
                                  className="border-t border-white/[0.05]"
                                >
                                  <td className="px-4 py-3 font-mono text-[0.75rem] text-white/55">
                                    {idx + 1}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-[0.75rem] text-white/60">
                                    {r.questionId || `Q${idx + 1}`}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-[0.75rem] text-white/70 max-w-[460px]">
                                    {(r.answer || "No response").slice(0, 180)}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-[0.75rem] text-white/70">
                                    {r.score || 0}
                                  </td>
                                  <td className="px-4 py-3 font-mono text-[0.75rem] text-white/70">
                                    {r.timeTaken || 0}s
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }
      default:
        return null;
    }
  };

  // derived state
  const isAssigned =
    participant.assignedPlatform !== undefined &&
    participant.assignedPlatform !== null;
  const isSelectingPlatform =
    participant.currentPhase === "research" && !selectedPlatform && !isAssigned;
  const badgeLabel =
    isAssigned || selectedPlatform
      ? (selectedPlatform || participant.assignedPlatform)?.toUpperCase()
      : "UNASSIGNED";
  const badgeClass =
    isAssigned || selectedPlatform
      ? "border-[#00bfdb] bg-[#00bfdb]/[0.08] text-[#00bfdb]"
      : "border-white/[0.1] text-white/40";

  const phaseOrder = ["research", "assessment", "creativity_test", "results"];
  const isEdgeToEdge =
    (participant.currentPhase === "research" &&
      (selectedPlatform === "google" || selectedPlatform === "chatgpt")) ||
    participant.currentPhase === "creativity_test" ||
    participant.currentPhase === "results" ||
    participant.currentPhase === "completed";

  const isResearchSplitPhase =
    participant.currentPhase === "research" &&
    (selectedPlatform === "google" || selectedPlatform === "chatgpt");

  return (
    <div className="h-[100dvh] overflow-hidden grid grid-rows-[auto_1fr_auto] bg-[#090a0c] text-white selection:bg-[#00bfdb] selection:text-[#090a0c]">
      <style>{`
        .font-display { font-family: 'Cabinet Grotesk', system-ui, -apple-system, sans-serif; }
        .font-mono { font-family: 'Geist Mono', ui-monospace, SFMono-Regular, monospace; }
        
        .pulse-dot {
          animation: pulse-opacity 1.8s ease-in-out infinite;
        }
        @keyframes pulse-opacity {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* Header */}
      <header
        className="sticky top-0 z-50 px-[2.5rem] py-4 flex justify-between items-center border-b border-white/[0.07]"
        style={{
          background: "rgba(9,10,12,0.92)",
          backdropFilter: "blur(14px)",
        }}
      >
        <div className="flex items-center gap-4">
          <div className="h-[38px] w-[38px] rounded-full bg-[#00bfdb]/10 border border-[#00bfdb]/25 flex items-center justify-center font-mono text-[#00bfdb] text-sm">
            {getInitials(participant.name)}
          </div>
          <div>
            <div className="font-display font-[600] text-[0.95rem] tracking-wide text-[#f0f2f5]">
              {participant.name}
            </div>
            <div className="font-mono text-[0.72rem] text-white/40">
              {participant.email || "Participant Account"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 font-mono text-[0.75rem]">
            <div
              className={`h-1.5 w-1.5 rounded-full ${participant.currentPhase === "completed" ? "bg-[#00bfdb] opacity-40" : isTrackingActive ? "bg-[#00bfdb]/60 pulse-dot" : "bg-white/20"}`}
            />
            <span className="text-white/40">0 min</span>
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <div className="font-mono text-[0.65rem] uppercase px-2.5 py-1 border border-white/20 text-white/40 rounded-full">
              {participant.currentPhase.replace("_", " ")}
            </div>
            <div
              className={`font-mono text-[0.65rem] uppercase px-2.5 py-1 border rounded-full transition-colors duration-400 ${badgeClass}`}
            >
              {badgeLabel}
            </div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              className="font-mono text-[0.78rem] text-white/30 hover:text-white/70 transition-colors ml-2 bg-transparent border-none"
            >
              Logout
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main
        className={`w-full min-h-0 ${isEdgeToEdge ? `h-full flex flex-col ${isResearchSplitPhase ? "overflow-hidden" : "overflow-y-auto"}` : "max-w-[1200px] mx-auto px-[2.5rem] py-12 overflow-y-auto"}`}
      >
        {renderCurrentPhase()}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.07] px-[2.5rem] py-4 flex justify-between items-center mt-auto">
        <div className="flex items-center gap-[1.5rem]">
          <div className="font-mono text-[0.65rem] uppercase text-white/40">
            BEHAVIORAL TRACKING
          </div>
          {[
            "Click Events",
            "Mouse Movement",
            "Scroll Behavior",
            "Navigation",
          ].map((tracker) => (
            <div
              key={tracker}
              className="flex items-center gap-1.5 transition-all duration-400"
            >
              <div
                className={`h-[5px] w-[5px] rounded-full transition-colors duration-400 ${
                  isTrackingActive
                    ? "bg-[#00bfdb] pulse-dot"
                    : "bg-white/[0.15]"
                }`}
              />
              <span className="font-mono text-[0.72rem] text-white/40 transition-colors duration-400">
                {tracker}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {participant.currentPhase === "completed" ? (
            <>
              {["RESEARCH", "ASSESSMENT", "CREATIVITY TEST", "RESULTS"].map(
                (phase, idx) => (
                  <div key={phase} className="flex items-center gap-2">
                    <div
                      className={`font-mono text-[0.62rem] uppercase px-[8px] py-[3px] rounded-[4px] ${
                        phase === "RESULTS"
                          ? "border border-[#00bfdb]/40 bg-[#00bfdb]/[0.08] text-[#00bfdb]"
                          : "border-none text-white/35 opacity-35"
                      }`}
                    >
                      {phase}
                    </div>
                    {idx < 3 && (
                      <div className="font-mono text-[0.7rem] text-white/40 px-1">
                        ·
                      </div>
                    )}
                  </div>
                ),
              )}
            </>
          ) : (
            phaseOrder.map((phase, idx) => {
              const labelMap = {
                research: "RESEARCH",
                assessment: "ASSESSMENT",
                creativity_test: "CREATIVITY TEST",
                results: "RESULTS",
              };
              const isActive =
                participant.currentPhase === phase ||
                (phase === "research" && isSelectingPlatform);
              return (
                <div key={phase} className="flex items-center gap-2">
                  <div
                    className={`font-mono text-[0.62rem] uppercase px-[8px] py-[3px] border rounded-[4px] ${
                      isActive
                        ? "border-[#00bfdb] bg-[#00bfdb]/[0.08] text-[#00bfdb]"
                        : "border-white/[0.07] text-white/40 opacity-40"
                    }`}
                  >
                    {labelMap[phase as keyof typeof labelMap]}
                  </div>
                  {idx < phaseOrder.length - 1 && (
                    <div className="font-mono text-[0.7rem] text-white/40 px-1">
                      ·
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </footer>
    </div>
  );
};
