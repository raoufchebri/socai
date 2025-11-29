"use client";

export default function StateLogo() {
  return (
    <div className="relative w-full max-w-4xl mx-auto py-8">
      {/* Terminal-style logo container */}
      <div className="terminal-logo-container">
        {/* Glowing background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-purple-500/5 to-cyan-500/5 rounded-xl blur-xl"></div>
        
        <div className="relative">
          {/* ASCII-style header decoration */}
          <div className="text-center mb-6 font-mono text-xs text-gray-600 tracking-widest">
            ╔══════════════════════════════════════════════════════════╗
          </div>

          {/* Main title with terminal cursor effect */}
          <div className="text-center space-y-4">
            {/* "State of" line */}
            <div className="flex items-center justify-center gap-3">
              <span className="text-cyan-500 font-mono text-lg">$</span>
              <span className="text-gray-400 font-mono text-xl tracking-wider uppercase">State of</span>
            </div>

            {/* Main "VIBE" text */}
            <h1 className="relative">
              <span className="block text-6xl md:text-8xl lg:text-9xl font-black tracking-tight">
                <span className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,217,255,0.5)]">
                  VIBE
                </span>
              </span>
            </h1>

            {/* "Engineering" line */}
            <div className="flex items-center justify-center gap-3">
              <span className="text-gray-400 font-mono text-xl tracking-wider uppercase">Engineering</span>
              <span className="inline-block w-3 h-6 bg-cyan-400 animate-pulse"></span>
            </div>

            {/* Year badge */}
            <div className="flex justify-center mt-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 font-mono text-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-gray-300">2025</span>
                <span className="text-gray-500">·</span>
                <span className="text-purple-400">SURVEY OPEN</span>
              </span>
            </div>
          </div>

          {/* ASCII-style footer decoration */}
          <div className="text-center mt-6 font-mono text-xs text-gray-600 tracking-widest">
            ╚══════════════════════════════════════════════════════════╝
          </div>

          {/* Decorative code snippets */}
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 hidden lg:block">
            <div className="font-mono text-xs text-gray-700 space-y-1 opacity-50">
              <div><span className="text-purple-500">const</span> survey = {'{'}</div>
              <div className="pl-4"><span className="text-cyan-500">year</span>: 2025,</div>
              <div className="pl-4"><span className="text-cyan-500">topic</span>: <span className="text-green-400">&quot;AI&quot;</span>,</div>
              <div className="pl-4"><span className="text-cyan-500">status</span>: <span className="text-yellow-400">&quot;open&quot;</span></div>
              <div>{'}'}</div>
            </div>
          </div>

          <div className="absolute -right-4 top-1/2 -translate-y-1/2 hidden lg:block">
            <div className="font-mono text-xs text-gray-700 space-y-1 opacity-50 text-right">
              <div><span className="text-purple-500">async function</span> <span className="text-yellow-400">analyze</span>() {'{'}</div>
              <div className="pr-4"><span className="text-cyan-500">await</span> collectResponses();</div>
              <div className="pr-4"><span className="text-purple-500">return</span> insights;</div>
              <div>{'}'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
