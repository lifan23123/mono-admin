<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import { getChatList, getChatRecord, getQiNiuDomain } from "@/api/user";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ViewIcon from "~icons/ep/chat-dot-round";
import RefreshIcon from "~icons/ep/refresh";
import CloseIcon from "~icons/ep/close";
import LoadingIcon from "~icons/ep/loading";

defineOptions({
  name: "MessageGroupChat"
});

const qiniuDomain = ref("");
const userQuery = ref("");
const renderIcon = useRenderIcon;
const dialogVisible = ref(false);
const loading = ref(false);
const pageNo = ref(1);
const pageSize = ref(20);
const hasMore = ref(true);
const groupChats = ref([]);

const fetchQiNiuDomain = async () => {
  try {
    const res = await getQiNiuDomain();
    const { data } = res as any;
    if (data) {
      qiniuDomain.value = data;
    }
  } catch (error) {
    console.error("Failed to fetch QiNiu domain:", error);
  }
};

// 详情页状态
const detailLoading = ref(false);
const detailPageNo = ref(1);
const detailPageSize = ref(20);
const detailHasMore = ref(true);
const detailMessages = ref([]);
const currentChatId = ref("");
const currentChatName = ref("");

// 维护用户名与左右边位的映射 (ID 为 key)
const nameSideMap = new Map<any, "left" | "right">();
let lastAssignedSide: "left" | "right" = "right";

const playAudio = (url: string) => {
  if (!url) return;
  const audio = new Audio(url);
  audio.play().catch(e => {
    console.error("Audio play failed:", e);
  });
};

// 获取聊天室列表 (Type 2 为群聊)
const fetchList = async (isAppend = false) => {
  if (loading.value) return;
  if (!isAppend) {
    pageNo.value = 1;
    hasMore.value = true;
    groupChats.value = [];
  }
  loading.value = true;

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
    if (list.length < pageSize.value) {
      hasMore.value = false;
    }

    // 处理聊天列表中的每个会话
    const formattedList = list.map(item => {
      if (item.imMessageList) {
        const getPreviewUrl = (path: string) => {
          if (!path || path.startsWith("http")) return path || "";
          let domainBase = "";
          if (typeof qiniuDomain.value === "string") {
            domainBase = qiniuDomain.value;
          } else if (qiniuDomain.value && typeof qiniuDomain.value === "object") {
            domainBase = (qiniuDomain.value as any).url || "";
          }
          const domain = domainBase.replace(/\/$/, "");
          const cleanPath = path.startsWith("/") ? path : `/${path}`;
          return domain + cleanPath;
        };

        item.imMessageList = item.imMessageList.reverse().map((msg: any) => {
          let parsed: any = { msgType: 1, content: msg.content };
          try {
            parsed = JSON.parse(msg.content);
          } catch (e) {}

          const mType = Number(parsed.msgType);
          let displayContent = parsed.content;

          if (mType === 3) {
            const imgs = Array.isArray(parsed.content) ? parsed.content : [parsed.content];
            displayContent = imgs.map((img: any) => ({ ...img, fullUrl: getPreviewUrl(img.url) }));
          } else if (mType === 4) {
            displayContent = { ...parsed, videoUrl: getPreviewUrl(parsed.videoUrl), coverUrl: getPreviewUrl(parsed.url) };
          } else if (mType === 5) {
            displayContent = { ...parsed, audioUrl: getPreviewUrl(parsed.url) };
          }

          return { ...msg, type: mType, formattedContent: displayContent };
        });
      }
      return item;
    });

    if (isAppend) {
      groupChats.value.push(...formattedList);
    } else {
      groupChats.value = formattedList;
    }
  } catch (error) {
    console.error("Fetch group chat list failed:", error);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => {
  if (loading.value || !hasMore.value) return;
  pageNo.value++;
  fetchList(true);
};

// 获取会话详情
const fetchDetail = async (isAppend = false) => {
  if (detailLoading.value || !currentChatId.value) return;
  if (!isAppend) {
    detailLoading.value = true;
    detailPageNo.value = 1;
    detailHasMore.value = true;
    detailMessages.value = [];
    nameSideMap.clear();
    lastAssignedSide = "right";
  }

  try {
    const res = await getChatRecord({
      chatId: currentChatId.value,
      pageNo: detailPageNo.value,
      pageSize: detailPageSize.value
    });

    const { data, code } = res as any;
    if (code !== "0000") {
      detailHasMore.value = false;
      return;
    }

    const list = Array.isArray(data) ? data : data?.list || [];
    if (list.length < detailPageSize.value) {
      detailHasMore.value = false;
    }

    const getUrl = (path: string) => {
      if (!path || path.startsWith("http")) return path || "";
      let domainBase = "";
      if (typeof qiniuDomain.value === "string") domainBase = qiniuDomain.value;
      else if (qiniuDomain.value && typeof qiniuDomain.value === "object") domainBase = (qiniuDomain.value as any).url || "";
      const domain = domainBase.replace(/\/$/, "");
      const cleanPath = path.startsWith("/") ? path : `/${path}`;
      return domain + cleanPath;
    };

    const mapped = [...list].reverse().map((msg: any) => {
      let parsed: any = { msgType: 1, content: msg.content };
      try { parsed = JSON.parse(msg.content); } catch (e) {}

      const mType = Number(parsed.msgType);
      let displayContent: any = parsed.content;

      if (mType === 3) {
        const imgs = Array.isArray(parsed.content) ? parsed.content : [parsed.content];
        displayContent = imgs.map((img: any) => ({ ...img, fullUrl: getUrl(img.url) }));
      } else if (mType === 4) {
        displayContent = { ...parsed, videoUrl: getUrl(parsed.videoUrl), coverUrl: getUrl(parsed.url) };
      } else if (mType === 5) {
        displayContent = { ...parsed, audioUrl: getUrl(parsed.url) };
      }

      const userId = msg.sendId;
      if (!nameSideMap.has(userId)) {
        const side = lastAssignedSide === "left" ? "right" : "left";
        nameSideMap.set(userId, side);
        lastAssignedSide = side;
      }

      return {
        id: msg.id,
        nickname: msg.sendUserName || "用户",
        avatar: msg.sendUserIcon || "",
        side: nameSideMap.get(userId),
        type: mType,
        content: displayContent,
        time: msg.createTime
      };
    });

    if (isAppend) {
      detailMessages.value = [...mapped, ...detailMessages.value];
    } else {
      detailMessages.value = mapped;
      nextTick(() => {
        const container = document.querySelector(".chat-detail-content");
        if (container) container.scrollTop = container.scrollHeight;
      });
    }
  } catch (error) {
    console.error("Fetch group chat records failed:", error);
  } finally {
    detailLoading.value = false;
  }
};

const loadMoreDetail = () => {
  if (detailLoading.value || !detailHasMore.value) return;
  detailPageNo.value++;
  fetchDetail(true);
};

const openChatDialog = (room: any) => {
  currentChatId.value = room.chatId;
  const userA = room.managerUsers?.[0]?.name || "群成员";
  const userB = room.managerUsers?.[1]?.name || "";
  currentChatName.value = userB ? `${userA} 与 ${userB}` : userA;
  dialogVisible.value = true;
  fetchDetail(false);
};

onMounted(() => {
  fetchQiNiuDomain();
  fetchList();
});

const handleQuery = () => {
  fetchList(false);
};
</script>

<template>
  <div class="message-group-chat-container p-4">
    <div class="search-section mb-6 flex justify-between items-center px-2">
      <div class="flex gap-4">
        <el-input
          v-model="userQuery"
          placeholder="搜索群聊用户/群名"
          clearable
          class="custom-search"
          @clear="handleQuery"
          @keyup.enter="handleQuery"
        />
        <el-button type="primary" class="query-btn" @click="handleQuery">查询</el-button>
      </div>
    </div>

    <!-- Group Chat List -->
    <div
      v-infinite-scroll="loadMore"
      :infinite-scroll-disabled="!hasMore || loading"
      :infinite-scroll-distance="100"
      class="rooms-scroll-wrapper"
    >
      <el-row :gutter="20">
        <el-col
          v-for="(room, index) in groupChats"
          :key="index"
          :xs="24"
          :sm="12"
          :lg="8"
          class="mb-6"
        >
          <el-card shadow="hover" class="chat-card border-none border-radius-16">
            <div class="chat-header flex justify-between items-center mb-4">
              <div class="users-info flex items-center gap-3">
                <div class="user-stack flex -space-x-2">
                  <el-avatar
                    v-for="(u, idx) in room.managerUsers?.slice(0, 2)"
                    :key="idx"
                    :src="u.icon"
                    :size="36"
                    class="border-2 border-white"
                  />
                </div>
                <div class="names text-sm font-bold text-gray-800">
                  {{ room.managerUsers?.[0]?.name || '群成员' }}
                  <span v-if="room.managerUsers?.[1]" class="mx-1 text-gray-400">&</span>
                  {{ room.managerUsers?.[1]?.name }}
                </div>
              </div>
              <el-button
                link
                type="primary"
                class="view-btn flex items-center gap-1"
                @click="openChatDialog(room)"
              >
                <component :is="useRenderIcon(ViewIcon)" />
                查看会话
              </el-button>
            </div>

            <!-- Message Preview -->
            <div class="chat-logs-container custom-scrollbar h-[350px] bg-gray-50/50 p-3 rounded-xl overflow-y-auto">
              <div
                v-for="(msg, msgIdx) in room.imMessageList"
                :key="msgIdx"
                :class="[
                  'msg-inner w-full mb-4',
                  msg.sendId === room.managerUsers?.[0]?.id ? 'text-left' : 'text-right'
                ]"
              >
                <div
                  :class="[
                    'bubble p-3 text-sm rounded-xl shadow-sm leading-relaxed max-w-[95%] w-fit inline-block text-left whitespace-pre-wrap break-normal overflow-wrap-anywhere',
                    msg.sendId === room.managerUsers?.[0]?.id ? 'ml-1' : 'float-right mr-1',
                    msg.sendId === room.managerUsers?.[0]?.id ? 'bg-white text-gray-800' : 'bg-blue-500 text-white'
                  ]"
                >
                  <div v-if="msg.type === 1 || msg.type === 2">{{ msg.formattedContent }}</div>
                  <div v-else-if="msg.type === 3" class="flex gap-1">
                    <el-image
                      v-if="msg.formattedContent?.[0]"
                      :src="msg.formattedContent[0].fullUrl"
                      :preview-src-list="[msg.formattedContent[0].fullUrl]"
                      fit="cover"
                      class="w-16 h-16 rounded cursor-pointer"
                      preview-teleported
                    />
                  </div>
                  <div v-else-if="msg.type === 4" class="flex items-center gap-1">
                    <component :is="useRenderIcon('ri:video-fill')" class="text-lg" />
                    <span>视频</span>
                  </div>
                  <div v-else-if="msg.type === 5" class="flex items-center gap-1">
                    <component :is="useRenderIcon('ri:volume-up-fill')" class="text-lg" />
                    <span>{{ msg.formattedContent.duration }}s 语音</span>
                  </div>
                </div>
                <div class="w-full clear-both"></div>
                <span class="text-[10px] text-gray-400 mt-1 px-1 inline-block">{{ msg.createTime }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Loading State -->
      <div class="scroll-footer py-2 text-center text-gray-400 text-sm">
        <div v-if="loading" class="flex justify-center items-center py-2">
          <el-icon class="is-loading mr-2"><component :is="useRenderIcon(LoadingIcon)" /></el-icon>
          加载中...
        </div>
        <div v-else-if="!hasMore && groupChats.length > 0">没有更多群聊记录了</div>
      </div>
    </div>

    <!-- Details Dialog -->
    <el-dialog
      v-model="dialogVisible"
      width="800px"
      align-center
      class="chat-detail-dialog"
      :show-close="false"
    >
      <template #header>
        <div class="custom-header flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <span class="text-base font-bold text-gray-800">{{ currentChatName }}</span>
          <div class="header-actions flex items-center gap-4">
            <el-button link class="action-btn" @click="fetchDetail(false)">
              <component :is="useRenderIcon(RefreshIcon)" class="text-xl" />
            </el-button>
            <el-button link class="action-btn close-btn" @click="dialogVisible = false">
              <component :is="useRenderIcon(CloseIcon)" class="text-xl" />
            </el-button>
          </div>
        </div>
      </template>

      <div
        class="chat-detail-content p-6 h-[500px] overflow-y-auto bg-gray-50/30 custom-scrollbar"
        v-infinite-scroll="loadMoreDetail"
        :infinite-scroll-disabled="!detailHasMore || detailLoading"
      >
        <div
          v-for="(msg, idx) in detailMessages"
          :key="idx"
          class="detail-msg-row mb-6 flex"
          :class="msg.side === 'right' ? 'justify-end' : 'justify-start'"
        >
          <el-avatar v-if="msg.side === 'left'" :src="msg.avatar" :size="40" class="mr-3 shrink-0" />
          <div :class="['flex flex-col', msg.side === 'right' ? 'items-end' : 'items-start']" style="max-width: 85%">
            <span class="text-xs text-gray-400 mb-1">{{ msg.nickname }}</span>
            
            <div
              v-if="msg.type === 1 || msg.type === 2"
              class="bubble-content p-3 text-sm shadow-sm"
              :class="msg.side === 'left' ? 'bg-white rounded-r-xl rounded-bl-xl' : 'bg-blue-500 text-white rounded-l-xl rounded-br-xl'"
            >
              {{ msg.content }}
            </div>

            <div v-else-if="msg.type === 3" class="flex gap-2">
              <el-image
                v-for="(img, i) in msg.content"
                :key="i"
                :src="img.fullUrl"
                :preview-src-list="[img.fullUrl]"
                fit="cover"
                class="rounded-lg w-32 h-32 cursor-pointer shadow-sm hover:opacity-90 transition-opacity"
                preview-teleported
              />
            </div>

            <div v-else-if="msg.type === 4" class="max-w-[320px]">
              <video :src="msg.content.videoUrl" :poster="msg.content.coverUrl" controls class="w-full rounded-lg shadow-sm" />
            </div>

            <div v-else-if="msg.type === 5">
              <div
                class="audio-bubble p-3 rounded-xl shadow-sm flex items-center gap-2 cursor-pointer"
                :class="msg.side === 'left' ? 'bg-white' : 'bg-blue-500 text-white'"
                @click="playAudio(msg.content.audioUrl)"
              >
                <component :is="useRenderIcon('ri:volume-up-fill')" class="text-xl" />
                <span class="text-xs">{{ msg.content.duration }}s</span>
              </div>
            </div>

            <span class="text-xs text-gray-300 mt-2">{{ msg.time }}</span>
          </div>
          <el-avatar v-if="msg.side === 'right'" :src="msg.avatar" :size="40" class="ml-3 shrink-0" />
        </div>

        <div class="scroll-footer py-2 text-center text-gray-400 text-xs">
          <div v-if="detailLoading" class="flex justify-center items-center py-2">
            <el-icon class="is-loading mr-2"><component :is="useRenderIcon(LoadingIcon)" /></el-icon>
            加载历史记录...
          </div>
          <div v-else-if="!detailHasMore && detailMessages.length > 0">没有更多消息了</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.message-group-chat-container {
  .custom-search {
    width: 250px;
    :deep(.el-input__wrapper) {
      background-color: #f7f8fa;
      box-shadow: none;
      border-radius: 8px;
    }
  }

  .border-radius-16 {
    border-radius: 16px !important;
  }

  .view-btn {
    color: #0076fe;
    font-size: 13px;
    &:hover { background-color: #eef2ff; border-radius: 6px; }
  }

  .bubble-content {
    display: inline-block;
    max-width: 100%;
    word-break: normal;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
    line-height: 1.6;
  }

  .custom-scrollbar {
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
  }
}

.overflow-wrap-anywhere {
  overflow-wrap: anywhere;
}

:deep(.chat-detail-dialog) {
  border-radius: 20px;
  overflow: hidden;
  .el-dialog__header { padding: 0; margin-right: 0; }
  .el-dialog__body { padding: 0; }
}
</style>
