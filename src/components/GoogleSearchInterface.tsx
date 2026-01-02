import { BookOpen, Clock, Edit, ExternalLink, FileText, Globe, MapPin, RotateCcw, Search, TrendingUp, Video } from 'lucide-react';
import { useEffect, useState } from 'react';
import { analyticsService } from '../services/analyticsService';
import { getInteractionTracker, stopInteractionTracker, Platform } from '../services/interactionTracker';
import { Participant } from '../types';

interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  type: 'web' | 'academic' | 'video' | 'news';
  relevance: number;
}

interface GoogleSearchInterfaceProps {
  participant: Participant;
  onQuerySubmit: (query: string) => void;
  onSearchBehavior: (behavior: {
    query: string;
    clickedResults: string[];
    timeSpent: number;
    scrollDepth: number;
  }) => void;
  onTopicChange?: (topic: string) => void; // Callback to notify parent of topic changes
  sessionId?: string; // Session ID for behavioral tracking
}

export const GoogleSearchInterface: React.FC<GoogleSearchInterfaceProps> = ({
  participant,
  onQuerySubmit,
  onSearchBehavior,
  onTopicChange,
  sessionId: propSessionId
}) => {
  const [currentQuery, setCurrentQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [clickedResults, setClickedResults] = useState<string[]>([]);
  const [searchStartTime, setSearchStartTime] = useState<Date | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  
  // Link tracking state
  const [visitedSites, setVisitedSites] = useState<string[]>([]);
  const [clickAnalytics, setClickAnalytics] = useState({
    totalClicks: 0,
    uniqueSites: 0,
    clickHistory: [] as Array<{
      url: string;
      timestamp: Date;
      context: string;
      participantId: string;
      researchTopic: string;
    }>
  });

  // Custom topic functionality
  const [isCustomTopicMode, setIsCustomTopicMode] = useState(false);
  const [customResearchTopic, setCustomResearchTopic] = useState('');
  const [showCustomTopicInput, setShowCustomTopicInput] = useState(false);
  const [currentActiveTopic, setCurrentActiveTopic] = useState(participant.researchTopic);

  // Initialize analytics session
  useEffect(() => {
    const sessionId = analyticsService.startSession(participant.id, 'google', participant.researchTopic);
    setSessionId(sessionId);
    
    return () => {
      if (sessionId) {
        analyticsService.endSession(sessionId);
      }
    };
  }, [participant.id, participant.researchTopic]);

  // Initialize InteractionTracker for behavioral cognitive load analysis
  // Requirements: 7.1 - Tag session with platform type
  useEffect(() => {
    const platform: Platform = 'google';
    // Use session ID from props if available, otherwise generate one
    const trackerSessionId = propSessionId || `session_${participant.id}_${Date.now()}`;
    
    // Initialize and start the tracker
    const tracker = getInteractionTracker(trackerSessionId, participant.id, platform);
    tracker.start();
    
    // Track initial navigation to Google Search interface
    tracker.trackNavigation('google-search-interface');
    
    // Cleanup on unmount - stop tracker and flush events
    return () => {
      stopInteractionTracker();
    };
  }, [participant.id, propSessionId]);

  // Custom topic handlers
  const handleCustomTopicToggle = () => {
    setShowCustomTopicInput(!showCustomTopicInput);
    if (!showCustomTopicInput) {
      setCustomResearchTopic('');
    }
  };

  const handleCustomTopicSubmit = () => {
    if (customResearchTopic.trim()) {
      const newTopic = customResearchTopic.trim();
      
      console.log('==========================================');
      console.log('🎯 CUSTOM TOPIC SUBMITTED IN GOOGLE INTERFACE');
      console.log('New Topic:', newTopic);
      console.log('Old Topic:', participant.researchTopic);
      console.log('Current Active Topic:', currentActiveTopic);
      console.log('==========================================');
      
      setCurrentActiveTopic(newTopic);
      setIsCustomTopicMode(true);
      setShowCustomTopicInput(false);
      
      // CRITICAL: Notify parent component of topic change
      console.log('Calling onTopicChange with:', newTopic);
      console.log('onTopicChange exists?:', !!onTopicChange);
      if (onTopicChange) {
        onTopicChange(newTopic);
        console.log('✅ onTopicChange called successfully');
      } else {
        console.error('❌ onTopicChange is undefined!');
      }
    }
  };

  const handleResetToOriginalTopic = () => {
    setCurrentActiveTopic(participant.researchTopic);
    setIsCustomTopicMode(false);
    setShowCustomTopicInput(false);
    setCustomResearchTopic('');
    // Notify parent component of topic change
    onTopicChange?.(participant.researchTopic);
  };

  // Generate topic-specific search suggestions
  const getSearchSuggestions = (topic: string) => [
    `${topic} definition`,
    `${topic} research papers`,
    `${topic} applications`,
    `${topic} benefits`,
    `${topic} challenges`,
    `${topic} latest developments`,
    `${topic} case studies`,
    `${topic} best practices`
  ];

  const handleSearch = async () => {
    if (!currentQuery.trim()) return;

    setIsSearching(true);
    setSearchStartTime(new Date());
    onQuerySubmit(currentQuery.trim());
    
    // Add to search history
    setSearchHistory(prev => [...prev, currentQuery.trim()]);

    // Track search behavior
    if (sessionId) {
      analyticsService.trackSearchBehavior(sessionId, {
        query: currentQuery.trim(),
        clickedResults: [],
        timeSpent: 0,
        scrollDepth: 0,
        searchType: 'internal',
        resultCount: 0,
        sessionDuration: Date.now() - (searchStartTime?.getTime() || Date.now())
      });
    }

    // Simulate search results generation
    setTimeout(() => {
      const results = generateSearchResults(currentQuery.trim(), participant.researchTopic);
      setSearchResults(results);
      setIsSearching(false);
    }, 1500);
  };

  // Function to track link clicks with analytics
  const trackLinkClick = (url: string, context: string) => {
    const clickData = {
      url,
      timestamp: new Date(),
      context,
      participantId: participant.id,
      researchTopic: participant.researchTopic
    };

    setClickAnalytics(prev => ({
      totalClicks: prev.totalClicks + 1,
      uniqueSites: new Set([...prev.clickHistory.map(c => c.url), url]).size,
      clickHistory: [...prev.clickHistory, clickData]
    }));

    setVisitedSites(prev => [...new Set([...prev, url])]);
    
    // Track analytics through the existing analytics service
    if (sessionId) {
      analyticsService.trackUserInteraction(sessionId, 'click', url, {
        context,
        timestamp: new Date(),
        participantId: participant.id,
        researchTopic: participant.researchTopic
      });
    }
  };

  const generateSearchResults = (query: string, topic: string): SearchResult[] => {
    console.log(`🔍 Search requested: "${query}" for topic: "${topic}"`);
    
    // In a real implementation, this would call Google Search API
    // For now, return empty results to show that real search is not available
    console.warn('⚠️ Real Google Search API not implemented - showing no results');
    
    // Return empty array instead of placeholder data
    return [];
  };

  const handleResultClick = (result: SearchResult) => {
    setClickedResults(prev => [...prev, result.id]);
    
    // Track link click with our new tracking system
    trackLinkClick(result.url, `search_result_${result.type}`);
    
    // Track search behavior
    if (searchStartTime) {
      const timeSpent = Date.now() - searchStartTime.getTime();
      onSearchBehavior({
        query: currentQuery,
        clickedResults: [...clickedResults, result.id],
        timeSpent,
        scrollDepth: Math.random() * 100 // This would be tracked in real implementation
      });
    }

    // Track user interaction with existing analytics service
    if (sessionId) {
      analyticsService.trackUserInteraction(sessionId, 'click', result.url, {
        resultId: result.id,
        resultTitle: result.title,
        resultType: result.type,
        relevance: result.relevance
      });
    }

    // Open in new tab
    window.open(result.url, '_blank');
  };

  const handleGoogleSearch = () => {
    const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(currentQuery || participant.researchTopic)}`;
    
    // Track the Google search click
    trackLinkClick(googleSearchUrl, 'google_search_redirect');
    
    window.open(googleSearchUrl, '_blank');
  };

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'academic': return <BookOpen className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'news': return <FileText className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const getResultColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'academic': return 'text-blue-600 bg-blue-100';
      case 'video': return 'text-red-600 bg-red-100';
      case 'news': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Google Search Header */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-full blur-lg animate-pulse"></div>
              <Globe className="h-6 w-6 relative z-10" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Google Search Interface</h3>
              <div className="flex items-center space-x-2">
                <p className="text-sm opacity-90">
                  Research {isCustomTopicMode ? 'Custom Topic: ' : ''}{currentActiveTopic}
                </p>
                {isCustomTopicMode && (
                  <span className="px-2 py-1 bg-yellow-500/20 rounded text-xs">CUSTOM</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Custom Topic Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCustomTopicToggle}
                className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm bg-white/20 hover:bg-white/30 transition-colors"
                title="Set custom research topic"
              >
                <Edit className="h-4 w-4" />
                <span>Custom Topic</span>
              </button>
              {isCustomTopicMode && (
                <button
                  onClick={handleResetToOriginalTopic}
                  className="flex items-center space-x-1 px-3 py-1 rounded-full text-sm bg-orange-500/20 hover:bg-orange-500/30 transition-colors"
                  title="Reset to original topic"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset</span>
                </button>
              )}
            </div>
            {clickAnalytics.totalClicks > 0 && (
              <div className="flex items-center space-x-1 px-3 py-1 bg-white/20 rounded-full text-sm">
                <ExternalLink className="h-4 w-4" />
                <span>{clickAnalytics.totalClicks} click{clickAnalytics.totalClicks !== 1 ? 's' : ''}</span>
                <span className="opacity-60">•</span>
                <span>{clickAnalytics.uniqueSites} site{clickAnalytics.uniqueSites !== 1 ? 's' : ''}</span>
                {visitedSites.length > 0 && (
                  <>
                    <span className="opacity-60">•</span>
                    <span className="text-xs opacity-75">
                      Recent: {visitedSites.slice(-3).map(site => {
                        try {
                          const domain = new URL(site).hostname.replace('www.', '');
                          return domain;
                        } catch {
                          return site.slice(0, 15);
                        }
                      }).join(', ')}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Topic Input Section - Same color scheme as header */}
      {showCustomTopicInput && (
        <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white p-4 border-t border-white/20">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-white/20">
              <Edit className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-base mb-2">Set Custom Research Topic</h4>
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={customResearchTopic}
                  onChange={(e) => setCustomResearchTopic(e.target.value)}
                  placeholder="Enter your custom research topic..."
                  className="flex-1 px-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:bg-white/30 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCustomTopicSubmit();
                    }
                  }}
                />
                <button
                  onClick={handleCustomTopicSubmit}
                  disabled={!customResearchTopic.trim()}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>Set Topic</span>
                </button>
                <button
                  onClick={handleCustomTopicToggle}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-white font-medium rounded-lg transition-colors flex items-center space-x-2"
                >
                  <span>Cancel</span>
                </button>
              </div>
              <p className="text-sm opacity-80 mt-2">
                Setting a custom topic will update all search suggestions and focus your research on the chosen subject.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={currentQuery}
              onChange={(e) => setCurrentQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={`Search for ${currentActiveTopic}...`}
              className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          <button
            onClick={handleSearch}
            disabled={!currentQuery.trim() || isSearching}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-2xl hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          <button
            onClick={handleGoogleSearch}
            className="px-6 py-3 bg-green-600 text-white font-semibold rounded-2xl hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Google</span>
          </button>
        </div>

        {/* Search Suggestions */}
        <div className="flex flex-wrap gap-2">
          {getSearchSuggestions(currentActiveTopic).map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuery(suggestion)}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto p-6">
        {isSearching ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching for "{currentQuery}"...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                About {searchResults.length} results for "{currentQuery}"
              </p>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Search time: ~1.2s</span>
              </div>
            </div>

            {searchResults.map((result) => (
              <div
                key={result.id}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleResultClick(result)}
              >
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-full ${getResultColor(result.type)}`}>
                    {getResultIcon(result.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium text-lg"
                        onClick={(e) => {
                          e.stopPropagation();
                          trackLinkClick(result.url, `direct_link_${result.type}`);
                        }}
                      >
                        {result.title}
                      </a>
                      <ExternalLink className="h-3 w-3 text-gray-400" />
                    </div>
                    <p className="text-green-700 text-sm mb-2">{result.url}</p>
                    <p className="text-gray-600 text-sm leading-relaxed">{result.snippet}</p>
                    <div className="flex items-center space-x-4 mt-3">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{result.relevance}% relevant</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{result.type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : currentQuery && !isSearching ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No results found for "{currentQuery}"</p>
            <p className="text-sm text-gray-500 mt-2">Try different keywords or check your spelling</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Start searching for information about {participant.researchTopic}</p>
            <p className="text-sm text-gray-500 mt-2">Use the search bar above or click on suggestions</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setCurrentQuery(`${participant.researchTopic} research papers`)}
            className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            Research Papers
          </button>
          <button
            onClick={() => setCurrentQuery(`${participant.researchTopic} applications`)}
            className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            Applications
          </button>
          <button
            onClick={() => setCurrentQuery(`${participant.researchTopic} latest developments`)}
            className="px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
          >
            Latest News
          </button>
        </div>
      </div>

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Searches</h3>
          <div className="flex flex-wrap gap-2">
            {searchHistory.slice(-5).map((query, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuery(query)}
                className="px-3 py-1 bg-white border border-gray-200 text-gray-700 text-sm rounded-full hover:bg-gray-50 transition-colors"
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
