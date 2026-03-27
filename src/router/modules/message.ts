const Layout = () => import("@/layout/index.vue");

export default {
  path: "/message",
  name: "Message",
  component: Layout,
  redirect: "/message/single",
  meta: {
    icon: "ri:chat-3-line",
    title: "消息管理",
    roles: ["admin", "common"],
    rank: 3
  },
  children: [
    {
      path: "/message/single",
      name: "MessageSingle",
      component: () => import("@/views/message/single/index.vue"),
      meta: {
        title: "单聊记录",
        roles: ["admin", "common"]
      }
    },
    {
      path: "/message/group-chat",
      name: "MessageGroupChat",
      component: () => import("@/views/message/group-chat/index.vue"),
      meta: {
        title: "群聊记录",
        roles: ["admin", "common"]
      }
    },
    {
      path: "/message/group-manage",
      name: "MessageGroupManage",
      component: () => import("@/views/message/group-manage/index.vue"),
      meta: {
        title: "群管理",
        roles: ["admin", "common"]
      }
    }
  ]
} satisfies RouteConfigsTable;
