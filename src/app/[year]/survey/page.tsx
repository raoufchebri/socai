import TerminalSurvey from '@/components/TerminalSurvey';

interface SurveyPageProps {
  params: Promise<{
    year: string;
  }>;
}

export async function generateStaticParams() {
  return [{ year: '2025' }];
}

export async function generateMetadata({ params }: SurveyPageProps) {
  const { year } = await params;
  return {
    title: `State of Vibe Engineering ${year} Survey`,
    description: `Take the ${year} State of Vibe Engineering survey and share how you use AI coding agents.`,
  };
}

export default async function SurveyPage({ params }: SurveyPageProps) {
  const { year } = await params;
  
  // Validate year
  const validYears = ['2025'];
  if (!validYears.includes(year)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl text-gray-300 mb-4">Survey not found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen survey-page">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Terminal Survey */}
        <TerminalSurvey />

        {/* Footer note */}
        <footer className="mt-8 text-center text-gray-600 text-sm">
          <p>Your responses are anonymous and will be used for research purposes only.</p>
        </footer>
      </div>
    </div>
  );
}

