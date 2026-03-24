const Layout = () => import("@/layout/index.vue");

export default {
  path: "/user-management",
  name: "UserManagement",
  component: Layout,
  redirect: "/user-management/index",
  meta: {
    icon: "ri:user-settings-line",
    title: "用户管理",
    roles: ["admin"],
    rank: 2
  },
  children: [
    {
      path: "/user-management/index",
      name: "UserManagementIndex",
      component: () => import("@/views/userManagement/index.vue"),
      meta: {
        title: "用户管理",
        roles: ["admin"]
      }
    }
  ]
} satisfies RouteConfigsTable;
