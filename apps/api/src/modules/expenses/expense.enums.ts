export enum ExpenseCategoryEnum {
  service = "service",
  merchandise = "merchandise",
  maintenance = "maintenance",
  rent = "rent",
  payroll = "payroll",
  tax = "tax",
  other = "other",
}

export const ExpenseCategoryLabels: Record<ExpenseCategoryEnum, string> = {
  [ExpenseCategoryEnum.service]: "Servicios",
  [ExpenseCategoryEnum.merchandise]: "Mercancía",
  [ExpenseCategoryEnum.maintenance]: "Mantenimiento",
  [ExpenseCategoryEnum.rent]: "Renta",
  [ExpenseCategoryEnum.payroll]: "Nómina",
  [ExpenseCategoryEnum.tax]: "Impuestos",
  [ExpenseCategoryEnum.other]: "Otros",
};
