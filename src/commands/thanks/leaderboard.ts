import { EmbedBuilder, HexColorString } from 'discord.js';
import { SlashCommand } from '../../structures/index.js';

export default new SlashCommand({
  name: 'leaderboard',
  description: 'view the thanks leaderboard!',
  async run({ client, interaction }) {
    const data = (await client.prisma.user.findMany())
      .sort((a, b) => b.thanks - a.thanks)
      .filter(({ thanks }) => thanks !== 0)
      .slice(0, 10);

    if (!data.length) {
      return client.embeds.error({
        reason: 'No data found!',
        interaction,
      });
    }

    const fetchUser = async (userId: string) => {
      const user = await client.users.fetch(userId);
      return user.tag;
    };

    const description = data.map(async ({ userId, thanks }, i) => `**${i + 1}) ${await fetchUser(userId)}:** \`${thanks}\``);

    const embed = new EmbedBuilder()
      .setTitle(`${client.emoji.information} Thanks Leaderboard`)
      .setColor(client.colors.Invisible as HexColorString)
      .setDescription((await Promise.all(description)).join('\n'));

    return interaction.followUp({
      embeds: [embed],
    });
  },
});
