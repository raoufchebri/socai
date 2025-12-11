'use client';

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// Color palette for charts
const COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#ec4899', // pink-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
];

interface ChartData {
  name: string;
  value: number;
  label?: string;
  [key: string]: string | number | undefined;
}

interface DonutChartProps {
  data: ChartData[];
  title: string;
  height?: number;
}

export function DonutChart({ data, title, height = 250 }: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-zinc-500">
          No data yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            nameKey="name"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: number, name: string) => [
              `${value} (${Math.round((value / total) * 100)}%)`,
              name,
            ]}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface HorizontalBarChartProps {
  data: ChartData[];
  title: string;
  height?: number;
  showPercentage?: boolean;
}

export function HorizontalBarChart({
  data,
  title,
  height = 300,
  showPercentage = true,
}: HorizontalBarChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-zinc-500">
          No data yet
        </div>
      </div>
    );
  }

  // Sort by value descending
  const sortedData = [...data].sort((a, b) => b.value - a.value);

  // Truncate long labels
  const truncateLabel = (label: string, maxLength: number = 20) => {
    if (label.length <= maxLength) return label;
    return `${label.slice(0, maxLength)}...`;
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={sortedData} layout="vertical" margin={{ left: 10, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
          <XAxis type="number" stroke="#52525b" fontSize={11} />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#71717a"
            fontSize={10}
            width={130}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => truncateLabel(value, 18)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#fff', fontWeight: 500, marginBottom: '4px' }}
            formatter={(value: number) => [
              showPercentage
                ? `${value} (${Math.round((value / total) * 100)}%)`
                : value,
              'Responses',
            ]}
          />
          <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface VerticalBarChartProps {
  data: ChartData[];
  title: string;
  height?: number;
}

export function VerticalBarChart({ data, title, height = 250 }: VerticalBarChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-48 text-zinc-500">
          No data yet
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis
            dataKey="name"
            stroke="#52525b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              color: '#fff',
            }}
            formatter={(value: number) => [
              `${value} (${Math.round((value / total) * 100)}%)`,
              'Responses',
            ]}
          />
          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface StackedBarData {
  name: string;
  [key: string]: string | number;
}

interface StackedBarChartProps {
  data: StackedBarData[];
  title: string;
  keys: string[];
  height?: number;
}

export function StackedBarChart({
  data,
  title,
  keys,
  height = 300,
}: StackedBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">{title}</h3>
        <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
          <p>No data yet</p>
          <p className="text-xs mt-2 text-zinc-600">Questions may need to be migrated</p>
        </div>
      </div>
    );
  }

  // Truncate long labels for Y-axis
  const truncateLabel = (label: string, maxLength: number = 25) => {
    if (label.length <= maxLength) return label;
    return `${label.slice(0, maxLength)}...`;
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <h3 className="text-sm font-medium text-zinc-400 mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
          <XAxis type="number" stroke="#52525b" fontSize={11} />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#71717a"
            fontSize={10}
            width={140}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => truncateLabel(value, 22)}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#fff', fontWeight: 500, marginBottom: '4px' }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
          />
          {keys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="a"
              fill={COLORS[index % COLORS.length]}
              radius={index === keys.length - 1 ? [0, 4, 4, 0] : 0}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface LikertChartProps {
  data: ChartData[];
  title: string;
  labels?: { low: string; high: string };
}

export function LikertChart({ data, title, labels }: LikertChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">{title}</h3>
        <div className="flex items-center justify-center h-24 text-zinc-500">
          No data yet
        </div>
      </div>
    );
  }

  // Calculate average score if numeric
  const numericData = data.filter((d) => !isNaN(Number(d.name)));
  const average =
    numericData.length > 0
      ? numericData.reduce((sum, d) => sum + Number(d.name) * d.value, 0) / total
      : null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-400">{title}</h3>
        {average !== null && (
          <span className="text-lg font-bold text-white">{average.toFixed(1)}/5</span>
        )}
      </div>
      <div className="flex items-end gap-1 h-20">
        {data.map((d, index) => {
          const percentage = (d.value / total) * 100;
          return (
            <div key={d.name} className="flex-1 flex flex-col items-center">
              <div
                className="w-full rounded-t transition-all"
                style={{
                  height: `${Math.max(percentage, 5)}%`,
                  backgroundColor: COLORS[index % COLORS.length],
                }}
              />
              <div className="text-xs text-zinc-400 mt-2">{d.name}</div>
              <div className="text-xs text-zinc-500">{d.value}</div>
            </div>
          );
        })}
      </div>
      {labels && (
        <div className="flex justify-between mt-2 text-xs text-zinc-500">
          <span>{labels.low}</span>
          <span>{labels.high}</span>
        </div>
      )}
    </div>
  );
}

