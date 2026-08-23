import { FITSHeaderItem, FITSHeaderManager, FITSParser } from "jsfitsio";

const header = new FITSHeaderManager();

header.insert(new FITSHeaderItem("SIMPLE", true, ""));
header.insert(new FITSHeaderItem("BITPIX", 16, ""));
header.insert(new FITSHeaderItem("NAXIS", 2, ""));
header.insert(new FITSHeaderItem("NAXIS1", 4, ""));
header.insert(new FITSHeaderItem("NAXIS2", 1, ""));
header.insert(new FITSHeaderItem("BSCALE", 2, ""));
header.insert(new FITSHeaderItem("BZERO", 10, ""));
header.insert(new FITSHeaderItem("BLANK", -999, ""));
header.insert(new FITSHeaderItem("DATAMIN", 12, ""));
header.insert(new FITSHeaderItem("DATAMAX", 16, ""));

const rawValues = [-999, 1, 2, 3];

const payload = rawValues.map((value) => {
  const bytes = new Uint8Array(2);
  const view = new DataView(bytes.buffer);

  // FITS integer payload is big-endian.
  view.setInt16(0, value, false);

  return bytes;
});

FITSParser.saveFITSLocally(
  {
    header,
    data: [Uint8Array.from(payload.flatMap((chunk) => Array.from(chunk)))],
  },
  "./test/fixtures/hips/fits-tile-physical-values.fits",
);

console.log("Fixture written.");
