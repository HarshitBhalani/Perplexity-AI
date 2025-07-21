// Enhanced chatinputbox component with improved UI and layout
"use client";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  ExternalLink,
  Sun,
  Moon,
  Trash2,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import { AIModelsOption } from "@/services/Shared";
import { supabase } from "@/services/supabase";
import { useRouter } from "next/navigation";

// Generate unique ID without external dependencies
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

function ChatInputBox() {
  const [userSearchInput, setUserSearchInput] = useState("");
  const [searchType, setSearchType] = useState("search");
  const [loading, setLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentSummary, setCurrentSummary] = useState("");
  const [showSerpButton, setShowSerpButton] = useState(false);
  const [serpResults, setSerpResults] = useState([]);
  const [currentQuery, setCurrentQuery] = useState("");
  const [error, setError] = useState("");
  const [hasStartedChat, setHasStartedChat] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const router = useRouter();

  // Load chat history from localStorage on component mount
  useEffect(() => {
    const savedChats = localStorage.getItem("perplexity-chat-history");
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats);
      setChatHistory(parsedChats);
      if (parsedChats.length > 0) {
        setHasStartedChat(true);
      }
    }
  }, []);

  // Save chat history to localStorage whenever it changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      localStorage.setItem(
        "perplexity-chat-history",
        JSON.stringify(chatHistory)
      );
    }
  }, [chatHistory]);

  const handleGroqError = (error) => {
    console.error("Groq API Error:", error);
    if (error.status === 429) {
      setError("Rate limit exceeded. Please try again later.");
    } else if (error.status === 400) {
      setError("Invalid request. Please check your input.");
    } else if (error.status === 404) {
      setError("API endpoint not found.");
    } else if (error.status === 420) {
      setError("Rate limit exceeded. Please wait before trying again.");
    } else {
      setError("An error occurred while processing your request.");
    }
  };

  const getGroqSummary = async (query, context = []) => {
    try {
      setError("");
      const contextMessages = context.slice(-5).map((chat) => ({
        role: "user",
        content: chat.query,
      }));

      // Build messages for Groq API
      const messages = [
        {
          role: "system",
          content: `
You are an advanced, intelligent AI assistant developed by Harshit Bhalani and Devang Gandhi. At the beginning of each new session, introduce yourself by saying:

"Hi! I'm your helpful AI assistant, proudly built by Harshit Bhalani and Devang Gandhi. I'm here to provide clear, accurate, and well-structured answers to your questions."

Your primary objectives are:
1. **Clarity** - Ensure every response is easy to understand, even for non-experts.
2. **Accuracy** - Base all answers on factual, up-to-date knowledge.
3. **Depth** - Provide enough detail to fully satisfy the user's query, while avoiding unnecessary fluff.
4. **Structure** - Use bullet points, headings, or step-by-step formatting when helpful.
5. **Tone** - Maintain a friendly, professional, and respectful tone at all times.
6. **Conciseness** - Avoid being overly verbose unless the user asks for an in-depth explanation.

You must:
- Answer questions clearly and completely without making up facts.
- Include real-world examples or context where relevant.
- Politely ask clarifying questions if a query is vague or ambiguous.
- Handle follow-up questions by remembering previous user messages from the same session.
- Default to summarizing complex topics in a digestible way unless instructed otherwise.

If a user asks a question that goes beyond your current knowledge or capability, say:
"I'm sorry, I don't have access to that specific information right now, but I can help guide you on where to find it."

You are not just an information bot—you are a polished assistant built with care, meant to impress with both technical depth and communication skills.

Only introduce yourself **once per session**, not on every message. Begin now.
    `.trim(),
        },
      ];

      // Add context from previous chats if available
      if (contextMessages.length > 0) {
        messages.push({
          role: "system",
          content: `Previous conversation context: ${contextMessages
            .map((c) => c.content)
            .join("\n")}`,
        });
      }

      messages.push({
        role: "user",
        content: query,
      });

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: messages,
            max_tokens: 1024,
            temperature: 0.6,
            top_p: 1,
            stream: false,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw { status: response.status, message: errorData.error };
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Invalid response from Groq API");
      }

      return data.choices[0].message.content;
    } catch (error) {
      handleGroqError(error);
      throw error;
    }
  };

  const getSerpResults = async (query) => {
    try {
      console.log("🔍 Calling SERP API via server route for query:", query);
      
      const response = await fetch('/api/serp-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query })
      });

      console.log("📡 Server Route Response Status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Server Route Error:", errorData);
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      console.log("📦 SERP Results via Server:", data.results?.length || 0, "results found");

      return data.results || [];
      
    } catch (error) {
      console.error("💥 SERP API Error:", error);
      
      // More specific error messages
      if (error.message.includes("401")) {
        setError("Invalid SERP API key. Please check your API key.");
      } else if (error.message.includes("429")) {
        setError("SERP API rate limit exceeded. Please try again later.");
      } else if (error.message.includes("402")) {
        setError("SERP API quota exceeded. Please check your subscription.");
      } else if (error.message.includes("Network")) {
        setError("Network error. Please check your internet connection.");
      } else {
        setError(`Failed to fetch search results: ${error.message}`);
      }
      
      throw error;
    }
  };

  const onSearchQuery = async () => {
    if (!userSearchInput.trim()) return;

    setLoading(true);
    setError("");
    setShowSerpButton(false);
    setSerpResults([]);
    setHasStartedChat(true);

    try {
      // Get Groq summary with context from last 5 chats
      const summary = await getGroqSummary(userSearchInput, chatHistory);
      setCurrentSummary(summary);
      setCurrentQuery(userSearchInput);
      setShowSerpButton(true);

      // Add to chat history
      const newChat = {
        id: generateId(),
        query: userSearchInput,
        summary,
        timestamp: new Date().toISOString(),
        type: searchType,
      };

      setChatHistory((prev) => [...prev, newChat]);
      setUserSearchInput("");
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSerpResults = async () => {
    if (!currentQuery) return;

    setLoading(true);
    try {
      console.log("🚀 Fetching SERP results for:", currentQuery);
      const results = await getSerpResults(currentQuery);
      console.log("✅ SERP results received:", results);
      setSerpResults(results);
      
      if (results.length === 0) {
        setError("No search results found. This might be due to API limits or the query.");
      }
    } catch (error) {
      console.error("💥 Error fetching SERP results:", error);
    } finally {
      setLoading(false);
    }
  };

  // Test function to check SERP API (you can call this from browser console)
  const testSerpAPI = async () => {
    console.log("🧪 Testing SERP API...");
    try {
      const results = await getSerpResults("test query");
      console.log("✅ SERP API Test Success:", results);
      return results;
    } catch (error) {
      console.error("❌ SERP API Test Failed:", error);
      return null;
    }
  };

  // Expose test function to window for debugging
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.testSerpAPI = testSerpAPI;
      console.log("🔧 Debug: You can test SERP API by running 'testSerpAPI()' in the browser console");
    }
  }, []);

  const clearHistory = () => {
    setChatHistory([]);
    localStorage.removeItem("perplexity-chat-history");
    setCurrentSummary("");
    setCurrentQuery("");
    setShowSerpButton(false);
    setSerpResults([]);
    setError("");
    setHasStartedChat(false);
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header Section */}
      <div className={`w-full transition-all duration-700 ease-in-out ${
        hasStartedChat 
          ? 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 shadow-sm' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Title */}
            <div className={`flex items-center gap-4 transition-all duration-700 ${
              hasStartedChat ? 'scale-75' : 'scale-100'
            }`}>
              <Image 
                src="/logo.png" 
                alt="logo" 
                width={hasStartedChat ? 60 : 160} 
                height={hasStartedChat ? 60 : 160}
                className="transition-all duration-700"
              />
              {hasStartedChat && (
                <div className="animate-fade-in">
                  <h1 className="text-xl font-bold text-gray-800 dark:text-white">Perplexity AI</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Ask me anything</p>
                </div>
              )}
            </div>

            {/* Theme Toggle and Clear History */}
            <div className="flex items-center gap-2">
              {hasStartedChat && chatHistory.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearHistory}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear History
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {isDark ? (
                  <Sun className="h-5 w-5 text-yellow-500" />
                ) : (
                  <Moon className="h-5 w-5 text-gray-600" />
                )}
              </Button>
            </div>
          </div>

          {/* Chat Input Box */}
          <div className={`transition-all duration-700 ${
            hasStartedChat ? 'mt-4' : 'mt-10 flex justify-center'
          }`}>
            <div className={`relative transition-all duration-700 ${
              hasStartedChat ? 'w-full' : 'w-full max-w-2xl'
            }`}>
              <div className="p-2 w-full border border-gray-300 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center">
                  <input
                    type="text"
                    placeholder="Ask anything..."
                    value={userSearchInput}
                    onChange={(e) => setUserSearchInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && onSearchQuery()}
                    className="w-full p-4 pr-16 outline-none rounded-2xl bg-transparent text-gray-800 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                    disabled={loading}
                  />
                  <Button
                    onClick={onSearchQuery}
                    disabled={loading || !userSearchInput.trim()}
                    className="absolute right-2 p-2 h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                  >
                    {loading ? (
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <ArrowRight className="text-white h-5 w-5" />
                    )}
                  </Button>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
                    {error}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Initial Welcome Screen */}
      {!hasStartedChat && (
        <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to Perplexity AI
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Ask me anything and I'll provide clear, accurate answers with the option to get related articles
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <MessageCircle className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-800 dark:text-white">Ask Questions</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Get instant answers to your queries</p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <ExternalLink className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-800 dark:text-white">Related Articles</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Find relevant web sources</p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <Sun className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <h3 className="font-semibold text-gray-800 dark:text-white">Smart Context</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Remembers conversation history</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Chat Results Area */}
      {hasStartedChat && (
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 space-y-6">
            {/* Current Summary */}
            {currentSummary && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-lg animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <h3 className="font-semibold text-lg text-gray-800 dark:text-white">AI Response</h3>
                </div>
                <MarkdownRenderer 
                  content={currentSummary} 
                  className="text-gray-700 dark:text-gray-300 leading-relaxed"
                />
                
                {/* SERP Button */}
{/*                 {showSerpButton && (
                  <div className="mt-6 flex flex-col sm:flex-row gap-4 items-start">
                    <Button
                      onClick={fetchSerpResults}
                      disabled={loading}
                      className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-4 py-2 rounded-lg transition-all duration-300"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {loading ? "Fetching..." : "Get Related Articles"}
                    </Button>
                    <span className="text-sm text-gray-600 dark:text-gray-400 self-center">
                      Find relevant web sources for deeper research
                    </span>
                  </div>
                )} */}
              </div>
            )}

            {/* SERP Results */}
            {serpResults.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-800 shadow-lg animate-fade-in">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Related Articles</h3>
                </div>
                <div className="grid gap-4">
                  {serpResults.map((result, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 hover:border-green-300 dark:hover:border-green-600"
                    >
                      <h4 className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors">
                        <a
                          href={result.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {result.title}
                        </a>
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                        {result.snippet}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <ExternalLink className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-500 dark:text-gray-500">
                          {result.displayLink}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chat History */}
            {chatHistory.length > 1 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <h3 className="font-semibold text-lg text-gray-800 dark:text-white">Previous Conversations</h3>
                </div>
                {chatHistory
                  .slice(0, -1) // Exclude the current chat
                  .reverse()
                  .slice(0, 5) // Show only last 5
                  .map((chat) => (
                    <div key={chat.id} className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-medium text-gray-800 dark:text-white">{chat.query}</h4>
                        <span className="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap ml-4">
                          {new Date(chat.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <MarkdownRenderer 
                        content={chat.summary} 
                        className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed"
                      />
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatInputBox;
