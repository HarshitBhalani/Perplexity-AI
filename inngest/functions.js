import { supabase } from "@/services/supabase";
import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  },
);

export const llmModel = inngest.createFunction(
  { id: "llm-model" },
  { event: "llm-model" },
  async ({ event, step }) => {
    const aiResp = await step.ai.infer('generate-ai-llm-call', {
      model: 'gemini-1.5-flash',
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY,
      body: {
        contents: [
          {
            role: 'system',
            parts: [
              {
                text: 'Depends on user input sources, summerize and search about topic, Give a markdown formatting. UserInput is : ' + event.data.searchInput
              }
            ]
          },
          {
            role: 'user',
            parts: [
              {
                text: JSON.stringify(event.data.searchResult)
              }
            ]
          }
        ]
      }
    });


    const saveToDB = await step.run('saveToDB', async () => {
      const { data, error } = await supabase
        .from('Chats')
        .update({ aiResp: aiResp?.candidate[0].content.parts[0].text })
        .eq('id', event.data.recordId)
        .select()
      return data
    })

  },
);