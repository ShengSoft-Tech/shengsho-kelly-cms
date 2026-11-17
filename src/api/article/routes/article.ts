/**
 * article router.
 */

import { factories } from '@strapi/strapi';

// 匿名请求不能用 ?status=draft 读草稿，原因见 src/policies/no-public-drafts.ts。
export default factories.createCoreRouter('api::article.article', {
  config: {
    find: { policies: ['global::no-public-drafts'] },
    findOne: { policies: ['global::no-public-drafts'] },
  },
});
