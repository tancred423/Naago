import { ApplicationCommand, Client, Collection } from "discord.js";
import * as log from "@std/log";

export class CommandMentionService {
  private static commandIds = new Map<string, string>();

  public static async init(client: Client): Promise<void> {
    try {
      const isProd = Deno.env.get("IS_PROD") === "true";
      let commands: Collection<string, ApplicationCommand>;

      if (isProd) {
        commands = await client.application!.commands.fetch();
      } else {
        const devGuildId = Deno.env.get("DISCORD_GUILD_ID");
        const devGuild = devGuildId ? client.guilds.cache.get(devGuildId) : undefined;
        if (devGuild) {
          commands = await devGuild.commands.fetch();
        } else {
          commands = await client.application!.commands.fetch();
        }
      }

      for (const [, command] of commands) {
        this.commandIds.set(command.name, command.id);
      }
      log.info(`[COMMANDS] Cached ${this.commandIds.size} command IDs for mentions`);
    } catch (error: unknown) {
      log.error(
        `[COMMANDS] Failed to fetch command IDs: ${error instanceof Error ? error.stack : String(error)}`,
      );
    }
  }

  public static mentionOrPlain(command: string, subcommand?: string): string {
    const id = this.commandIds.get(command);
    const label = subcommand ? `/${command} ${subcommand}` : `/${command}`;

    if (!id) {
      return `${label}`;
    }

    return `<${label}:${id}>`;
  }

  public static mentionOrBacktick(command: string, subcommand?: string): string {
    const id = this.commandIds.get(command);
    const label = subcommand ? `/${command} ${subcommand}` : `/${command}`;

    if (!id) {
      return `\`${label}\``;
    }

    return `<${label}:${id}>`;
  }
}
