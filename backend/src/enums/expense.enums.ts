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
  [ExpenseCategoryEnum.service]: "SERVICIO",
  [ExpenseCategoryEnum.merchandise]: "MERCANCÍA",
  [ExpenseCategoryEnum.maintenance]: "MANTENIMIENTO",
  [ExpenseCategoryEnum.rent]: "RENTA",
  [ExpenseCategoryEnum.payroll]: "NÓMINA",
  [ExpenseCategoryEnum.tax]: "IMPUESTOS",
  [ExpenseCategoryEnum.other]: "OTRO",
};