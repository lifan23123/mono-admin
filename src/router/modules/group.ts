const Layout = () => import("@/layout/index.vue");

export default {
  path: "/discovery",
  name: "Discovery",
  component: Layout,
  redirect: "/discovery/index",
  meta: {
    icon: "ri:compass-3-line",
    title: "发现管理",
    roles: ["admin"],
    rank: 4
  },
  children: [
    {
      path: "/discovery/index",
      name: "DiscoveryManage",
      component: () => import("@/views/group/discovery/index.vue"),
      meta: {
        title: "发现管理",
        roles: ["admin"],
        showParent: false
      }
    }
  ]
} satisfies RouteConfigsTable;
