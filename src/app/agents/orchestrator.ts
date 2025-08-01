import { generateObject } from "ai";
import { z } from "zod";
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY || "",
});

export async function implementTask(taskRequest: string) {
  const model = groq("moonshotai/kimi-k2-instruct");
  const system =
    "You are a Project Manager responsible for designing an efficient task execution strategy.";
  const prompt = `Create a work plan for the following task: 
    ${taskRequest}`;

  const { object: taskPlan } = await generateObject({
    model,
    system,
    prompt,
    schema: z.object({
      tasks: z.array(
        z.object({
          purpose: z.string(),
          taskName: z.enum([
            "Audience research",
            "Content creation",
            "Account management",
            "Performance analysis",
          ]),
          changeType: z.enum(["create", "modify", "delete"]),
        })
      ),
      estimatedEffort: z.enum(["low", "medium", "high"]),
    }),
  });

  const taskChanges = await Promise.all(
    taskPlan.tasks.map(async (task) => {
      // Determine job roles based on task type
      const workerSystemPrompt = {
        create:
          {
            "Audience research":
              "You are a Business Analyst. You are responsible for conduncting in-depth research on the targer audience",
            "Content creation":
              "You are a Content Strategist. You design engaging content stragies tailored to the audience.",
            "Account management":
              "You are a Social Media Manager. You manage and optimize social media accounts.",
            "Performance analysis":
              "You are a Marketing Analyst. You analyze data and measure the success of marketing strategies.",
          }[task.taskName] || "You are an expert profissional in this field.",
        modify:
          {
            "Audience research":
              "You are a Business Analyst. You improve audience research strategies to be more effective.",
            "Content creation":
              "You are a Content Strategist. You enhance content creation strategies to be more effective.",
            "Account management":
              "You are a Social Media Manager. You improve account management strategies to be more effective.",
            "Performance analysis":
              "You are a Marketing Analyst. You enhance performance analysis strategies to be more effective.",
          }[task.taskName] || "You are a specialist enhancing task efficiency.",
        delete:
          {
            "Audience research":
              "You are an Operations Manager. You identify unnecessary audience research tasks and remove them efficiently.",
            "Content creation":
              "You are an Operations Manager. You identify unnecessary content creation tasks and remove them efficiently.",
            "Account management":
              "You are an Operations Manager. You identify unnecessary account management tasks and remove them efficiently.",
            "Performance analysis":
              "You are an Operations Manager. You identify unnecessary performance analysis tasks and remove them efficiently.",
          }[task.taskName] ||
          "You are an Operations Manager. You identify unnecessary tasks and remove them efficiently.",
      }[task.changeType];

      const { object: change } = await generateObject({
        model,
        schema: z.object({
          explanation: z.string(),
          actionItems: z.array(z.string()),
        }),
        system: workerSystemPrompt,
        prompt: `Implement changes for the following task: 
        - ${task.taskName}
        
        Purpose of change: ${task.purpose}

        Explain the reason for the change and provide a list of necessary action items.
        `,
      });

      return {
        task,
        implementantion: change,
      };
    })
  );

  console.log("==== TASK PLAN ====");
  console.log(JSON.stringify(taskPlan, null, 2));

  console.log("==== TASK CHANGES ====");
  taskChanges.forEach((change, index) => {
    console.log(`\n${index + 1}. ${change.task.taskName}`);
    console.log(`   Purpose       : ${change.task.purpose}`);
    console.log(`   Change Type   : ${change.task.changeType}`);
    console.log(`   Explanation   : ${change.implementantion.explanation}`);
    console.log(`   Action Items  :`);
    change.implementantion.actionItems.forEach((item, idx) => {
      console.log(`     - ${item}`);
    });
  });

  return {
    plan: taskPlan,
    changes: taskChanges,
  };
}
