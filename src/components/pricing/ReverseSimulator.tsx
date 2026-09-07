import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { CountUpValue } from "./CountUpValue";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  brl,
  buildCurve,
  simulateReverse,
  type CurvePoint,
  type FinancialProfile,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

export interface ReverseSimulatorProps {
  profile: FinancialProfile;
}

interface CurveTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: CurvePoint }>;
}

function CurveTooltip({ active, payload }: CurveTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="glass-panel rounded-xl border border-border px-3 py-2 text-xs shadow-lg">
      <p className="tabular font-medium text-foreground">{brl(point.price)} por projeto</p>
      <p className="tabular text-muted-foreground">
        {point.projects.toFixed(1)} projetos · {point.hours.toFixed(0)} h/mês
      </p>
    </div>
  );
}

export function ReverseSimulator({ profile }: ReverseSimulatorProps) {
  const [desiredProfit, setDesiredProfit] = useState(8000);
  const [projectPrice, setProjectPrice] = useState(3000);
  const [projectHours, setProjectHours] = useState(20);

  const result = useMemo(
    () => simulateReverse(profile, desiredProfit, projectPrice, projectHours),
    [profile, desiredProfit, projectPrice, projectHours],
  );

  const curve = useMemo(
    () => buildCurve(profile, desiredProfit, projectHours, projectPrice),
    [profile, desiredProfit, projectHours, projectPrice],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.2fr]">
      <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="space-y-2">
          <Label htmlFor="desired-profit">Quanto você quer receber por mês (líquido)</Label>
          <Input
            id="desired-profit"
            inputMode="numeric"
            value={desiredProfit}
            onChange={(e) => setDesiredProfit(Math.max(Number(e.target.value) || 0, 0))}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="reverse-price">Preço médio por projeto</Label>
            <span className="tabular text-sm font-medium">{brl(projectPrice)}</span>
          </div>
          <Slider
            id="reverse-price"
            value={[projectPrice]}
            min={200}
            max={40000}
            step={100}
            onValueChange={([value]) => setProjectPrice(value)}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="reverse-hours">Horas por projeto</Label>
            <span className="tabular text-sm font-medium">{projectHours} h</span>
          </div>
          <Slider
            id="reverse-hours"
            value={[projectHours]}
            min={1}
            max={160}
            step={1}
            onValueChange={([value]) => setProjectHours(value)}
          />
        </div>

        <div className="rounded-xl border border-border surface-gradient p-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Projetos necessários por mês
          </p>
          <CountUpValue
            value={result.projectsNeeded}
            format={(v) => v.toFixed(1)}
            className={cn(
              "mt-2 block font-display text-[clamp(2.5rem,6vw,3.5rem)] font-semibold leading-none",
              result.feasible ? "text-success" : "text-warning",
            )}
          />
          <p className="mt-3 text-sm text-muted-foreground">
            Precisa faturar{" "}
            <span className="tabular font-medium text-foreground">
              {brl(result.requiredRevenue)}
            </span>{" "}
            e trabalhar{" "}
            <span className="tabular font-medium text-foreground">
              {result.hoursNeeded.toFixed(0)} h
            </span>{" "}
            — sua disponibilidade é de {profile.productiveHours} h.
          </p>
          {!result.feasible && (
            <p className="mt-2 text-sm font-medium text-warning">
              Não cabe na sua agenda: suba o preço por projeto ou reduza a meta.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Preço x volume necessário
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Passe o mouse pela curva para ver quantos projetos cada preço exige.
        </p>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={curve} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="price"
                tickFormatter={(value: number) => brl(value)}
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                width={36}
              />
              <Tooltip
                content={<CurveTooltip />}
                cursor={{ stroke: "var(--primary)", strokeDasharray: "4 4" }}
              />
              <Line
                type="monotone"
                dataKey="projects"
                stroke="var(--primary)"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, fill: "var(--primary)", stroke: "var(--background)", strokeWidth: 3 }}
                animationDuration={1100}
                animationEasing="ease-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
