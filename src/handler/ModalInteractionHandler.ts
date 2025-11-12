import { ModalSubmitInteraction } from "discord.js";
import Favorite from "../command/favorite.ts";
import Profile from "../command/profile.ts";
import Setup from "../command/setup.ts";

export class ModalInteractionHandler {
  static async execute(
    interaction: ModalSubmitInteraction,
  ): Promise<void> {
    const modalIdSplit = interaction.customId.split(".");
    const commandName = modalIdSplit[0];
    const action = modalIdSplit[1];

    switch (commandName) {
      case "favorite":
        switch (action) {
          case "remove":
            await Favorite.remove(interaction);
            break;
          default:
            throw new Error(
              "ModalInteractionHandler#execute: Favorite action not recognized.",
            );
        }
        break;
      case "profile":
        switch (action) {
          case "favorite":
            await Profile.handleFavoriteModal(interaction);
            break;
          default:
            throw new Error(
              "ModalInteractionHandler#execute: Profile action not recognized.",
            );
        }
        break;
      case "setup":
        switch (action) {
          case "lodestone":
            await Setup.handleModal(interaction);
            break;
          case "theme":
            await Setup.handleThemeModal(interaction);
            break;
          default:
            throw new Error(
              "ModalInteractionHandler#execute: Setup action not recognized.",
            );
        }
        break;
      default:
        throw new Error(
          "ModalInteractionHandler#execute: Command not recognized.",
        );
    }
  }
}
