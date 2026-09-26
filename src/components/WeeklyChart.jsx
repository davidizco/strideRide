import { useMemo } from "react";
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
import { formatHours } from "../utils/format.js";
import { SPORT_GROUPS } from "../utils/sports.js";
import { weeklyHoursBySport } from "../utils/weekly.js";

export default function WeeklyChart({ activities, weeks }) {
  const data = useMemo(
    () => weeklyHoursBySport(activities, weeks),
    [activities, weeks],
  );
  const groups = Object.keys(SPORT_GROUPS).filter((group) =>
    data.some((week) => week[group] > 0),
  );

  return (
    <section className="section card">
      <h2>Horas por semana</h2>
      <p className="muted">Últimas {weeks} semanas</p>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 8, right: 4, bottom: 0, left: -24 }}
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 11 }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(value, name) => [
                `${formatHours(value)} h`,
                SPORT_GROUPS[name].label,
              ]}
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
              cursor={{ fill: "var(--border)", opacity: 0.4 }}
            />
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
      </div>
    </section>
  );
}
