import React, { useEffect, useState } from 'react'
import { LucideImage, LucideList, LucideSparkles, LucideVideo, LucideLoader } from 'lucide-react';
import AnswerDisplay from './AnswerDisplay';
import axios from 'axios';
import { supabase } from '@/services/supabase';
import { useParams } from 'next/navigation';

const tabs = [
    { label: 'Answer', icon: LucideSparkles },
    { label: 'Images', icon: LucideImage },
    { label: 'Videos', icon: LucideVideo },
    { label: 'Sources', icon: LucideList },
];

function DisplayResult({ searchInputRecord }) {
    const [activeTab, setActiveTab] = useState('Answer');
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [aiResp, setAiResp] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const { libId } = useParams();

    useEffect(() => {
        if (searchInputRecord?.searchInput) {
            console.log('Search triggered for:', searchInputRecord.searchInput);
            GetSearchApiResult();
        }
    }, [searchInputRecord]);

    const GetSearchApiResult = async () => {
        console.log('Starting API call...');
        setLoading(true);
        setError(null);
        setSearchResults([]); // Clear previous results
        setAiResp(null); // Clear previous AI response

        try {
            const result = await axios.post('/api/serp-search-api', {
                searchInput: searchInputRecord?.searchInput,
                searchType: searchInputRecord?.type
            });

            console.log('=== API RESPONSE DEBUG ===');
            console.log('Full Response:', result.data);
            console.log('Organic Results:', result.data?.organic_results);

            // Direct extraction of organic results
            const organicResults = result.data?.organic_results || [];
            console.log('Extracted Results:', organicResults);
            console.log('Results Count:', organicResults.length);

            // Process each result
            const processedResults = organicResults.map((item, index) => {
                console.log(`Processing result ${index}:`, item);
                return {
                    id: index,
                    title: item.title || 'No Title',
                    description: item.snippet || item.description || 'No description',
                    url: item.link || item.url || '#',
                    source: item.source || item.displayed_link || 'Unknown',
                    date: item.date || item.published_date || null
                };
            });

            // Set search results first
            setSearchResults(processedResults);

            // Save search results to Supabase
            const { data: chatData, error: insertError } = await supabase
                .from('Chats')
                .insert([
                    {
                        libId: libId,
                        searchResult: processedResults,
                    },
                ])
                .select()

            // Handle Supabase error if needed
            if (insertError) {
                console.error('Supabase insert error:', insertError);
                throw new Error('Failed to save search results');
            }

            console.log('=== SUPABASE INSERT SUCCESS ===');
            console.log('Inserted Chat Record:', chatData[0]);
            console.log('Chat Record ID:', chatData[0].id);

            console.log('=== PROCESSED RESULTS ===');
            console.log('Processed Results:', processedResults);
            console.log('Setting state with:', processedResults.length, 'results');

            // Generate AI response after successful search
            await GenerateAIResp(processedResults, chatData[0].id);

        } catch (err) {
            console.error('API Error:', err);
            setError('Failed to fetch search results');
        } finally {
            setLoading(false);
        }
    };

    // Generate AI Response and Save to Database
    const GenerateAIResp = async (processedResults, recordId) => {
        console.log('=== STARTING AI GENERATION ===');
        console.log('Record ID for update:', recordId);
        console.log('Search Input:', searchInputRecord?.searchInput);
        console.log('Processed Results for AI:', processedResults);
        
        setAiLoading(true);
        
        try {
            // Call LLM API
            const aiResult = await axios.post('/api/llm-model', {
                searchInput: searchInputRecord?.searchInput,
                searchResult: processedResults,
                recordId: recordId
            });
            
            console.log('=== AI API RESPONSE ===');
            console.log('Full AI Response:', aiResult.data);
            console.log('AI Response Type:', typeof aiResult.data);
            console.log('AI Response Content:', JSON.stringify(aiResult.data, null, 2));
            
            // Set AI response in state
            setAiResp(aiResult.data);

            // Save AI response to database
            console.log('=== UPDATING DATABASE WITH AI RESPONSE ===');
            console.log('Updating record ID:', recordId);
            console.log('AI data to save:', aiResult.data);
            
            const { data: updateData, error: updateError } = await supabase
                .from('Chats')
                .update({ 
                    aiResp: aiResult.data 
                })
                .eq('id', recordId)
                .select();

            if (updateError) {
                console.error('=== DATABASE UPDATE ERROR ===');
                console.error('Update Error:', updateError);
                console.error('Error details:', JSON.stringify(updateError, null, 2));
                throw new Error(`Failed to save AI response to database: ${updateError.message}`);
            }

            console.log('=== DATABASE UPDATE SUCCESS ===');
            console.log('Updated record:', updateData);
            console.log('Updated aiResp field:', updateData[0]?.aiResp);
            console.log('Update successful for record ID:', recordId);

        } catch (error) {
            console.error('=== AI GENERATION OR DATABASE ERROR ===');
            console.error('Error:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            
            setError('Failed to generate AI response or save to database');
            
            // Try to log more details about the error
            if (error.response) {
                console.error('API Error Response:', error.response.data);
                console.error('API Error Status:', error.response.status);
            }
        } finally {
            setAiLoading(false);
        }
    }

    // Simple render function for sources
    const renderSources = () => {
        console.log('=== RENDER SOURCES DEBUG ===');
        console.log('Current searchResults state:', searchResults);
        console.log('Array length:', searchResults.length);
        console.log('Is array?', Array.isArray(searchResults));

        if (loading) {
            return (
                <div className="flex items-center justify-center py-8">
                    <LucideLoader className="animate-spin mr-2" size={20} />
                    <span>Loading results...</span>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-red-500 text-center py-8">
                    <p>{error}</p>
                </div>
            );
        }

        return (
            <div className="mt-4">
                {/* Results Display */}
                {searchResults.length > 0 ? (
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium text-green-600">
                            Found {searchResults.length} results:
                        </h3>
                        {searchResults.map((result) => (
                            <div key={result.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                                <h4 className="font-medium text-blue-600 hover:underline">
                                    <a href={result.url} target="_blank" rel="noopener noreferrer">
                                        {result.title}
                                    </a>
                                </h4>
                                <p className="text-gray-600 text-sm mt-2">{result.description}</p>
                                <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                                    <span>{result.source}</span>
                                    {result.date && <span>• {result.date}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <p className="text-lg">No results to display</p>
                        <p className="text-sm mt-2">
                            {searchInputRecord?.searchInput ?
                                'Try searching for something else' :
                                'Enter a search query to get started'
                            }
                        </p>
                    </div>
                )}
            </div>
        );
    };

    // Main render
    if (!searchInputRecord) {
        return (
            <div className="text-center py-8 text-gray-500">
                <p>Enter a search query to get started</p>
            </div>
        );
    }

    return (
        <div className='mt-7'>
            <h2 className='font-medium text-3xl line-clamp-3'>
                {searchInputRecord?.searchInput}
            </h2>

            {/* Tab Navigation */}
            <div className="flex items-center space-x-6 border-b border-gray-200 pb-2 mt-6">
                {tabs.map(({ label, icon }) => (
                    <button
                        key={label}
                        onClick={() => setActiveTab(label)}
                        className={`flex items-center gap-1 relative text-sm font-medium text-gray-700 hover:text-black ${activeTab === label ? 'text-black' : ''
                            }`}
                    >
                        <span className="w-4 h-4">
                            {React.createElement(icon, { size: 16 })}
                        </span>
                        <span>{label}</span>
                        {label === 'Sources' && searchResults.length > 0 && (
                            <span className="ml-1 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                {searchResults.length}
                            </span>
                        )}
                        {activeTab === label && (
                            <span className="absolute -bottom-2 left-0 w-full h-0.5 bg-black rounded"></span>
                        )}
                    </button>
                ))}

                <div className="ml-auto text-sm text-gray-500">
                    {loading ? 'Searching...' : `${searchResults?.length || 0} results`}
                </div>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'Answer' && (
                    <div>
                        {aiLoading && (
                            <div className="flex items-center justify-center py-8">
                                <LucideLoader className="animate-spin mr-2" size={20} />
                                <span>Generating AI response...</span>
                            </div>
                        )}
                        <AnswerDisplay 
                            searchResult={{ web: { results: searchResults } }} 
                            aiResp={aiResp}
                            loading={aiLoading}
                        />
                    </div>
                )}
                {activeTab === 'Sources' && renderSources()}
                {activeTab === 'Images' && (
                    <div className="mt-4 text-center text-gray-500">
                        <p>Images functionality coming soon</p>
                    </div>
                )}
                {activeTab === 'Videos' && (
                    <div className="mt-4 text-center text-gray-500">
                        <p>Videos functionality coming soon</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DisplayResult;