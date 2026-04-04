import { Roles } from './constants/roles';

export default (initialState: any) => {
  const currentUser = initialState?.currentUser;

  const canSeeAdmin = !!(currentUser && currentUser.role === Roles.ADMIN);

  return {
    canSeeAdmin,
  };
};
