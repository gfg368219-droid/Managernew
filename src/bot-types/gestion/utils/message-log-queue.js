const { EmbedBuilder } = require("discord.js");

const BATCH_DELAY_MS = 5000;
const MAX_ENTRY_LENGTH = 900;
const MAX_DESCRIPTION_LENGTH = 3800;
const MAX_ENTRIES_PER_BATCH = 100;
const queuesByClient = new WeakMap();

function splitEntries(entries) {
  const chunks = [];
  let current = "";

  for (const entry of entries) {
    const next = current ? `${current}\n\n${entry}` : entry;
    if (current && next.length > MAX_DESCRIPTION_LENGTH) {
      chunks.push(current);
      current = entry;
    } else {
      current = next;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}

async function flushQueue(client, queueKey) {
  const clientQueues = queuesByClient.get(client);
  const batch = clientQueues?.get(queueKey);
  if (!batch) return;

  clientQueues.delete(queueKey);
  if (batch.timer) clearTimeout(batch.timer);

  const chunks = splitEntries(batch.entries);
  for (const [index, description] of chunks.entries()) {
    try {
      const page = chunks.length > 1 ? ` (${index + 1}/${chunks.length})` : "";
      const embed = new EmbedBuilder()
        .setColor(batch.color)
        .setTitle(`Journal de messages — ${batch.entries.length} événement(s)${page}`)
        .setDescription(description)
        .setTimestamp();
      await batch.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(
        `[gestion] envoi du journal groupé impossible (${batch.guildId}) :`,
        error.message
      );
    }
  }
}

function queueMessageLog(client, guildId, channel, color, entry) {
  let clientQueues = queuesByClient.get(client);
  if (!clientQueues) {
    clientQueues = new Map();
    queuesByClient.set(client, clientQueues);
  }

  const queueKey = `${guildId}:${channel.id}`;
  let batch = clientQueues.get(queueKey);
  if (!batch) {
    batch = { guildId, channel, color, entries: [], timer: null };
    clientQueues.set(queueKey, batch);
  }

  batch.entries.push(String(entry).slice(0, MAX_ENTRY_LENGTH));
  if (batch.entries.length >= MAX_ENTRIES_PER_BATCH) {
    void flushQueue(client, queueKey);
    return;
  }

  if (!batch.timer) {
    batch.timer = setTimeout(() => {
      void flushQueue(client, queueKey);
    }, BATCH_DELAY_MS);
    batch.timer.unref?.();
  }
}

module.exports = { queueMessageLog };