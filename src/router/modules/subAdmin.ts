const Layout = () => import("@/layout/index.vue");

export default {
  path: "/sub-admin",
  name: "SubAdmin",
  component: Layout,
  redirect: "/sub-admin/index",
  meta: {
    icon: "ri:admin-line",
    title: "子管理员",
    rank: 1
  },
  children: [
    {
      path: "/sub-admin/index",
      name: "SubAdminIndex",
      component: () => import("@/views/subAdmin/index.vue"),
      meta: {
        title: "子管理员"
      }
    }
  ]
} satisfies RouteConfigsTable;
