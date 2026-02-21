import Link from "next/link";

const posts = [
  {
    title: "State of Code 2025 — Survey Results",
    description:
      "How developers use AI coding tools and agents in 2025. Claude Code leads adoption, 87% use AI daily, and hallucinations remain the #1 challenge.",
    href: "/2025/survey/result",
    date: "2025",
    featured: true,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0d1117]">
      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Header */}
        <header className="mb-16">
          <pre
            className="font-mono text-[0.5rem] sm:text-[0.7rem] md:text-[0.85rem] leading-none whitespace-pre text-[#CD8B6A] select-none drop-shadow-[0_0_10px_rgba(205,139,106,0.5)] inline-block text-left"
            style={{
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
              lineHeight: 1,
            }}
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
          <p className="text-gray-400 font-mono text-sm mt-6 max-w-xl">
            Exploring how developers use AI coding tools and agents.
          </p>
        </header>

        {/* Posts */}
        <main>
          {posts.map((post) => (
            <Link
              key={post.href}
              href={post.href}
              className="group block"
            >
              <article
                className={`border rounded-lg p-6 transition-colors ${
                  post.featured
                    ? "bg-[#161b22] border-[#CD8B6A]/40 hover:border-[#CD8B6A]"
                    : "bg-[#161b22] border-[#30363d] hover:border-[#CD8B6A]/60"
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  {post.featured && (
                    <span className="text-[#CD8B6A] font-mono text-xs border border-[#CD8B6A]/40 rounded px-2 py-0.5">
                      featured
                    </span>
                  )}
                  <span className="text-gray-600 font-mono text-xs">
                    {post.date}
                  </span>
                </div>
                <h2 className="text-white font-mono text-lg group-hover:text-[#CD8B6A] transition-colors mb-2">
                  {post.title}
                </h2>
                <p className="text-gray-400 font-mono text-sm leading-relaxed">
                  {post.description}
                </p>
              </article>
            </Link>
          ))}
        </main>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-[#30363d]">
          <p className="text-gray-600 text-sm font-mono">
            stateofcode.ai
          </p>
        </footer>
      </div>
    </div>
  );
}
