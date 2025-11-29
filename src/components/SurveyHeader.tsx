import Link from "next/link";

export default function SurveyHeader() {
  return (
    <header className="w-full mb-12">
      <div className="terminal-container">
        {/* Terminal header bar */}
        <div className="terminal-header">
          <div className="terminal-buttons">
            <span className="terminal-btn terminal-btn-red"></span>
            <span className="terminal-btn terminal-btn-yellow"></span>
            <span className="terminal-btn terminal-btn-green"></span>
          </div>
          <div className="terminal-title">
            navigation.sh
          </div>
          <div className="terminal-status"></div>
        </div>

        {/* Navigation content */}
        <div className="px-5 py-4 flex items-center justify-between flex-wrap gap-4">
          <nav className="flex items-center gap-3 text-sm font-mono">
            <span className="text-accent-cyan">❯</span>
            <Link href="/" className="text-gray-400 hover:text-accent-cyan transition-colors">
              ~/surveys
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-gray-200">
              state-of-vibe-engineering
            </span>
            <span className="text-gray-600">/</span>
            <span className="text-accent-purple">
              2025
            </span>
          </nav>
          
          <div className="flex items-center gap-4">
            <button 
              type="button" 
              className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 hover:border-gray-600 text-gray-300 transition-all text-sm font-mono"
            >
              <span className="w-2 h-2 bg-accent-green rounded-full"></span>
              <span>en-US</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
