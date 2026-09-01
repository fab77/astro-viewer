import { describe, expect, it } from "@jest/globals";
import {
  decDMSToDeg,
  decDegToDMS,
  raHMSToDeg,
  raDegToHMS,
} from "./Utils.js";

describe("astronomical sexagesimal coordinate conversions", () => {
  it("converts HMS right ascension to degrees", () => {
    expect(raHMSToDeg({ h: 12, m: 0, s: 0 })).toBeCloseTo(180);
    expect(raHMSToDeg({ h: 13, m: 29, s: 52.7 })).toBeCloseTo(
      202.4695833333,
    );
  });

  it("converts positive DMS declination to degrees", () => {
    expect(decDMSToDeg({ d: 47, m: 11, s: 43 })).toBeCloseTo(
      47.1952777778,
    );
  });

  it("converts negative DMS declination to degrees", () => {
    expect(decDMSToDeg({ d: -47, m: 11, s: 43 })).toBeCloseTo(
      -47.1952777778,
    );
  });

  it("preserves a negative declination below one degree", () => {
    expect(decDMSToDeg({ d: -0, m: 30, s: 0 })).toBeCloseTo(-0.5);
  });

  it("round-trips representative degree coordinates", () => {
    const ra = 202.4695833333;
    const dec = -47.1952777778;

    expect(raHMSToDeg(raDegToHMS(ra))).toBeCloseTo(ra);
    expect(decDMSToDeg(decDegToDMS(dec))).toBeCloseTo(dec);
  });
});