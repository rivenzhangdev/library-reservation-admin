import { Roles, MANAGEMENT_ROLES } from './constants/roles';

export default (initialState: any) => {
  const currentUser = initialState?.currentUser;

  const canSeeAdmin = !!(currentUser && currentUser.role === Roles.ADMIN);

  /** 运营员、审核员、管理员均可访问 */
  const canSeeManagement = !!(
    currentUser && MANAGEMENT_ROLES.includes(currentUser.role)
  );

  /** 审核员或管理员可审批 */
  const canReview = !!(
    currentUser &&
    (currentUser.role === Roles.ADMIN || currentUser.role === Roles.REVIEWER)
  );

  return {
    canSeeAdmin,
    canSeeManagement,
    canReview,
  };
};
