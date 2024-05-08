import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "unbag",
  description: "一个专门用来开发npm工具的包",
  head: [["link", { rel: "icon", type: "image/svg+xml", href: "/logo.svg" }]],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    logo: "/logo.svg",
    nav: [
      { text: "指引", link: "/guide/" },
      {
        text: "更新日志",
        link: "https://github.com/LiuWenXing1996/unbag/blob/main/CHANGELOG.md",
      },
    ],
    sidebar: [
      {
        text: "指引",
        items: [{ text: "开始", link: "/guide/" }],
      },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/LiuWenXing1996/unbag" },
    ],
  },
});
