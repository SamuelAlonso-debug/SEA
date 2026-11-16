import { describe, expect, it } from "vitest";
import { mainPaymentMethod, salePayments, settlePayments } from "./sale.payments";
import { salePaymentInputSchema } from "./sale.schema";

const issue = (input: object) => salePaymentInputSchema.safeParse(input).error?.issues[0];

describe("settlePayments", () => {
  it("pago mixto: el cambio sale solo del efectivo", () => {
    const payments = [
      { method: "CASH" as const, amount: 100, received: 200 },
      { method: "TRANSFER" as const, amount: 16, reference: "SPEI-1" },
    ];
    expect(settlePayments(payments, 116)).toEqual([
      { method: "CASH", amount: 100, received: 200, change: 100, reference: null },
      { method: "TRANSFER", amount: 16, received: null, change: null, reference: "SPEI-1" },
    ]);
  });

  it("compara y calcula el cambio en centavos, sin residuos de coma flotante", () => {
    expect(settlePayments([{ method: "CARD", amount: 0.1 }, { method: "CASH", amount: 0.2 }], 0.3)).toHaveLength(2);
    expect(settlePayments([{ method: "CASH", amount: 115.99, received: 120.1 }], 115.99)[0]!.change).toBe(4.11);
  });

  it.each([
    [[{ method: "CASH" as const, amount: 100 }], "Los pagos suman 100.00 y el total es 116.00"],
    [[{ method: "CARD" as const, amount: 120 }], "Los pagos suman 120.00 y el total es 116.00"],
  ])("suma distinta del total → ZodError en payments", (payments, message) => {
    expect(() => settlePayments(payments, 116)).toThrow(
      expect.objectContaining({ name: "ZodError", issues: [expect.objectContaining({ path: ["payments"], message })] })
    );
  });
});

describe("salePaymentInputSchema", () => {
  it.each([
    [{ method: "CHEQUE", amount: 1 }, ["method"], 'Opción inválida: se esperaba una de "CASH"|"CARD"|"TRANSFER"'],
    [{ method: "CASH", amount: 0 }, ["amount"], "El monto del pago debe ser mayor a 0"],
    [{ method: "CASH", amount: 100, received: 99.99 }, ["received"], "El efectivo recibido no cubre el pago"],
    [{ method: "CARD", amount: 100, received: 100 }, ["received"], "Solo los pagos en efectivo llevan monto recibido"],
  ])("%j → error", (input, path, message) => {
    expect(issue(input)).toMatchObject({ path, message });
  });

  it("efectivo exacto es válido", () => {
    expect(issue({ method: "CASH", amount: 100, received: 100 })).toBeUndefined();
  });
});

describe("salePayments / mainPaymentMethod", () => {
  it("venta previa sin pagos → un pago de su método por el total", () => {
    expect(salePayments({ payments: [], paymentMethod: "CARD", total: 116 })).toEqual([
      { method: "CARD", amount: 116, received: null, change: null, reference: null },
    ]);
  });

  it("el método resumen es el del pago mayor", () => {
    const payments = settlePayments([{ method: "TRANSFER", amount: 16 }, { method: "CASH", amount: 100 }], 116);
    expect(mainPaymentMethod(payments)).toBe("CASH");
  });
});
