import { describe, expect, it } from "bun:test";
import { canReadPanelMessages } from "./panel-privacy";

describe("private panel message visibility", () => {
  it("lets a regular panel read its chats", () => {
    expect(canReadPanelMessages(false)).toBe(true);
  });

  it("hides chat messages in private summary mode", () => {
    expect(canReadPanelMessages(true)).toBe(false);
  });
});