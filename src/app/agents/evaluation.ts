import { groq } from "@ai-sdk/groq";
import { generateObject, generateText } from "ai";
import z from "zod";

export async function writeArticleWithFeedback(
  topic: string
): Promise<{ finalArticle: string; iterationsRequired: number }> {
  const model = groq("moonshotai/kimi-k2-instruct");

  let currentArticle = "";
  let iterations = 0;
  const MAX_INTERATIONS = 3;

  // Initial article generation
  const { text: article } = await generateText({
    model,
    system:
      "You are a writer. Your task is to write a concise article in only 6 sentences! Yo might get additional feedback from you supervisor",
    prompt: `Write a 6-sentence article on the topic: ${topic}`,
  });

  currentArticle = article;

  while (iterations < MAX_INTERATIONS) {
    // Evaluate current article
    const { object: evaluation } = await generateObject({
      model,
      schema: z.object({
        qualityScore: z.number().min(1).max(10),
        clearAndConcise: z.boolean(),
        engaging: z.boolean(),
        informative: z.boolean(),
        specificIssues: z.array(z.string()),
        improvementSuggestions: z.array(z.string()),
      }),
      system:
        "You are a writing supervisor! Your agency specializes in concise articles! Your task is to evaluate the given article and provide feedback for improvements! Repeat until the article meets your requirements!",
      prompt: `Evaluate this article:
      
      Article: ${article}
      
      Consider:
      1. Overall quality
      2. Clarity conciseness
      3. Engagement level
      4. Information value`,
    });

    // Check if quality meets threshold
    if (
      evaluation.qualityScore >= 8 &&
      evaluation.clearAndConcise &&
      evaluation.engaging &&
      evaluation.informative
    ) {
      break;
    }

    // Generate improved article based on feedback
    const { text: improvedArticle } = await generateText({
      model,
      system: "You are an expert article writer.",
      prompt: `Improve this article based on the following feedback:
      ${evaluation.specificIssues.join("\n")}
      ${evaluation.improvementSuggestions.join("\n")}
      
      Current article: ${currentArticle}`,
    });

    currentArticle = improvedArticle;
    iterations++;
  }

  return {
    finalArticle: currentArticle,
    iterationsRequired: iterations,
  };
}
