import { assertEquals } from "@std/assert";
import { ColorResolvable } from "discord.js";
import { DiscordColorService } from "../../src/service/DiscordColorService.ts";

const blurple = Deno.env.get("COLOR_BLURPLE")! as ColorResolvable;

Deno.test("getBotColorByInteraction - returns blurple when guild is null", async () => {
  const interaction = {
    client: { user: { id: "123" } },
    guild: null,
  } as unknown as Parameters<typeof DiscordColorService.getBotColorByInteraction>[0];

  const result = await DiscordColorService.getBotColorByInteraction(interaction);
  assertEquals(result, blurple);
});

Deno.test("getBotColorByInteraction - returns blurple when botId is null", async () => {
  const interaction = {
    client: { user: null },
    guild: { members: { fetch: () => Promise.resolve(null) } },
  } as unknown as Parameters<typeof DiscordColorService.getBotColorByInteraction>[0];

  const result = await DiscordColorService.getBotColorByInteraction(interaction);
  assertEquals(result, blurple);
});

Deno.test("getBotColorByInteraction - returns blurple when member is null", async () => {
  const interaction = {
    client: { user: { id: "123" } },
    guild: { members: { fetch: () => Promise.resolve(null) } },
  } as unknown as Parameters<typeof DiscordColorService.getBotColorByInteraction>[0];

  const result = await DiscordColorService.getBotColorByInteraction(interaction);
  assertEquals(result, blurple);
});

Deno.test("getBotColorByInteraction - returns blurple when displayHexColor is #000000", async () => {
  const interaction = {
    client: { user: { id: "123" } },
    guild: {
      members: {
        fetch: () => Promise.resolve({ displayHexColor: "#000000" }),
      },
    },
  } as unknown as Parameters<typeof DiscordColorService.getBotColorByInteraction>[0];

  const result = await DiscordColorService.getBotColorByInteraction(interaction);
  assertEquals(result, blurple);
});

Deno.test("getBotColorByInteraction - returns member display color", async () => {
  const interaction = {
    client: { user: { id: "123" } },
    guild: {
      members: {
        fetch: () => Promise.resolve({ displayHexColor: "#ff5733" }),
      },
    },
  } as unknown as Parameters<typeof DiscordColorService.getBotColorByInteraction>[0];

  const result = await DiscordColorService.getBotColorByInteraction(interaction);
  assertEquals(result, "#ff5733");
});

Deno.test("getBotColorByClientGuild - returns blurple when client is null", async () => {
  const result = await DiscordColorService.getBotColorByClientGuild(
    null as unknown as Parameters<typeof DiscordColorService.getBotColorByClientGuild>[0],
    {} as unknown as Parameters<typeof DiscordColorService.getBotColorByClientGuild>[1],
  );
  assertEquals(result, blurple);
});

Deno.test("getBotColorByClientGuild - returns blurple when guild is null", async () => {
  const client = { user: { id: "123" } };
  const result = await DiscordColorService.getBotColorByClientGuild(
    client as unknown as Parameters<typeof DiscordColorService.getBotColorByClientGuild>[0],
    null as unknown as Parameters<typeof DiscordColorService.getBotColorByClientGuild>[1],
  );
  assertEquals(result, blurple);
});

Deno.test("getBotColorByClientGuild - returns member display color", async () => {
  const client = { user: { id: "123" } };
  const guild = {
    members: {
      fetch: () => Promise.resolve({ displayHexColor: "#abcdef" }),
    },
  };
  const result = await DiscordColorService.getBotColorByClientGuild(
    client as unknown as Parameters<typeof DiscordColorService.getBotColorByClientGuild>[0],
    guild as unknown as Parameters<typeof DiscordColorService.getBotColorByClientGuild>[1],
  );
  assertEquals(result, "#abcdef");
});
