import { inngest } from "@/inngest/client";
import { NextResponse } from "next/server";

export async function POST(req) {
    const { searchInput, searchResult, recordId } = await req.json();


    const inggestRunId = await inggest.send({
        name: 'llm-model',
        data: {
            searchInput: searchInput,
            searchResult: searchResult,
            recordId: recordId
        }
    });
    return NextResponse.json(inggestRunId)
}