/**
 * Núcleo de cálculo da ferramenta de precificação.
 * Todas as funções são puras e defensivas: entradas inválidas nunca
 * produzem NaN/Infinity, sempre um número finito seguro para renderizar.
 */

export interface ExpenseItem {
  id: string;
  label: string;
  amount: number;
}

export interface FinancialProfile {
  expenses: ExpenseItem[];
  /** Horas realmente faturáveis por mês */
  productiveHours: number;
  /** Margem de lucro desejada em % (ex.: 30) */
  marginPercent: number;
  /** Reserva de impostos em % sobre o preço (ex.: 12) */
  taxPercent: number;
  onboarded: boolean;
}

export interface SavedService {
  id: string;
  name: string;
  hours: number;
  price: number;
  createdAt: number;
}

export interface HourlyRates {
  totalExpenses: number;
  /** Custo por hora apenas para cobrir despesas */
  costPerHour: number;
  /** Preço-hora mínimo: cobre custo + impostos, lucro zero */
  minimum: number;
  /** Preço-hora competitivo: ~60% da margem desejada */
  competitive: number;
  /** Preço-hora ideal: custo + margem cheia + impostos */
  ideal: number;
}

export type HealthLevel = "below" | "tight" | "healthy";

const safe = (n: number): number => (Number.isFinite(n) && n > 0 ? n : 0);

export const emptyProfile = (): FinancialProfile => ({
  expenses: [],
  productiveHours: 120,
  marginPercent: 30,
  taxPercent: 6,
  onboarded: false,
});

export function totalExpenses(expenses: ExpenseItem[]): number {
  if (!Array.isArray(expenses)) return 0;
  return expenses.reduce((sum, item) => sum + safe(item.amount), 0);
}

export function computeRates(profile: FinancialProfile): HourlyRates {
  const total = totalExpenses(profile.expenses);
  const hours = safe(profile.productiveHours);
  const costPerHour = hours > 0 ? total / hours : 0;

  // Impostos incidem sobre o preço cobrado, então dividimos (gross-up).
  const taxRate = Math.min(Math.max(profile.taxPercent ?? 0, 0), 90) / 100;
  const divisor = 1 - taxRate || 1;
  const margin = Math.max(profile.marginPercent ?? 0, 0) / 100;

  return {
    totalExpenses: total,
    costPerHour,
    minimum: costPerHour / divisor,
    competitive: (costPerHour * (1 + margin * 0.6)) / divisor,
    ideal: (costPerHour * (1 + margin)) / divisor,
  };
}

export interface ProjectResult {
  hours: number;
  minPrice: number;
  competitivePrice: number;
  idealPrice: number;
  /** Preço-hora efetivo do preço testado */
  effectiveHourly: number;
  health: HealthLevel;
  /** Lucro líquido estimado do preço testado */
  netProfit: number;
}

export function simulateProject(
  profile: FinancialProfile,
  hours: number,
  testPrice: number,
): ProjectResult {
  const rates = computeRates(profile);
  const h = safe(hours);
  const price = safe(testPrice);
  const effectiveHourly = h > 0 ? price / h : 0;
  const taxRate = Math.min(Math.max(profile.taxPercent ?? 0, 0), 90) / 100;

  let health: HealthLevel = "below";
  if (effectiveHourly >= rates.ideal) health = "healthy";
  else if (effectiveHourly >= rates.minimum) health = "tight";

  return {
    hours: h,
    minPrice: rates.minimum * h,
    competitivePrice: rates.competitive * h,
    idealPrice: rates.ideal * h,
    effectiveHourly,
    health,
    netProfit: price * (1 - taxRate) - rates.costPerHour * h,
  };
}

export interface ReverseResult {
  /** Receita bruta necessária no mês */
  requiredRevenue: number;
  /** Projetos por mês para atingir o objetivo */
  projectsNeeded: number;
  /** Horas necessárias por mês */
  hoursNeeded: number;
  /** Se cabe dentro da disponibilidade declarada */
  feasible: boolean;
}

export function simulateReverse(
  profile: FinancialProfile,
  desiredProfit: number,
  projectPrice: number,
  projectHours: number,
): ReverseResult {
  const total = totalExpenses(profile.expenses);
  const taxRate = Math.min(Math.max(profile.taxPercent ?? 0, 0), 90) / 100;
  const divisor = 1 - taxRate || 1;
  const requiredRevenue = (total + Math.max(desiredProfit, 0)) / divisor;
  const price = safe(projectPrice);
  const projectsNeeded = price > 0 ? requiredRevenue / price : 0;
  const hoursNeeded = projectsNeeded * safe(projectHours);

  return {
    requiredRevenue,
    projectsNeeded,
    hoursNeeded,
    feasible: hoursNeeded > 0 && hoursNeeded <= safe(profile.productiveHours),
  };
}

export interface CurvePoint {
  price: number;
  projects: number;
  hours: number;
}

/** Curva preço x volume necessário para atingir a meta. */
export function buildCurve(
  profile: FinancialProfile,
  desiredProfit: number,
  projectHours: number,
  centerPrice: number,
): CurvePoint[] {
  const total = totalExpenses(profile.expenses);
  const taxRate = Math.min(Math.max(profile.taxPercent ?? 0, 0), 90) / 100;
  const requiredRevenue = (total + Math.max(desiredProfit, 0)) / (1 - taxRate || 1);
  const base = safe(centerPrice) || 1000;
  const start = Math.max(base * 0.25, 50);
  const end = base * 2.5;
  const steps = 24;
  const points: CurvePoint[] = [];

  for (let i = 0; i <= steps; i++) {
    const price = start + ((end - start) * i) / steps;
    const projects = price > 0 ? requiredRevenue / price : 0;
    points.push({
      price: Math.round(price),
      projects: Number(projects.toFixed(2)),
      hours: Number((projects * safe(projectHours)).toFixed(1)),
    });
  }
  return points;
}

export const brl = (value: number): string =>
  (Number.isFinite(value) ? value : 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
