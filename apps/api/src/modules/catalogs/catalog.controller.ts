import { Request, Response } from "express";
import { ExpenseCategoryLabels } from "../expenses/expense.enums";
import { PaymentMethodLabels } from "../sales/payment-method.enums";

const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }));

export const getCatalogsHandler = (req: Request, res: Response) => {
  res.json({
    expenseCategories: toOptions(ExpenseCategoryLabels),
    paymentMethods: toOptions(PaymentMethodLabels),
  });
};
