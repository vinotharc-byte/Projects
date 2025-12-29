import { GoogleGenAI, Type } from "@google/genai";
import { Bucket, Task, Priority, Status } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateProjectPlan = async (topic: string): Promise<{ buckets: Bucket[], tasks: Task[] }> => {
  if (!ai) throw new Error("Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in your .env file.");
  const model = "gemini-2.5-flash";

  const prompt = `Create a detailed project management plan for: "${topic}". 
  Generate 3-5 logical buckets (stages) and 3-5 tasks per bucket. 
  For each task, provide:
  1. Realistic Title and Description.
  2. Priority.
  3. Start Date offset (from today) and Duration (days).
  4. Estimated Effort (hours) - assume 8h/day standard but vary for realism.
  5. Assignee Name (invent realistic names like 'Jane Doe', 'Alex Smith').
  6. Allocation percentage (usually 100, sometimes 50).
  Ensure the timeline spans roughly 30-45 days.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            buckets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  tasks: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        priority: { type: Type.STRING, enum: ["Low", "Medium", "High", "Urgent"] },
                        startDateOffset: { type: Type.NUMBER },
                        durationDays: { type: Type.NUMBER },
                        effortHours: { type: Type.NUMBER },
                        assignee: { type: Type.STRING },
                        allocation: { type: Type.NUMBER }
                      },
                      required: ["title", "priority", "startDateOffset", "durationDays", "effortHours", "assignee"]
                    }
                  }
                },
                required: ["name", "tasks"]
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text);
    const today = new Date();

    // Transform into our app's internal structure with IDs
    const newBuckets: Bucket[] = [];
    const newTasks: Task[] = [];

    data.buckets.forEach((b: any) => {
      const bucketId = Math.random().toString(36).substr(2, 9);
      newBuckets.push({
        id: bucketId,
        name: b.name
      });

      b.tasks.forEach((t: any) => {
        const start = new Date(today);
        start.setDate(today.getDate() + (t.startDateOffset || 0));

        const end = new Date(start);
        end.setDate(start.getDate() + (t.durationDays || 1));

        newTasks.push({
          id: Math.random().toString(36).substr(2, 9),
          title: t.title,
          description: t.description || "",
          bucketId: bucketId,
          priority: t.priority as Priority,
          status: Status.NOT_STARTED,
          labels: [],
          startDate: start.toISOString().split('T')[0],
          dueDate: end.toISOString().split('T')[0],
          percentComplete: 0,
          effort: t.effortHours,
          assignee: t.assignee,
          allocation: t.allocation || 100,
          predecessors: []
        });
      });
    });

    return { buckets: newBuckets, tasks: newTasks };

  } catch (error) {
    console.error("Error generating plan:", error);
    throw error;
  }
};