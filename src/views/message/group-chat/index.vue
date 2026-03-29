<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getChatList, getQiNiuDomain } from "@/api/user";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ChatRecordDialog from "../components/ChatRecordDialog.vue";
import ViewIcon from "~icons/ri/chat-search-line";
import LoadingIcon from "~icons/ep/loading";
import UserIcon from "~icons/ri/user-line";

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

const dialogVisible = ref(false);
const currentChatId = ref("");
const currentChatName = ref("");

const playingMsgId = ref<string | number | null>(null);
let currentAudio: HTMLAudioElement | null = null;


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

const playAudio = (msg: any) => {
  const url = msg.formattedContent.audioUrl;
  if (!url) return;

  if (currentAudio) {
    currentAudio.pause();
    if (playingMsgId.value === msg.id) {
      playingMsgId.value = null;
      currentAudio = null;
      return;
    }
  }

  const audio = new Audio(url);
  currentAudio = audio;
  playingMsgId.value = msg.id;

  audio.play().catch(e => {
    console.error("Audio play failed:", e);
    playingMsgId.value = null;
  });

  audio.onended = () => {
    playingMsgId.value = null;
    currentAudio = null;
  };
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
      // 头部信息解析
      const groupIcon = getUrl(item.icon);
      const groupName = item.name || "未命名群聊";
      const peopleCount = item.peopleNum || 0;
      const ownerName = item.managerUsers?.[0]?.name || "未知创建者";

      item.imMessageList = (item.imMessageList || []).reverse().map((msg: any) => {
        let parsed: any = { msgType: 1, content: msg.content };
        try { parsed = JSON.parse(msg.content); } catch (e) {}
        const mType = Number(parsed.msgType);
        let displayContent = parsed.content;

        if (mType === 3) {
          const imgs = Array.isArray(parsed.content) ? parsed.content : [parsed.content];
          displayContent = imgs.map((img: any) => ({ ...img, fullUrl: getUrl(img.url) }));
        } else if (mType === 4) {
          const videoData = typeof parsed.content === "object" ? parsed.content : {};
          displayContent = {
            ...videoData,
            videoUrl: getUrl(videoData.videoUrl || parsed.videoUrl),
            coverUrl: getUrl(videoData.imgUrl || parsed.url)
          };
        } else if (mType === 5) {
          const audioData = typeof parsed.content === "object" ? parsed.content : {};
          displayContent = {
            ...audioData,
            audioUrl: getUrl(audioData.url || parsed.url)
          };
        }


        return {
          ...msg,
          type: mType,
          formattedContent: displayContent,
          side: "left", // 群聊展示列表统一靠左
          time: msg.createTime
        };
      });

      return {
        ...item,
        displayInfo: {
          icon: groupIcon,
          name: groupName,
          peopleNum: peopleCount,
          owner: ownerName
        }
      };
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
  currentChatName.value = room.displayInfo.name;
  dialogVisible.value = true;
};
</script>

<template>
  <div class="message-group-chat-container p-4">
    <el-card shadow="never" class="filter-card mb-4 border-none border-radius-16">
      <div class="flex items-center gap-8 px-2">
        <div class="flex items-center">
          <span class="mr-4 text-sm text-gray-600">用户</span>
          <el-input
            v-model="userQuery"
            placeholder="群名/用户名"
            clearable
            class="search-input"
            @clear="fetchList(false)"
            @keyup.enter="fetchList(false)"
          />
        </div>
        <el-button type="primary" class="query-btn px-8" @click="fetchList(false)">查询</el-button>
      </div>
    </el-card>

    <div
      v-infinite-scroll="loadMore"
      :infinite-scroll-disabled="!hasMore || loading"
      :infinite-scroll-distance="200"
      class="rooms-wrapper px-2"
    >
      <el-row :gutter="24">
        <el-col v-for="room in groupChats" :key="room.id" :xs="24" :sm="12" :lg="8" class="mb-6">
          <el-card shadow="never" class="chat-card border-none border-radius-16 overflow-hidden">
            <!-- Simplified Header (Matching Single Chat Style) -->
            <div class="chat-header flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-4 mx-1">
              <div class="flex items-center gap-3 overflow-hidden flex-1">
                <el-image :src="room.displayInfo.icon" class="w-10 h-10 rounded-lg bg-white shadow-sm shrink-0" fit="cover">
                  <template #error>
                    <div class="w-full h-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">群</div>
                  </template>
                </el-image>

                <div class="header-info overflow-hidden">
                  <div class="owner-name text-[15px] font-bold text-gray-800 truncate">{{ room.displayInfo.owner }}</div>
                  <div class="group-meta flex items-center gap-2 text-gray-400 text-xs">
                    <span class="truncate max-w-[100px]">{{ room.displayInfo.name }}</span>
                    <div class="flex items-center gap-1 shrink-0">
                      <component :is="renderIcon(UserIcon)" class="text-[10px]" />
                      <span>{{ room.displayInfo.peopleNum }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <el-button 
                link 
                type="primary" 
                class="view-btn flex items-center bg-blue-50 px-3 py-1.5 rounded-full shrink-0" 
                @click="openChatDialog(room)"
              >
                <component :is="renderIcon(ViewIcon)" class="mr-1 text-sm" />
                <span class="text-sm">详情</span>
              </el-button>
            </div>

            <!-- Content Area -->
            <div class="chat-logs-container custom-scrollbar h-[350px] p-6 bg-white overflow-y-auto">
              <div v-for="(msg, msgIdx) in room.imMessageList" :key="msgIdx" class="msg-item mb-6 flex gap-3 items-start">
                <el-avatar :src="msg.sendUserIcon" :size="38" class="shrink-0 rounded-full shadow-sm" />
                <div class="flex-1 overflow-hidden">
                  <div class="sender-name text-xs text-gray-400 mb-1.5">{{ msg.sendUserName }}</div>
                  <div class="bubble-mini text-sm text-gray-700 leading-relaxed word-break-all whitespace-pre-wrap">
                    <template v-if="msg.type <= 2">{{ msg.formattedContent }}</template>
                    <div v-else-if="msg.type === 3" class="flex gap-1">
                      <el-image v-if="msg.formattedContent?.[0]" :src="msg.formattedContent[0].fullUrl" :preview-src-list="[msg.formattedContent[0].fullUrl]" fit="cover" class="w-24 h-24 rounded-lg shadow-sm" preview-teleported />
                    </div>
                    <div v-else-if="msg.type === 4" class="max-w-[180px]">
                      <video
                        :src="msg.formattedContent.videoUrl"
                        :poster="msg.formattedContent.coverUrl"
                        controls
                        class="w-full rounded shadow-sm"
                      />
                    </div>
                    <div
                      v-else-if="msg.type === 5"
                      class="flex items-center gap-3 cursor-pointer p-2 bg-gray-50 rounded-lg transition-all active:scale-95"
                      @click="playAudio(msg)"
                    >
                      <div v-if="playingMsgId === msg.id" class="voice-waves">
                        <div class="wave-bar" />
                        <div class="wave-bar" />
                        <div class="wave-bar" />
                      </div>
                      <template v-else>
                        <component :is="renderIcon('ri:volume-up-fill')" class="text-blue-500" />
                        <span class="text-xs font-bold text-gray-600">{{ msg.formattedContent.duration }}s</span>
                      </template>
                    </div>

                    <div v-else class="flex items-center gap-2 text-gray-400 bg-gray-50 px-3 py-2 rounded-lg w-fit">
                      <component :is="renderIcon('ri:chat-3-line')" />
                      <span>未知消息</span>
                    </div>

                  </div>
                  <div class="msg-time text-[10px] text-gray-300 mt-2">{{ msg.time }}</div>
                </div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <div class="scroll-footer py-4 text-center text-gray-400 text-sm">
        <div v-if="loading" class="flex justify-center items-center py-2">
          <el-icon class="is-loading mr-2"><component :is="useRenderIcon(LoadingIcon)" /></el-icon>数据加载中...
        </div>
        <div v-else-if="!hasMore && groupChats.length > 0">已加载全部历史记录</div>
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
    transition: transform 0.2s;
    &:hover { transform: translateY(-2px); }
  }

  .view-btn-new {
    transition: all 0.2s;
    &:active { transform: translateY(-50%) scale(0.95); }
  }

  .custom-scrollbar {
    &::-webkit-scrollbar { width: 4px; }
    &::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
  }

  .word-break-all { word-break: break-all; }

  .voice-waves {
    display: flex;
    align-items: center;
    gap: 3px;
    height: 14px;
    .wave-bar {
      width: 2.5px;
      height: 100%;
      background: #3b82f6;
      border-radius: 1px;
      animation: wave-breath 0.8s ease-in-out infinite;
      &:nth-child(2) { animation-delay: 0.15s; height: 70%; }
      &:nth-child(3) { animation-delay: 0.3s; height: 50%; }
    }
  }

  @keyframes wave-breath {
    0%, 100% { height: 4px; }
    50% { height: 14px; }
  }
}

</style>