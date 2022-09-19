import { ApplicationCommandOptionType } from 'discord.js';
import { SlashCommand } from '../../structures/index.js';

export default new SlashCommand({
  name: 'thank',
  description: 'thank a user!',
  options: [
    {
      name: 'user',
      description: 'the user to thank',
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: 'reason',
      description: 'the reason you thanked the user',
      type: ApplicationCommandOptionType.String,
    },
  ],
  cooldown: 900000, // 15 minutes
  async run({ client, interaction, args }) {
    const user = args.getUser('user')!;

    if (user.id === interaction.user.id) {
      return client.embeds.error({
        reason: 'You cannot thank yourself!',
        interaction,
      });
    }

    if (user.bot) {
      return client.embeds.error({
        reason: 'You cannot thank a bot!',
        interaction,
      });
    }

    const userData = await client.prisma.user.findFirst({
      where: { userId: user.id },
    });

    if (userData) {
      await client.prisma.user.update({
        where: { userId: user.id },
        data: { thanks: userData.thanks + 1 },
      });

      return client.embeds.success({
        reason: `\`${user.tag}\` now has \`${userData.thanks + 1}\` thanks!`,
        interaction,
      });
    }

    await client.prisma.user.create({
      data: { userId: user.id, thanks: 1 },
    });

    return client.embeds.success({
      reason: `\`${user.tag}\` now has \`1\` thank!`,
      interaction,
    });
  },
});
