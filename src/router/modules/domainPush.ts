const Layout = () => import("@/layout/index.vue");

export default {
  path: "/domain-push",
  name: "DomainPush",
  component: Layout,
  redirect: "/domain-push/index",
  meta: {
    icon: "ri:send-plane-fill",
    title: "域名推送",
    roles: ["admin"],
    rank: 7
  },
  children: [
    {
      path: "/domain-push/index",
      name: "DomainPushIndex",
      component: () => import("@/views/domainPush/index.vue"),
      meta: {
        title: "域名推送",
        roles: ["admin"]
      }
    }
  ]
} satisfies RouteConfigsTable;
