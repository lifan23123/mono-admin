const Layout = () => import("@/layout/index.vue");

export default {
  path: "/group",
  name: "Group",
  component: Layout,
  redirect: "/group/discovery",
  meta: {
    icon: "ri:group-line",
    title: "群管理",
    rank: 4
  },
  children: [
    {
      path: "/group/discovery",
      name: "DiscoveryManage",
      component: () => import("@/views/group/discovery/index.vue"),
      meta: {
        title: "发现管理",
        showParent: true
      }
    }
  ]
} satisfies RouteConfigsTable;
