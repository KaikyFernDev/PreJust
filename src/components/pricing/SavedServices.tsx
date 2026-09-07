import { AnimatePresence, motion } from "motion/react";
import { Clock, Trash2 } from "lucide-react";

import { brl, simulateProject, type FinancialProfile, type SavedService } from "@/lib/pricing";
import { cn } from "@/lib/utils";

export interface SavedServicesProps {
  profile: FinancialProfile;
  services: SavedService[];
  onRemove: (id: string) => void;
}

const HEALTH_DOT = {
  below: "bg-danger",
  tight: "bg-warning",
  healthy: "bg-success",
} as const;

export function SavedServices({ profile, services, onRemove }: SavedServicesProps) {
  if (services.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        Nenhum perfil salvo ainda. Simule um projeto e clique em "Salvar perfil de serviço".
      </p>
    );
  }

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence initial={false}>
        {services.map((service) => {
          const result = simulateProject(profile, service.hours, service.price);
          return (
            <motion.li
              key={service.id}
              layout
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96, height: 0 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <article className="glass-panel h-full rounded-2xl border border-border surface-gradient p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-base font-semibold text-foreground">
                    {service.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => onRemove(service.id)}
                    aria-label={`Remover ${service.name}`}
                    className="rounded-md p-1 text-muted-foreground transition-colors hover:text-danger focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <p className="tabular mt-3 font-display text-2xl font-semibold text-foreground">
                  {brl(service.price)}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3.5" /> {service.hours} h ·{" "}
                  {brl(result.effectiveHourly)}/h
                </p>
                <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className={cn("size-2 rounded-full", HEALTH_DOT[result.health])} />
                  Ideal hoje: {brl(result.idealPrice)}
                </p>
              </article>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );
}
