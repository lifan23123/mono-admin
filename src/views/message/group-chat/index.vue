<script setup lang="ts">
import { ref } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ViewIcon from "~icons/ep/chat-dot-round";
import RefreshIcon from "~icons/ep/refresh";
import CloseIcon from "~icons/ep/close";
import MembersIcon from "~icons/ep/user";

defineOptions({
  name: "MessageGroupChat"
});

const userQuery = ref("");
const contentQuery = ref("");
const dialogVisible = ref(false);

const groupChats = ref(
  Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    group: {
      name: "admin01",
      desc: "山鸟与鱼不同路",
      members: 22,
      avatarLogo: "王"
    },
    messages: [
      {
        sender: "看看",
        avatarInitial: "王",
        text: "我通过了你的朋友验证请求，现在我们可以开始聊天了",
        time: "2026-03-11 13:44:08"
      },
      {
        sender: "看看",
        avatarInitial: "王",
        text: "东北图牛潘图图",
        time: "2026-03-11 13:44:08"
      }
    ]
  }))
);

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
    content: "https://picsum.photos/400/600?random=1",
    caption: "东北图牛潘图图东北图牛潘图图",
    time: "11:39"
  },
  {
    side: "right",
    nickname: "呆呆",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    type: "text",
    content: "收到，这些资料很有用。",
    time: "11:40"
  }
]);

const handleQuery = () => {
  console.log("Querying with:", userQuery.value, contentQuery.value);
};

const openChatDialog = (room: any) => {
  console.log("Opening group chat for:", room.group.name);
  dialogVisible.value = true;
};
</script>

<template>
  <div class="message-group-chat-container p-4">
    <!-- Filter Card -->
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

    <!-- Chat Grid -->
    <el-row :gutter="16">
      <el-col 
        v-for="room in groupChats" 
        :key="room.id" 
        :xs="24" :sm="12" :lg="8"
        class="mb-4"
      >
        <el-card shadow="never" class="chat-card border-none border-radius-16">
          <!-- Group Header -->
          <div class="chat-header flex items-center justify-between p-4 bg-gray-50 border-radius-12 mb-4">
            <div class="flex items-center flex-1 overflow-hidden">
              <div class="group-avatar-box mr-3 shrink-0 flex items-center justify-center text-blue-500 font-bold bg-white rounded border border-gray-100">
                {{ room.group.avatarLogo }}{{ room.group.avatarLogo }}
              </div>
              <div class="group-info overflow-hidden">
                <div class="name text-sm font-bold text-gray-800 truncate">{{ room.group.name }}</div>
                <div class="flex items-center mt-1">
                  <span class="desc text-xs text-gray-400 truncate mr-3">{{ room.group.desc }}</span>
                  <div class="members-count flex items-center text-gray-400">
                    <component :is="useRenderIcon(MembersIcon)" class="mr-1 text-xs" />
                    <span class="text-xs">{{ room.group.members }}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <el-button 
              link 
              type="primary" 
              class="view-btn flex items-center bg-blue-50 px-3 py-1 border-radius-20 shrink-0 ml-2"
              @click="openChatDialog(room)"
            >
              <component :is="useRenderIcon(ViewIcon)" class="mr-1 text-sm" />
              <span class="text-xs">查看会话</span>
            </el-button>
          </div>

          <!-- Message Logs -->
          <div class="chat-logs-container custom-scrollbar">
            <div v-for="(msg, index) in room.messages" :key="index" class="msg-item flex mb-4">
              <div class="avatar-circle mr-3 shrink-0 bg-blue-500 text-white flex items-center justify-center font-bold text-sm">
                {{ msg.avatarInitial }}
              </div>
              <div class="msg-content overflow-hidden">
                <div class="sender text-xs text-gray-400 mb-1">{{ msg.sender }}</div>
                <div class="text text-sm text-gray-700 leading-relaxed mb-1">{{ msg.text }}</div>
                <div class="time text-xs text-gray-300">{{ msg.time }}</div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Chat Detail Dialog (Same as Single Chat) -->
    <el-dialog
      v-model="dialogVisible"
      width="800px"
      align-center
      class="custom-dialog chat-detail-dialog"
      :show-close="false"
    >
      <template #header="{ close }">
        <div class="custom-header flex items-center justify-between px-6 py-4">
          <span class="text-base font-bold text-gray-800">群聊会话记录</span>
          <div class="header-actions flex items-center gap-4">
            <el-button link class="action-btn refresh-btn">
              <component :is="useRenderIcon(RefreshIcon)" class="text-xl" />
            </el-button>
            <el-button link class="action-btn close-btn" @click="close">
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
          <el-avatar v-if="msg.side === 'left'" :src="msg.avatar" :size="40" class="mr-3 shrink-0" />
          
          <div :class="['msg-body-wrapper', msg.side === 'right' ? 'text-right items-end' : 'text-left items-start', 'flex flex-col']">
            <div class="nickname text-xs text-gray-400 mb-1">{{ msg.nickname }}</div>
            
            <div v-if="msg.type === 'text'" :class="['bubble-content p-3 text-sm shadow-sm', msg.side === 'left' ? 'bg-white rounded-r-xl rounded-bl-xl' : 'bg-blue-500 text-white rounded-l-xl rounded-br-xl']">
              {{ msg.content }}
            </div>

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

          <el-avatar v-if="msg.side === 'right'" :src="msg.avatar" :size="40" class="ml-3 shrink-0" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.message-group-chat-container {
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
      
      .group-avatar-box {
        width: 48px;
        height: 48px;
        font-size: 14px;
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

      .avatar-circle {
        width: 32px;
        height: 32px;
        border-radius: 50%;
      }
    }
  }
}

/* Custom Scrollbar */
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

/* Dialog Styles */
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
      &.close-btn:hover { color: #ef4444; }
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
