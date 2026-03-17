const Layout = () => import("@/layout/index.vue");

export default {
  path: "/key-config",
  name: "KeyConfig",
  component: Layout,
  redirect: "/key-config/index",
  meta: {
    icon: "ri:key-2-line",
    title: "key配置",
    rank: 6
  },
  children: [
    {
      path: "/key-config/index",
      name: "KeyConfigIndex",
      component: () => import("@/views/key/index.vue"),
      meta: {
        title: "key配置"
      }
    }
  ]
} satisfies RouteConfigsTable;
