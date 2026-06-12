import { defineConfig } from "vitepress";

const faviconPath = `/${process.env.READTHEDOCS_VERSION_NAME || "img"}/favicon.png`;
// const logoPath = `/${process.env.READTHEDOCS_VERSION_NAME || "img"}/logo.png`;

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "shinka-rpc",
  description: "Symmetric RPC bus",
  cleanUrls: true,
  base: `${process.env.READTHEDOCS_VERSION_NAME || ""}/`,

  head: [["link", { rel: "icon", href: faviconPath }]],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config

    // logo: logoPath,

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
            { text: "Shinka", link: "/core/shinka" },
            { text: "Usage Example", link: "/core/usage-example" },
            { text: "Client", link: "/core/client" },
            { text: "ServerBus", link: "/core/server" },
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
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/shinka-rpc/shinka-js" },
    ],
  },
});
