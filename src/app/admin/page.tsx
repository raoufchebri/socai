'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AnswerBreakdown {
  answer: string;
  label: string;
  count: number;
  percentage: number;
}

interface QuestionStat {
  id: number;
  slug: string;
  prompt: string;
  type: 'single' | 'multiple' | 'scale' | 'text';
  category: string;
  categorySlug: string;
  totalResponses: number;
  answers: AnswerBreakdown[];
}

interface RecentSession {
  id: number;
  startedAt: string;
  completedAt: string | null;
  responseCount: number;
}

interface Stats {
  summary: {
    totalSessions: number;
    completedSessions: number;
    completionRate: number;
    totalResponses: number;
  };
  questionStats: QuestionStat[];
  byCategory: Record<string, QuestionStat[]>;
  recentSessions: RecentSession[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (!res.ok) throw new Error('Failed to fetch stats');
      const data = await res.json();
      setStats(data);
      // Select first category by default
      const categories = Object.keys(data.byCategory);
      if (categories.length > 0) {
        setSelectedCategory(categories[0]);
      }
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const toggleQuestion = (slug: string) => {
    setExpandedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-zinc-400">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-red-400">{error}</div>
      </div>
    );
  }

  if (!stats) return null;

  const categories = Object.keys(stats.byCategory);
  const currentQuestions = selectedCategory ? stats.byCategory[selectedCategory] : [];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">Survey Dashboard</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            label="Total Sessions"
            value={stats.summary.totalSessions}
          />
          <SummaryCard
            label="Completed"
            value={stats.summary.completedSessions}
          />
          <SummaryCard
            label="Completion Rate"
            value={`${stats.summary.completionRate}%`}
          />
          <SummaryCard
            label="Total Responses"
            value={stats.summary.totalResponses}
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-white text-black'
                  : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Questions */}
        <div className="space-y-4">
          {currentQuestions.map((q) => (
            <QuestionCard
              key={q.slug}
              question={q}
              expanded={expandedQuestions.has(q.slug)}
              onToggle={() => toggleQuestion(q.slug)}
            />
          ))}
        </div>

        {/* Recent Sessions */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold mb-4">Recent Sessions</h2>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-4 py-3 text-sm text-zinc-400 font-medium">
                    Session ID
                  </th>
                  <th className="text-left px-4 py-3 text-sm text-zinc-400 font-medium">
                    Started
                  </th>
                  <th className="text-left px-4 py-3 text-sm text-zinc-400 font-medium">
                    Status
                  </th>
                  <th className="text-right px-4 py-3 text-sm text-zinc-400 font-medium">
                    Responses
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.recentSessions.map((session) => (
                  <tr key={session.id} className="border-b border-zinc-800 last:border-b-0">
                    <td className="px-4 py-3 text-sm font-mono text-zinc-300">
                      #{session.id}
                    </td>
                    <td className="px-4 py-3 text-sm text-zinc-400">
                      {new Date(session.startedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded ${
                          session.completedAt
                            ? 'bg-green-900/50 text-green-400'
                            : 'bg-yellow-900/50 text-yellow-400'
                        }`}
                      >
                        {session.completedAt ? 'Completed' : 'In Progress'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right text-zinc-300">
                      {session.responseCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-zinc-400 mt-1">{label}</div>
    </div>
  );
}

function QuestionCard({
  question,
  expanded,
  onToggle,
}: {
  question: QuestionStat;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isChoiceQuestion = question.type === 'single' || question.type === 'multiple';
  const isScaleQuestion = question.type === 'scale';
  const isTextQuestion = question.type === 'text';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-4 flex items-center justify-between text-left hover:bg-zinc-800/50 transition-colors"
      >
        <div className="flex-1">
          <div className="font-medium text-white">{question.prompt}</div>
          <div className="text-sm text-zinc-500 mt-1">
            {question.totalResponses} responses · {question.type}
          </div>
        </div>
        <div className="text-zinc-500 ml-4">
          {expanded ? '−' : '+'}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-zinc-800 pt-4">
          {isChoiceQuestion && (
            <div className="space-y-2">
              {question.answers.map((a) => (
                <div key={a.answer} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-zinc-300">{a.label}</span>
                      <span className="text-zinc-500">
                        {a.count} ({a.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${a.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isScaleQuestion && (
            <div className="flex items-end gap-1 h-32">
              {question.answers.map((a) => (
                <div
                  key={a.answer}
                  className="flex-1 flex flex-col items-center"
                >
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all"
                    style={{
                      height: `${Math.max(a.percentage, 5)}%`,
                    }}
                  />
                  <div className="text-xs text-zinc-400 mt-2">{a.label}</div>
                  <div className="text-xs text-zinc-500">{a.count}</div>
                </div>
              ))}
            </div>
          )}

          {isTextQuestion && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {question.answers.length === 0 ? (
                <div className="text-zinc-500 text-sm">No responses yet</div>
              ) : (
                question.answers.map((a, i) => (
                  <div
                    key={i}
                    className="bg-zinc-800 rounded px-3 py-2 text-sm text-zinc-300"
                  >
                    {a.answer}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
