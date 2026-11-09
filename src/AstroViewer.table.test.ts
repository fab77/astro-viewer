import { describe, expect, it, jest } from "@jest/globals";
import { AstroViewer } from "./AstroViewer.js";
import { MetadataColumn, ColumnType, MetadataManager } from "astrospatial-core/metadata";
import type { AstroTable } from "astrospatial-core/metadata";

const table: AstroTable = {
  columns: [
    new MetadataColumn({ index: 0, name: "ra", unit: "deg", columnType: ColumnType.GEOM_RA }),
    new MetadataColumn({ index: 1, name: "dec", unit: "deg", columnType: ColumnType.GEOM_DEC }),
    new MetadataColumn({ index: 2, name: "outline", unit: "", columnType: ColumnType.GEOM_FOOTPRINT }),
  ],
  rows: [["202.47", "47.2", "POLYGON ICRS ..."]],
};

function createSubject() {
  const subject = Object.create(AstroViewer.prototype) as AstroViewer;
  const catalogue = { addSources: jest.fn() };
  const footprint = { addFootprints: jest.fn() };
  const createCatalogue = jest.fn(() => catalogue);
  const createFootprintSet = jest.fn(() => footprint);
  const showCatalogue = jest.fn();
  const showFootprintSet = jest.fn();
  Object.assign(subject, { createCatalogue, createFootprintSet, showCatalogue, showFootprintSet });
  return { subject, catalogue, footprint, createCatalogue, createFootprintSet, showCatalogue, showFootprintSet };
}

function createEarthSubject() {
  const subject = Object.create(AstroViewer.prototype) as AstroViewer;
  const pointSet = { addSources: jest.fn() };
  const footprint = { addFootprints: jest.fn() };
  const createTerraPointSet = jest.fn(() => pointSet);
  const createTerraFootprintSet = jest.fn(() => footprint);
  const showTerraPointSet = jest.fn();
  const showTerraFootprintSet = jest.fn();
  Object.assign(subject, {
    createTerraPointSet,
    createTerraFootprintSet,
    showTerraPointSet,
    showTerraFootprintSet,
  });
  return {
    subject,
    pointSet,
    footprint,
    createTerraPointSet,
    createTerraFootprintSet,
    showTerraPointSet,
    showTerraFootprintSet,
  };
}

describe("AstroTable public overlay APIs", () => {
  it("creates and displays a catalogue with existing metadata and rows", () => {
    const ctx = createSubject();
    const result = ctx.subject.addCatalogue(table, { name: "sources", description: "demo", providerUrl: "https://example.org" });
    expect(result).toBe(ctx.catalogue);
    expect(ctx.createCatalogue).toHaveBeenCalledWith("sources", "demo", "https://example.org", expect.any(MetadataManager));
    expect(ctx.catalogue.addSources).toHaveBeenCalledWith(table.rows, table.columns);
    expect(ctx.showCatalogue).toHaveBeenCalledWith(ctx.catalogue);
  });

  it("supports creating a catalogue without showing it", () => {
    const ctx = createSubject();
    ctx.subject.addCatalogue(table, { name: "hidden", visible: false });
    expect(ctx.showCatalogue).not.toHaveBeenCalled();
    expect(ctx.catalogue.addSources).toHaveBeenCalledWith(table.rows, table.columns);
  });

  it("creates and displays footprint sets using the existing methods", () => {
    const ctx = createSubject();
    const result = ctx.subject.addFootprintSet(table, { name: "regions" });
    expect(result).toBe(ctx.footprint);
    expect(ctx.createFootprintSet).toHaveBeenCalledWith("regions", "", "", expect.any(MetadataManager));
    expect(ctx.footprint.addFootprints).toHaveBeenCalledWith(table.rows, table.columns);
    expect(ctx.showFootprintSet).toHaveBeenCalledWith(ctx.footprint);
  });

  it("supports hidden footprint sets", () => {
    const ctx = createSubject();
    ctx.subject.addFootprintSet(table, { name: "hidden", visible: false });
    expect(ctx.showFootprintSet).not.toHaveBeenCalled();
  });
});

describe("AstroTable Earth overlay APIs", () => {
  it("creates and displays an Earth point set", () => {
    const ctx = createEarthSubject();

    const result = ctx.subject.addTerraPointSet(table, {
      name: "cities",
      description: "Earth cities",
      providerUrl: "https://example.org",
    });

    expect(result).toBe(ctx.pointSet);
    expect(ctx.createTerraPointSet).toHaveBeenCalledWith(
      "cities",
      "Earth cities",
      "https://example.org",
      expect.any(MetadataManager),
    );
    expect(ctx.pointSet.addSources).toHaveBeenCalledWith(
      table.rows,
      table.columns,
    );
    expect(ctx.showTerraPointSet).toHaveBeenCalledWith(ctx.pointSet);
  });

  it("creates hidden Earth footprints without displaying them", () => {
    const ctx = createEarthSubject();

    const result = ctx.subject.addTerraFootprintSet(table, {
      name: "regions",
      visible: false,
    });

    expect(result).toBe(ctx.footprint);
    expect(ctx.footprint.addFootprints).toHaveBeenCalledWith(
      table.rows,
      table.columns,
    );
    expect(ctx.showTerraFootprintSet).not.toHaveBeenCalled();
  });
});
