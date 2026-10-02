const BOT_TYPE_CHANGE_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function parseDuration(input) {
  const match = String(input || "")
    .trim()
    .toLowerCase()
    .match(/^(\d+)\s*(m|h|j|d|w|mois|month|months|y|an|ans|year|years)$/);

  if (!match) {
    throw new Error(
      "Durée invalide. Utilisez par exemple `30j`, `12h`, `2mois` ou `1an`."
    );
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers = {
    m: 60_000,
    h: 3_600_000,
    j: 86_400_000,
    d: 86_400_000,
    w: 604_800_000,
    mois: 2_592_000_000,
    month: 2_592_000_000,
    months: 2_592_000_000,
    y: 31_536_000_000,
    an: 31_536_000_000,
    ans: 31_536_000_000,
    year: 31_536_000_000,
    years: 31_536_000_000,
  };
  return amount * multipliers[unit];
}

function parseUses(input) {
  const uses = Number.parseInt(String(input || "").trim(), 10);
  if (!Number.isInteger(uses) || uses < 1 || uses > 100_000) {
    throw new Error("Le nombre d'utilisations doit être compris entre 1 et 100000.");
  }
  return uses;
}

function formatDuration(ms) {
  const days = Math.floor(ms / 86_400_000);
  if (days >= 365) return `${Math.floor(days / 365)} an(s)`;
  if (days >= 30) return `${Math.floor(days / 30)} mois`;
  if (days >= 1) return `${days} jour(s)`;
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${hours} heure(s)`;
  return `${Math.max(1, Math.floor(ms / 60_000))} minute(s)`;
}

function formatRemaining(expiresAt) {
  const remaining = expiresAt - Date.now();
  if (remaining <= 0) return "Expiré";
  return `${formatDuration(remaining)} restants`;
}

function formatDate(timestamp) {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function getBotTypeChangeAvailableAt(bot) {
  const lastChangedAt = Number(bot?.lastTypeChangedAt || 0);
  return Number.isFinite(lastChangedAt) && lastChangedAt > 0
    ? lastChangedAt + BOT_TYPE_CHANGE_COOLDOWN_MS
    : 0;
}

module.exports = {
  BOT_TYPE_CHANGE_COOLDOWN_MS,
  parseDuration,
  parseUses,
  formatDuration,
  formatRemaining,
  formatDate,
  getBotTypeChangeAvailableAt,
};