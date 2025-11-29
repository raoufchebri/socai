"use client";

import { useState } from "react";
import { faqData } from "@/data/surveyData";

export default function SurveyFAQ() {
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggleItem = (id: string) => {
    setOpenItem(openItem === id ? null : id);
  };

  return (
    <section className="mb-16">
      {/* Section header */}
      <div className="flex items-center gap-3 mb-6 font-mono">
        <span className="text-accent-cyan">❯</span>
        <span className="text-gray-400">cat</span>
        <span className="text-white">FAQ.md</span>
      </div>

      {/* FAQ Container */}
      <div className="terminal-container">
        <div className="terminal-header">
          <div className="terminal-buttons">
            <span className="terminal-btn terminal-btn-red"></span>
            <span className="terminal-btn terminal-btn-yellow"></span>
            <span className="terminal-btn terminal-btn-green"></span>
          </div>
          <div className="terminal-title">
            FAQ.md
          </div>
          <div className="terminal-status">
            <span className="text-gray-500 text-xs font-mono">{faqData.length} items</span>
          </div>
        </div>

        <div className="divide-y divide-gray-800">
          {faqData.map((item, index) => (
            <div key={item.id} className="group">
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full text-left px-6 py-4 hover:bg-gray-800/30 transition-colors flex items-start gap-4 font-mono"
              >
                {/* Line number */}
                <span className="text-gray-600 text-sm flex-shrink-0 w-6 text-right select-none">
                  {String(index + 1).padStart(2, '0')}
                </span>
                
                {/* Expand indicator */}
                <span className="text-accent-cyan flex-shrink-0 w-4">
                  {openItem === item.id ? '▼' : '▶'}
                </span>
                
                {/* Question */}
                <span className="flex-1 text-gray-200 text-sm">
                  <span className="text-accent-purple">##</span> {item.question}
                </span>
              </button>
              
              {openItem === item.id && (
                <div className="px-6 pb-4 pl-20 animate-fadeIn">
                  <div className="text-gray-400 text-sm font-mono leading-relaxed border-l-2 border-accent-cyan/30 pl-4">
                    {item.answer}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
