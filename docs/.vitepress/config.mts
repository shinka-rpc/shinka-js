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
      // { text: "Home", link: "/", activeMatch: "^/$" },
      {
        text: "Getting started",
        link: "/getting-started/",
        activeMatch: "^/getting-started/",
      },
      {
        text: "API Reference",
        activeMatch: "^/api-reference/",
        items: [
          {
            text: "API Reference",
            link: "/api-reference/",
            activeMatch: "^/api-reference/$",
          },
          {
            text: "Core",
            link: "/api-reference/core/",
            activeMatch: "^/api-reference/core/",
          },
          {
            text: "Transports",
            link: "/api-reference/transports/",
            activeMatch: "^/api-reference/transports/",
          },
          {
            text: "Serializers",
            link: "/api-reference/serializers/",
            activeMatch: "^/api-reference/serializers/",
          },
          {
            text: "Scenarios",
            link: "/api-reference/scenarios/",
            activeMatch: "^/api-reference/scenarios/",
          },
          {
            text: "<b>LiMon</b>s",
            link: "/api-reference/limons/",
            activeMatch: "^/api-reference/limons/",
          },
          {
            text: "Integrations",
            link: "/api-reference/integrations/",
            activeMatch: "^/api-reference/integrations/",
          },
          {
            text: "Schedulers",
            link: "/api-reference/schedulers/",
            activeMatch: "^/api-reference/schedulers/",
          },
          {
            text: "Collections",
            link: "/api-reference/collections",
            activeMatch: "^/api-reference/collections",
          },
          {
            text: "Concurrency",
            link: "/api-reference/concurrency",
            activeMatch: "^/api-reference/concurrency",
          },
          {
            text: "OutScope",
            link: "/api-reference/outscope",
            activeMatch: "^/api-reference/outscope",
          },
          {
            text: "Util",
            link: "/api-reference/util",
            activeMatch: "^/api-reference/util",
          },
          {
            text: "Exclusive Lock",
            link: "/api-reference/exclusive-lock",
            activeMatch: "^/api-reference/exclusive-lock",
          },
          {
            text: "Lib*",
            link: "/api-reference/lib/",
            activeMatch: "^/api-reference/lib/",
          },
          // {
          //   text: "Other",
          //   link: "/api-reference/",
          //   activeMatch: "^/api-reference/",
          // },
        ],
      },
    ],

    sidebar: {
      "/getting-started/": [
        {
          items: [
            { text: "Getting Started", link: "/getting-started/" },
            {
              text: "What is RPC?",
              link: "/getting-started/what-is-rpc",
            },
            {
              text: "Usage Example",
              link: "/getting-started/usage-example",
            },
          ],
        },
      ],
      "/api-reference/": [
        {
          items: [
            { text: "API Reference", link: "/api-reference/" },
            {
              text: "Core",
              link: "/api-reference/core/",
              items: [
                { text: "Shinka", link: "/api-reference/core/shinka" },
                { text: "Bus", link: "/api-reference/core/bus" },
                { text: "Client", link: "/api-reference/core/client" },
                { text: "Hub", link: "/api-reference/core/hub" },
                { text: "Pool", link: "/api-reference/core/pool" },
                { text: "Server", link: "/api-reference/core/server" },
              ],
            },
            {
              text: "Transports",
              link: "/api-reference/transports/",
              items: [
                {
                  text: "Dedicated Worker",
                  link: "/api-reference/transports/dedicated-worker",
                },
                {
                  text: "Shared Worker",
                  link: "/api-reference/transports/shared-worker",
                },
                {
                  text: "Browser Extension",
                  link: "/api-reference/transports/browser-extension",
                },
                {
                  text: "WebSocket",
                  link: "/api-reference/transports/web-socket",
                },
              ],
            },
            {
              text: "Serializers",
              link: "/api-reference/serializers/",
              items: [
                { text: "JSON", link: "/api-reference/serializers/json" },
                { text: "BSON", link: "/api-reference/serializers/bson" },
                {
                  text: "Msgspec",
                  link: "/api-reference/serializers/msgspec",
                },
                { text: "YAML", link: "/api-reference/serializers/yaml" },
                { text: "GZIP", link: "/api-reference/serializers/gzip" },
                { text: "Base64", link: "/api-reference/serializers/base64" },
              ],
            },
            {
              text: "<b>LiMon</b>s",
              link: "/api-reference/limons/",
              items: [
                {
                  text: "Opportunistic",
                  link: "/api-reference/limons/opportunistic",
                },
              ],
            },
            {
              text: "Integrations",
              link: "/api-reference/integrations/",
              items: [
                {
                  text: "ReactJS",
                  link: "/api-reference/integrations/react",
                },
              ],
            },
            {
              text: "Scenarios",
              link: "/api-reference/scenarios/",
              items: [
                {
                  text: "WaitConnected",
                  link: "/api-reference/scenarios/wait-connected",
                },
                {
                  text: "ClientRegistry",
                  link: "/api-reference/scenarios/client-registry",
                },
                {
                  text: "PassThrough",
                  link: "/api-reference/scenarios/pass-through",
                },
                {
                  text: "SingleFlight",
                  link: "/api-reference/scenarios/single-flight",
                },
              ],
            },
            {
              text: "Schedulers",
              link: "/api-reference/schedulers/",
              // items: [],
            },
            {
              text: "Collections",
              link: "/api-reference/collections",
            },
            {
              text: "Concurrency",
              link: "/api-reference/concurrency",
            },
            { text: "OutScope", link: "/api-reference/outscope" },
            { text: "Util", link: "/api-reference/util" },
            {
              text: "Exclusive Lock",
              link: "/api-reference/exclusive-lock",
            },
            {
              text: "Lib*",
              link: "/api-reference/lib/",
              items: [
                {
                  text: "libserializer",
                  link: "/api-reference/lib/libserializer",
                },
                {
                  text: "libtransport",
                  link: "/api-reference/lib/libtransport",
                },
              ],
            },
            // {
            //   text: "Other",
            //   link: "/api-reference/",
            //   items: [],
            // },
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
