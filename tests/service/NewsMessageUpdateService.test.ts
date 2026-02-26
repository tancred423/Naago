import { assertEquals } from "@std/assert";
import { assertSpyCalls, stub } from "@std/testing/mock";
import { NewsQueueService } from "../../src/service/NewsQueueService.ts";
import { NewsMessageUpdateService } from "../../src/service/NewsMessageUpdateService.ts";

Deno.test("updatePostedMessages - calls enqueueUpdateJobs with correct args", async () => {
  const enqueueStub = stub(NewsQueueService, "enqueueUpdateJobs", () => Promise.resolve(5));

  try {
    const newsData = {
      title: "Test Title",
      link: "https://example.com",
      date: 1700000000000,
      banner: "https://example.com/banner.png",
      tag: "Maintenance",
      description: {
        html: "<p>test</p>",
        markdown: "test",
      },
    };

    const result = await NewsMessageUpdateService.updatePostedMessages("maintenances", 42, newsData);

    assertSpyCalls(enqueueStub, 1);
    assertEquals(enqueueStub.calls[0].args[0], "maintenances");
    assertEquals(enqueueStub.calls[0].args[1], 42);
    assertEquals(result, { updated: 5, failed: 0 });
  } finally {
    enqueueStub.restore();
  }
});

Deno.test("updatePostedMessages - returns zero updated when no posted messages", async () => {
  const enqueueStub = stub(NewsQueueService, "enqueueUpdateJobs", () => Promise.resolve(0));

  try {
    const newsData = {
      title: "Title",
      link: "https://example.com",
      date: 1700000000000,
      description: {
        html: "<p>test</p>",
        markdown: "test",
      },
    };

    const result = await NewsMessageUpdateService.updatePostedMessages("topics", 1, newsData);
    assertEquals(result, { updated: 0, failed: 0 });
  } finally {
    enqueueStub.restore();
  }
});

Deno.test("updatePostedMessages - passes tag and banner in payload", async () => {
  const enqueueStub = stub(NewsQueueService, "enqueueUpdateJobs", () => Promise.resolve(1));

  try {
    const newsData = {
      title: "Title",
      link: "https://example.com",
      date: 1700000000000,
      banner: "https://img.com/b.png",
      tag: "Emergency",
      description: {
        html: "<p>desc</p>",
        markdown: "desc",
      },
    };

    await NewsMessageUpdateService.updatePostedMessages("statuses", 10, newsData);

    const payload = enqueueStub.calls[0].args[2];
    assertEquals(payload.tag, "Emergency");
    assertEquals(payload.banner, "https://img.com/b.png");
  } finally {
    enqueueStub.restore();
  }
});
