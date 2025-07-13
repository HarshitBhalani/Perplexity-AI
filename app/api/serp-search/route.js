import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { query } = await request.json();

        if (!query) {
            return NextResponse.json(
                { error: 'Query is required' },
                { status: 400 }
            );
        }

        const SERP_API_KEY = process.env.NEXT_PUBLIC_SERP_API_KEY;
        
        if (!SERP_API_KEY) {
            return NextResponse.json(
                { error: 'SERP API key not configured' },
                { status: 500 }
            );
        }

        const searchParams = new URLSearchParams({
            engine: 'google',
            q: query,
            api_key: SERP_API_KEY,
            num: 10,
            safe: 'active'
        });

        console.log("🔍 Server-side SERP API call for query:", query);

        const response = await fetch(`https://serpapi.com/search.json?${searchParams}`, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; PerplexityClone/1.0)',
            }
        });

        console.log("📡 SERP Response Status:", response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ SERP API Error:", errorText);
            
            return NextResponse.json(
                { error: `SERP API error: ${response.status} - ${errorText}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        console.log("📦 SERP API Success - Found results:", data.organic_results?.length || 0);

        // Extract organic results
        const results = data.organic_results?.map(result => ({
            title: result.title,
            link: result.link,
            snippet: result.snippet,
            displayLink: result.displayed_link || result.link
        })) || [];

        return NextResponse.json({
            results,
            searchMetadata: {
                query: data.search_metadata?.query,
                totalResults: data.search_information?.total_results
            }
        });

    } catch (error) {
        console.error('Error in SERP API route:', error);
        
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
