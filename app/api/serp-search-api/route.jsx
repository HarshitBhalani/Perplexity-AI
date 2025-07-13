import axios from "axios";
import { error } from "console";
import { NextResponse } from "next/server";

export async function POST(request) {
    const { searchInput, searchType } = await request.json();

    if (searchInput) {
        const result = await axios.get('https://serpapi.com/search.json?engine=google&q=' + searchInput+'&count=5', {
            headers: {
                'Accept': 'application/json',
                'Accept-Encoding': 'gzip'
            },
            params: {
                'api_key': process.env.SERP_API_KEY
            }
        });
        console.log(result.data);

        return NextResponse.json(result.data);
    }
    else {
        return NextResponse.json({ error: 'Search input is required' }, {
            status: 400
        });
    }
}