import { load } from "@std/dotenv";
import { readdirSync } from "node:fs";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import * as log from "@std/log";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

await load({ export: true });

const __dirname = dirname(fileURLToPath(import.meta.url));

// Logger
log.setup({
  handlers: {
    console: new log.ConsoleHandler("DEBUG", {
      formatter: (logRecord) =>
        `${logRecord.datetime.toISOString()} [${logRecord.levelName}] ${logRecord.msg}`,
    }),
  },
  loggers: {
    default: {
      level: "DEBUG",
      handlers: ["console"],
    },
  },
});

const clientId = Deno.env.get("DISCORD_CLIENT_ID")!;
const guildId = Deno.env.get("DISCORD_GUILD_ID")!;
const token = Deno.env.get("DISCORD_TOKEN")!;
const isProd = Deno.env.get("IS_PROD");

if (isProd) {
  const commands: any[] = [];
  const commandFiles = readdirSync(join(__dirname, "command"))
    .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = await import(join(__dirname, "command", file));
    commands.push(command.default.data.toJSON());
    log.info(`Registered command: ${command.default.data.name}`);
  }

  // Register commands
  const rest = new REST({ version: "10" }).setToken(token);

  rest
    .put(Routes.applicationCommands(clientId), { body: commands })
    .then(() =>
      log.info("Successfully registered global application commands.")
    )
    .catch(console.error);
} else {
  const commands: any[] = [];
  const commandFiles = readdirSync(join(__dirname, "command"))
    .filter((file) => file.endsWith(".ts") || file.endsWith(".js"));

  for (const file of commandFiles) {
    const command = await import(join(__dirname, "command", file));
    commands.push(command.default.data.toJSON());
    log.info(`Registered command: ${command.default.data.name}`);
  }

  // Register commands
  const rest = new REST({ version: "10" }).setToken(token);

  rest
    .put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
    .then(() => log.info("Successfully registered guild application commands."))
    .catch(console.error);
}
