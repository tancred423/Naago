import { ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder } from "discord.js";
import { Command } from "./type/Command.ts";
import { MaintenancesCommandHelper } from "../helper/MaintenancesCommandHelper.ts";

class MaintenancesCommand extends Command {
  public readonly data = new SlashCommandBuilder()
    .setName("maintenances")
    .setDescription("Lists all currently ongoing and upcoming FFXIV maintenances.");

  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const message = await MaintenancesCommandHelper.getMaintenances();
    await interaction.reply({
      components: message.components,
      flags: MessageFlags.IsComponentsV2,
    });
  }
}

export default new MaintenancesCommand();
