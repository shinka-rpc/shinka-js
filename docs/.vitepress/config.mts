import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "shinka-rpc",
  description: "Symmetric RPC bus",
  cleanUrls: true,
  base: process.env.READTHEDOCS_VERSION_NAME
    ? `/${process.env.READTHEDOCS_VERSION_NAME}/`
    : "/",

  head: [["link", { rel: "icon", href: "/img/favicon.png" }]],

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Core", link: "/core/" },
      { text: "Transports", link: "/transports/" },
      { text: "Serializers", link: "/serializers/" },
    ],

    sidebar: {
      "/core/": [
        {
          items: [
            { text: "Core", link: "/core/" },
            { text: "Usage Example", link: "/core/usage-example" },
            { text: "ClientBus", link: "/core/client-bus" },
            { text: "ServerBus", link: "/core/server-bus" },
          ],
        },
      ],
      "/transports/": [
        {
          text: "Transports",
          items: [{ text: "Runtime API Examples", link: "/api-examples" }],
        },
      ],
      "/serializers/": [
        {
          text: "Serializers",
          items: [{ text: "Markdown Examples", link: "/markdown-examples" }],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/shinka-rpc/shinka-js" },
    ],
  },
});
