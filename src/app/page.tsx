import { generateMarketingCopy } from "./agents/chaining";
import { writeArticleWithFeedback } from "./agents/evaluation";
import { implementTask } from "./agents/orchestrator";

export default async function Home() {
  const input = "i4t, uma empresa de marketing utilizando inteligencia artificial. escreva em pt-br e seja conciso";
  const text = await generateMarketingCopy(input);

  const topic = 'Machine learning in space'
  const result = await writeArticleWithFeedback(topic)

  const taskRequest = 'Develop a social media marketing strategy for a small business';
  const taskResult = await implementTask(taskRequest)

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <div className="mt-32">
        <h2 className="font-bold text-2xl">Generated Marketing Copy</h2>
        {text}

        <h2 className="font-bold text-2xl">Generated Article</h2>
        {result.finalArticle}
        <p className="font-bold">Iterações necessárias do artigo: {result.iterationsRequired}</p>

        <h2 className="font-bold text-2xl">Generated Task</h2>
      </div>
    </div>
  );
}
