import { describe, expect, it } from "vitest";
import { clusterHue, parseAiStores } from "./cluster-colors";

describe("cluster colors", () => {
  it("same cluster always gets same color, different clusters differ", () => {
    expect(clusterHue("4")).toBe(clusterHue(" 4 "));
    expect(clusterHue("4")).not.toBe(clusterHue("5"));
    expect(clusterHue("")).toBeNull();
  });
  it("parses AI output and drops rows without id or name and duplicates", () => {
    const r = parseAiStores(
      'ok {"stores":[{"store_code":"10","name":"A","full_address":"Rua 1","cluster":"Cluster 4"},{"store_code":"10","name":"B"},{"store_code":"","name":"C"}]}',
    );
    expect(r).toEqual([{ store_code: "10", name: "A", full_address: "Rua 1", cluster: "4" }]);
  });
});

import { clusterShortcut, storeMatches } from "./cluster-colors";
describe("busca por cluster", () => {
  it("c1 encontra só o cluster 1", () => {
    expect(clusterShortcut("C1")).toBe("1");
    expect(clusterShortcut("cluster 3")).toBe("3");
    expect(storeMatches({ store_code: "10", name: "A", cluster: "1" }, "c1")).toBe(true);
    expect(storeMatches({ store_code: "1", name: "A", cluster: "10" }, "c1")).toBe(false);
  });
});

import { geocodeQuery, clusterRegion } from "./cluster-colors";
describe("região do cluster", () => {
  it("usa a cidade do cluster na busca", () => {
    expect(geocodeQuery("Rua Uniflor 1222", "3")).toBe("Rua Uniflor 1222, Pinhais, PR, Brasil");
    expect(geocodeQuery("Rua X 1", "08")).toBe("Rua X 1, Joinville, SC, Brasil");
    expect(clusterRegion("17")?.label).toBe("CIC");
  });
});
