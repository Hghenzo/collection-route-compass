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
