import { ApplicationCommandOptionType } from 'discord.js';
import { SlashCommand } from '../../structures/index.js';

export default new SlashCommand({
  name: 'add-thank',
  description: 'add a thank from a user',
  options: [
    {
      name: 'user',
      description: 'the user add a thank from',
      type: ApplicationCommandOptionType.User,
      required: true,
    },
    {
      name: 'amount',
      description: 'the amount of thanks to add',
      type: ApplicationCommandOptionType.Integer,
      min_value: 1,
    },
  ],
  memberPermission: 'Administrator',
  async run({ client, interaction, args }) {
    const user = args.getUser('user')!;
    const amount = args.getInteger('amount') || 1;

    const userData = await client.prisma.user.findFirst({
      where: { userId: user.id },
    });

    if (!userData) {
      return client.embeds.error({
        reason: `\`${user.tag}\` has no data!`,
        interaction,
      });
    }

    const newData = await client.prisma.user.update({
      where: { userId: user.id },
      data: { thanks: userData.thanks + amount },
    });

    return client.embeds.success({
      reason: `Added \`${amount}\` thank(s) to \`${user.tag}\`\n\n**Thanks:** \`${newData.thanks}\``,
      interaction,
    });
  },
});
