import React from 'react';

export interface PlayerSkillMetrics {
  batting: number; // 0 - 100
  bowling: number; // 0 - 100
  fielding: number; // 0 - 100
  fitness: number; // 0 - 100
  impact: number; // 0 - 100
}

interface PlayerSkillRadarChartProps {
  skills?: Partial<PlayerSkillMetrics>;
  role?: string;
  category?: string;
  customStats?: any;
  size?: number;
  className?: string;
  primaryColor?: string;
}

export function derivePlayerSkills(
  role: string = '',
  category: string = '',
  customStats?: any
): PlayerSkillMetrics {
  const r = (role || '').toLowerCase();
  const c = (category || '').toLowerCase();

  // Baseline by category tier
  const tierBoost = c.includes('icon')
    ? 25
    : c.includes('gold') || c.includes('tier 1')
    ? 15
    : c.includes('silver') || c.includes('tier 2')
    ? 8
    : 0;

  let base: PlayerSkillMetrics = {
    batting: 55 + tierBoost,
    bowling: 50 + tierBoost,
    fielding: 65 + tierBoost,
    fitness: 70 + tierBoost,
    impact: 60 + tierBoost,
  };

  if (r.includes('bat')) {
    base.batting = Math.min(98, 75 + tierBoost);
    base.bowling = Math.max(30, 40 + tierBoost);
    base.impact = Math.min(95, 70 + tierBoost);
  } else if (r.includes('bowl')) {
    base.bowling = Math.min(98, 78 + tierBoost);
    base.batting = Math.max(30, 42 + tierBoost);
    base.impact = Math.min(95, 72 + tierBoost);
  } else if (r.includes('all') || r.includes('ar')) {
    base.batting = Math.min(95, 74 + tierBoost);
    base.bowling = Math.min(95, 74 + tierBoost);
    base.impact = Math.min(98, 80 + tierBoost);
  } else if (r.includes('keep') || r.includes('wk')) {
    base.fielding = Math.min(98, 82 + tierBoost);
    base.batting = Math.min(92, 68 + tierBoost);
    base.fitness = Math.min(95, 78 + tierBoost);
  }

  // Adjust if custom stats object is supplied
  if (customStats) {
    if (customStats.runs && Number(customStats.runs) > 300) {
      base.batting = Math.min(99, base.batting + 10);
    }
    if (customStats.wickets && Number(customStats.wickets) > 15) {
      base.bowling = Math.min(99, base.bowling + 10);
    }
    if (customStats.strikeRate && Number(customStats.strikeRate) > 140) {
      base.impact = Math.min(99, base.impact + 8);
    }
  }

  return base;
}

export const PlayerSkillRadarChart: React.FC<PlayerSkillRadarChartProps> = ({
  skills,
  role = 'All-Rounder',
  category = 'Open',
  customStats,
  size = 220,
  className = '',
  primaryColor = '#6366f1',
}) => {
  const computedSkills = {
    ...derivePlayerSkills(role, category, customStats),
    ...skills,
  };

  const center = size / 2;
  const radius = size * 0.38;

  const axes = [
    { label: 'Batting', key: 'batting' as const, angle: -Math.PI / 2 },
    { label: 'Bowling', key: 'bowling' as const, angle: -Math.PI / 2 + (2 * Math.PI) / 5 },
    { label: 'Fielding', key: 'fielding' as const, angle: -Math.PI / 2 + (4 * Math.PI) / 5 },
    { label: 'Fitness', key: 'fitness' as const, angle: -Math.PI / 2 + (6 * Math.PI) / 5 },
    { label: 'Impact', key: 'impact' as const, angle: -Math.PI / 2 + (8 * Math.PI) / 5 },
  ];

  // Concentric polygon web levels (25%, 50%, 75%, 100%)
  const levels = [0.25, 0.5, 0.75, 1.0];

  const getWebPoints = (factor: number) => {
    return axes
      .map((axis) => {
        const x = center + radius * factor * Math.cos(axis.angle);
        const y = center + radius * factor * Math.sin(axis.angle);
        return `${x},${y}`;
      })
      .join(' ');
  };

  // Data polygon points
  const dataPoints = axes.map((axis) => {
    const value = Math.max(10, Math.min(100, computedSkills[axis.key] || 50));
    const factor = value / 100;
    const x = center + radius * factor * Math.cos(axis.angle);
    const y = center + radius * factor * Math.sin(axis.angle);
    return { x, y, value };
  });

  const dataPolygonString = dataPoints.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${className}`}>
      <svg width={size} height={size} className="overflow-visible">
        <defs>
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.45" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0.08" />
          </radialGradient>
          <filter id="radarDropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={primaryColor} floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Concentric Grid Webs */}
        {levels.map((lvl, idx) => (
          <polygon
            key={idx}
            points={getWebPoints(lvl)}
            fill="none"
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
            strokeWidth="1"
            strokeDasharray={idx < 3 ? '2 2' : 'none'}
          />
        ))}

        {/* Axis Lines */}
        {axes.map((axis, idx) => {
          const x = center + radius * Math.cos(axis.angle);
          const y = center + radius * Math.sin(axis.angle);
          return (
            <line
              key={idx}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="1"
            />
          );
        })}

        {/* Data Skill Polygon with Gradient Fill */}
        <polygon
          points={dataPolygonString}
          fill="url(#radarGlow)"
          stroke={primaryColor}
          strokeWidth="2.5"
          filter="url(#radarDropShadow)"
          className="transition-all duration-500 ease-out"
        />

        {/* Data Point Circles */}
        {dataPoints.map((point, idx) => (
          <circle
            key={idx}
            cx={point.x}
            cy={point.y}
            r="3.5"
            fill="#ffffff"
            stroke={primaryColor}
            strokeWidth="2"
            className="transition-all duration-500"
          />
        ))}

        {/* Axis Labels & Values */}
        {axes.map((axis, idx) => {
          const labelDist = radius + 20;
          const lx = center + labelDist * Math.cos(axis.angle);
          const ly = center + labelDist * Math.sin(axis.angle);
          const value = computedSkills[axis.key];

          return (
            <g key={idx}>
              <text
                x={lx}
                y={ly - 4}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[10px] font-bold fill-slate-700 dark:fill-slate-300 uppercase tracking-wider"
              >
                {axis.label}
              </text>
              <text
                x={lx}
                y={ly + 8}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[9.5px] font-extrabold"
                fill={primaryColor}
              >
                {value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
