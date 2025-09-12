import { ExternalLink, Search, Globe, Clock, TrendingUp, BookOpen, FileText, Video, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Participant } from '../types';
import { analyticsService } from '../services/analyticsService';

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
}

export const GoogleSearchInterface: React.FC<GoogleSearchInterfaceProps> = ({
  participant,
  onQuerySubmit,
  onSearchBehavior
}) => {
  const [currentQuery, setCurrentQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [clickedResults, setClickedResults] = useState<string[]>([]);
  const [searchStartTime, setSearchStartTime] = useState<Date | null>(null);
  const [sessionId, setSessionId] = useState<string>('');

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

  const generateSearchResults = (query: string, topic: string): SearchResult[] => {
    const baseResults: SearchResult[] = [
      {
        id: '1',
        title: `Comprehensive Guide to ${topic}: Understanding the Fundamentals`,
        url: `https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`,
        snippet: `This comprehensive research paper explores the fundamental principles of ${topic}, providing detailed analysis of current methodologies and future implications.`,
        type: 'academic',
        relevance: 95
      },
      {
        id: '2',
        title: `${topic} in Modern Applications: A Practical Approach`,
        url: `https://www.researchgate.net/publication/${encodeURIComponent(query)}`,
        snippet: `Explore how ${topic} is being applied in contemporary settings, with real-world examples and case studies demonstrating its effectiveness.`,
        type: 'web',
        relevance: 88
      },
      {
        id: '3',
        title: `Latest Developments in ${topic}: 2024 Research Overview`,
        url: `https://www.sciencedirect.com/science/article/${encodeURIComponent(query)}`,
        snippet: `Stay updated with the latest research findings and technological advancements in ${topic}, including breakthrough discoveries and emerging trends.`,
        type: 'news',
        relevance: 92
      },
      {
        id: '4',
        title: `${topic} Tutorial: Step-by-Step Implementation Guide`,
        url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
        snippet: `Learn how to implement ${topic} effectively with this detailed tutorial covering best practices, common pitfalls, and optimization strategies.`,
        type: 'video',
        relevance: 85
      },
      {
        id: '5',
        title: `${topic} Case Studies: Success Stories and Lessons Learned`,
        url: `https://ieeexplore.ieee.org/search/searchresult.jsp?queryText=${encodeURIComponent(query)}`,
        snippet: `Discover real-world applications of ${topic} through detailed case studies, showcasing successful implementations and valuable insights.`,
        type: 'academic',
        relevance: 90
      }
    ];

    return baseResults.sort((a, b) => b.relevance - a.relevance);
  };

  const handleResultClick = (result: SearchResult) => {
    setClickedResults(prev => [...prev, result.id]);
    
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

    // Track user interaction
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
      {/* Search Header - Desktop Optimized */}
      <div className="p-4 lg:p-6 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3 lg:space-x-4 mb-3 lg:mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={currentQuery}
              onChange={(e) => setCurrentQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={`Search for ${participant.researchTopic}...`}
              className="w-full px-3 py-2 lg:px-4 lg:py-3 pl-10 lg:pl-12 border-2 border-gray-200 rounded-lg lg:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
            />
            <Search className="absolute left-3 lg:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 lg:h-5 lg:w-5 text-gray-400" />
          </div>
          <button
            onClick={handleSearch}
            disabled={!currentQuery.trim() || isSearching}
            className="px-4 py-2 lg:px-6 lg:py-3 bg-blue-600 text-white font-semibold rounded-lg lg:rounded-2xl hover:bg-blue-700 disabled:bg-gray-300 transition-colors text-sm lg:text-base"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
          <button
            onClick={handleGoogleSearch}
            className="px-4 py-2 lg:px-6 lg:py-3 bg-green-600 text-white font-semibold rounded-lg lg:rounded-2xl hover:bg-green-700 transition-colors flex items-center space-x-2 text-sm lg:text-base"
          >
            <ExternalLink className="h-3 w-3 lg:h-4 lg:w-4" />
            <span>Google</span>
          </button>
        </div>

        {/* Search Suggestions - Compact */}
        <div className="flex flex-wrap gap-1 lg:gap-2">
          {getSearchSuggestions(participant.researchTopic).map((suggestion, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuery(suggestion)}
              className="px-2 lg:px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs lg:text-sm rounded-full transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>

      {/* Search Results - Desktop Optimized */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {isSearching ? (
          <div className="text-center py-8 lg:py-12">
            <div className="animate-spin rounded-full h-8 w-8 lg:h-12 lg:w-12 border-b-2 border-blue-600 mx-auto mb-3 lg:mb-4"></div>
            <p className="text-gray-600 text-sm lg:text-base">Searching for "{currentQuery}"...</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-3 lg:space-y-4">
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <p className="text-xs lg:text-sm text-gray-600">
                About {searchResults.length} results for "{currentQuery}"
              </p>
              <div className="flex items-center space-x-1 lg:space-x-2 text-xs lg:text-sm text-gray-500">
                <Clock className="h-3 w-3 lg:h-4 lg:w-4" />
                <span>Search time: ~1.2s</span>
              </div>
            </div>

            {searchResults.map((result) => (
              <div
                key={result.id}
                className="bg-white border border-gray-200 rounded-lg lg:rounded-xl p-3 lg:p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleResultClick(result)}
              >
                <div className="flex items-start space-x-2 lg:space-x-3">
                  <div className={`p-1 lg:p-2 rounded-full ${getResultColor(result.type)}`}>
                    {getResultIcon(result.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-1 lg:space-x-2 mb-1">
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm lg:text-lg"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {result.title}
                      </a>
                      <ExternalLink className="h-2 w-2 lg:h-3 lg:w-3 text-gray-400" />
                    </div>
                    <p className="text-green-700 text-xs lg:text-sm mb-1 lg:mb-2">{result.url}</p>
                    <p className="text-gray-600 text-xs lg:text-sm leading-relaxed">{result.snippet}</p>
                    <div className="flex items-center space-x-3 lg:space-x-4 mt-2 lg:mt-3">
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="h-2 w-2 lg:h-3 lg:w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{result.relevance}% relevant</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-2 w-2 lg:h-3 lg:w-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{result.type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : currentQuery && !isSearching ? (
          <div className="text-center py-8 lg:py-12">
            <Search className="h-8 w-8 lg:h-12 lg:w-12 text-gray-400 mx-auto mb-3 lg:mb-4" />
            <p className="text-gray-600 text-sm lg:text-base">No results found for "{currentQuery}"</p>
            <p className="text-xs lg:text-sm text-gray-500 mt-1 lg:mt-2">Try different keywords or check your spelling</p>
          </div>
        ) : (
          <div className="text-center py-8 lg:py-12">
            <Globe className="h-8 w-8 lg:h-12 lg:w-12 text-gray-400 mx-auto mb-3 lg:mb-4" />
            <p className="text-gray-600 text-sm lg:text-base">Start searching for information about {participant.researchTopic}</p>
            <p className="text-xs lg:text-sm text-gray-500 mt-1 lg:mt-2">Use the search bar above or click on suggestions</p>
          </div>
        )}
      </div>

      {/* Search History - Compact Desktop */}
      {searchHistory.length > 0 && (
        <div className="p-4 lg:p-6 border-t border-gray-200 bg-gray-50">
          <h3 className="text-xs lg:text-sm font-semibold text-gray-700 mb-2 lg:mb-3">Recent Searches</h3>
          <div className="flex flex-wrap gap-1 lg:gap-2">
            {searchHistory.slice(-5).map((query, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuery(query)}
                className="px-2 lg:px-3 py-1 bg-white border border-gray-200 text-gray-700 text-xs lg:text-sm rounded-full hover:bg-gray-50 transition-colors"
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
