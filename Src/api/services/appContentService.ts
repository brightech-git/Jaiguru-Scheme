import { callApi } from '../apiClient';
import { APP_CONTENT } from '../endpoints';

export interface AppContentResponse {
  id: string;
  data: string;
}

/** Fetches CMS-managed content such as PRIVACY without embedding it in the app bundle. */
export const getAppContent = (contentId: string) =>
  callApi<undefined, AppContentResponse>({
    method: 'get',
    url: APP_CONTENT.BY_ID(contentId),
  });
