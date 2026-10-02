const { EmbedBuilder } = require("discord.js");

const FLUSH_INTERVAL_MS = 5000;
const MAX_ENTRY_LENGTH = 900;
const MAX_DESCRIPTION_LENGTH = 3800;
const EVENT_DEDUPE_WINDOW_MS = 10_000;
const queuesByClient = new WeakMap();
const recentEventsByClient = new WeakMap();

function takeDescription(entries) {
  const selected = [];
  let current = "";

  for (const entry of entries) {
    const next = current ? `${current}\n\n${entry}` : entry;
    if (next.length > MAX_DESCRIPTION_LENGTH) break;
    selected.push(entry);
    current = next;
  }

  return { selected, description: current };
}

function wasRecentlyQueued(client, guildId, eventKey) {
  if (!eventKey) return false;

  let recentEvents = recentEventsByClient.get(client);
  if (!recentEvents) {
    recentEvents = new Map();
    recentEventsByClient.set(client, recentEvents);
  }

  const now = Date.now();
  const key = `${guildId}:${eventKey}`;
  const previousTime = recentEvents.get(key);
  if (previousTime !== undefined && now - previousTime < EVENT_DEDUPE_WINDOW_MS) {
    return true;
  }

  recentEvents.set(key, now);
  if (recentEvents.size > 5000) {
    for (const [recentKey, timestamp] of recentEvents) {
      if (now - timestamp >= EVENT_DEDUPE_WINDOW_MS) recentEvents.delete(recentKey);
    }
  }
  return false;
}

function scheduleFlush(client, queueKey, batch) {
  if (batch.timer || batch.flushing) return;
  batch.timer = setTimeout(() => {
    batch.timer = null;
    void flushQueue(client, queueKey, batch);
  }, FLUSH_INTERVAL_MS);
  batch.timer.unref?.();
}

async function flushQueue(client, queueKey, expectedBatch) {
  const clientQueues = queuesByClient.get(client);
  const batch = clientQueues?.get(queueKey);
  if (!batch || batch !== expectedBatch || batch.flushing) return;

  if (batch.timer) clearTimeout(batch.timer);
  batch.timer = null;

  if (!batch.entries.length) {
    clientQueues.delete(queueKey);
    return;
  }

  const { selected, description } = takeDescription(batch.entries);
  if (!selected.length) {
    console.error(`[gestion] entrée de journal trop longue (${batch.guildId})`);
    batch.entries.shift();
    scheduleFlush(client, queueKey, batch);
    return;
  }

  batch.entries.splice(0, selected.length);
  batch.flushing = true;
  try {
    const waiting = batch.entries.length;
    const suffix = waiting ? ` — ${waiting} en attente` : "";
    const embed = new EmbedBuilder()
      .setColor(batch.color)
      .setTitle(`Journal de messages — ${selected.length} événement(s)${suffix}`)
      .setDescription(description)
      .setTimestamp();
    await batch.channel.send({ embeds: [embed] });
  } catch (error) {
    batch.entries.unshift(...selected);
    console.error(
      `[gestion] envoi du journal groupé impossible (${batch.guildId}) :`,
      error.message
    );
  } finally {
    batch.flushing = false;
    if (clientQueues.get(queueKey) !== batch) return;
    if (batch.entries.length) {
      scheduleFlush(client, queueKey, batch);
    } else {
      clientQueues.delete(queueKey);
    }
  }
}

function queueMessageLog(client, guildId, channel, color, entry, eventKey) {
  if (wasRecentlyQueued(client, guildId, eventKey)) return;

  let clientQueues = queuesByClient.get(client);
  if (!clientQueues) {
    clientQueues = new Map();
    queuesByClient.set(client, clientQueues);
  }

  const queueKey = `${guildId}:${channel.id}`;
  let batch = clientQueues.get(queueKey);
  if (!batch) {
    batch = { guildId, channel, color, entries: [], timer: null, flushing: false };
    clientQueues.set(queueKey, batch);
  }

  batch.entries.push(String(entry).slice(0, MAX_ENTRY_LENGTH));
  scheduleFlush(client, queueKey, batch);
}

module.exports = { queueMessageLog };