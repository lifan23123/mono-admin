const Layout = () => import("@/layout/index.vue");

export default {
  path: "/",
  name: "Home",
  component: Layout,
  redirect: "/statistics/index",
  meta: {
    icon: "ri:bar-chart-2-line",
    title: "平台统计",
    roles: ["admin"],
    rank: 0
  },
  children: [
    {
      path: "/statistics/index",
      name: "Statistics",
      component: () => import("@/views/statistics/index.vue"),
      meta: {
        title: "平台统计",
        roles: ["admin"]
      }
    }
  ]
} satisfies RouteConfigsTable;
