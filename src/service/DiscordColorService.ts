import { ButtonInteraction, Client, ColorResolvable, CommandInteraction, Guild } from "discord.js";

export class DiscordColorService {
  private static readonly blurple = Deno.env.get("COLOR_BLURPLE")!;

  public static async getBotColorByInteraction(
    interaction: CommandInteraction | ButtonInteraction,
  ): Promise<ColorResolvable> {
    const botId = interaction.client.user?.id;
    const guild = interaction.guild;
    if (!guild || !botId) return this.blurple as ColorResolvable;
    const member = await guild.members.fetch(botId);
    if (!member) return this.blurple as ColorResolvable;
    const displayHexColor = member.displayHexColor;
    if (displayHexColor === "#000000") return this.blurple as ColorResolvable;

    return displayHexColor as ColorResolvable;
  }

  public static async getBotColorByClientGuild(
    client: Client,
    guild: Guild,
  ): Promise<ColorResolvable> {
    if (!client || !guild || !client.user) return this.blurple as ColorResolvable;
    const botId = client.user.id;
    const member = await guild.members.fetch(botId);
    if (!member) return this.blurple as ColorResolvable;
    const displayHexColor = member.displayHexColor;
    if (displayHexColor === "#000000") return this.blurple as ColorResolvable;

    return displayHexColor as ColorResolvable;
  }
}
