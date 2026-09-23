const Layout = () => import("@/layout/index.vue");

export default {
  path: "/emoji",
  name: "Emoji",
  component: Layout,
  redirect: "/emoji/index",
  meta: {
    icon: "ri:emotion-line",
    title: "表情管理",
    roles: ["admin", "common"],
    rank: 9
  },
  children: [
    {
      path: "/emoji/index",
      name: "EmojiIndex",
      component: () => import("@/views/emoji/index.vue"),
      meta: {
        title: "表情管理",
        roles: ["admin", "common"]
      }
    },
    {
      path: "/emoji/detail",
      name: "EmojiDetail",
      component: () => import("@/views/emoji/detail.vue"),
      meta: {
        title: "表情详情",
        showLink: false,
        roles: ["admin", "common"],
        activePath: "/emoji/index"
      }
    }
  ]
} satisfies RouteConfigsTable;
