import { AnimatePresence, motion } from "motion/react";
import { Plus, Trash2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useState, type FormEvent } from "react";

import { CountUpValue } from "./CountUpValue";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  brl,
  computeRates,
  totalExpenses,
  type ExpenseItem,
  type FinancialProfile,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

export interface OnboardingWizardProps {
  profile: FinancialProfile;
  onChange: (patch: Partial<FinancialProfile>) => void;
  onFinish: () => void;
}

const STEPS = ["Despesas fixas", "Disponibilidade", "Margem e impostos"] as const;

export function OnboardingWizard({ profile, onChange, onFinish }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");

  const rates = computeRates(profile);
  const go = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(Math.min(Math.max(next, 0), STEPS.length - 1));
  };

  const addExpense = (event: FormEvent) => {
    event.preventDefault();
    const value = Number(amount.replace(",", "."));
    if (!label.trim() || !Number.isFinite(value) || value <= 0) return;
    const item: ExpenseItem = { id: crypto.randomUUID(), label: label.trim(), amount: value };
    onChange({ expenses: [...profile.expenses, item] });
    setLabel("");
    setAmount("");
  };

  const removeExpense = (id: string) =>
    onChange({ expenses: profile.expenses.filter((item) => item.id !== id) });

  return (
    <section className="mx-auto w-full max-w-2xl">
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-widest text-muted-foreground">
          <span>
            Etapa {step + 1} de {STEPS.length}
          </span>
          <span>{STEPS[step]}</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-primary"
            animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 160, damping: 22 }}
          />
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border surface-gradient p-6 sm:p-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 0 && (
              <div className="space-y-6">
                <header>
                  <h2 className="font-display text-2xl font-semibold text-foreground">
                    Quanto custa existir todo mês?
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Liste aluguel, softwares, contador, internet — tudo que sai mesmo sem
                    cliente novo.
                  </p>
                </header>

                <form onSubmit={addExpense} className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    placeholder="Ex.: Assinaturas de software"
                    aria-label="Nome da despesa"
                  />
                  <Input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    inputMode="decimal"
                    placeholder="R$ 0"
                    aria-label="Valor mensal da despesa"
                    className="sm:w-36"
                  />
                  <Button type="submit" className="shrink-0">
                    <Plus className="size-4" /> Adicionar
                  </Button>
                </form>

                <ul className="space-y-2">
                  <AnimatePresence initial={false}>
                    {profile.expenses.map((item) => (
                      <motion.li
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: -12, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                          <span className="text-sm text-card-foreground">{item.label}</span>
                          <div className="flex items-center gap-3">
                            <span className="tabular text-sm font-medium text-foreground">
                              {brl(item.amount)}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeExpense(item.id)}
                              aria-label={`Remover ${item.label}`}
                              className="rounded-md p-1 text-muted-foreground transition-colors hover:text-danger focus-visible:outline-2 focus-visible:outline-ring"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>

                <p className="text-sm text-muted-foreground">
                  Total mensal:{" "}
                  <CountUpValue
                    value={totalExpenses(profile.expenses)}
                    format={brl}
                    className="font-semibold text-foreground"
                  />
                </p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <header>
                  <h2 className="font-display text-2xl font-semibold text-foreground">
                    Quantas horas você realmente vende?
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Descontando prospecção, reuniões e administração. A média realista fica
                    entre 80 e 140 horas.
                  </p>
                </header>
                <div className="space-y-4">
                  <Label htmlFor="hours">Horas produtivas por mês</Label>
                  <Slider
                    id="hours"
                    value={[profile.productiveHours]}
                    min={20}
                    max={220}
                    step={5}
                    onValueChange={([value]) => onChange({ productiveHours: value })}
                  />
                  <p className="tabular font-display text-4xl font-semibold text-foreground">
                    {profile.productiveHours} h
                  </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <header>
                  <h2 className="font-display text-2xl font-semibold text-foreground">
                    Margem e reserva de impostos
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    A margem é o seu lucro acima do custo. A reserva de impostos é
                    descontada do preço cobrado.
                  </p>
                </header>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="margin">Margem desejada</Label>
                    <span className="tabular text-sm font-medium">{profile.marginPercent}%</span>
                  </div>
                  <Slider
                    id="margin"
                    value={[profile.marginPercent]}
                    min={0}
                    max={120}
                    step={1}
                    onValueChange={([value]) => onChange({ marginPercent: value })}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="tax">Reserva de impostos</Label>
                    <span className="tabular text-sm font-medium">{profile.taxPercent}%</span>
                  </div>
                  <Slider
                    id="tax"
                    value={[profile.taxPercent]}
                    min={0}
                    max={40}
                    step={0.5}
                    onValueChange={([value]) => onChange({ taxPercent: value })}
                  />
                </div>

                <div className="rounded-xl border border-border bg-card p-5">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    Seu preço-hora ideal
                  </p>
                  <CountUpValue
                    value={rates.ideal}
                    format={brl}
                    className="mt-2 block font-display text-5xl font-semibold text-primary"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => go(step - 1)}
            className={cn(step === 0 && "invisible")}
          >
            <ArrowLeft className="size-4" /> Voltar
          </Button>
          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={() => go(step + 1)}>
              Continuar <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button type="button" onClick={onFinish}>
              <Check className="size-4" /> Ver meus números
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
