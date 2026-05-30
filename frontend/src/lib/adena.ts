export function parseAdena(value: string | number): number {
  if (typeof value === "number") {
    return Math.floor(Math.max(0, value));
  }

  const cleaned = value.trim().toLowerCase().replace(/\s/g, "");

  if (!cleaned) {
    return 0;
  }

  const match = cleaned.match(/^(\d+(?:\.\d+)?)(k{1,2}|b)?$/);

  if (!match) {
    return -1; // sinaliza formato inválido
  }

  const num = parseFloat(match[1]);
  const suffix = match[2];

  if (Number.isNaN(num) || num < 0) {
    return -1;
  }

  if (suffix === "kk") {
    return Math.floor(num * 1_000_000);
  }

  if (suffix === "k") {
    return Math.floor(num * 1_000);
  }

  if (suffix === "b") {
    return Math.floor(num * 1_000_000_000);
  }

  return Math.floor(num);
}

function fmt(n: number): string {
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

export function formatAdenaPreview(value: number): string {
  if (value <= 0) return "";

  if (value >= 1_000_000_000_000) {
    return `${fmt(value / 1_000_000_000_000)} Trillion`;
  }
  if (value >= 1_000_000_000) {
    return `${fmt(value / 1_000_000_000)} Billion`;
  }
  if (value >= 1_000_000) {
    return `${fmt(value / 1_000_000)} Million`;
  }
  if (value >= 1_000) {
    return `${fmt(value / 1_000)} Thousand`;
  }

  return value.toLocaleString("pt-BR");
}
