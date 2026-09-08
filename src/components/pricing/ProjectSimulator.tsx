import { motion } from "motion/react";
import { BookmarkPlus, FileDown } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { exportQuotePdf } from "@/lib/quotePdf";

import { CountUpValue } from "./CountUpValue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  brl,
  computeRates,
  simulateProject,
  type FinancialProfile,
  type HealthLevel,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

export interface ProjectSimulatorProps {
  profile: FinancialProfile;
  onChange: (patch: Partial<FinancialProfile>) => void;
  onSave: (service: { name: string; hours: number; price: number }) => void;
}

const HEALTH_COPY: Record<HealthLevel, string> = {
  below: "Abaixo do custo — esse preço tira dinheiro do seu bolso",
  tight: "Na margem mínima — paga as contas, mas sem lucro real",
  healthy: "Saudável — cobre custo, impostos e a margem desejada",
};

const HEALTH_TEXT: Record<HealthLevel, string> = {
  below: "text-danger",
  tight: "text-warning",
  healthy: "text-success",
};

const HEALTH_BG: Record<HealthLevel, string> = {
  below: "bg-danger/12 border-danger/40",
  tight: "bg-warning/12 border-warning/40",
  healthy: "bg-success/12 border-success/40",
};

export function ProjectSimulator({ profile, onChange, onSave }: ProjectSimulatorProps) {
  const [name, setName] = useState("Landing page institucional");
  const [hours, setHours] = useState(20);
  const [price, setPrice] = useState(3000);

  const rates = useMemo(() => computeRates(profile), [profile]);
  const result = useMemo(
    () => simulateProject(profile, hours, price),
    [profile, hours, price],
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      <div className="space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="space-y-2">
          <Label htmlFor="service-name">Nome do serviço</Label>
          <Input
            id="service-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Identidade visual completa"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="service-hours">Horas estimadas</Label>
            <span className="tabular text-sm font-medium">{hours} h</span>
          </div>
          <Slider
            id="service-hours"
            value={[hours]}
            min={1}
            max={200}
            step={1}
            onValueChange={(v) => setHours((v[0] ?? 0))}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="service-price">Preço a testar</Label>
            <span className="tabular text-sm font-medium">{brl(price)}</span>
          </div>
          <Slider
            id="service-price"
            value={[price]}
            min={100}
            max={40000}
            step={50}
            onValueChange={(v) => setPrice((v[0] ?? 0))}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="live-margin">Margem desejada</Label>
            <span className="tabular text-sm font-medium">{profile.marginPercent}%</span>
          </div>
          <Slider
            id="live-margin"
            value={[profile.marginPercent]}
            min={0}
            max={120}
            step={1}
            onValueChange={(v) => onChange({ marginPercent: v[0] ?? 0 })}
          />
          <p className="text-xs text-muted-foreground">
            Arraste e veja o resultado recalcular na hora.
          </p>
        </div>

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => onSave({ name: name.trim() || "Serviço sem nome", hours, price })}
        >
          <BookmarkPlus className="size-4" /> Salvar perfil de serviço
        </Button>
      </div>

      <div className="space-y-4">
        <motion.div
          layout
          className={cn(
            "rounded-2xl border p-8 transition-colors duration-500",
            HEALTH_BG[result.health],
          )}
        >
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Preço ideal para esse projeto
          </p>
          <CountUpValue
            value={result.idealPrice}
            format={brl}
            className={cn(
              "mt-3 block font-display text-[clamp(2.75rem,7vw,4rem)] font-semibold leading-none transition-colors duration-500",
              HEALTH_TEXT[result.health],
            )}
          />
          <p className={cn("mt-4 text-sm font-medium", HEALTH_TEXT[result.health])}>
            {HEALTH_COPY[result.health]}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Seu preço testado dá{" "}
            <span className="tabular font-medium text-foreground">
              {brl(result.effectiveHourly)}
            </span>{" "}
            por hora · lucro líquido estimado de{" "}
            <span className="tabular font-medium text-foreground">
              {brl(result.netProfit)}
            </span>
          </p>
        </motion.div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Mínimo", value: result.minPrice, hint: "sem lucro" },
            { label: "Competitivo", value: result.competitivePrice, hint: "margem parcial" },
            { label: "Ideal", value: result.idealPrice, hint: "margem cheia" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-border surface-gradient p-4"
            >
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {item.label}
              </p>
              <CountUpValue
                value={item.value}
                format={brl}
                className="mt-1 block font-display text-xl font-semibold text-foreground"
              />
              <p className="text-xs text-muted-foreground">{item.hint}</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Custo-hora real:{" "}
          <span className="tabular font-medium text-foreground">{brl(rates.costPerHour)}</span> ·
          preço-hora mínimo:{" "}
          <span className="tabular font-medium text-foreground">{brl(rates.minimum)}</span> ·
          ideal:{" "}
          <span className="tabular font-medium text-foreground">{brl(rates.ideal)}</span>
        </div>
      </div>
    </div>
  );
}
