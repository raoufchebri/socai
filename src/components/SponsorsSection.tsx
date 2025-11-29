import Image from "next/image";
import { sponsorsData } from "@/data/surveyData";

export default function SponsorsSection() {
  return (
    <section className="mb-16">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6 font-mono">
        <span className="text-accent-cyan">❯</span>
        <span className="text-gray-400">cat</span>
        <span className="text-white">SPONSORS.md</span>
      </div>

      {/* Sponsors Container */}
      <div className="terminal-container">
        <div className="terminal-header">
          <div className="terminal-buttons">
            <span className="terminal-btn terminal-btn-red"></span>
            <span className="terminal-btn terminal-btn-yellow"></span>
            <span className="terminal-btn terminal-btn-green"></span>
          </div>
          <div className="terminal-title">
            SPONSORS.md
          </div>
          <div className="terminal-status">
            <span className="text-accent-pink text-xs font-mono">♥ {sponsorsData.length} supporters</span>
          </div>
        </div>

        <div className="p-6">
          {/* Markdown-style header */}
          <div className="font-mono text-sm mb-6">
            <span className="text-accent-pink">##</span>
            <span className="text-gray-300 ml-2">With Support From</span>
          </div>

          {/* Sponsors grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {sponsorsData.map((sponsor, idx) => (
              <a
                key={sponsor.id}
                href={sponsor.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center p-6 rounded-lg bg-gray-800/30 border border-gray-700 hover:border-accent-cyan/50 hover:bg-gray-800/50 transition-all duration-300"
                aria-label={sponsor.name}
              >
                <Image
                  src={sponsor.imageUrl}
                  alt={sponsor.name}
                  width={160}
                  height={50}
                  className="max-w-full h-auto opacity-70 group-hover:opacity-100 transition-opacity filter grayscale group-hover:grayscale-0"
                />
              </a>
            ))}
          </div>

          {/* Sponsor CTA */}
          <div className="mt-8 pt-6 border-t border-gray-800 font-mono text-sm">
            <div className="text-gray-500">
              <span className="text-gray-600">{`// `}</span>
              <span>Want to support the survey?</span>
            </div>
            <a
              href="mailto:sponsors@devographics.com"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-accent-pink transition-colors mt-2"
            >
              <span className="text-accent-pink">$</span>
              <span>contact --sponsor</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
