import { Roles, MANAGEMENT_ROLES } from './constants/roles';

export default (initialState: any) => {
  const currentUser = initialState?.currentUser;
  const role =
    currentUser?.role === undefined || currentUser?.role === null
      ? undefined
      : Number(currentUser.role);

  const canSeeAdmin = !!(currentUser && role === Roles.ADMIN);

  /** 运营员、审核员、管理员均可访问 */
  const canSeeManagement = !!(
    currentUser &&
    role !== undefined &&
    MANAGEMENT_ROLES.includes(role as any)
  );

  /** 审核员或管理员可审批 */
  const canReview = !!(
    currentUser &&
    (role === Roles.ADMIN || role === Roles.REVIEWER)
  );

  return {
    canSeeAdmin,
    canSeeManagement,
    canReview,
  };
};
