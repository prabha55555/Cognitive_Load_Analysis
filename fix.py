content = r"""/* eslint-disable @typescript-eslint/no-explicit-any */
import { RefreshCw, Activity } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { adminService, AdminAnalytics, AdminParticipant, AdminSession } from '../services/adminService';
import { logger } from '../utils/logger';

// --- OVERVIEW TAB REDESIGN ---
const AdminOverviewTab = ({ analytics }: { analytics: AdminAnalytics }) => {
  const doughnutRef = React.useRef<HTMLCanvasElement>(null);
  const barRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    let dChart: any = null;
    let bChart: any = null;

    const renderCharts = () => {
      const Chart = (window as any).Chart;
      if (!Chart) return;

      if (doughnutRef.current) {
        dChart = new Chart(doughnutRef.current, {
          type: 'doughnut',
          data: {
            labels: ['Low', 'Moderate', 'High', 'Very High'],
            datasets: [{
              data: [
                analytics.cognitiveLoad.distribution.low || 0, 
                analytics.cognitiveLoad.distribution.moderate || 0, 
                analytics.cognitiveLoad.distribution.high || 0, 
                analytics.cognitiveLoad.distribution['very-high'] || 0
              ],
              backgroundColor: [
                'rgba(0,191,219,0.7)',
                'rgba(255,255,255,0.25)',
                'rgba(255,255,255,0.45)',
                'rgba(224,80,80,0.7)'
              ],
              borderColor: '#090a0c',
              borderWidth: 3,
              hoverOffset: 6
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  color: 'rgba(255,255,255,0.45)',
                  font: { family: 'Geist Mono', size: 11 },
                  boxWidth: 10,
                  padding: 14
                }
              },
              tooltip: {
                backgroundColor: '#0f1114',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                titleColor: 'rgba(255,255,255,0.7)',
                bodyColor: 'rgba(255,255,255,0.5)',
                titleFont: { family: 'Geist Mono', size: 11 },
                bodyFont: { family: 'Geist Mono', size: 11 }
              }
            }
          }
        });
      }

      if (barRef.current) {
        const pData = analytics.platforms;
        const labels = pData.map(p => p.platform === 'google' ? 'Google Search' : p.platform === 'chatgpt' ? 'ChatGPT' : p.platform);
        const sessions = pData.map(p => p.totalSessions);
        const completed = pData.map(p => p.completedSessions);

        bChart = new Chart(barRef.current, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Total Sessions',
                data: sessions,
                backgroundColor: 'rgba(0,191,219,0.25)',
                borderColor: 'rgba(0,191,219,0.6)',
                borderWidth: 1,
                borderRadius: 3
              },
              {
                label: 'Completed',
                data: completed,
                backgroundColor: 'rgba(255,255,255,0.08)',
                borderColor: 'rgba(255,255,255,0.2)',
                borderWidth: 1,
                borderRadius: 3
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                labels: {
                  color: 'rgba(255,255,255,0.4)',
                  font: { family: 'Geist Mono', size: 11 },
                  boxWidth: 10,
                  padding: 16
                }
              },
              tooltip: {
                backgroundColor: '#0f1114',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                titleColor: 'rgba(255,255,255,0.7)',
                bodyColor: 'rgba(255,255,255,0.5)',
                titleFont: { family: 'Geist Mono', size: 11 },
                bodyFont: { family: 'Geist Mono', size: 11 }
              }
            },
            scales: {
              x: {
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { color: 'rgba(255,255,255,0.35)', font: { family: 'Geist Mono', size: 11 } },
                border: { color: 'rgba(255,255,255,0.07)' }
              },
              y: {
                grid: { color: 'rgba(255,255,255,0.04)' },
                ticks: { color: 'rgba(255,255,255,0.35)', font: { family: 'Geist Mono', size: 11 } },
                border: { color: 'rgba(255,255,255,0.07)' },
                beginAtZero: true
              }
            }
          }
        });
      }
    };

    if (!(window as any).Chart) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js';
      script.async = true;
      script.onload = renderCharts;
      document.head.appendChild(script);
    } else {
      renderCharts();
    }

    return () => {
      if (dChart) dChart.destroy();
      if (bChart) bChart.destroy();
    };
  }, [analytics]);

  const platformData = analytics?.platforms.map(p => ({
    platform: p.platform === 'google' ? 'Google Search' : p.platform === 'chatgpt' ? 'ChatGPT' : p.platform,
    sessions: p.totalSessions,
    completed: p.completedSessions,
    completionRate: p.completionRate,
    avgDuration: p.avgSessionDuration,
  })) || [];

  return (
    <div className=\"flex flex-col w-full h-full pb-10\">
      {/* Zone 3 — KPI Strip */}
      <div className=\"px-[1rem] md:px-[2.5rem] py-[1.5rem] border-b border-white/[0.07] grid grid-cols-2 md:grid-cols-4 gap-y-6 md:gap-x-0 md:gap-y-0 divide-x-0 md:divide-x divide-white/[0.07]\">
        <div className=\"flex flex-col gap-[0.3rem] pr-[1rem] md:pr-0 md:mr-[2rem] border-r-0 md:border-r border-white/[0.07]\">
          <div className=\"font-mono text-[0.65rem] uppercase text-white/40\">TOTAL PARTICIPANTS</div>
          <div className=\"font-display font-[900] text-[2.6rem] tracking-[-0.04em] text-white leading-none\">{analytics.overview.totalParticipants}</div>
          <div className=\"font-mono text-[0.68rem] text-white/40\">enrolled</div>
        </div>
        <div className=\"flex flex-col gap-[0.3rem] pl-[1rem] md:pl-0 pr-[1rem] md:pr-0 md:ml-[2rem] md:mr-[2rem] border-r-0 md:border-r border-white/[0.07]\">
          <div className=\"font-mono text-[0.65rem] uppercase text-white/40\">TOTAL SESSIONS</div>
          <div className=\"font-display font-[900] text-[2.6rem] tracking-[-0.04em] text-white leading-none\">{analytics.overview.totalSessions}</div>
          <div className=\"font-mono text-[0.68rem] text-[#00bfdb]\">{analytics.overview.completedSessions} completed</div>
        </div>
        <div className=\"flex flex-col gap-[0.3rem] pr-[1rem] md:pl-0 md:pr-0 md:ml-[2rem] md:mr-[2rem] border-r-0 md:border-r border-white/[0.07]\">
          <div className=\"font-mono text-[0.65rem] uppercase text-white/40\">ACTIVE SESSIONS</div>
          <div className=\"font-display font-[900] text-[2.6rem] tracking-[-0.04em] text-white leading-none\">{analytics.overview.activeSessions}</div>
          <div className=\"font-mono text-[0.68rem] flex items-center gap-[0.4rem]\">
            <div className=\"w-[5px] h-[5px] rounded-full bg-[#00bfdb] opacity-80\" style={{animation: 'pulse-opacity 1.8s ease-in-out infinite'}} />
            <span className=\"text-white/40\">live</span>
          </div>
        </div>
        <div className=\"flex flex-col gap-[0.3rem] pl-[1rem] md:pl-0 md:ml-[2rem] border-r-0 border-white/[0.07]\">
          <div className=\"font-mono text-[0.65rem] uppercase text-white/40\">AVG COGNITIVE LOAD</div>
          <div className=\"font-display font-[900] text-[2.6rem] tracking-[-0.04em] text-white leading-none\">{analytics.overview.avgCognitiveLoad}</div>
          <div className=\"font-mono text-[0.68rem] text-white/40\">/ 100 index</div>
        </div>
      </div>

      {/* Zone 4 — Charts Row */}
      <div className=\"px-[1rem] md:px-[2.5rem] py-[2rem] border-b border-white/[0.07] grid grid-cols-1 md:grid-cols-2 gap-[2.5rem] lg:gap-[4rem]\" style={{minHeight: '380px'}}>
        {/* Doughnut Chart */}
        <div className=\"flex flex-col relative w-full h-full\" style={{minHeight:'300px'}}>
          <div className=\"font-mono text-[0.65rem] uppercase text-white/40 mb-[1.2rem]\">COGNITIVE LOAD DISTRIBUTION</div>
          <div className=\"relative w-full flex-1 flex items-center justify-center\">
            <canvas ref={doughnutRef} className=\"w-full h-full bg-transparent max-h-[300px]\"></canvas>
            <div className=\"absolute inset-0 flex flex-col items-center justify-center pointer-events-none\" style={{transform: 'translateX(-22%)'}}>
              <div className=\"font-display font-[800] text-[1.8rem] leading-none text-white\">{analytics.cognitiveLoad.distribution.high + analytics.cognitiveLoad.distribution['very-high']}</div>
              <div className=\"font-mono text-[0.6rem] text-white/40 uppercase mt-1\">High Vol</div>
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div className=\"flex flex-col relative w-full h-full\" style={{minHeight:'300px'}}>
          <div className=\"font-mono text-[0.65rem] uppercase text-white/40 mb-[1.2rem]\">PLATFORM COMPLETION</div>
          <div className=\"relative w-full flex-1\">
            <canvas ref={barRef} className=\"w-full h-full bg-transparent max-h-[300px]\"></canvas>
          </div>
        </div>
      </div>

      {/* Zone 5 — Data Table Strip */}
      <div className=\"px-[1rem] md:px-[2.5rem] py-[2.5rem]\">
        <div className=\"font-mono text-[0.65rem] uppercase text-white/40 mb-[1.2rem]\">PLATFORM TELEMETRY</div>
        <div className=\"w-full text-left\">
          <div className=\"hidden md:grid grid-cols-5 border-b border-white/[0.07] pb-[0.8rem] mb-[0.8rem] font-mono text-[0.65rem] text-white/40 uppercase\">
            <div className=\"col-span-2\">Platform Engine</div>
            <div>Sessions</div>
            <div>Avg Duration</div>
            <div>Completion</div>
          </div>
          {platformData.map((row, idx) => (
            <div key={idx} className=\"grid grid-cols-1 md:grid-cols-5 items-center py-[1rem] border-b border-white/[0.04] group hover:bg-white/[0.01] transition-colors gap-2 md:gap-0\">
              <div className=\"col-span-2 font-mono text-[0.8rem] text-white/80 group-hover:text-[#00bfdb] transition-colors\">{row.platform}</div>
              <div className=\"font-mono text-[0.8rem] text-white/60\">{row.sessions} total</div>
              <div className=\"font-mono text-[0.8rem] text-white/60\">{Math.round(row.avgDuration / 60)}m {Math.round(row.avgDuration % 60)}s</div>
              <div className=\"font-mono text-[0.8rem] text-white/60 flex items-center gap-[1rem]\">
                <div className=\"w-full max-w-[80px] h-[3px] bg-white/[0.1] rounded-full overflow-hidden\">
                  <div className=\"h-full bg-[#00bfdb]\" style={{ width: `${row.completionRate}%` }} />
                </div>
                <span>{row.completionRate.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AdminDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [participants, setParticipants] = useState<AdminParticipant[]>([]);
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [behavioralPredictions, setBehavioralPredictions] = useState<any[]>([]);
  const [behavioralTimeline, setBehavioralTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'overview' | 'participants' | 'sessions' | 'behavioral'>('overview');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'chatgpt' | 'google'>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [analyticsData, participantsData, sessionsData, predictionsData, timelineData] = await Promise.all([
        adminService.getAnalytics(),
        adminService.getAllParticipants(),
        adminService.getAllSessions(),
        adminService.getBehavioralPredictions({
          platform: selectedPlatform !== 'all' ? selectedPlatform : undefined,
          startDate: dateRange.start,
          endDate: dateRange.end,
        }),
        adminService.getBehavioralTimeline({
          platform: selectedPlatform !== 'all' ? selectedPlatform : undefined,
          startDate: dateRange.start,
          endDate: dateRange.end,
        }),
      ]);
      
      setAnalytics(analyticsData);
      setParticipants(participantsData);
      setSessions(sessionsData);
      setBehavioralPredictions(predictionsData);
      setBehavioralTimeline(timelineData);
      
      logger.info('[AdminDashboard] Data loaded successfully');
    } catch (err: any) {
      logger.error('[AdminDashboard] Failed to load data:', err);
      setError(err.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlatform, dateRange]);

  if (loading) {
    return (
    <div className=\"min-h-[100dvh] flex flex-col bg-[#090a0c] text-white text-left selection:bg-[#00bfdb] selection:text-[#090a0c]\">
      <style dangerouslySetInnerHTML={{__html: `
        .font-display { font-family: 'Cabinet Grotesk', system-ui, sans-serif; }
        .font-mono { font-family: 'Geist Mono', ui-monospace, SFMono-Regular, monospace; }
        @keyframes pulse-opacity {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes cw-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}} />

      {/* Zone 1 — Top Bar */}
      <div className=\"sticky top-0 z-10 flex justify-between items-center px-[2.5rem] py-[1rem] border-b border-white/[0.07] bg-[#090a0c]/95 backdrop-blur-[14px]\">
        <div>
          <div className=\"font-mono text-[0.65rem] uppercase text-white/40 mb-[0.2rem]\">COGNITIVE LOAD LAB</div>
          <h1 className=\"font-display font-[800] text-[1.1rem] text-white leading-none\">Admin Dashboard</h1>
          <div className=\"font-mono text-[0.68rem] text-white/40 mt-[0.3rem]\">Cognitive Load Analysis Platform · Administrator Panel</div>
        </div>
        <div className=\"flex items-center gap-[0.8rem]\">
          <div className=\"font-mono text-[0.68rem] text-white/40\">Updated just now</div>
          <button 
            onClick={fetchData}
            className=\"group flex items-center gap-[0.4rem] font-display font-[600] text-[0.82rem] text-white/50 bg-transparent border border-white/[0.12] rounded-[6px] px-[1rem] py-[0.45rem] hover:border-white/30 hover:text-white/70 transition-colors\"
          >
            <RefreshCw className=\"h-[14px] w-[14px] text-white/50 opacity-100 transition-all duration-500 group-active:rotate-180\" />
            Refresh
          </button>
        </div>
      </div>

      {/* Zone 2 — Tab Navigation */}
      <div className=\"px-[2.5rem] border-b border-white/[0.07] flex bg-[#090a0c] overflow-x-auto hide-scrollbars\">
        {['overview', 'participants', 'sessions', 'behavioral'].map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view as any)}
            className={`font-display font-[500] text-[0.85rem] px-[1.2rem] py-[0.85rem] capitalize transition-all duration-200 border-b-2 whitespace-nowrap ${
              activeView === view
                ? 'text-[#00bfdb] border-[#00bfdb]'
                : 'text-white/35 border-transparent hover:text-white/65'
            }`}
          >
            {view}
          </button>
        ))}
      </div>

      {/* Active View Area */}
      <div className=\"flex-1 flex flex-col min-h-0 relative\">
        {activeView === 'overview' && analytics && <AdminOverviewTab analytics={analytics} />}
        
        {/* Legacy container for other tabs to keep their own #090a0c spacing mostly intact, padding resets them to standard margins */}
        <div className={activeView !== 'overview' ? \"max-w-7xl mx-auto px-6 py-8 w-full text-left\" : \"hidden\"}>
        {activeView === 'participants' && (
          <div className=\"cla-surface\">
            <div className=\"border-b border-slate-200 p-6 dark:border-slate-700\">
              <h3 className=\"text-lg font-semibold text-slate-900 dark:text-slate-100\">All Participants</h3>
              <p className=\"mt-1 text-sm text-slate-500 dark:text-slate-400\">Total: {participants.length}</p>
            </div>
            <div className=\"overflow-x-auto\">
              <table className=\"min-w-full divide-y divide-slate-200 dark:divide-slate-700\">
                <thead className=\"bg-slate-50/80 dark:bg-slate-800/70\">
                  <tr>
                    <th className=\"px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider\">
                      Name
                    </th>
                    <th className=\"px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider\">
                      Email
                    </th>
                    <th className=\"px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider\">
                      Role
                    </th>
                    <th className=\"px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider\">
                      Sessions
                    </th>
                    <th className=\"px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider\">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className=\"divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900/40\">
                  {participants.map((participant) => (
                    <tr key={participant.id}>
                      <td className=\"px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100\">
                        {participant.name}
                      </td>
                      <td className=\"px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400\">
                        {participant.email}
                      </td>
                      <td className=\"px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400\">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          participant.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {participant.role}
                        </span>
                      </td>
                      <td className=\"px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400\">
                        {participant.sessions?.[0]?.count || 0}
                      </td>
                      <td className=\"px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400\">
                        {new Date(participant.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'sessions' && (
          <div className=\"cla-surface\">
            <div className=\"border-b border-slate-200 p-6 dark:border-slate-700\">
              <h3 className=\"text-lg font-semibold text-slate-900 dark:text-slate-100\">All Sessions</h3>
              <p className=\"mt-1 text-sm text-slate-500 dark:text-slate-400\">Total: {sessions.length}</p>
            </div>
            <div className=\"overflow-x-auto\">
              <table className=\"min-w-full divide-y divide-slate-200 dark:divide-slate-700\">
                <thead className=\"bg-slate-50/80 dark:bg-slate-800/70\">
                  <tr>
                    <th className=\"px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider\">
                      Participant
                    </th>
                    <th className=\"px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider\">
                      Topic
                    </th>
                    <th className=\"px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider\">
                      Platform
                    </th>
                    <th className=\"px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider\">
                      Phase
                    </th>
                    <th className=\"px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider\">
                      Cognitive Load
                    </th>
                    <th className=\"px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider\">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className=\"divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900/40\">
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td className=\"px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100\">
                        {session.participants?.name || 'Unknown'}
                      </td>
                      <td className=\"max-w-xs truncate px-6 py-4 text-sm text-slate-500 dark:text-slate-400\">
                        {session.topic}
                      </td>
                      <td className=\"px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400\">
                        <span className=\"uppercase font-medium\">{session.platform}</span>
                      </td>
                      <td className=\"px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400\">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          session.current_phase === 'completed' ? 'bg-green-100 text-green-800' :
                          session.current_phase === 'research' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {session.current_phase}
                        </span>
                      </td>
                      <td className=\"px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400\">
                        {session.cognitive_load_metrics?.[0] ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            session.cognitive_load_metrics[0].category === 'low' ? 'bg-green-100 text-green-800' :
                            session.cognitive_load_metrics[0].category === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                            session.cognitive_load_metrics[0].category === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {session.cognitive_load_metrics[0].overall_score} ({session.cognitive_load_metrics[0].category})
                          </span>
                        ) : (
                          <span className=\"text-slate-400\">-</span>
                        )}
                      </td>
                      <td className=\"px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400\">
                        {new Date(session.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Behavioral Analysis View */}
        {activeView === 'behavioral' && (
          <div className=\"space-y-6\">
            {/* Filters */}
            <div className=\"cla-surface p-6\">
              <h3 className=\"mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100\">Filters</h3>
              <div className=\"grid grid-cols-1 md:grid-cols-3 gap-4\">
                {/* Platform Filter */}
                <div>
                  <label className=\"mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200\">Platform</label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value as any)}
                    className=\"cla-input w-full\"
                  >
                    <option value=\"all\">All Platforms</option>
                    <option value=\"chatgpt\">ChatGPT</option>
                    <option value=\"google\">Google Search</option>
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className=\"mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200\">Start Date</label>
                  <input
                    type=\"date\"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className=\"cla-input w-full\"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className=\"mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200\">End Date</label>
                  <input
                    type=\"date\"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className=\"cla-input w-full\"
                  />
                </div>
              </div>
            </div>

            {/* Timeline Chart */}
            {behavioralTimeline.length > 0 && (
              <div className=\"cla-surface p-6\">
                <h3 className=\"mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100\">Cognitive Load Timeline</h3>
                <ResponsiveContainer width=\"100%\" height={300}>
                  <LineChart data={behavioralTimeline}>
                    <CartesianGrid strokeDasharray=\"3 3\" />
                    <XAxis dataKey=\"date\" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type=\"monotone\" dataKey=\"low\" stroke=\"#10b981\" name=\"Low\" />
                    <Line type=\"monotone\" dataKey=\"moderate\" stroke=\"#f59e0b\" name=\"Moderate\" />
                    <Line type=\"monotone\" dataKey=\"high\" stroke=\"#ef4444\" name=\"High\" />
                    <Line type=\"monotone\" dataKey=\"very-high\" stroke=\"#dc2626\" name=\"Very High\" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Cognitive Load Distribution */}
            {behavioralTimeline.length > 0 && (
              <div className=\"grid grid-cols-1 md:grid-cols-4 gap-6\">
                {[
                  { label: 'Low', key: 'low', color: '#10b981' },
                  { label: 'Moderate', key: 'moderate', color: '#f59e0b' },
                  { label: 'High', key: 'high', color: '#ef4444' },
                  { label: 'Very High', key: 'very-high', color: '#dc2626' },
                ].map((category) => {
                  const total = behavioralTimeline.reduce((sum, day: any) => sum + (day[category.key] || 0), 0);
                  const percentage = behavioralTimeline.reduce((sum, day: any) => sum + (day[category.key] || 0), 0) / 
                                   behavioralTimeline.reduce((sum, day: any) => sum + (day.total || 0), 0) * 100;
                  return (
                    <div key={category.key} className=\"cla-surface p-6\">
                      <div className=\"flex items-center justify-between\">
                        <div>
                          <p className=\"text-sm text-slate-600 dark:text-slate-300\">{category.label}</p>
                          <p className=\"mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100\">{total}</p>
                          <p className=\"mt-1 text-xs text-slate-500 dark:text-slate-400\">{percentage.toFixed(1)}%</p>
                        </div>
                        <div className=\"w-12 h-12 rounded-full\" style={{ backgroundColor: category.color, opacity: 0.2 }}></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Predictions Table */}
            {behavioralPredictions.length > 0 && (
              <div className=\"cla-surface p-6\">
                <h3 className=\"mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100\">Recent Predictions</h3>
                <div className=\"overflow-x-auto\">
                  <table className=\"w-full\">
                    <thead className=\"border-b border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-800/70\">
                      <tr>
                        <th className=\"px-6 py-3 text-left text-sm font-medium text-slate-900 dark:text-slate-100\">Participant</th>
                        <th className=\"px-6 py-3 text-left text-sm font-medium text-slate-900 dark:text-slate-100\">Session</th>
                        <th className=\"px-6 py-3 text-left text-sm font-medium text-slate-900 dark:text-slate-100\">Platform</th>
                        <th className=\"px-6 py-3 text-left text-sm font-medium text-slate-900 dark:text-slate-100\">Prediction</th>
                        <th className=\"px-6 py-3 text-left text-sm font-medium text-slate-900 dark:text-slate-100\">Confidence</th>
                        <th className=\"px-6 py-3 text-left text-sm font-medium text-slate-900 dark:text-slate-100\">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className=\"divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900/40\">
                      {behavioralPredictions.slice(0, 20).map((pred, idx) => (
                        <tr key={idx}>
                          <td className=\"px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-100\">
                            {pred.sessions?.participants?.name || 'Unknown'}
                          </td>
                          <td className=\"max-w-xs truncate px-6 py-4 text-sm text-slate-500 dark:text-slate-400\">
                            {pred.sessions?.topic || 'N/A'}
                          </td>
                          <td className=\"px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400\">
                            <span className=\"uppercase font-medium text-xs\">
                              {pred.sessions?.platform || 'N/A'}
                            </span>
                          </td>
                          <td className=\"px-6 py-4 whitespace-nowrap text-sm\">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              pred.predicted_load_category === 'low' ? 'bg-green-100 text-green-800' :
                              pred.predicted_load_category === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                              pred.predicted_load_category === 'high' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {pred.predicted_load_category}
                            </span>
                          </td>
                          <td className=\"px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400\">
                            {(pred.confidence_score * 100).toFixed(1)}%
                          </td>
                          <td className=\"px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400\">
                            {new Date(pred.prediction_timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {behavioralPredictions.length === 0 && (
              <div className=\"cla-surface p-12 text-center\">
                <Activity className=\"mx-auto mb-4 h-12 w-12 text-slate-400\" />
                <p className=\"text-slate-600 dark:text-slate-300\">No behavioral predictions available for the selected filters</p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
    </div>
  );
};
"""
open('src/components/AdminDashboard.tsx','w',encoding='utf-8').write(content)
