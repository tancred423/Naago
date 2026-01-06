import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Command } from "./type/Command.ts";
import { WhenIsResetCommandHelper } from "../helper/WhenIsResetCommandHelper.ts";

class WhenIsResetCommand extends Command {
  public readonly data = new SlashCommandBuilder()
    .setName("when-is-reset")
    .setDescription("Shows different reset times for FFXIV.");

  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    await interaction.deferReply();
    const reply = await WhenIsResetCommandHelper.getPage(interaction, "daily");
    await interaction.editReply(reply);
  }
}

export default new WhenIsResetCommand();
