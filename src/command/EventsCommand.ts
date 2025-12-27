import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { Command } from "./type/Command.ts";
import { EventsCommandHelper } from "../helper/EventsCommandHelper.ts";

class EventsCommand extends Command {
  public readonly data = new SlashCommandBuilder()
    .setName("events")
    .setDescription("Lists all currently ongoing and upcoming FFXIV events.");

  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const message = await EventsCommandHelper.getEvents();
    await interaction.reply({
      components: message.components,
      flags: MessageFlags.IsComponentsV2,
    });
  }
}

export default new EventsCommand();
