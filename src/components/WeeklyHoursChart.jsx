import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS_TICK, CHART_CURSOR } from "../utils/charts.js";
import { formatDuration } from "../utils/format.js";
import { SPORT_GROUPS } from "../utils/sports.js";

function WeekTooltip({ active, payload, label }) {
  const items = payload?.filter((item) => item.value > 0) ?? [];
  if (!active || items.length === 0) return null;
  return (
    <div className="chart-tooltip">
      <strong>Semana del {label}</strong>
      {items.map((item) => (
        <span key={item.dataKey} style={{ color: item.color }}>
          {SPORT_GROUPS[item.dataKey].label}:{" "}
          {formatDuration(item.value * 3600)}
        </span>
      ))}
    </div>
  );
}

export default function WeeklyHoursChart({ data, groups }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -24 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="week"
          tick={AXIS_TICK}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
        />
        <Tooltip content={<WeekTooltip />} cursor={CHART_CURSOR} />
        <Legend
          formatter={(name) => SPORT_GROUPS[name].label}
          wrapperStyle={{ fontSize: 12 }}
        />
        {groups.map((group) => (
          <Bar
            key={group}
            dataKey={group}
            stackId="hours"
            fill={SPORT_GROUPS[group].color}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
