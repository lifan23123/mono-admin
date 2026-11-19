const Layout = () => import("@/layout/index.vue");

export default {
  path: "/post-management",
  name: "PostManagement",
  component: Layout,
  redirect: "/post-management/index",
  meta: {
    icon: "ri:article-line",
    title: "帖子管理",
    roles: ["admin"],
    rank: 10
  },
  children: [
    {
      path: "/post-management/index",
      name: "PostManagementIndex",
      component: () => import("@/views/postManagement/index.vue"),
      meta: {
        title: "帖子管理",
        roles: ["admin"]
      }
    },
    {
      path: "/post-management/detail",
      name: "PostManagementDetail",
      component: () => import("@/views/postManagement/detail.vue"),
      meta: {
        title: "帖子详情",
        showLink: false,
        roles: ["admin"],
        activePath: "/post-management/index"
      }
    }
  ]
} satisfies RouteConfigsTable;
