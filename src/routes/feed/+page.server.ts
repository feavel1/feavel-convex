import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
  // Load parent data (session, user info)
  const parentData = await parent();

  return {
    ...parentData
  };
};