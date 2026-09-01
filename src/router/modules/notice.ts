const Layout = () => import("@/layout/index.vue");

export default {
  path: "/notice",
  name: "Notice",
  component: Layout,
  redirect: "/notice/index",
  meta: {
    icon: "ri:notification-3-line",
    title: "公告管理",
    roles: ["admin", "common"],
    rank: 8
  },
  children: [
    {
      path: "/notice/index",
      name: "NoticeIndex",
      component: () => import("@/views/notice/index.vue"),
      meta: {
        title: "公告管理",
        roles: ["admin", "common"]
      }
    }
  ]
} satisfies RouteConfigsTable;
