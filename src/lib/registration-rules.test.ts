import { describe, expect, it } from "vitest";
import { emptyStore, storePayload, volumeLimits } from "./registration-rules";

describe("Store registration", () => {
  it("requires a nonempty unique identifier and name", () => {
    expect(() => storePayload({ ...emptyStore, store_code: " ", name: "Loja" })).toThrow();
    expect(() => storePayload({ ...emptyStore, store_code: "L01", name: " " })).toThrow();
    expect(
      storePayload({ ...emptyStore, store_code: " L01 ", name: " Loja Centro " }),
    ).toMatchObject({ store_code: "L01", name: "Loja Centro" });
  });
  it("preserves all registration fields and composes an address when absent", () => {
    const form = {
      store_code: "L01",
      name: "Loja",
      full_address: "",
      street: "Rua São João",
      street_number: "10",
      complement: "Sala 2",
      region: "Centro",
      city: "São Paulo",
      location_reference: "Praça",
      fixed_notes: "Portão lateral",
    };
    expect(storePayload(form)).toEqual({
      ...form,
      full_address: "Rua São João, 10, Sala 2, Centro, São Paulo",
    });
    expect(storePayload({ ...form, full_address: "Endereço informado" }).full_address).toBe(
      "Endereço informado",
    );
  });
});
describe("Configurable volume limits", () => {
  it("does not supply defaults when limits are undefined", () => {
    expect(volumeLimits("", "")).toBeNull();
  });
  it("requires increasing nonnegative whole-package limits", () => {
    expect(volumeLimits("0", "1")).toEqual({ low_volume_max: 0, medium_volume_max: 1 });
    for (const [low, medium] of [
      ["10", "10"],
      ["20", "10"],
      ["-1", "10"],
      ["1.5", "10"],
      ["1", "2147483648"],
    ] as const)
      expect(volumeLimits(low, medium)).toBeNull();
    expect(volumeLimits("100", "300")).toEqual({ low_volume_max: 100, medium_volume_max: 300 });
  });
});

import { storesFromSheet } from "./registration-rules";
describe("storesFromSheet", () => {
  it("lê cabeçalhos em português, ignora linhas sem ID e IDs repetidos", () => {
    const r = storesFromSheet([
      { ID: "L1", Loja: "Centro", Rua: "Av. Brasil", Número: "10", Bairro: "Sé" },
      { ID: "", Loja: "Sem id", Rua: "", Número: "", Bairro: "" },
      { ID: "L1", Loja: "Repetida", Rua: "", Número: "", Bairro: "" },
    ]);
    expect(r.stores).toHaveLength(1);
    expect(r.stores[0]?.full_address).toBe("Av. Brasil, 10, Sé");
    expect(r.skipped).toBe(2);
    expect(r.missingColumns).toBe(false);
  });
});
