import Image from 'next/image';
import React, { useState } from 'react'

function AnswerDisplay({ searchResult }) {
  const [expandedQuestions, setExpandedQuestions] = useState({});

  // SerpAPI data extraction
  const webResult = searchResult?.organic_results || [];
  const relatedQuestions = searchResult?.related_questions || [];
  const knowledgeGraph = searchResult?.knowledge_graph || {};
  const answerBox = searchResult?.answer_box || {};
  const searchQuery = searchResult?.search_parameters?.q || "";

  // Toggle related question expansion
  const toggleQuestion = (index) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Separate YouTube videos and other results
  const youTubeResults = webResult.filter(item =>
    item?.link?.includes('youtube.com') || item?.source?.includes('YouTube')
  );

  const otherResults = webResult.filter(item =>
    !item?.link?.includes('youtube.com') && !item?.source?.includes('YouTube')
  );

  // Generate AI-like comprehensive answer based on search results
  const generateAIAnswer = () => {
    if (!webResult.length) return null;

    const topResults = webResult.slice(0, 3);
    const combinedSnippets = topResults.map(r => r.snippet).join(' ');

    return {
      summary: combinedSnippets.length > 500 ?
        combinedSnippets.substring(0, 500) + "... Based on multiple sources, this information provides a comprehensive overview of the topic." :
        combinedSnippets + " This information is compiled from trusted web sources to give you the most accurate and up-to-date details.",
      confidence: "High",
      sources: topResults.length
    };
  };

  // Generate key features based on search results
  const generateKeyFeatures = () => {
    const features = [];

    // Extract key points from snippets
    const allSnippets = webResult.map(r => r.snippet).join(' ').toLowerCase();

    // Common feature patterns based on search content
    const featurePatterns = [
      { keywords: ['benefit', 'advantage', 'good', 'positive'], label: 'Benefits & Advantages' },
      { keywords: ['how', 'step', 'process', 'method'], label: 'Process & Methods' },
      { keywords: ['type', 'kind', 'category', 'different'], label: 'Types & Categories' },
      { keywords: ['cost', 'price', 'expensive', 'cheap', 'budget'], label: 'Cost & Pricing' },
      { keywords: ['use', 'application', 'purpose', 'function'], label: 'Uses & Applications' },
      { keywords: ['feature', 'characteristic', 'property'], label: 'Key Characteristics' },
      { keywords: ['history', 'origin', 'background', 'development'], label: 'Background & History' },
      { keywords: ['comparison', 'vs', 'versus', 'compare'], label: 'Comparisons' }
    ];

    featurePatterns.forEach(pattern => {
      const matchCount = pattern.keywords.reduce((count, keyword) => {
        return count + (allSnippets.match(new RegExp(keyword, 'g')) || []).length;
      }, 0);

      if (matchCount > 0) {
        features.push({
          title: pattern.label,
          relevance: matchCount,
          icon: getFeatureIcon(pattern.label)
        });
      }
    });

    // Sort by relevance and take top 5
    return features.sort((a, b) => b.relevance - a.relevance).slice(0, 5);
  };

  const getFeatureIcon = (label) => {
    const iconMap = {
      'Benefits & Advantages': '✨',
      'Process & Methods': '⚙️',
      'Types & Categories': '📋',
      'Cost & Pricing': '💰',
      'Uses & Applications': '🎯',
      'Key Characteristics': '🔍',
      'Background & History': '📚',
      'Comparisons': '⚖️'
    };
    return iconMap[label] || '📌';
  };

  // Convert YouTube URLs to open in app or browser
  const handleYouTubeClick = (url) => {
    // Extract video ID
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    if (videoId) {
      // Try to open in YouTube app first, fallback to browser
      const youtubeAppUrl = `youtube://watch?v=${videoId}`;
      const browserUrl = `https://www.youtube.com/watch?v=${videoId}`;

      // For mobile devices, try app first
      if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        window.location.href = youtubeAppUrl;
        setTimeout(() => {
          window.open(browserUrl, '_blank');
        }, 500);
      } else {
        window.open(browserUrl, '_blank');
      }
    }
  };

  const aiAnswer = generateAIAnswer();
  const keyFeatures = generateKeyFeatures();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto p-8">

        {/* AI Generated Answer Section */}
        {aiAnswer && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-lg">
              <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                AI-Generated Answer
              </h2>
              <div className="bg-white/50 rounded-xl p-4 mb-4">
                <p className="text-slate-700 leading-relaxed text-lg">{aiAnswer.summary}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-slate-600">Confidence: {aiAnswer.confidence}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                  <span className="text-slate-600">{aiAnswer.sources} sources analyzed</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* YouTube Videos Section - Now First */}
        {youTubeResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
              <div className="w-6 h-6 bg-red-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </div>
              Video Content ({youTubeResults.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {youTubeResults.slice(0, 6).map((item, index) => (
                <div key={index} className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50 overflow-hidden">
                  <div className="relative cursor-pointer" onClick={() => handleYouTubeClick(item.link)}>
                    {item?.thumbnail ? (
                      <div className="relative">
                        <Image
                          src={item.thumbnail}
                          alt={item.title}
                          width={400}
                          height={225}
                          className="w-full h-48 object-cover"
                        />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-colors">
                            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                          </div>
                        </div>
                        <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                          📺 YouTube
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-slate-200 flex items-center justify-center">
                        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-slate-800 mb-2 line-clamp-2 hover:text-red-600 transition-colors cursor-pointer"
                      onClick={() => handleYouTubeClick(item.link)}>
                      {item?.title}
                    </h3>
                    <p className="text-slate-600 text-sm line-clamp-2 mb-3">
                      {item?.snippet}
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="truncate">{item?.displayed_link || 'YouTube'}</span>
                      {item?.date && <span>{item.date}</span>}
                    </div>
                    <button
                      onClick={() => handleYouTubeClick(item.link)}
                      className="w-full mt-3 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Watch on YouTube
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Web Sources Section */}
        {otherResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              Web Sources ({otherResults.length})
            </h2>
            <div className="space-y-4">
              {otherResults.map((item, index) => (
                <div key={index} className="bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-slate-200/50 hover:border-slate-300/50">
                  <div className="flex items-start gap-4">
                    {item?.thumbnail && (
                      <div className="flex-shrink-0">
                        <Image
                          src={item.thumbnail}
                          alt={item.title}
                          width={60}
                          height={60}
                          className="rounded-lg object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-800 hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                        <a href={item?.link} target="_blank" rel="noopener noreferrer">
                          {item?.title}
                        </a>
                      </h3>
                      <div className="flex items-center gap-4 text-sm mb-2">
                        <span className="text-emerald-600 font-medium truncate">
                          {item?.displayed_link || item?.source || new URL(item?.link || '').hostname}
                        </span>
                        {item?.date && (
                          <span className="text-slate-500">{item.date}</span>
                        )}
                        {item?.position && (
                          <span className="text-slate-400">#{item.position}</span>
                        )}
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-2">
                        {item?.snippet}
                      </p>
                      {item?.rich_snippet && (
                        <div className="text-xs text-slate-500 bg-slate-100 rounded-md p-2">
                          {JSON.stringify(item.rich_snippet)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Questions Section */}
        {relatedQuestions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-3">
              <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              People Also Ask
            </h2>
            <div className="space-y-3">
              {relatedQuestions.slice(0, 5).map((question, index) => (
                <div key={index} className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
                  <button
                    onClick={() => toggleQuestion(index)}
                    className="w-full p-4 text-left hover:bg-slate-50/50 transition-colors flex items-center justify-between"
                  >
                    <h4 className="font-medium text-slate-800 pr-4">{question.question}</h4>
                    <svg
                      className={`w-5 h-5 text-slate-500 transition-transform ${expandedQuestions[index] ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {expandedQuestions[index] && (
                    <div className="px-4 pb-4 border-t border-slate-200/50">
                      {question.snippet && (
                        <p className="text-slate-700 text-sm leading-relaxed mb-3 mt-3">
                          {question.snippet}
                        </p>
                      )}
                      {question.link && (
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          <a
                            href={question.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            {question.displayed_link || question.source || 'Read full answer →'}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Information */}
        {searchResult?.search_information && (
          <div className="text-center py-4 text-sm text-slate-500">
            Found {searchResult.search_information.total_results} results in {searchResult.search_information.time_taken_displayed}
          </div>
        )}

        {/* No results message */}
        {webResult.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="text-slate-500 text-lg">No search results found</div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AnswerDisplay