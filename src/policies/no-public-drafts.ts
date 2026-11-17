/**
 * 不允许匿名请求读草稿。
 *
 * Strapi 5 的 REST API 只看 Public 角色有没有 find 权限，不区分草稿和已发布：
 * 任何人在 /api/articles 后面加上 `?status=draft` 就能读到所有未发布的文章
 * （2026-11-17 用 Garden Party 草稿实测确认）。
 *
 * 加了这条 policy 后，只有带 API token 的请求（推送脚本、前端的预览请求）能读草稿，
 * 匿名请求带 status=draft 一律 403。不带 status 或 status=published 的公开请求不受影响。
 */
interface PolicyContext {
  request?: { query?: Record<string, unknown> };
  state?: { auth?: { strategy?: { name?: string }; credentials?: unknown } };
}

export default (policyContext: PolicyContext) => {
  // 必须读 request.query：policyContext 是 Object.assign({}, ctx) 拷出来的，
  // Koa 的 ctx.query 是原型上的 getter，拷贝后就没了，读它永远是 undefined。
  if (policyContext.request?.query?.status !== 'draft') {
    return true;
  }
  const auth = policyContext.state?.auth;
  return auth?.strategy?.name === 'api-token' && Boolean(auth.credentials);
};
