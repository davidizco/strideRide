import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AXIS_TICK, TOOLTIP_STYLE } from "../utils/charts.js";
import { formatPower, formatShortDuration } from "../utils/format.js";

export default function PowerCurveChart({ curve, color }) {
  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={curve}
          margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
        >
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="duration"
            tickFormatter={formatShortDuration}
            tick={AXIS_TICK}
            tickLine={false}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            labelFormatter={(duration) =>
              `Mejor ${formatShortDuration(duration)}`
            }
            formatter={(value) => [formatPower(value), "Potencia"]}
            contentStyle={TOOLTIP_STYLE}
          />
          <Line
            dataKey="watts"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
