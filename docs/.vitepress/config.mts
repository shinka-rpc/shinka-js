import { withMermaid } from "vitepress-plugin-mermaid";

import { dirname, join } from "path";
import { copyFile } from "fs/promises";

const __dirname = new URL(import.meta.url + "/..").pathname;
const docsDir = dirname(__dirname);
const docsDistDir = join(__dirname, "dist");

const PROD = process.env.NODE_ENV === "production";

const baseUrl = process.env.READTHEDOCS_VERSION_NAME
  ? `/${process.env.READTHEDOCS_VERSION_NAME}/`
  : "/";

const faviconPath = PROD ? `${baseUrl}favicon.png` : "/img/favicon.png";

// https://vitepress.dev/reference/site-config
export default withMermaid({
  title: "shinka-rpc",
  description: "Symmetric RPC bus",
  cleanUrls: true,
  base: baseUrl,

  head: [["link", { rel: "icon", href: faviconPath }]],

  transformPageData: (pageData, context) => {
    if (PROD && pageData.filePath === "index.md") {
      const { hero } = pageData.frontmatter;
      hero.image.src = "/assets/logo.png";
    }
  },

  buildEnd: async (siteConfig) => {
    await copyFile(
      join(docsDir, "img", "logo.png"),
      join(docsDistDir, "assets", "logo.png"),
    );
    await copyFile(
      join(docsDir, "img", "favicon.png"),
      join(docsDistDir, "favicon.png"),
    );
  },

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config

    nav: [
      { text: "Home", link: "/" },
      { text: "Core", link: "/core/" },
      { text: "Transports", link: "/transports/" },
      { text: "Serializers", link: "/serializers/" },
      { text: "Util", link: "/util/" },
    ],

    sidebar: {
      "/core/": [
        {
          items: [
            { text: "Core", link: "/core/" },
            { text: "Usage Example", link: "/core/usage-example" },
            { text: "Shinka", link: "/core/shinka" },
            { text: "Client", link: "/core/client" },
            { text: "Server", link: "/core/server" },
          ],
        },
      ],
      "/transports/": [
        {
          items: [
            { text: "Transports", link: "/transports/" },
            { text: "Dedicated Worker", link: "/transports/dedicated-worker" },
            { text: "Shared Worker", link: "/transports/shared-worker" },
            {
              text: "Browser Extension",
              link: "/transports/browser-extension",
            },
            { text: "WebSocket", link: "/transports/web-socket" },
          ],
        },
      ],
      "/serializers/": [
        {
          items: [
            { text: "Serializers", link: "/serializers/" },
            { text: "JSON", link: "/serializers/json" },
            { text: "BSON", link: "/serializers/bson" },
            { text: "Msgspec", link: "/serializers/msgspec" },
            { text: "GZIP", link: "/serializers/gzip" },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/shinka-rpc/shinka-js" },
    ],
  },
});
