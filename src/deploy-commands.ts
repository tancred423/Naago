import { load } from "@std/dotenv";
import { readdirSync, statSync } from "node:fs";
import { REST, Routes } from "discord.js";
import { RESTPostAPIApplicationCommandsJSONBody } from "discord.js";
import * as log from "@std/log";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

await load({ export: true });

const __dirname = dirname(fileURLToPath(import.meta.url));

log.setup({
  handlers: {
    console: new log.ConsoleHandler("DEBUG", {
      formatter: (logRecord) => `${logRecord.datetime.toISOString()} [${logRecord.levelName}] ${logRecord.msg}`,
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
const ownerCommandsServerId = Deno.env.get("OWNER_COMMANDS_SERVER_ID");
const token = Deno.env.get("DISCORD_TOKEN")!;
const isProd = Deno.env.get("IS_PROD")! === "true";

const commandFiles = readdirSync(join(__dirname, "command"))
  .filter((file) => {
    const filePath = join(__dirname, "command", file);
    return (file.endsWith(".ts") || file.endsWith(".js")) &&
      statSync(filePath).isFile();
  });

const regularCommands: RESTPostAPIApplicationCommandsJSONBody[] = [];
const ownerCommands: RESTPostAPIApplicationCommandsJSONBody[] = [];

for (const file of commandFiles) {
  const command = await import(join(__dirname, "command", file));
  const commandData = command.default.data.toJSON();

  if (commandData.name === "owner") {
    ownerCommands.push(commandData);
    log.info(`Found owner command: ${commandData.name}`);
  } else {
    regularCommands.push(commandData);
    log.info(`Found regular command: ${commandData.name}`);
  }
}

const rest = new REST({ version: "10" }).setToken(token);

if (isProd) {
  if (regularCommands.length > 0) {
    await rest
      .put(Routes.applicationCommands(clientId), { body: regularCommands })
      .then(() => log.info("Successfully registered global application commands."))
      .catch(console.error);
  }

  if (ownerCommands.length > 0 && ownerCommandsServerId) {
    await rest
      .put(Routes.applicationGuildCommands(clientId, ownerCommandsServerId), { body: ownerCommands })
      .then(() => log.info(`Successfully registered owner commands to guild ${ownerCommandsServerId}.`))
      .catch(console.error);
  } else if (ownerCommands.length > 0 && !ownerCommandsServerId) {
    log.warn("Owner commands found but OWNER_COMMANDS_SERVER_ID not set. Skipping owner command deployment.");
  }
} else {
  const allCommands = [...regularCommands, ...ownerCommands];
  await rest
    .put(Routes.applicationGuildCommands(clientId, guildId), { body: allCommands })
    .then(() => log.info("Successfully registered guild application commands."))
    .catch(console.error);
}
