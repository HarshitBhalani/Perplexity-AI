import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(request) {
    try {
        const { query, context = [] } = await request.json();

        if (!query) {
            return NextResponse.json(
                { error: 'Query is required' },
                { status: 400 }
            );
        }

        if (!GROQ_API_KEY) {
            return NextResponse.json(
                { error: 'Groq API key not configured' },
                { status: 500 }
            );
        }

        // Build context messages
        const messages = [
            {
                role: 'system',
                content: 'You are a helpful AI assistant. Provide comprehensive, accurate, and well-structured summaries based on the user query. Keep responses informative but concise.'
            }
        ];

        // Add context from previous chats if available
        if (context.length > 0) {
            messages.push({
                role: 'system',
                content: `Previous conversation context: ${context.map(c => c.content).join('\n')}`
            });
        }

        messages.push({
            role: 'user',
            content: query
        });

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.1-70b-versatile', // Llama 70B model
                messages: messages,
                max_tokens: 1024,
                temperature: 0.7,
                top_p: 1,
                stream: false
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Groq API Error:', response.status, errorData);
            
            return NextResponse.json(
                { error: `Groq API error: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            return NextResponse.json(
                { error: 'Invalid response from Groq API' },
                { status: 500 }
            );
        }

        const summary = data.choices[0].message.content;

        return NextResponse.json({
            summary,
            usage: data.usage
        });

    } catch (error) {
        console.error('Error in Groq API route:', error);
        
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
