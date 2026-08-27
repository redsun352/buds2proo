import { describe, expect, it } from "vitest";

const REPOSITORY_URL = "https://api.github.com/repos/redsun352/buds2proo";
const authenticatedTest = process.env.GITHUB_WRITE_TOKEN ? it : it.skip;

describe("GitHub yazma erişimi", () => {
  authenticatedTest("hedef depo için yazma iznine sahip anahtarı doğrular", async () => {
    const token = process.env.GITHUB_WRITE_TOKEN;
    expect(token, "GITHUB_WRITE_TOKEN tanımlı olmalı").toBeTruthy();

    const response = await fetch(REPOSITORY_URL, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    expect(response.status, "GitHub depo isteği başarılı olmalı").toBe(200);
    const repository = (await response.json()) as { permissions?: { push?: boolean } };
    expect(repository.permissions?.push, "Anahtar hedef depoya yazma izni taşımalı").toBe(true);
  });
});
