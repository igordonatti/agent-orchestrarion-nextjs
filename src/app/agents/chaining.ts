import { generateObject, generateText } from "ai";
import { z } from "zod";
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY || "",
});

// A função é assíncrona porque ela vai fazer chamadas de rede para a API da IA,
// que são operações que levam tempo. 'input: string' indica que ela espera receber
// um texto como argumento (provavelmente a descrição de um produto).
export async function generateMarketingCopy(input: string): Promise<string> {
  const model = groq("moonshotai/kimi-k2-instruct");

  // A função generateText é projetada para receber um prompt e
  // retornar uma resposta em formato de texto simples.
  console.log("Generating initial marketing copy...");
  const { text: copy } = await generateText({
    model,
    prompt: `Write persuasive marketing copy for: ${input}. Focus on benefits and emotional appeal`,
  });

  //A função generateObject é mais avançada;
  // ela força a IA a responder em um formato de objeto JSON estruturado que corresponde a um esquema definido.
  console.log("Evaluating marketing copy quality...");
  const { object: qualityMetrics } = await generateObject({
    model,
    // Define a "forma" exata que o objeto de resposta deve ter.
    // A IA é instruída a gerar uma saída que passe na validação deste esquema.
    schema: z.object({
      hasCallToAction: z.boolean(),
      emotionalAppeal: z.number().min(1).max(10),
      clarity: z.number().min(1).max(10),
    }),
    prompt: `Evaluate this marketing copy for:
    1. Presence of call to action (true/false)
    2. Emotional appeal (1-10)
    3. Clarity (1-10)
    
    Copy to evaluate: ${copy}`,
  });

  console.log(
    `Evaluate result: 
    Clarity: ${qualityMetrics.clarity}
    Emotional appeal: ${qualityMetrics.emotionalAppeal}
    Call: ${qualityMetrics.hasCallToAction}
    `
  );

  // If quality check fails, regenerate with more specific instructions
  if (
    !qualityMetrics.hasCallToAction ||
    qualityMetrics.emotionalAppeal < 7 ||
    qualityMetrics.clarity < 7
  ) {
    console.log("Improving marketing copy based on quality evaluation...");
    const { text: improvedCopy } = await generateText({
      model,
      prompt: `Rewrite this marketing copy with: 
      ${!qualityMetrics.hasCallToAction ? "- A clear call to action" : ""}
      ${qualityMetrics.emotionalAppeal < 7 ? "- Stronger emotional appeal" : ""}
      ${qualityMetrics.clarity < 7 ? "- Improved clarity and directness" : ""}

      Original copy: ${copy}`,
    });

    console.log("\nFinal Improved Marketing Copy:\n", improvedCopy);
    console.log("\nQuality Metrics:", qualityMetrics);
    return improvedCopy;
  }

  return copy;
}
