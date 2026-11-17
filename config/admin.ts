import type { Core } from '@strapi/strapi';

/** 内容管理器里的 Preview 按钮目前只对文章生效；其他类型返回 null，后台就不显示按钮。 */
const ARTICLE_UID = 'api::article.article';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Admin => {
  // 前端站点（例如 https://dev.shengsho.com）。用 dev 站而不是正式站：正式站的 CloudFront
  // 不把 query 参数转发到 SSR，带 ?preview= 的请求到不了服务器。
  const clientUrl = env('CLIENT_URL', '');
  // 与前端 SSR 服务器的 STRAPI_PREVIEW_SECRET 相同。前端只有在它匹配时才去读草稿。
  const previewSecret = env('PREVIEW_SECRET', '');

  return {
    auth: {
      secret: env('ADMIN_JWT_SECRET'),
    },
    apiToken: {
      salt: env('API_TOKEN_SALT'),
    },
    transfer: {
      token: {
        salt: env('TRANSFER_TOKEN_SALT'),
      },
    },
    secrets: {
      encryptionKey: env('ENCRYPTION_KEY'),
    },
    flags: {
      nps: env.bool('FLAG_NPS', true),
      promoteEE: env.bool('FLAG_PROMOTE_EE', true),
    },
    preview: {
      // 两个环境变量缺一个就不开：按钮点了也只会打开一个读不到草稿的页面。
      enabled: Boolean(clientUrl && previewSecret),
      config: {
        // 写进后台的 CSP frame-src，否则后台无法在 iframe 里显示前端页面。
        allowedOrigins: clientUrl ? [new URL(clientUrl).origin] : [],
        async handler(uid, { documentId, locale, status }) {
          if (uid !== ARTICLE_UID) {
            return null;
          }
          const document = await strapi.documents(ARTICLE_UID).findOne({
            documentId,
            locale,
            status: status === 'published' ? 'published' : 'draft',
          });
          const slug = (document as { slug?: string } | null)?.slug;
          if (!slug) {
            return null;
          }
          const url = new URL(`/${locale || 'en-US'}/blog/${encodeURIComponent(slug)}`, clientUrl);
          // 已发布版本直接看线上页面；只有草稿需要带密钥，让前端改读草稿。
          if (status === 'draft') {
            url.searchParams.set('preview', previewSecret);
          }
          return url.href;
        },
      },
    },
  };
};

export default config;
