import Link from "next/link";
import { surveyData } from "@/data/surveyData";
import StateLogo from "./StateLogo";

export default function SurveyIntro() {
  return (
    <section className="mb-16">
      {/* Hero Logo */}
      <StateLogo />

      {/* Intro Text in Terminal Style */}
      <div className="terminal-container mb-10">
        <div className="terminal-header">
          <div className="terminal-buttons">
            <span className="terminal-btn terminal-btn-red"></span>
            <span className="terminal-btn terminal-btn-yellow"></span>
            <span className="terminal-btn terminal-btn-green"></span>
          </div>
          <div className="terminal-title">
            about.md
          </div>
          <div className="terminal-status"></div>
        </div>
        
        <div className="p-6 space-y-4 font-mono text-sm">
          {surveyData.intro.paragraphs.map((paragraph, index) => (
            <div key={index} className="terminal-line">
              <span className="text-gray-500 mr-3 select-none">{String(index + 1).padStart(2, '0')}</span>
              <span className="text-gray-300">{paragraph}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section - Terminal Command Style */}
      <div className="terminal-container">
        <div className="terminal-header">
          <div className="terminal-buttons">
            <span className="terminal-btn terminal-btn-red"></span>
            <span className="terminal-btn terminal-btn-yellow"></span>
            <span className="terminal-btn terminal-btn-green"></span>
          </div>
          <div className="terminal-title">
            start-survey.sh
          </div>
          <div className="terminal-status">
            <span className="text-accent-green text-xs font-mono">● ready</span>
          </div>
        </div>

        <div className="p-6">
          {/* Command prompt */}
          <div className="font-mono text-sm mb-6">
            <div className="flex items-center gap-2 text-gray-400 mb-2">
              <span className="text-accent-cyan">❯</span>
              <span>./start-survey --year=2025 --topic=&quot;vibe-engineering&quot;</span>
            </div>
            <div className="text-gray-500 pl-4 border-l-2 border-gray-700 ml-2">
              <p>Initializing State of Vibe Engineering Survey...</p>
              <p className="text-accent-green">✓ Survey loaded successfully</p>
              <p className="text-accent-purple">? Ready to begin ({getTotalQuestions()} questions)</p>
            </div>
          </div>

          {/* CTA Button */}
          <div className="mb-6">
            <Link
              href={surveyData.surveyLink}
              className="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-accent-cyan/20 to-accent-purple/20 border border-accent-cyan/40 hover:border-accent-cyan text-white font-mono rounded-lg hover:shadow-lg hover:shadow-accent-cyan/20 transition-all duration-300"
            >
              <span className="text-accent-cyan">❯</span>
              <span>Start Survey</span>
              <span className="text-gray-500 group-hover:text-accent-cyan transition-colors">_</span>
            </Link>
          </div>

          {/* Info badges */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-gray-800/50 border border-gray-700">
              <span className="text-accent-cyan">⏱</span>
              <span className="text-gray-400">~10 min</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-gray-800/50 border border-gray-700">
              <span className="text-accent-purple">⌨</span>
              <span className="text-gray-400">keyboard navigation</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-gray-800/50 border border-gray-700">
              <span className="text-accent-green">✓</span>
              <span className="text-gray-400">anonymous</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function getTotalQuestions() {
  // This would normally come from the survey data
  return 13;
}
