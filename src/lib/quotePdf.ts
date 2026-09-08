/**
 * Geração de orçamento em PDF a partir de uma simulação de projeto.
 * Roda 100% no navegador (jsPDF), sem backend nem dados enviados para fora.
 */
import { jsPDF } from "jspdf";

import { brl, computeRates, type FinancialProfile, type ProjectResult } from "./pricing";

export interface QuoteInput {
  profile: FinancialProfile;
  result: ProjectResult;
  serviceName: string;
  hours: number;
  price: number;
  clientName?: string;
  providerName?: string;
  /** Validade da proposta em dias */
  validityDays?: number;
}

const slug = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "orcamento";

export function buildQuotePdf(input: QuoteInput): { doc: jsPDF; filename: string } {
  const {
    profile,
    result,
    serviceName,
    hours,
    price,
    clientName,
    providerName,
    validityDays = 15,
  } = input;

  const rates = computeRates(profile);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  const right = pageWidth - margin;
  let y = margin;

  const today = new Date();
  const dateStr = today.toLocaleDateString("pt-BR");
  const validUntil = new Date(today.getTime() + validityDays * 86400000).toLocaleDateString(
    "pt-BR",
  );

  // Cabeçalho
  doc.setFillColor(24, 28, 38);
  doc.rect(0, 0, pageWidth, 96, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("Orçamento de serviço", margin, 52);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(providerName?.trim() || "Proposta comercial", margin, 72);
  doc.text(`Emitido em ${dateStr}`, right, 72, { align: "right" });

  y = 132;
  doc.setTextColor(30, 30, 30);

  const line = (label: string, value: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.text(label, margin, y);
    doc.setTextColor(25, 25, 25);
    doc.setFont("helvetica", "bold");
    doc.text(value, right, y, { align: "right" });
    y += 22;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Dados da proposta", margin, y);
  y += 24;

  if (clientName?.trim()) line("Cliente", clientName.trim());
  line("Serviço", serviceName || "Serviço");
  line("Horas estimadas", `${hours} h`);
  line("Validade da proposta", validUntil);

  y += 10;
  doc.setDrawColor(225, 225, 225);
  doc.line(margin, y, right, y);
  y += 32;

  // Valor principal
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text("VALOR DO INVESTIMENTO", margin, y);
  y += 34;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(32);
  doc.setTextColor(20, 20, 20);
  doc.text(brl(price), margin, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text(
    `Equivalente a ${brl(result.effectiveHourly)} por hora de trabalho dedicada.`,
    margin,
    y,
  );
  y += 34;

  // Faixas de preço
  doc.setDrawColor(225, 225, 225);
  doc.line(margin, y, right, y);
  y += 28;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(25, 25, 25);
  doc.text("Faixas de preço calculadas", margin, y);
  y += 24;

  line("Mínimo (sem lucro)", brl(result.minPrice));
  line("Competitivo (margem parcial)", brl(result.competitivePrice));
  line("Ideal (margem cheia)", brl(result.idealPrice));

  y += 10;
  doc.line(margin, y, right, y);
  y += 28;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Base do cálculo", margin, y);
  y += 24;
  line("Custo-hora real", brl(rates.costPerHour));
  line("Preço-hora mínimo", brl(rates.minimum));
  line("Preço-hora ideal", brl(rates.ideal));
  line("Margem desejada", `${profile.marginPercent}%`);
  line("Reserva de impostos", `${profile.taxPercent}%`);

  // Rodapé
  const footerY = doc.internal.pageSize.getHeight() - 56;
  doc.setDrawColor(225, 225, 225);
  doc.line(margin, footerY - 20, right, footerY - 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(130, 130, 130);
  doc.text(
    "Documento gerado automaticamente para fins de proposta comercial. Não possui valor fiscal.",
    margin,
    footerY,
  );

  return { doc, filename: `orcamento-${slug(serviceName)}.pdf` };
}

export function exportQuotePdf(input: QuoteInput): string {
  const { doc, filename } = buildQuotePdf(input);
  doc.save(filename);
  return filename;
}
