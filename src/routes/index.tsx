import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { CountUpValue } from "@/components/pricing/CountUpValue";
import { OnboardingWizard } from "@/components/pricing/OnboardingWizard";
import { ProjectSimulator } from "@/components/pricing/ProjectSimulator";
import { ReverseSimulator } from "@/components/pricing/ReverseSimulator";
import { SavedServices } from "@/components/pricing/SavedServices";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePricingStore } from "@/hooks/usePricingStore";
import { brl, computeRates } from "@/lib/pricing";

const TITLE = "Precifica — custo-hora real e simulação de preços para freelancers";
const DESCRIPTION =
  "Calcule seu custo-hora real, descubra preço mínimo, competitivo e ideal por projeto e veja quantos projetos por mês você precisa para bater sua meta.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const { hydrated, profile, services, setProfile, saveService, removeService, reset } =
    usePricingStore();
  const [editing, setEditing] = useState(false);

  if (!hydrated) {
    return <div className="min-h-screen bg-background" aria-hidden />;
  }

  const rates = computeRates(profile);
  const showWizard = !profile.onboarded || editing;

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Precifica</p>
            <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
              Quanto custa a sua hora de verdade?
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Uma calculadora viva para freelancers e prestadores de serviço: custo-hora
              real, preço por projeto e o volume necessário para bater sua meta.
            </p>
          </div>
          {profile.onboarded && !editing && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing(true)}>
                Editar perfil financeiro
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  reset();
                  setEditing(false);
                  toast("Dados apagados");
                }}
                aria-label="Recomeçar do zero"
              >
                <RotateCcw className="size-4" />
              </Button>
            </div>
          )}
        </header>

        {showWizard ? (
          <OnboardingWizard
            profile={profile}
            onChange={setProfile}
            onFinish={() => {
              setProfile({ onboarded: true });
              setEditing(false);
              toast.success("Perfil financeiro pronto");
            }}
          />
        ) : (
          <div className="space-y-10">
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="grid gap-4 sm:grid-cols-3"
            >
              {[
                { label: "Custo-hora real", value: rates.costPerHour },
                { label: "Preço-hora mínimo", value: rates.minimum },
                { label: "Preço-hora ideal", value: rates.ideal },
              ].map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-border surface-gradient p-6"
                >
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {card.label}
                  </p>
                  <CountUpValue
                    value={card.value}
                    format={brl}
                    className="mt-2 block font-display text-3xl font-semibold text-foreground"
                  />
                </div>
              ))}
            </motion.section>

            <Tabs defaultValue="project">
              <TabsList>
                <TabsTrigger value="project">Simular projeto</TabsTrigger>
                <TabsTrigger value="reverse">Simulador reverso</TabsTrigger>
                <TabsTrigger value="saved">Perfis salvos</TabsTrigger>
              </TabsList>

              <TabsContent value="project" className="mt-6">
                <ProjectSimulator
                  profile={profile}
                  onChange={setProfile}
                  onSave={(service) => {
                    saveService(service);
                    toast.success("Perfil de serviço salvo");
                  }}
                />
              </TabsContent>

              <TabsContent value="reverse" className="mt-6">
                <ReverseSimulator profile={profile} />
              </TabsContent>

              <TabsContent value="saved" className="mt-6">
                <SavedServices
                  profile={profile}
                  services={services}
                  onRemove={removeService}
                />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </main>
  );
}
