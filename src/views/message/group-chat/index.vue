<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getChatList, getQiNiuDomain } from "@/api/user";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ChatRecordDialog from "../components/ChatRecordDialog.vue";
import ViewIcon from "~icons/ep/chat-dot-round";
import LoadingIcon from "~icons/ep/loading";

defineOptions({
  name: "MessageGroupChat"
});

const qiniuDomain = ref("");
const userQuery = ref("");
const renderIcon = useRenderIcon;
const loading = ref(false);
const pageNo = ref(1);
const pageSize = ref(20);
const hasMore = ref(true);
const groupChats = ref([]);

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
    groupChats.value = [];
  }

  try {
    const res = await getChatList({
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      loginName: userQuery.value,
      type: 2
    });

    const { data, code } = res as any;
    if (code !== "0000") {
      hasMore.value = false;
      return;
    }

    const list = Array.isArray(data) ? data : data?.list || [];
    if (list.length < pageSize.value) hasMore.value = false;

    const formattedList = list.map(item => {
      const roomSideMap = new Map<any, "left" | "right">();
      let roomLastSide: "left" | "right" = "right";

      item.imMessageList = (item.imMessageList || []).reverse().map((msg: any) => {
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
      return item;
    });

    if (isAppend) groupChats.value.push(...formattedList);
    else groupChats.value = formattedList;
  } catch (error) {
    console.error("Fetch list failed:", error);
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
  fetchQiNiuDomain();
  fetchList();
});

const openChatDialog = (room: any) => {
  currentChatId.value = room.id;
  const userA = room.managerUsers?.[0]?.name || "群成员";
  const userB = room.managerUsers?.[1]?.name || "";
  currentChatName.value = userB ? `${userA} 与 ${userB}` : userA;
  dialogVisible.value = true;
};
</script>

<template>
  <div class="message-group-chat-container p-4">
    <div class="search-section mb-6 flex justify-between items-center px-4">
      <div class="flex gap-4">
        <el-input
          v-model="userQuery"
          placeholder="搜索群聊用户/群名"
          clearable
          class="custom-search"
          @clear="fetchList(false)"
          @keyup.enter="fetchList(false)"
        />
        <el-button type="primary" class="query-btn" @click="fetchList(false)">查询</el-button>
      </div>
    </div>

    <div
      v-infinite-scroll="loadMore"
      :infinite-scroll-disabled="!hasMore || loading"
      :infinite-scroll-distance="200"
      class="rooms-wrapper px-2"
    >
      <el-row :gutter="24">
        <el-col v-for="room in groupChats" :key="room.id" :xs="24" :sm="12" :lg="8" class="mb-6">
          <el-card shadow="hover" class="chat-card border-none border-radius-16">
            <div class="chat-header flex justify-between items-center mb-6 p-1">
              <div class="users-info flex items-center gap-3">
                <div class="user-stack flex -space-x-2">
                  <el-avatar v-for="(u, idx) in room.managerUsers?.slice(0, 2)" :key="idx" :src="u.icon" :size="36" class="border-2 border-white shadow-sm" />
                </div>
                <div class="names text-sm font-bold text-gray-800 truncate max-w-[120px]">
                  {{ room.managerUsers?.[0]?.name || '群成员' }}
                  <span v-if="room.managerUsers?.[1]" class="mx-1 text-gray-400">/</span>
                  {{ room.managerUsers?.[1]?.name }}
                </div>
              </div>
              <el-button link type="primary" class="view-btn flex items-center gap-1 px-3 py-1 bg-blue-50/50 rounded-full" @click="openChatDialog(room)">
                <component :is="useRenderIcon(ViewIcon)" class="text-xs" />
                <span class="text-xs">查看详情</span>
              </el-button>
            </div>

            <div class="chat-logs-container custom-scrollbar h-[350px] bg-gray-50/30 p-4 rounded-2xl overflow-y-auto">
              <div v-for="(msg, msgIdx) in room.imMessageList" :key="msgIdx" class="msg-item mb-5 flex flex-col">
                <div class="flex w-full" :class="msg.side === 'right' ? 'flex-row-reverse' : 'flex-row'">
                  <div
                    :class="[
                      'bubble p-3 text-sm rounded-xl shadow-sm leading-relaxed max-w-[95%] w-fit whitespace-pre-wrap overflow-wrap-anywhere word-keep-all block',
                      msg.side === 'left' ? 'bg-white text-gray-800' : 'bg-gray-50 text-gray-700 border border-gray-100'
                    ]"
                  >
                    <div v-if="msg.type <= 2">{{ msg.formattedContent }}</div>
                    <div v-else-if="msg.type === 3" class="flex gap-1">
                      <el-image v-if="msg.formattedContent?.[0]" :src="msg.formattedContent[0].fullUrl" :preview-src-list="[msg.formattedContent[0].fullUrl]" fit="cover" class="w-20 h-20 rounded shadow-sm" preview-teleported />
                    </div>
                    <div v-else class="flex items-center gap-2 opacity-70">
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
        <div v-if="loading" class="flex justify-center items-center py-2">
          <el-icon class="is-loading mr-2"><component :is="useRenderIcon(LoadingIcon)" /></el-icon>加载中...
        </div>
        <div v-else-if="!hasMore && groupChats.length > 0">没有更多群聊记录了</div>
      </div>
    </div>

    <!-- Reusable Component -->
    <ChatRecordDialog
      v-model:visible="dialogVisible"
      :chat-id="currentChatId"
      :chat-name="currentChatName"
      :qiniu-domain="qiniuDomain"
      :type="2"
    />
  </div>
</template>

<style lang="scss" scoped>
.message-group-chat-container {
  .custom-search {
    width: 260px;
    :deep(.el-input__wrapper) { background-color: #f7f8fa; border-radius: 12px; height: 40px; box-shadow: none; }
  }
  .border-radius-16 { border-radius: 16px !important; }
  .view-btn { text-decoration: none; color: #0076fe; &:hover { background-color: #eef2ff; } }
  .word-keep-all { word-break: keep-all; }
  .overflow-wrap-anywhere { overflow-wrap: anywhere; }
  .custom-scrollbar { &::-webkit-scrollbar { width: 4px; } &::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; } }
}
</style>