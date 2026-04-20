// Numeric role enum: 0 = user, 1 = admin, 2 = operator, 3 = reviewer
export const Roles = {
  USER: 0,
  ADMIN: 1,
  OPERATOR: 2,
  REVIEWER: 3,
} as const;

export type Role = (typeof Roles)[keyof typeof Roles];

/** 管理层角色（运营员、审核员、管理员） */
export const MANAGEMENT_ROLES = [
  Roles.ADMIN,
  Roles.OPERATOR,
  Roles.REVIEWER,
] as const;
