<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getChatList, getChatRecord } from "@/api/user";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ViewIcon from "~icons/ep/chat-dot-round";
import RefreshIcon from "~icons/ep/refresh";
import CloseIcon from "~icons/ep/close";
import LoadingIcon from "~icons/ep/loading";

defineOptions({
  name: "MessageSingle"
});

// 确保模板可以访问到渲染函数
const renderIcon = useRenderIcon;

const userQuery = ref("");
const dialogVisible = ref(false);
const loading = ref(false);
const pageNo = ref(1);
const pageSize = ref(20);
const hasMore = ref(true);
const chatRooms = ref([]);

// 详情页状态
const detailLoading = ref(false);
const detailPageNo = ref(1);
const detailPageSize = ref(20);
const detailHasMore = ref(true);
const detailMessages = ref([]);
const currentChatId = ref("");
const currentChatName = ref("");

const fetchList = async (isAppend = false) => {
  if (loading.value) return;
  if (!isAppend) {
    loading.value = true;
    pageNo.value = 1;
    hasMore.value = true;
  }
  try {
    const { data } = await getChatList({
      type: 1, // 单聊
      userName: userQuery.value,
      pageNo: pageNo.value,
      pageSize: pageSize.value
    });

    const list = Array.isArray(data) ? data : data?.list || [];
    if (list.length < pageSize.value) {
      hasMore.value = false;
    }

    const mapped = list.map((item: any) => {
      const userA = item.managerUsers?.[0] || {};
      const userB = item.managerUsers?.[1] || userA;

      return {
        id: item.id,
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
        messages: (item.imMessageList || [])
          .slice()
          .reverse()
          .map((msg: any, index: number) => {
            let actualContent = msg.content;
            try {
              const parsed = JSON.parse(msg.content);
              actualContent = parsed.content || parsed.text || msg.content;
            } catch (e) {
              /* Keep original */
            }
            return {
              text: actualContent,
              time: msg.createTime,
              side: index % 2 === 0 ? "left" : "right"
            };
          })
      };
    });

    if (isAppend) {
      chatRooms.value.push(...mapped);
    } else {
      chatRooms.value = mapped;
    }
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
});

const handleQuery = () => {
  fetchList(false);
};

// 获取详情列表
const fetchDetail = async (isAppend = false) => {
  if (detailLoading.value || !currentChatId.value) return;
  if (!isAppend) {
    detailLoading.value = true;
    detailPageNo.value = 1;
    detailHasMore.value = true;
    detailMessages.value = [];
  }

  try {
    const res = await getChatRecord({
      chatId: currentChatId.value,
      pageNo: detailPageNo.value,
      pageSize: detailPageSize.value
    });

    const { data, code } = res as any;

    // 如果接口返回非成功状态，停止加载
    if (code !== "0000") {
      detailHasMore.value = false;
      return;
    }

    const list = Array.isArray(data) ? data : data?.list || [];
    if (list.length < detailPageSize.value) {
      detailHasMore.value = false;
    }

    const mapped = list.map((msg: any, index: number) => {
      let actualContent = msg.content;
      try {
        const parsed = JSON.parse(msg.content);
        actualContent = parsed.content || parsed.text || msg.content;
      } catch (e) {
        /* Plain text */
      }
      return {
        nickname: msg.sendUserName || "用户",
        avatar: msg.sendUserIcon || "",
        side: msg.sendId === currentChatId.value ? "right" : "left", // 这里逻辑可根据实际返回调整，暂时交替或固定
        type: "text", // 暂时默认为 text
        content: actualContent,
        time: msg.createTime
      };
    });

    if (isAppend) {
      detailMessages.value.push(...mapped);
    } else {
      detailMessages.value = mapped;
    }
  } catch (error) {
    console.error("Fetch chat records failed:", error);
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
  currentChatId.value = room.id;
  currentChatName.value = `${room.userA.nickname} 与 ${room.userB.nickname}`;
  dialogVisible.value = true;
  fetchDetail(false);
};
</script>

<template>
  <div
    class="message-single-container p-4"
    v-infinite-scroll="loadMore"
    :infinite-scroll-disabled="!hasMore || loading"
    :infinite-scroll-distance="200"
  >
    <el-card
      shadow="never"
      class="filter-card mb-4 border-none border-radius-16"
    >
      <div class="flex items-center gap-8">
        <div class="flex items-center">
          <span class="mr-4 text-sm text-gray-600 whitespace-nowrap">用户</span>
          <el-input
            v-model="userQuery"
            placeholder="昵称/ID"
            class="search-input"
            clearable
          />
        </div>
        <el-button type="primary" class="query-btn px-8" @click="handleQuery"
          >查询</el-button
        >
      </div>
    </el-card>

    <el-row v-loading="loading" :gutter="16">
      <el-col
        v-for="room in chatRooms"
        :key="room.id"
        :xs="24"
        :sm="12"
        :lg="8"
        class="mb-4"
      >
        <el-card shadow="never" class="chat-card border-none border-radius-16">
          <div
            class="chat-header flex items-center justify-between p-4 bg-gray-50 border-radius-12 mb-4"
          >
            <!-- User A -->
            <div class="flex items-center">
              <div class="avatar-circle mr-2 bg-blue-500 text-white">
                {{ room.userA.avatarInitial }}
              </div>
              <div class="user-info">
                <div class="nickname text-sm font-bold text-gray-800">
                  {{ room.userA.nickname }}
                </div>
                <div class="uid text-xs text-gray-400">
                  UID:{{ room.userA.uid }}
                </div>
              </div>
            </div>

            <!-- View Action -->
            <div class="view-session flex flex-col items-center">
              <el-button
                link
                type="primary"
                class="view-btn flex items-center bg-blue-50 px-3 py-1 border-radius-20"
                @click="openChatDialog(room)"
              >
                <component :is="useRenderIcon(ViewIcon)" class="mr-1 text-sm" />
                <span class="text-xs">查看会话</span>
              </el-button>
            </div>

            <!-- User B -->
            <div class="flex items-center text-right">
              <div class="user-info mr-2">
                <div class="nickname text-sm font-bold text-gray-800">
                  {{ room.userB.nickname }}
                </div>
                <div class="uid text-xs text-gray-400">
                  UID:{{ room.userB.uid }}
                </div>
              </div>
              <div class="avatar-circle bg-blue-500 text-white">
                {{ room.userB.avatarInitial }}
              </div>
            </div>
          </div>

          <!-- Card Logs Scroll Area -->
          <div class="chat-logs-container custom-scrollbar card-logs-area">
            <div
              v-for="(msg, index) in room.messages"
              :key="index"
              :class="[
                'msg-item mb-4 flex',
                msg.side === 'right' ? 'justify-end' : 'justify-start'
              ]"
            >
              <div
                :class="[
                  'msg-inner max-w-[90%]',
                  msg.side === 'right' ? 'text-right' : 'text-left'
                ]"
              >
                <div
                  :class="[
                    'msg-text text-sm py-3 px-4 rounded-xl shadow-sm leading-relaxed min-w-[80px]',
                    msg.side === 'left'
                      ? 'bg-gray-100 text-gray-700 rounded-tl-none text-left'
                      : 'bg-blue-500 text-white rounded-tr-none text-right'
                  ]"
                >
                  {{ msg.text }}
                </div>
                <div class="msg-time text-[10px] text-gray-300 mt-1">
                  {{ msg.time }}
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Loading Footer -->
    <div class="scroll-footer py-4 text-center text-gray-400 text-sm">
      <div
        v-if="loading && chatRooms.length > 0"
        class="flex justify-center items-center py-2"
      >
        <el-icon class="is-loading mr-2"
          ><component :is="useRenderIcon(LoadingIcon)"
        /></el-icon>
        加载中...
      </div>
      <div v-else-if="!hasMore && chatRooms.length > 0">没有更多了</div>
      <div v-else-if="chatRooms.length === 0 && !loading">暂无记录</div>
    </div>

    <!-- Chat Details Dialog -->
    <el-dialog
      v-model="dialogVisible"
      width="800px"
      align-center
      class="custom-dialog chat-detail-dialog"
      :show-close="false"
    >
      <template #header="{ close }">
        <div class="custom-header flex items-center justify-between px-6 py-4">
          <span class="text-base font-bold text-gray-800">{{ currentChatName }}</span>
          <div class="header-actions flex items-center gap-4">
            <el-button
              link
              class="action-btn refresh-btn"
              @click="fetchDetail(false)"
            >
              <component :is="useRenderIcon(RefreshIcon)" class="text-xl" />
            </el-button>
            <el-button link class="action-btn close-btn" @click="close">
              <component :is="useRenderIcon(CloseIcon)" class="text-2xl" />
            </el-button>
          </div>
        </div>
      </template>
      <div 
        class="chat-detail-content custom-scrollbar"
        v-infinite-scroll="loadMoreDetail"
        :infinite-scroll-disabled="!detailHasMore || detailLoading"
        :infinite-scroll-distance="20"
      >
        <div
          v-for="(msg, idx) in detailMessages"
          :key="idx"
          :class="[
            'detail-msg-row mb-6 flex',
            msg.side === 'right' ? 'justify-end' : 'justify-start'
          ]"
        >
          <!-- Left Avatar Case -->
          <el-avatar
            v-if="msg.side === 'left'"
            :src="msg.avatar"
            :size="40"
            class="mr-3 shrink-0"
          />

          <div
            :class="[
              'msg-body-wrapper',
              msg.side === 'right'
                ? 'text-right items-end'
                : 'text-left items-start',
              'flex flex-col'
            ]"
          >
            <div class="nickname text-xs text-gray-400 mb-1">
              {{ msg.nickname }}
            </div>

            <!-- Text Bubble -->
            <div
              v-if="msg.type === 'text'"
              :class="[
                'bubble-content p-3 text-sm shadow-sm',
                msg.side === 'left'
                  ? 'bg-white rounded-r-xl rounded-bl-xl'
                  : 'bg-blue-500 text-white rounded-l-xl rounded-br-xl'
              ]"
            >
              {{ msg.content }}
            </div>

            <div class="time text-xs text-gray-300 mt-2">{{ msg.time }}</div>
          </div>

          <!-- Right Avatar Case -->
          <el-avatar
            v-if="msg.side === 'right'"
            :src="msg.avatar"
            :size="40"
            class="ml-3 shrink-0"
          />
        </div>

        <!-- Detail Loading Footer -->
        <div class="scroll-footer py-2 text-center text-gray-400 text-[12px]">
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
.message-single-container {
  background: transparent;
  width: 100%;
  height: calc(100vh - 84px); // 减去顶部导航栏高度
  overflow-y: auto;
  min-height: 100%;
  padding: 20px;

  .border-radius-16 {
    border-radius: 16px !important;
  }

  .border-radius-12 {
    border-radius: 12px !important;
  }

  .border-radius-20 {
    border-radius: 20px !important;
  }

  .filter-card {
    :deep(.el-card__body) {
      padding: 20px 24px;
    }

    .search-input {
      width: 220px;
      :deep(.el-input__wrapper) {
        background-color: #f7f8fa;
        box-shadow: none;
        border-radius: 8px;
        height: 40px;
      }
    }

    .query-btn {
      height: 40px;
      border-radius: 8px;
      background-color: #0076fe;
      border: none;
    }
  }

  .chat-card {
    height: 460px;
    display: flex;
    flex-direction: column;

    :deep(.el-card__body) {
      padding: 12px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .chat-header {
      flex-shrink: 0;

      .avatar-circle {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
      }

      .view-btn {
        color: #0076fe;
        font-weight: 500;

        &:hover {
          opacity: 0.8;
          background-color: #eef2ff;
        }
      }
    }

    .chat-logs-container {
      flex: 1;
      overflow-y: auto;
      padding: 0 4px;

      .msg-item {
        &:last-child {
          margin-bottom: 0;
        }
      }
    }
  }
}

/* Custom Scrollbar for Chat Logs */
.custom-scrollbar {
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #f0f0f0;
    border-radius: 10px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
}

/* Chat Detail Dialog Styles */
:deep(.chat-detail-dialog) {
  border-radius: 24px;
  background-color: #f8f9fb;

  .el-dialog__header {
    margin-right: 0;
    padding: 0;
    border-bottom: 1px solid #f1f3f5;
  }

  .custom-header {
    .action-btn {
      padding: 0;
      color: #909399;
      transition: all 0.3s;

      &:hover {
        color: #0076fe;
        transform: scale(1.1);
      }

      &.close-btn:hover {
        color: #ef4444;
      }
    }
  }

  .el-dialog__body {
    padding: 24px;
    background-color: #f8f9fb;
  }

  .chat-detail-content {
    max-height: 500px;
    overflow-y: auto;
    padding-right: 10px;
  }

  .bubble-content {
    display: inline-block;
    max-width: 80%;
    word-break: break-all;
  }
}
</style>
