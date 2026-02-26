import { assertEquals } from "@std/assert";
import { ArrayManipulationService } from "../../src/service/ArrayManipulationService.ts";

Deno.test("prettifyPermissionArray - formats snake_case permissions", () => {
  assertEquals(
    ArrayManipulationService.prettifyPermissionArray(["SEND_MESSAGES", "VIEW_CHANNEL"]),
    "Send Messages, View Channel",
  );
});

Deno.test("prettifyPermissionArray - handles single permission", () => {
  assertEquals(ArrayManipulationService.prettifyPermissionArray(["SEND_MESSAGES"]), "Send Messages");
});

Deno.test("prettifyPermissionArray - handles empty array", () => {
  assertEquals(ArrayManipulationService.prettifyPermissionArray([]), "");
});

Deno.test("prettifyPermissionArray - handles single-word permission", () => {
  assertEquals(ArrayManipulationService.prettifyPermissionArray(["ADMINISTRATOR"]), "Administrator ");
});

Deno.test("removeItemFromArray - removes existing item", () => {
  const arr = [1, 2, 3];
  ArrayManipulationService.removeItemFromArray(arr, 2);
  assertEquals(arr, [1, 3]);
});

Deno.test("removeItemFromArray - does nothing when item not found", () => {
  const arr = [1, 2, 3];
  ArrayManipulationService.removeItemFromArray(arr, 4);
  assertEquals(arr, [1, 2, 3]);
});

Deno.test("removeItemFromArray - removes only first occurrence", () => {
  const arr = [1, 2, 2, 3];
  ArrayManipulationService.removeItemFromArray(arr, 2);
  assertEquals(arr, [1, 2, 3]);
});

Deno.test("removeItemFromArray - works with strings", () => {
  const arr = ["a", "b", "c"];
  ArrayManipulationService.removeItemFromArray(arr, "b");
  assertEquals(arr, ["a", "c"]);
});

Deno.test("removeIndicesFromArray - removes items at specified indices and joins", () => {
  assertEquals(ArrayManipulationService.removeIndicesFromArray(["a", "b", "c", "d"], 1, 3), "a c");
});

Deno.test("removeIndicesFromArray - removes nothing when no indices given", () => {
  assertEquals(ArrayManipulationService.removeIndicesFromArray(["a", "b", "c"]), "a b c");
});

Deno.test("removeIndicesFromArray - handles empty array", () => {
  assertEquals(ArrayManipulationService.removeIndicesFromArray([], 0), "");
});
