import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tooltipStyle = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-border)",
  borderRadius: 8,
  color: "var(--color-fg)",
  fontSize: 11,
  padding: "4px 8px",
};

const tickStyle = {
  fill: "var(--color-subtle)",
  fontSize: 10,
};

export type ChartPoint = {
  at: number;
  label: string;
  value: number;
};

export function TrendLineChart({
  data,
  unit = "",
  goal,
}: {
  data: ChartPoint[];
  unit?: string;
  goal?: number | null;
}) {
  if (data.length < 2) {
    return (
      <p className="px-3 py-4 text-center text-xs text-subtle">
        Log at least two points to see the line.
      </p>
    );
  }

  return (
    <div className="h-28 sm:h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
          <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis
            tick={tickStyle}
            axisLine={false}
            tickLine={false}
            width={32}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(val) => [`${String(val)} ${unit}`, ""]}
          />
          {typeof goal === "number" && (
            <ReferenceLine y={goal} stroke="var(--color-accent)" strokeDasharray="3 3" />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-fg)"
            strokeWidth={1.75}
            dot={{ r: 2.5, fill: "var(--color-fg)" }}
            activeDot={{ r: 3.5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendBarChart({ data }: { data: ChartPoint[] }) {
  if (data.length < 2) {
    return (
      <p className="px-3 py-4 text-center text-xs text-subtle">
        Finish two sessions to chart volume.
      </p>
    );
  }

  return (
    <div className="h-28 sm:h-32 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 6, right: 8, left: -10, bottom: 0 }}>
          <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={32} />
          <Tooltip
            cursor={{ fill: "color-mix(in oklab, var(--color-fg) 4%, transparent)" }}
            contentStyle={tooltipStyle}
            formatter={(val) => [`${String(val)} kg`, "Volume"]}
          />
          <Bar dataKey="value" fill="var(--color-accent)" radius={[4, 4, 1, 1]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
