import { describe, expect, it } from "vitest";
import { duplicateReason, routeIndicators } from "./planning-rules";

describe("Operational rules", () => {
  it("requires an explicit justification for a duplicate store", () => {
    expect(duplicateReason(null)).toBeNull();
    expect(duplicateReason("   ")).toBeNull();
    expect(duplicateReason("  Coleta adicional por excesso de volume  ")).toBe(
      "Coleta adicional por excesso de volume",
    );
  });
  it("counts routes with support, not the number of stores needing support", () => {
    const routes = [{ id: "R1", needs_support: false, needs_extra_route: false, archived: false }];
    const items = Array.from({ length: 3 }, () => ({
      route_id: "R1",
      needs_support: true,
      needs_extra_route: false,
    }));
    expect(routeIndicators(items, routes).support).toBe(1);
  });
  it("counts only created active extra routes, not pending store requests", () => {
    const routes = [
      { id: "R1", needs_support: false, needs_extra_route: true, archived: false },
      { id: "R2", needs_support: false, needs_extra_route: true, archived: true },
    ];
    expect(
      routeIndicators([{ route_id: null, needs_support: false, needs_extra_route: true }], routes)
        .extra,
    ).toBe(1);
  });
});
