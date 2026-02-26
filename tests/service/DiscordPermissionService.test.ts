import { assertEquals } from "@std/assert";
import { stub } from "@std/testing/mock";
import { PermissionsBitField } from "discord.js";
import { DiscordPermissionService } from "../../src/service/DiscordPermissionService.ts";
import { DiscordEmbedService } from "../../src/service/DiscordEmbedService.ts";

Deno.test("hasAllPermissions - returns true when member has all permissions", async () => {
  const member = {
    permissions: {
      has: () => true,
    },
  };
  const interaction = {
    reply: () => Promise.resolve(),
  };

  const result = await DiscordPermissionService.hasAllPermissions(
    interaction as unknown as Parameters<typeof DiscordPermissionService.hasAllPermissions>[0],
    member as unknown as Parameters<typeof DiscordPermissionService.hasAllPermissions>[1],
    PermissionsBitField.Flags.ManageMessages,
  );

  assertEquals(result, true);
});

Deno.test("hasAllPermissions - returns false and replies when missing permissions", async () => {
  let replyCalled = false;
  const member = {
    permissions: {
      has: () => false,
    },
  };
  const interaction = {
    reply: () => {
      replyCalled = true;
      return Promise.resolve();
    },
  };

  const embedStub = stub(DiscordEmbedService, "getErrorEmbed", () =>
    ({
      addFields: () => ({}),
    }) as ReturnType<typeof DiscordEmbedService.getErrorEmbed>);

  try {
    const result = await DiscordPermissionService.hasAllPermissions(
      interaction as unknown as Parameters<typeof DiscordPermissionService.hasAllPermissions>[0],
      member as unknown as Parameters<typeof DiscordPermissionService.hasAllPermissions>[1],
      PermissionsBitField.Flags.ManageMessages,
    );

    assertEquals(result, false);
    assertEquals(replyCalled, true);
  } finally {
    embedStub.restore();
  }
});

Deno.test("hasAllPermissions - checks multiple permissions", async () => {
  const hasPerms = new Set([PermissionsBitField.Flags.ManageMessages]);
  const member = {
    permissions: {
      has: (perm: bigint) => hasPerms.has(perm),
    },
  };
  let replyCalled = false;
  const interaction = {
    reply: () => {
      replyCalled = true;
      return Promise.resolve();
    },
  };

  const embedStub = stub(DiscordEmbedService, "getErrorEmbed", () =>
    ({
      addFields: () => ({}),
    }) as ReturnType<typeof DiscordEmbedService.getErrorEmbed>);

  try {
    const result = await DiscordPermissionService.hasAllPermissions(
      interaction as unknown as Parameters<typeof DiscordPermissionService.hasAllPermissions>[0],
      member as unknown as Parameters<typeof DiscordPermissionService.hasAllPermissions>[1],
      PermissionsBitField.Flags.ManageMessages,
      PermissionsBitField.Flags.Administrator,
    );

    assertEquals(result, false);
    assertEquals(replyCalled, true);
  } finally {
    embedStub.restore();
  }
});
