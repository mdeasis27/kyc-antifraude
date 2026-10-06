import assert from "node:assert/strict";
import test from "node:test";
import { STORY } from "./story";
import { lintStory, storyStrings as strings } from "@/design-system/demo/copy-lint";

const keys = (o: unknown): string[] => o && typeof o === "object" && !Array.isArray(o) ? Object.entries(o).filter(([k]) => k !== "before" && k !== "after").flatMap(([k, v]) => [k, ...keys(v).map(x => `${k}.${x}`)]) : [];

test("same shape in English and Spanish", () => assert.deepEqual(keys(STORY.es), keys(STORY.en)));

test("no empty strings except the owner-supplied why note", () => {
  for (const locale of ["en", "es"] as const) {
    const { why, ...rest } = STORY[locale];
    assert.notEqual(why.title.trim(), "");
    for (const s of strings(rest)) assert.notEqual(s.trim(), "", `${locale}: empty string`);
  }
});

test("avoids AI-sounding patterns and brand names", () => {
  for (const locale of ["en", "es"] as const) assert.deepEqual(lintStory(STORY[locale]), [], locale);
});

test("the bet names the line", () => {
  assert.match(STORY.es.tryIt.question(70), /al menos 70%/);
  assert.match(STORY.en.tryIt.question(75), /at least 75%/);
});

test("the comparison sentence is true at a gap, one and zero", () => {
  assert.equal(STORY.es.compare.sentence(2, 4), "Con la cola se rechazaron 2. Sin ella, 4: 2 personas que pudieron abrir su cuenta se fueron a su casa.");
  assert.match(STORY.es.compare.sentence(2, 3), /una persona que pudo abrir su cuenta se fue/);
  assert.match(STORY.en.compare.sentence(2, 2), /nobody needs the manager/);
  for (const locale of ["en", "es"] as const) for (const [a, b] of [[2, 4], [2, 3], [2, 2]]) assert.deepEqual(lintStory({ s: STORY[locale].compare.sentence(a, b) }), []);
});

test("approved count agrees in number", () => {
  assert.equal(STORY.es.scene.approvedOf(1), "Se aprobó sola 1 de 12");
  assert.equal(STORY.es.scene.approvedOf(8), "Se aprobaron solas 8 de 12");
});

test("the scene summary agrees in number", () => {
  assert.equal(STORY.es.scene.summary(1, 2), "1 fue con el gerente y 2 se rechazaron.");
  assert.equal(STORY.es.scene.summary(2, 1), "2 fueron con el gerente y 1 se rechazó.");
  assert.equal(STORY.en.scene.summary(2, 1), "2 went to the manager and 1 was rejected.");
});
