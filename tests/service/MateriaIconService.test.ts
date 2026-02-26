import { assert, assertStringIncludes } from "@std/assert";
import { MateriaIconService } from "../../src/service/MateriaIconService.ts";

Deno.test("getIconPath - Savage Aim returns crt path", () => {
  assertStringIncludes(MateriaIconService.getIconPath("Savage Aim Materia I"), "crt_1.png");
});

Deno.test("getIconPath - Savage Aim XII returns crt_12 path", () => {
  assertStringIncludes(MateriaIconService.getIconPath("Savage Aim Materia XII"), "crt_12.png");
});

Deno.test("getIconPath - Heavens' Eye returns dh path", () => {
  assertStringIncludes(MateriaIconService.getIconPath("Heavens' Eye Materia V"), "dh_5.png");
});

Deno.test("getIconPath - Savage Might returns det path", () => {
  assertStringIncludes(MateriaIconService.getIconPath("Savage Might Materia III"), "det_3.png");
});

Deno.test("getIconPath - Quickarm returns sks path", () => {
  assertStringIncludes(MateriaIconService.getIconPath("Quickarm Materia VII"), "sks_7.png");
});

Deno.test("getIconPath - Quicktongue returns sps path", () => {
  assertStringIncludes(MateriaIconService.getIconPath("Quicktongue Materia X"), "sps_10.png");
});

Deno.test("getIconPath - Battledance returns tenacity path", () => {
  assertStringIncludes(MateriaIconService.getIconPath("Battledance Materia IV"), "tenacity_4.png");
});

Deno.test("getIconPath - Piety returns piety path", () => {
  assertStringIncludes(MateriaIconService.getIconPath("Piety Materia VI"), "piety_6.png");
});

Deno.test("getIconPath - Craftsman's Command returns control path", () => {
  assertStringIncludes(MateriaIconService.getIconPath("Craftsman's Command Materia II"), "control_2.png");
});

Deno.test("getIconPath - Craftsman's Cunning returns cp path", () => {
  assertStringIncludes(MateriaIconService.getIconPath("Craftsman's Cunning Materia IX"), "cp_9.png");
});

Deno.test("getIconPath - Craftsman's Competence returns cms path", () => {
  assertStringIncludes(MateriaIconService.getIconPath("Craftsman's Competence Materia XI"), "cms_11.png");
});

Deno.test("getIconPath - Gatherer's Grasp returns gp path", () => {
  assertStringIncludes(MateriaIconService.getIconPath("Gatherer's Grasp Materia VIII"), "gp_8.png");
});

Deno.test("getIconPath - Gatherer's Guerdon returns gathering path", () => {
  assertStringIncludes(MateriaIconService.getIconPath("Gatherer's Guerdon Materia I"), "gathering_1.png");
});

Deno.test("getIconPath - Gatherer's Guile returns perception path", () => {
  assertStringIncludes(MateriaIconService.getIconPath("Gatherer's Guile Materia XII"), "perception_12.png");
});

Deno.test("getIconPath - unknown materia returns fallback path", () => {
  assertStringIncludes(MateriaIconService.getIconPath("Nonexistent Materia"), "fallback.png");
});

Deno.test("getIconPath - all paths contain materia directory", () => {
  const path = MateriaIconService.getIconPath("Savage Aim Materia I");
  assert(path.includes("image") && path.includes("materia"), "Path should contain image/materia segments");
});
