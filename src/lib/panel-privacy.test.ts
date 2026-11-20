import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canReadPanelMessages } from "./panel-privacy";

describe("private panel message visibility", () => {
  it("lets a regular panel read its chats", () => {
    assert.equal(canReadPanelMessages(false), true);
  });

  it("hides chat messages in private summary mode", () => {
    assert.equal(canReadPanelMessages(true), false);
  });
});