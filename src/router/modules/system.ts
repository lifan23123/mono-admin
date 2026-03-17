const Layout = () => import("@/layout/index.vue");

export default {
  path: "/backend",
  name: "Backend",
  component: Layout,
  redirect: "/backend/user",
  meta: {
    icon: "ri:settings-3-line",
    title: "后台管理",
    rank: 5
  },
  children: [
    {
      path: "/backend/user",
      name: "BackendUser",
      component: () => import("@/views/backend/user/index.vue"),
      meta: {
        title: "后台用户管理"
      }
    },
    {
      path: "/backend/log",
      name: "BackendLog",
      component: () => import("@/views/backend/log/index.vue"),
      meta: {
        title: "后台登录日志"
      }
    },
    {
      path: "/backend/blacklist",
      name: "BackendBlacklist",
      component: () => import("@/views/backend/blacklist/index.vue"),
      meta: {
        title: "IP黑名单"
      }
    }
  ]
} satisfies RouteConfigsTable;
