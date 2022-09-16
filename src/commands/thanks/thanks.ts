import { ApplicationCommandOptionType, EmbedBuilder, HexColorString } from 'discord.js';
import { SlashCommand } from '../../structures/index.js';

export default new SlashCommand({
  name: 'thanks',
  description: 'view your thanks!',
  options: [
    {
      name: 'user',
      description: 'the user to check',
      type: ApplicationCommandOptionType.User,
    },

  ],
  async run({ client, interaction, args }) {
    const user = args.getUser('user') || interaction.user;

    const userData = await client.prisma.user.findFirst({
      where: { userId: user.id },
    });

    if (!userData || userData.thanks === 0) {
      return client.embeds.error({
        reason: `\`${user.tag}\` has no thanks!`,
        interaction,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`${client.emoji.information} Thanks Leaderboard`)
      .setColor(client.colors.Invisible as HexColorString)
      .setAuthor({ iconURL: interaction.user.displayAvatarURL({ extension: 'png' }), name: 'a' })
      .setDescription(`**${user.tag}** has \`${userData.thanks}\` thanks`);

    return interaction.followUp({
      embeds: [embed],
    });
  },
});
