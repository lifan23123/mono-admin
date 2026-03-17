<script setup lang="ts">
import { ref } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import SearchIcon from "~icons/ep/search";
import ViewIcon from "~icons/ep/chat-dot-round";
import RefreshIcon from "~icons/ep/refresh";
import CloseIcon from "~icons/ep/close";

defineOptions({
  name: "MessageSingle"
});

const userQuery = ref("");
const contentQuery = ref("");
const dialogVisible = ref(false);

const chatRooms = ref(
  Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    userA: {
      nickname: "admin01",
      uid: "100312",
      avatarInitial: "王"
    },
    userB: {
      nickname: "admin01",
      uid: "100312",
      avatarInitial: "王"
    },
    messages: [
      {
        text: "我通过了你的朋友验证请求，现在我们可以开始聊天了",
        time: "2026-03-11 13:44:08"
      },
      {
        text: "东北图牛潘图图",
        time: "2026-03-11 13:44:08"
      },
      {
        text: "今天天气不错，适合出去走走。",
        time: "2026-03-11 14:00:25"
      },
      {
        text: "好的，那我们下午三点见？",
        time: "2026-03-11 14:05:12"
      }
    ]
  }))
);

const handleQuery = () => {
  console.log("Querying with:", userQuery.value, contentQuery.value);
};

const detailMessages = ref([
  {
    side: "left",
    nickname: "看看",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky",
    type: "text",
    content: "东北图牛潘图图",
    time: "11:39"
  },
  {
    side: "left",
    nickname: "看看",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucky",
    type: "image",
    content: "https://picsum.photos/400/600",
    caption: "东北图牛潘图图东北图牛潘图图",
    time: "11:39"
  },
  {
    side: "right",
    nickname: "呆呆",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    type: "text",
    content: "好的，收到了！",
    time: "11:40"
  }
]);

const openChatDialog = (room: any) => {
  console.log("Opening chat for room:", room.id);
  dialogVisible.value = true;
};
</script>

<template>
  <div class="message-single-container p-4">
    <el-card shadow="never" class="filter-card mb-4 border-none border-radius-16">
      <div class="flex items-center justify-between">
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
          <div class="flex items-center">
            <span class="mr-4 text-sm text-gray-600 whitespace-nowrap">聊天内容</span>
            <el-input
              v-model="contentQuery"
              placeholder="昵称/ID"
              class="search-input"
              clearable
            />
          </div>
        </div>
        <el-button type="primary" class="query-btn px-8" @click="handleQuery">查询</el-button>
      </div>
    </el-card>

    <el-row :gutter="16">
      <el-col 
        v-for="room in chatRooms" 
        :key="room.id" 
        :xs="24" :sm="12" :lg="8"
        class="mb-4"
      >
        <el-card shadow="never" class="chat-card border-none border-radius-16">
          <div class="chat-header flex items-center justify-between p-4 bg-gray-50 border-radius-12 mb-4">
            <!-- User A -->
            <div class="flex items-center">
              <div class="avatar-circle mr-2 bg-blue-500 text-white">
                {{ room.userA.avatarInitial }}
              </div>
              <div class="user-info">
                <div class="nickname text-sm font-bold text-gray-800">{{ room.userA.nickname }}</div>
                <div class="uid text-xs text-gray-400">UID:{{ room.userA.uid }}</div>
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
                <div class="nickname text-sm font-bold text-gray-800">{{ room.userB.nickname }}</div>
                <div class="uid text-xs text-gray-400">UID:{{ room.userB.uid }}</div>
              </div>
              <div class="avatar-circle bg-blue-500 text-white">
                {{ room.userB.avatarInitial }}
              </div>
            </div>
          </div>

          <div class="chat-logs-container custom-scrollbar">
            <div v-for="(msg, index) in room.messages" :key="index" class="msg-item mb-4">
              <div class="msg-text text-sm text-gray-700 mb-1 leading-relaxed">
                {{ msg.text }}
              </div>
              <div class="msg-time text-xs text-gray-300">
                {{ msg.time }}
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

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
          <span class="text-base font-bold text-gray-800">看看与呆呆的会话</span>
          <div class="header-actions flex items-center gap-4">
            <el-button 
              link 
              class="action-btn refresh-btn" 
              @click="console.log('Refreshing...')"
            >
              <component :is="useRenderIcon(RefreshIcon)" class="text-xl" />
            </el-button>
            <el-button 
              link 
              class="action-btn close-btn" 
              @click="close"
            >
              <component :is="useRenderIcon(CloseIcon)" class="text-2xl" />
            </el-button>
          </div>
        </div>
      </template>
      <div class="chat-detail-content custom-scrollbar">
        <div 
          v-for="(msg, idx) in detailMessages" 
          :key="idx" 
          :class="['detail-msg-row mb-6 flex', msg.side === 'right' ? 'justify-end' : 'justify-start']"
        >
          <!-- Left Avatar Case -->
          <el-avatar v-if="msg.side === 'left'" :src="msg.avatar" :size="40" class="mr-3 shrink-0" />
          
          <div :class="['msg-body-wrapper', msg.side === 'right' ? 'text-right items-end' : 'text-left items-start', 'flex flex-col']">
            <div class="nickname text-xs text-gray-400 mb-1">{{ msg.nickname }}</div>
            
            <!-- Text Bubble -->
            <div v-if="msg.type === 'text'" :class="['bubble-content p-3 text-sm shadow-sm', msg.side === 'left' ? 'bg-white rounded-r-xl rounded-bl-xl' : 'bg-blue-500 text-white rounded-l-xl rounded-br-xl']">
              {{ msg.content }}
            </div>

            <!-- Image Bubble -->
            <div v-if="msg.type === 'image'" class="image-bubble bg-white p-1 rounded-xl shadow-sm overflow-hidden" style="max-width: 260px;">
              <el-image 
                :src="msg.content" 
                fit="cover" 
                class="w-full rounded-lg mb-2" 
                :preview-src-list="[msg.content]"
              />
              <div class="image-caption px-2 pb-1 text-xs text-gray-700 leading-snug">
                {{ msg.caption }}
              </div>
            </div>

            <div class="time text-xs text-gray-300 mt-2">{{ msg.time }}</div>
          </div>

          <!-- Right Avatar Case -->
          <el-avatar v-if="msg.side === 'right'" :src="msg.avatar" :size="40" class="ml-3 shrink-0" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.message-single-container {
  background: transparent;
  width: 100%;
  min-height: 100%;

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
    height: 420px;
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
