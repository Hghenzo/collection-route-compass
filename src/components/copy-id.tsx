import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";

const collator = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });
/** Ordem crescente por ID, tratando números corretamente (2 antes de 10). */
export const byStoreCode = (a: { store_code: string }, b: { store_code: string }) =>
  collator.compare(a.store_code, b.store_code);

export function CopyId({ value }: { value: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      title="Copiar ID"
      aria-label={`Copiar ID ${value}`}
      className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          toast.success(`ID ${value} copiado`);
          setTimeout(() => setDone(false), 1500);
        } catch {
          toast.error("Não foi possível copiar.");
        }
      }}
    >
      {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  );
}
