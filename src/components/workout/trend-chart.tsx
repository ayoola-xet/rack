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
  fontSize: 12,
};

const tickStyle = {
  fill: "var(--color-subtle)",
  fontSize: 11,
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
      <p className="px-3 py-8 text-center text-sm text-subtle">
        Log at least two points to see the line.
      </p>
    );
  }

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis
            tick={tickStyle}
            axisLine={false}
            tickLine={false}
            width={36}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(val) => [`${String(val)} ${unit}`, ""]}
          />
          {typeof goal === "number" && (
            <ReferenceLine y={goal} stroke="var(--color-accent)" strokeDasharray="4 4" />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--color-fg)"
            strokeWidth={2}
            dot={{ r: 3, fill: "var(--color-fg)" }}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendBarChart({ data }: { data: ChartPoint[] }) {
  if (data.length < 2) {
    return (
      <p className="px-3 py-8 text-center text-sm text-subtle">
        Finish two sessions to chart volume.
      </p>
    );
  }

  return (
    <div className="h-40">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis tick={tickStyle} axisLine={false} tickLine={false} width={36} />
          <Tooltip
            cursor={{ fill: "color-mix(in oklab, var(--color-fg) 4%, transparent)" }}
            contentStyle={tooltipStyle}
            formatter={(val) => [`${String(val)} kg`, "Volume"]}
          />
          <Bar dataKey="value" fill="var(--color-accent)" radius={[6, 6, 2, 2]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
