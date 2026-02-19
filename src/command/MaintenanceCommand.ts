import { ChatInputCommandInteraction, ContainerBuilder, MessageFlags, SlashCommandBuilder } from "discord.js";
import { MaintenancesRepository } from "../database/repository/MaintenancesRepository.ts";
import { DiscordEmbedService } from "../service/DiscordEmbedService.ts";
import { Command } from "./type/Command.ts";

class MaintenanceCommand extends Command {
  public readonly data = new SlashCommandBuilder()
    .setName("maintenance")
    .setDescription("Current maintenances if any.");

  public async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    const activeMaintenances = await MaintenancesRepository.findActive();

    if (activeMaintenances.length === 0) {
      await interaction.reply({ content: "There is no active maintenance." });
      return;
    }

    const headerText = activeMaintenances.length > 1
      ? "# These maintenances are currently active"
      : "# This maintenance is currently active";

    const components: ContainerBuilder[] = [
      DiscordEmbedService.buildTextContainer(headerText, "COLOR_MAINTENANCES"),
    ];

    for (const maintenanceData of activeMaintenances) {
      if (components.length >= 5) break;
      components.push(DiscordEmbedService.getMaintenanceContainerFromData(maintenanceData));
    }

    await interaction.reply({ components, flags: MessageFlags.IsComponentsV2 });
  }
}

export default new MaintenanceCommand();
