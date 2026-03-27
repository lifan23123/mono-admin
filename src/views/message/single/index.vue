<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getChatList, getQiNiuDomain } from "@/api/user";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ChatRecordDialog from "../components/ChatRecordDialog.vue";
import ViewIcon from "~icons/ep/chat-dot-round";
import LoadingIcon from "~icons/ep/loading";

defineOptions({
  name: "SingleRecord"
});

const qiniuDomain = ref("");
const userQuery = ref("");
const renderIcon = useRenderIcon;
const loading = ref(false);
const pageNo = ref(1);
const pageSize = ref(20);
const hasMore = ref(true);
const chatRooms = ref([]);

// 弹窗状态
const dialogVisible = ref(false);
const currentChatId = ref("");
const currentChatName = ref("");

const fetchQiNiuDomain = async () => {
  try {
    const res = await getQiNiuDomain();
    const { data } = res as any;
    if (data) qiniuDomain.value = data;
  } catch (e) {}
};

const getUrl = (path: string) => {
  if (!path || path.startsWith("http")) return path || "";
  let domainBase = "";
  if (typeof qiniuDomain.value === "string") domainBase = qiniuDomain.value;
  else if (qiniuDomain.value && typeof qiniuDomain.value === "object") {
    domainBase = (qiniuDomain.value as any).url || "";
  }
  const domain = domainBase.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return domain + cleanPath;
};

const fetchList = async (isAppend = false) => {
  if (loading.value) return;
  if (!isAppend) {
    loading.value = true;
    pageNo.value = 1;
    hasMore.value = true;
    chatRooms.value = [];
  }
  try {
    const { data } = await getChatList({
      type: 1,
      userName: userQuery.value,
      pageNo: pageNo.value,
      pageSize: pageSize.value
    });

    const list = Array.isArray(data) ? data : data?.list || [];
    if (list.length < pageSize.value) hasMore.value = false;

    const formattedList = list.map((item: any) => {
      const roomSideMap = new Map<any, "left" | "right">();
      let roomLastSide: "left" | "right" = "right";

      const imList = (item.imMessageList || []).reverse().map((msg: any) => {
        let parsed: any = { msgType: 1, content: msg.content };
        try { parsed = JSON.parse(msg.content); } catch (e) {}
        const mType = Number(parsed.msgType);
        let displayContent = parsed.content;

        if (mType === 3) {
          const imgs = Array.isArray(parsed.content) ? parsed.content : [parsed.content];
          displayContent = imgs.map((img: any) => ({ ...img, fullUrl: getUrl(img.url) }));
        } else if (mType === 4 || mType === 5) {
          displayContent = { ...parsed, fullUrl: getUrl(parsed.url || parsed.videoUrl) };
        }

        const userId = msg.sendId;
        if (!roomSideMap.has(userId)) {
          const side = roomLastSide === "left" ? "right" : "left";
          roomSideMap.set(userId, side);
          roomLastSide = side;
        }

        return {
          ...msg,
          type: mType,
          formattedContent: displayContent,
          side: roomSideMap.get(userId),
          time: msg.createTime
        };
      });

      const userA = item.managerUsers?.[0] || {};
      const userB = item.managerUsers?.[1] || userA;

      return {
        id: item.id,
        managerUsers: item.managerUsers,
        userA: {
          nickname: userA.name || userA.loginName || "用户A",
          uid: userA.id,
          avatarInitial: (userA.name || "A").substring(0, 1)
        },
        userB: {
          nickname: userB.nickname || userB.name || userB.loginName || "用户B",
          uid: userB.id,
          avatarInitial: (userB.name || "B").substring(0, 1)
        },
        messages: imList
      };
    });

    if (isAppend) chatRooms.value.push(...formattedList);
    else chatRooms.value = formattedList;
  } catch (error) {
    console.error("Fetch chat list failed:", error);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => {
  if (loading.value || !hasMore.value) return;
  pageNo.value++;
  fetchList(true);
};

onMounted(() => {
  fetchList();
  fetchQiNiuDomain();
});

const handleQuery = () => fetchList(false);

const openChatDialog = (room: any) => {
  currentChatId.value = room.id;
  currentChatName.value = `${room.userA.nickname} 与 ${room.userB.nickname}`;
  dialogVisible.value = true;
};
</script>

<template>
  <div
    class="message-single-container p-4"
    v-infinite-scroll="loadMore"
    :infinite-scroll-disabled="!hasMore || loading"
    :infinite-scroll-distance="200"
  >
    <el-card shadow="never" class="filter-card mb-4 border-none border-radius-16">
      <div class="flex items-center gap-8 px-2">
        <div class="flex items-center">
          <span class="mr-4 text-sm text-gray-600">用户</span>
          <el-input v-model="userQuery" placeholder="昵称/ID" class="search-input" clearable />
        </div>
        <el-button type="primary" class="query-btn px-8" @click="handleQuery">查询</el-button>
      </div>
    </el-card>

    <el-row v-loading="loading" :gutter="24">
      <el-col v-for="room in chatRooms" :key="room.id" :xs="24" :sm="12" :lg="8" class="mb-6">
        <el-card shadow="never" class="chat-card border-none border-radius-16">
          <div class="chat-header flex items-center justify-between p-4 bg-gray-50 border-radius-12 mb-4">
            <div class="flex items-center flex-1">
              <div class="avatar-circle mr-2 bg-blue-500 text-white">{{ room.userA.avatarInitial }}</div>
              <div class="user-info truncate">
                <div class="nickname text-sm font-bold text-gray-800">{{ room.userA.nickname }}</div>
                <div class="uid text-[10px] text-gray-400">UID:{{ room.userA.uid }}</div>
              </div>
            </div>

            <el-button link type="primary" class="view-btn flex items-center bg-blue-50 px-3 py-1 rounded-full shrink-0 mx-2" @click="openChatDialog(room)">
              <component :is="useRenderIcon(ViewIcon)" class="mr-1 text-sm" />
              <span class="text-xs">详情</span>
            </el-button>

            <div class="flex items-center flex-1 justify-end text-right">
              <div class="user-info mr-2 truncate">
                <div class="nickname text-sm font-bold text-gray-800">{{ room.userB.nickname }}</div>
                <div class="uid text-[10px] text-gray-400">UID:{{ room.userB.uid }}</div>
              </div>
              <div class="avatar-circle bg-blue-500 text-white">{{ room.userB.avatarInitial }}</div>
            </div>
          </div>

          <div class="chat-logs-container custom-scrollbar px-1 h-[350px] overflow-y-auto">
            <div v-for="(msg, msgIdx) in room.messages" :key="msgIdx" class="msg-wrapper mb-5">
              <div class="flex w-full" :class="msg.side === 'right' ? 'flex-row-reverse' : 'flex-row'">
                <div
                  :class="[
                    'bubble p-3 text-sm rounded-xl shadow-sm leading-relaxed max-w-[95%] w-fit whitespace-pre-wrap overflow-wrap-anywhere word-keep-all block',
                    msg.side === 'left' ? 'bg-white text-gray-800' : 'bg-gray-50 text-gray-700 border border-gray-100'
                  ]"
                >
                  <div v-if="msg.type <= 2">{{ msg.formattedContent }}</div>
                  <div v-else-if="msg.type === 3" class="flex gap-1 overflow-hidden">
                    <el-image v-if="msg.formattedContent?.[0]" :src="msg.formattedContent[0].fullUrl" :preview-src-list="[msg.formattedContent[0].fullUrl]" fit="cover" class="w-20 h-20 rounded shadow-sm" preview-teleported />
                  </div>
                  <div v-else class="flex items-center gap-2 opacity-60">
                    <component :is="useRenderIcon(msg.type === 4 ? 'ri:video-fill' : 'ri:volume-up-fill')" />
                    <span>{{ msg.type === 4 ? '视频消息' : '语音消息' }}</span>
                  </div>
                </div>
              </div>
              <div class="text-[10px] text-gray-300 mt-1.5 px-1" :class="msg.side === 'right' ? 'text-right' : 'text-left'">{{ msg.time }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div class="scroll-footer py-4 text-center text-gray-400 text-sm">
      <div v-if="loading && chatRooms.length > 0" class="flex justify-center items-center py-2">
        <el-icon class="is-loading mr-2"><component :is="useRenderIcon(LoadingIcon)" /></el-icon>加载中...
      </div>
      <div v-else-if="!hasMore && chatRooms.length > 0">没有更多了</div>
    </div>

    <!-- Reusable Component -->
    <ChatRecordDialog
      v-model:visible="dialogVisible"
      :chat-id="currentChatId"
      :chat-name="currentChatName"
      :qiniu-domain="qiniuDomain"
      :type="1"
    />
  </div>
</template>

<style lang="scss" scoped>
.message-single-container {
  height: calc(100vh - 84px);
  overflow-y: auto;
  padding: 24px;
  .border-radius-16 { border-radius: 16px !important; }
  .filter-card {
    :deep(.el-card__body) { padding: 16px 24px; }
    .search-input { width: 220px; :deep(.el-input__wrapper) { background-color: #f7f8fa; border-radius: 10px; height: 40px; box-shadow: none; } }
    .query-btn { height: 40px; border-radius: 10px; }
  }
  .chat-card {
    height: 480px;
    :deep(.el-card__body) { padding: 12px; height: 100%; display: flex; flex-direction: column; }
    .avatar-circle { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; }
    .view-btn { text-decoration: none; &:hover { background-color: #eef2ff; } }
  }
  .custom-scrollbar { &::-webkit-scrollbar { width: 4px; } &::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; } }
  .word-keep-all { word-break: keep-all; }
  .overflow-wrap-anywhere { overflow-wrap: anywhere; }
}
</style>
