import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-16 pt-8 border-t border-gray-800">
      {/* Terminal-style footer */}
      <div className="font-mono text-sm">
        {/* Main links row */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mb-6 text-gray-500">
          <span className="text-accent-cyan">❯</span>
          <span className="flex items-center gap-2">
            <span className="text-gray-600">©</span>
            <span>{currentYear}</span>
            <a
              href="https://devographics.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-accent-cyan transition-colors"
            >
              Devographics
            </a>
          </span>
          <span className="text-gray-700">|</span>
          <Link href="/account/profile" className="hover:text-accent-cyan transition-colors">
            Account
          </Link>
          <span className="text-gray-700">|</span>
          <Link href="/privacy-policy" className="hover:text-accent-cyan transition-colors">
            Privacy
          </Link>
          <span className="text-gray-700">|</span>
          <a
            href="https://github.com/Devographics/Monorepo/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent-cyan transition-colors inline-flex items-center gap-1"
          >
            <span>Issues</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
        
        {/* Secondary row */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-gray-600 pb-8">
          <a
            href="https://github.com/Devographics/locale-en-US"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent-purple transition-colors inline-flex items-center gap-2"
          >
            <span className="text-accent-purple">$</span>
            <span>translate --help</span>
          </a>
          <span className="text-gray-700">|</span>
          <button
            className="hover:text-accent-purple transition-colors inline-flex items-center gap-2"
            title="Enables an experimental light mode"
          >
            <span className="text-accent-purple">$</span>
            <span>theme --toggle</span>
          </button>
        </div>

        {/* ASCII art footer decoration */}
        <div className="text-center text-gray-700 text-xs pb-4">
          <pre className="inline-block">
{`    ╭─────────────────────────────╮
    │  Built with ♥ and AI agents │
    ╰─────────────────────────────╯`}
          </pre>
        </div>
      </div>
    </footer>
  );
}
