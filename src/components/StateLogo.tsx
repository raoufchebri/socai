"use client";

export default function StateLogo() {
  const asciiLogo = `
 ███████╗████████╗ █████╗ ████████╗███████╗
 ██╔════╝╚══██╔══╝██╔══██╗╚══██╔══╝██╔════╝
 ███████╗   ██║   ███████║   ██║   █████╗  
 ╚════██║   ██║   ██╔══██║   ██║   ██╔══╝  
 ███████║   ██║   ██║  ██║   ██║   ███████╗
 ╚══════╝   ╚═╝   ╚═╝  ╚═╝   ╚═╝   ╚══════╝
  ██████╗ ███████╗     ██████╗ ██████╗ ██████╗ ███████╗
 ██╔═══██╗██╔════╝    ██╔════╝██╔═══██╗██╔══██╗██╔════╝
 ██║   ██║█████╗      ██║     ██║   ██║██║  ██║█████╗  
 ██║   ██║██╔══╝      ██║     ██║   ██║██║  ██║██╔══╝  
 ╚██████╔╝██║         ╚██████╗╚██████╔╝██████╔╝███████╗
  ╚═════╝ ╚═╝          ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝`.trim();

  return (
    <div className="relative w-full max-w-4xl mx-auto py-8">
      {/* Terminal-style logo container */}
      <div className="terminal-logo-container">
        {/* Glowing background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-cyan-500/10 rounded-xl blur-2xl"></div>
        
        <div className="relative">
          {/* ASCII Art Logo */}
          <div className="text-center overflow-x-auto">
            <pre 
              className="inline-block font-mono text-[0.35rem] xs:text-[0.45rem] sm:text-[0.55rem] md:text-[0.7rem] lg:text-xs leading-[1.1] whitespace-pre bg-gradient-to-b from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(0,217,255,0.4)] select-none"
              aria-label="State of Code"
            >
              {asciiLogo}
            </pre>
          </div>

          {/* Year badge */}
          <div className="flex justify-center mt-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 font-mono text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-gray-300">2025</span>
              <span className="text-gray-500">·</span>
              <span className="text-purple-400">SURVEY OPEN</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
