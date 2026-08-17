import { defineConfig } from "vitepress";
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

const config = defineConfig({
  title: "shinka-rpc",
  description: "Symmetric RPC bus",
  // cleanUrls: true,
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
      { text: "Home", link: "/", activeMatch: "^/$" },
      { text: "Core", link: "/core/", activeMatch: "^/core/" },
      {
        text: "Transports",
        link: "/transports/",
        activeMatch: "^/transports/",
      },
      {
        text: "Serializers",
        link: "/serializers/",
        activeMatch: "^/serializers/",
      },
      { text: "<b>LiMon</b>s", link: "/limons/", activeMatch: "^/limons/" },
      {
        text: "Schedulers",
        link: "/schedulers/",
        activeMatch: "^/schedulers/",
      },
      { text: "Other", link: "/other/", activeMatch: "^/other/" },
    ],

    sidebar: {
      "/core/": [
        {
          items: [
            { text: "Core", link: "/core/" },
            { text: "Usage Example", link: "/core/usage-example" },
            { text: "Shinka", link: "/core/shinka" },
            { text: "Bus", link: "/core/bus" },
            { text: "Client", link: "/core/client" },
            { text: "Hub", link: "/core/hub" },
            { text: "Pool", link: "/core/pool" },
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
      "/limons/": [
        {
          items: [
            { text: "<b>LiMon</b>s", link: "/limons/" },
            { text: "Opportunistic", link: "/limons/opportunistic" },
          ],
        },
      ],
      "/schedulers/": [
        { items: [{ text: "Schedulers", link: "/schedulers/" }] },
      ],
      "/other/": [
        {
          items: [
            { text: "Other", link: "/other/" },
            { text: "Collections", link: "/other/collections" },
            { text: "Concurrency", link: "/other/concurrency" },
            { text: "Exclusive Lock", link: "/other/exclusive-lock" },
            { text: "OutScope", link: "/other/outscope" },
            { text: "Util", link: "/other/util" },
            { text: "Lib*", link: "/other/lib" },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/shinka-rpc/shinka-js" },
    ],
  },
});

// https://vitepress.dev/reference/site-config
export default withMermaid(config);
