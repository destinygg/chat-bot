const basePunishmentHelper = require("../../../lib/commands/base-punishment-helper");
const assert = require("assert");

describe("BasePunishmentHelper Tests", () => {
  it("punish one for time for reason", function(done) {
    const input = "20m Bob for being stupid";
    const output = basePunishmentHelper(input, 3600);
    const expected = [
      {
        userToPunish: "bob",
        parsedDuration: 1200,
        parsedReason: "for being stupid",
        isPermanent: false
      }
    ];

    assert.deepStrictEqual(output, expected);
    done();
  });
  it("punish one with overRideDuration", function(done) {
    const input = "20m Bob for being stupid";
    const output = basePunishmentHelper(input, 3600, 1800);
    const expected = [
      {
        userToPunish: "bob",
        parsedDuration: 1800,
        parsedReason: "for being stupid",
        isPermanent: false
      }
    ];

    assert.deepStrictEqual(output, expected);
    done();
  });
  it("punish one with default time", function(done) {
    const input = "Bob for being stupid";
    const output = basePunishmentHelper(input, 3600);
    const expected = [
      {
        userToPunish: "bob",
        parsedDuration: 3600,
        parsedReason: "for being stupid",
        isPermanent: false
      }
    ];

    assert.deepStrictEqual(output, expected);
    done();
  });
  it("punish many with time", function(done) {
    const input = "20m Bob, Kogasa, MrMouton for being stupid";
    const output = basePunishmentHelper(input, 3600);
    const expected = [
      {
        userToPunish: "bob",
        parsedDuration: 1200,
        parsedReason: "for being stupid",
        isPermanent: false
      },
      {
        userToPunish: "kogasa",
        parsedDuration: 1200,
        parsedReason: "for being stupid",
        isPermanent: false
      },
      {
        userToPunish: "mrmouton",
        parsedDuration: 1200,
        parsedReason: "for being stupid",
        isPermanent: false
      }
    ];

    assert.deepStrictEqual(output, expected);
    done();
  });
});
