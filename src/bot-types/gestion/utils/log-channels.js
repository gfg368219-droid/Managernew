function resolveLogChannel(message, channelArgument) {
  const mentionedChannel = message.mentions.channels.first();
  if (mentionedChannel) return mentionedChannel;
  if (!channelArgument) return message.channel;

  const channelId = channelArgument.match(/^<#(\d+)>$/)?.[1] || channelArgument;
  return message.guild.channels.cache.get(channelId) || null;
}

function isLogChannel(channel) {
  return Boolean(
    channel &&
    typeof channel.send === "function" &&
    typeof channel.isTextBased === "function" &&
    channel.isTextBased()
  );
}

module.exports = { resolveLogChannel, isLogChannel };