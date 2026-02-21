import { notFound } from 'next/navigation';
import { getSurveyResults, QuestionResult, CategoryResult, MultipleChoiceAnalysis, CrossQuestionAnalysis } from '@/lib/get-survey-results';

interface ResultPageProps {
  params: Promise<{
    year: string;
  }>;
}

export async function generateMetadata({ params }: ResultPageProps) {
  const { year } = await params;
  return {
    title: `State of Code ${year} Results | stateofcode.ai`,
    description: `View the results of the ${year} State of Code survey - insights on how developers use AI coding agents.`,
  };
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { year } = await params;
  const yearNum = parseInt(year, 10);

  if (isNaN(yearNum)) {
    notFound();
  }

  const results = await getSurveyResults(yearNum);

  if (!results) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <header className="mb-16 text-center">
          <div className="mb-8">
            <pre 
              className="font-mono text-[0.5rem] sm:text-[0.7rem] md:text-[0.85rem] leading-none whitespace-pre text-[#CD8B6A] select-none drop-shadow-[0_0_10px_rgba(205,139,106,0.5)] inline-block text-left"
              style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace', lineHeight: 1 }}
              aria-label="State of Code"
            >
{`███████╗ ████████╗  █████╗  ████████╗ ███████╗
██╔════╝ ╚══██╔══╝ ██╔══██╗ ╚══██╔══╝ ██╔════╝
███████╗    ██║    ███████║    ██║    █████╗  
╚════██║    ██║    ██╔══██║    ██║    ██╔══╝  
███████║    ██║    ██║  ██║    ██║    ███████╗
╚══════╝    ╚═╝    ╚═╝  ╚═╝    ╚═╝    ╚══════╝
 ██████╗  ███████╗      ██████╗  ██████╗  ██████╗  ███████╗
██╔═══██╗ ██╔════╝     ██╔════╝ ██╔═══██╗ ██╔══██╗ ██╔════╝
██║   ██║ █████╗       ██║      ██║   ██║ ██║  ██║ █████╗  
██║   ██║ ██╔══╝       ██║      ██║   ██║ ██║  ██║ ██╔══╝  
╚██████╔╝ ██║          ╚██████╗ ╚██████╔╝ ██████╔╝ ███████╗
 ╚═════╝  ╚═╝           ╚═════╝  ╚═════╝  ╚═════╝  ╚══════╝`}
            </pre>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-mono">
            {results.survey.title}
          </h1>
          <p className="text-lg text-gray-400 mb-8 max-w-2xl mx-auto font-mono">
            {results.survey.description || 'Exploring how developers use AI coding agents and tools.'}
          </p>
        </header>

        {/* Key Takeaways */}
        <section className="mb-16">
          <h2 className="text-xl sm:text-2xl font-bold text-white font-mono flex items-center gap-3 mb-8">
            <span className="text-[#CD8B6A]">❯</span>
            Key Takeaways
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TakeawayCard
              stat="57%"
              title="Claude Code leads"
              description="Claude Code is the most-used AI coding tool, and the #1 recommended tool at 43%."
            />
            <TakeawayCard
              stat="87%"
              title="Daily AI usage"
              description="The vast majority of developers use AI coding tools every day. Only 2% have tried and stopped."
            />
            <TakeawayCard
              stat="65%"
              title="Significant productivity gains"
              description="Most developers report significantly increased productivity. 54% strongly agree AI tools make them a better developer."
            />
            <TakeawayCard
              stat="#1"
              title="Hallucinations are the top challenge"
              description="58% cite inaccurate or hallucinated code as their biggest challenge, followed by cost (42%)."
            />
            <TakeawayCard
              stat="70%"
              title="JS/TS dominates"
              description="JavaScript/TypeScript is the most popular language, followed by Python at 60%."
            />
            <TakeawayCard
              stat="61%"
              title="Opus 4.5 is the top model"
              description="Anthropic's Opus 4.5 leads model usage, followed by Sonnet 4.5 (51%) and Gemini 3 Pro (37%)."
            />
            <TakeawayCard
              stat="67%"
              title="Companies encourage AI tools"
              description="Two-thirds of companies officially encourage AI tool usage. Only 2% ban them."
            />
            <TakeawayCard
              stat="49%"
              title="Fewer hallucinations wanted most"
              description="Top requested improvements: fewer hallucinations, more affordable pricing (43%), and better codebase understanding (41%)."
            />
          </div>
        </section>

        {/* Results */}
        <main className="space-y-16">
          {results.categories.map((category) => (
            <CategorySection key={category.id} category={category} />
          ))}

          {/* Cross-Question Analysis */}
          {results.crossAnalysis && results.crossAnalysis.languageToTools.length > 0 && (
            <CrossAnalysisSection analysis={results.crossAnalysis} />
          )}
        </main>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-[#30363d] text-center">
          <p className="text-gray-600 text-sm font-mono">
            stateofcode.ai · {year}
          </p>
        </footer>
      </div>
    </div>
  );
}

function CategorySection({ category }: { category: CategoryResult }) {
  return (
    <section>
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-white font-mono flex items-center gap-3">
          <span className="text-[#CD8B6A]">❯</span>
          {category.name}
        </h2>
        {category.description && (
          <p className="text-gray-500 mt-2 font-mono text-sm">
            {category.description}
          </p>
        )}
      </div>

      <div className="space-y-10">
        {category.questions.map((question) => (
          <QuestionCard key={question.id} question={question} />
        ))}
      </div>
    </section>
  );
}

function QuestionCard({ question }: { question: QuestionResult }) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6">
      <h3 className="text-white font-mono mb-2">
        {question.prompt}
      </h3>
      {question.description && (
        <p className="text-gray-500 text-sm font-mono mb-4">
          {question.description}
        </p>
      )}

      {/* Custom insight for tools question - shown before charts */}
      {question.slug === 'tools-currently-use' && question.multipleChoiceAnalysis && (
        <div className="mb-6 p-4 bg-[#21262d] rounded-lg border border-[#30363d]">
          <p className="text-gray-300 font-mono text-sm">
            💡 On average, developers use <span className="text-[#CD8B6A] font-medium">{question.multipleChoiceAnalysis.avgSelections}</span> tools. 
            The most popular is <span className="text-[#CD8B6A] font-medium">{question.answers[0]?.label}</span>, 
            followed by <span className="text-[#CD8B6A] font-medium">{question.answers[1]?.label}</span>.
          </p>
        </div>
      )}

      {question.type === 'scale' ? (
        <ScaleChart question={question} />
      ) : (
        <HorizontalBarChart question={question} />
      )}

      {/* Multiple-choice analysis (skip for specific questions) */}
      {question.type === 'multiple' && question.multipleChoiceAnalysis && 
       !['programming-languages', 'tools-currently-use', 'capabilities-improvement', 'models-use'].includes(question.slug) && (
        <MultipleChoiceInsights analysis={question.multipleChoiceAnalysis} />
      )}
    </div>
  );
}

function HorizontalBarChart({ question }: { question: QuestionResult }) {
  const filteredAnswers = question.answers.filter(a => a.percentage > 0);
  const maxPercentage = Math.max(...filteredAnswers.map(a => a.percentage), 1);

  return (
    <div className="space-y-3">
      {filteredAnswers.map((answer) => (
        <div key={answer.value} className="group">
          <div className="flex items-center justify-between text-sm font-mono mb-1">
            <span className="text-gray-300 truncate pr-4">{answer.label}</span>
            <span className="text-gray-500 flex-shrink-0">
              {answer.percentage}%
            </span>
          </div>
          <div className="h-6 bg-[#21262d] rounded overflow-hidden">
            <div
              className="h-full bg-[#CD8B6A] rounded transition-all duration-500 ease-out flex items-center"
              style={{ width: `${(answer.percentage / maxPercentage) * 100}%` }}
            >
              {answer.percentage > 10 && (
                <span className="text-xs font-mono text-black/70 px-2">
                  {answer.percentage}%
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ScaleChart({ question }: { question: QuestionResult }) {
  // For scale charts, keep all values to show the full scale range
  const maxPercentage = Math.max(...question.answers.map(a => a.percentage), 1);

  return (
    <div>
      {/* Scale labels */}
      {(question.scaleMinLabel || question.scaleMaxLabel) && (
        <div className="flex justify-between text-xs text-gray-500 font-mono mb-2">
          <span>{question.scaleMinLabel}</span>
          <span>{question.scaleMaxLabel}</span>
        </div>
      )}
      
      {/* Vertical bars */}
      <div className="flex items-end justify-between gap-2 h-32">
        {question.answers.map((answer) => {
          const heightPercent = maxPercentage > 0 ? (answer.percentage / maxPercentage) * 100 : 0;
          
          return (
            <div key={answer.value} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-[#CD8B6A] rounded-t transition-all duration-500 ease-out min-h-[4px]"
                style={{ height: `${Math.max(heightPercent, 3)}%` }}
              />
              <div className="text-xs text-gray-400 font-mono mt-2">
                {answer.label}
              </div>
              {answer.percentage > 0 && (
                <div className="text-xs text-gray-600 font-mono">
                  {answer.percentage}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MultipleChoiceInsights({ analysis }: { analysis: MultipleChoiceAnalysis }) {
  return (
    <div className="mt-8 pt-6 border-t border-[#30363d]">
      <h4 className="text-[#CD8B6A] font-mono text-sm mb-4 flex items-center gap-2">
        <span>📊</span> Selection Analysis
      </h4>

      <div className={`grid grid-cols-1 ${analysis.topCombinations.length > 0 ? 'md:grid-cols-2' : ''} gap-6`}>
        {/* Selection Distribution */}
        <div>
          <p className="text-gray-400 text-xs font-mono mb-3">
            How many do developers use?
          </p>
          <p className="text-white font-mono text-lg mb-3">
            Average: <span className="text-[#CD8B6A]">{analysis.avgSelections}</span>
          </p>
          <div className="space-y-2">
            {analysis.selectionDistribution.map((dist) => (
              <div key={dist.count} className="flex items-center gap-2">
                <span className="text-gray-500 font-mono text-xs w-8">
                  {dist.count === 10 ? '10+' : dist.count}
                </span>
                <div className="flex-1 h-3 bg-[#21262d] rounded overflow-hidden">
                  <div
                    className="h-full bg-[#7ee787] rounded transition-all duration-500"
                    style={{ width: `${dist.percentage}%` }}
                  />
                </div>
                <span className="text-gray-500 font-mono text-xs w-12 text-right">
                  {dist.percentage}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Combinations */}
        {analysis.topCombinations.length > 0 && (
          <div>
            <p className="text-gray-400 text-xs font-mono mb-3">
              Most common tool combinations
            </p>
            <div className="space-y-2">
              {analysis.topCombinations.slice(0, 5).map((combo, idx) => (
                <div key={idx} className="bg-[#21262d] rounded p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#CD8B6A] font-mono text-xs">
                      #{idx + 1}
                    </span>
                    <span className="text-gray-500 font-mono text-xs">
                      {combo.percentage}%
                    </span>
                  </div>
                  <div className="text-gray-300 font-mono text-sm">
                    {combo.labels[0]}
                  </div>
                  <div className="text-gray-500 font-mono text-xs my-1">+</div>
                  <div className="text-gray-300 font-mono text-sm">
                    {combo.labels[1]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TakeawayCard({ stat, title, description }: { stat: string; title: string; description: string }) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-5">
      <div className="flex items-start gap-4">
        <span className="text-2xl sm:text-3xl font-bold text-[#CD8B6A] font-mono flex-shrink-0">
          {stat}
        </span>
        <div>
          <h3 className="text-white font-mono font-medium text-sm mb-1">{title}</h3>
          <p className="text-gray-400 font-mono text-xs leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );
}

function CrossAnalysisSection({ analysis }: { analysis: CrossQuestionAnalysis }) {
  return (
    <section className="mt-16 pt-8 border-t border-[#30363d]">
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-white font-mono flex items-center gap-3">
          <span className="text-[#CD8B6A]">🔗</span>
          Language → Tool Preferences
        </h2>
        <p className="text-gray-500 mt-2 font-mono text-sm">
          Which AI coding tools do developers prefer based on their programming language?
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analysis.languageToTools.slice(0, 8).map((langData) => (
          <div 
            key={langData.language}
            className="bg-[#161b22] border border-[#30363d] rounded-lg p-5"
          >
            <h3 className="text-white font-mono font-medium mb-4">
              {langData.languageLabel}
            </h3>

            <p className="text-gray-400 text-xs font-mono mb-3">
              Top AI tools used:
            </p>

            <div className="space-y-2">
              {langData.topTools.map((tool, idx) => (
                <div key={tool.tool} className="flex items-center gap-2">
                  <span className="text-[#CD8B6A] font-mono text-xs w-4">
                    {idx + 1}.
                  </span>
                  <span className="text-gray-300 font-mono text-sm flex-1 truncate">
                    {tool.toolLabel}
                  </span>
                  <div className="w-20 h-2 bg-[#21262d] rounded overflow-hidden">
                    <div
                      className="h-full bg-[#CD8B6A] rounded transition-all duration-500"
                      style={{ width: `${tool.percentage}%` }}
                    />
                  </div>
                  <span className="text-gray-500 font-mono text-xs w-10 text-right">
                    {tool.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {analysis.languageToTools.length > 8 && (
        <p className="text-gray-600 text-sm font-mono mt-6 text-center">
          Showing top 8 languages by number of developers
        </p>
      )}
    </section>
  );
}

