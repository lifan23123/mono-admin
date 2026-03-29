<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { getChatRecord } from "@/api/user";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import RefreshIcon from "~icons/ep/refresh";
import CloseIcon from "~icons/ep/close";
import LoadingIcon from "~icons/ep/loading";

const props = defineProps({
  visible: { type: Boolean, default: false },
  chatId: { type: [String, Number], default: "" },
  chatName: { type: String, default: "" },
  type: { type: [String, Number], default: 1 }, // 1: 单聊 (左右), 2: 群聊 (全左)
  qiniuDomain: { type: [String, Object], default: "" }
});

const emit = defineEmits(["update:visible"]);

const loading = ref(false);
const pageNo = ref(1);
const pageSize = ref(100);
const hasMore = ref(true);
const messages = ref([]);
const playingMsgId = ref<string | number | null>(null);
let currentAudio: HTMLAudioElement | null = null;


// 内部维护分侧逻辑 (仅在 type=1 时生效)
const sideMap = new Map<any, "left" | "right">();
let lastSide: "left" | "right" = "right";

const getUrl = (path: string) => {
  if (!path || path.startsWith("http")) return path || "";

  let domainBase = "";
  if (typeof props.qiniuDomain === "string") {
    domainBase = props.qiniuDomain;
  } else if (props.qiniuDomain && typeof props.qiniuDomain === "object") {
    domainBase = (props.qiniuDomain as any).url || "";
  }

  const domain = domainBase.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return domain + cleanPath;
};

const playAudio = (msg: any) => {
  const url = msg.content.audioUrl;
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


const fetchDetail = async (isAppend = false) => {
  if (loading.value || !props.chatId) return;
  if (!isAppend) {
    loading.value = true;
    pageNo.value = 1;
    hasMore.value = true;
    messages.value = [];
    sideMap.clear();
    lastSide = "right";
  }

  try {
    const res = await getChatRecord({
      chatId: props.chatId,
      pageNo: pageNo.value,
      pageSize: pageSize.value
    });

    const { data, code } = res as any;
    if (code !== "0000") {
      hasMore.value = false;
      return;
    }

    const list = Array.isArray(data) ? data : data?.list || [];
    if (list.length < pageSize.value) hasMore.value = false;

    const mapped = [...list].reverse().map((msg: any) => {
      let parsed: any = { msgType: 1, content: msg.content };
      try {
        parsed = JSON.parse(msg.content);
      } catch (e) {}

      const mType = Number(parsed.msgType);
      let displayContent: any = parsed.content;

      if (mType === 3) {
        const imgs = Array.isArray(parsed.content)
          ? parsed.content
          : [parsed.content];
        displayContent = imgs.map((img: any) => ({
          ...img,
          fullUrl: getUrl(img.url)
        }));
      } else if (mType === 4) {
        const videoData =
          typeof parsed.content === "object" ? parsed.content : {};
        displayContent = {
          ...videoData,
          videoUrl: getUrl(videoData.videoUrl || parsed.videoUrl),
          coverUrl: getUrl(videoData.imgUrl || parsed.url)
        };
      } else if (mType === 5) {
        const audioData =
          typeof parsed.content === "object" ? parsed.content : {};
        displayContent = {
          ...audioData,
          audioUrl: getUrl(audioData.url || parsed.url)
        };
      }

      // 布局逻辑判断: type 1 分侧, type 2 统一左侧
      let side: "left" | "right" = "left";
      if (Number(props.type) === 1) {
        const userId = msg.sendId;
        if (!sideMap.has(userId)) {
          const s = lastSide === "left" ? "right" : "left";
          sideMap.set(userId, s);
          lastSide = s;
        }
        side = sideMap.get(userId);
      }

      return {
        id: msg.id,
        nickname: msg.sendUserName || "用户",
        avatar: msg.sendUserIcon || "",
        side,
        type: mType,
        content: displayContent,
        time: msg.createTime
      };
    });

    if (isAppend) {
      messages.value = [...mapped, ...messages.value];
    } else {
      messages.value = mapped;
    }
  } catch (error) {
    console.error("Fetch Detail failed:", error);
  } finally {
    loading.value = false;
  }
};

const loadMore = () => {
  if (loading.value || !hasMore.value) return;
  pageNo.value++;
  fetchDetail(true);
};

watch(
  () => props.visible,
  val => {
    if (val) fetchDetail(false);
  }
);

const handleClose = () => {
  emit("update:visible", false);
};
</script>

<template>
  <el-dialog
    :model-value="visible"
    width="800px"
    align-center
    class="chat-record-dialog"
    :show-close="false"
    destroy-on-close
    append-to-body
    @close="handleClose"
  >
    <template #header>
      <div
        class="custom-header flex items-center justify-between px-6 py-4 border-b border-gray-100"
      >
        <span class="text-base font-bold text-gray-800">{{ chatName }}</span>
        <div class="header-actions flex items-center gap-4">
          <el-button link class="action-btn" @click="fetchDetail(false)">
            <component :is="useRenderIcon(RefreshIcon)" class="text-xl" />
          </el-button>
          <el-button link class="action-btn close-btn" @click="handleClose">
            <component :is="useRenderIcon(CloseIcon)" class="text-xl" />
          </el-button>
        </div>
      </div>
    </template>

    <div
      class="chat-detail-content p-6 h-[500px] overflow-y-auto bg-gray-50/20 custom-scrollbar"
      v-infinite-scroll="loadMore"
      :infinite-scroll-disabled="!hasMore || loading"
      :infinite-scroll-distance="20"
    >
      <div
        v-for="(msg, idx) in messages"
        :key="idx"
        class="detail-msg-row mb-6 flex"
        :class="msg.side === 'right' ? 'justify-end' : 'justify-start'"
      >
        <!-- Left Avatar -->
        <el-avatar
          v-if="msg.side === 'left'"
          :src="msg.avatar"
          :size="40"
          class="mr-3 shrink-0"
        />

        <div
          :class="[
            'flex flex-col',
            msg.side === 'right' ? 'items-end' : 'items-start'
          ]"
          style="max-width: 85%"
        >
          <span class="text-xs text-gray-400 mb-1">{{ msg.nickname }}</span>

          <!-- Text Bubble -->
          <div
            v-if="msg.type === 1 || msg.type === 2"
            class="bubble-content p-3 text-sm shadow-sm"
            :class="[
              msg.side === 'left'
                ? 'bg-white text-gray-800 rounded-r-xl rounded-bl-xl'
                : 'bg-blue-500 text-white rounded-l-xl rounded-br-xl'
            ]"
          >
            {{ msg.content }}
          </div>

          <!-- Image Content -->
          <div v-else-if="msg.type === 3" class="flex flex-wrap gap-2">
            <el-image
              v-for="(img, i) in msg.content"
              :key="i"
              :src="img.fullUrl"
              :preview-src-list="[img.fullUrl]"
              fit="cover"
              class="rounded-xl w-32 h-32 cursor-pointer shadow-sm"
              preview-teleported
            />
          </div>

          <!-- Video Message -->
          <div v-else-if="msg.type === 4" class="max-w-[320px]">
            <video
              :src="msg.content.videoUrl"
              :poster="msg.content.coverUrl"
              controls
              class="w-full rounded-xl shadow-sm"
            />
          </div>

          <!-- Audio Message -->
          <div v-else-if="msg.type === 5">
            <div
              :class="[
                'audio-bubble p-3 rounded-xl shadow-sm flex items-center gap-3 cursor-pointer transition-all active:scale-95',
                msg.side === 'left'
                  ? 'bg-white text-gray-800'
                  : 'bg-blue-500 text-white'
              ]"
              @click="playAudio(msg)"
            >
              <div v-if="playingMsgId === msg.id" class="voice-waves">
                <div class="wave-bar" />
                <div class="wave-bar" />
                <div class="wave-bar" />
              </div>
              <component
                v-else
                :is="useRenderIcon('ri:volume-up-fill')"
                class="text-xl"
              />
              <span class="text-xs font-bold">{{ msg.content.duration }}s</span>
            </div>

          </div>

          <span class="text-[10px] text-gray-300 mt-2">{{ msg.time }}</span>
        </div>

        <!-- Right Avatar -->
        <el-avatar
          v-if="msg.side === 'right'"
          :src="msg.avatar"
          :size="40"
          class="ml-3 shrink-0"
        />
      </div>

      <!-- Loading State -->
      <div class="scroll-footer py-2 text-center text-gray-400 text-xs">
        <div v-if="loading" class="flex justify-center items-center py-2">
          <el-icon class="is-loading mr-2"
            ><component :is="useRenderIcon(LoadingIcon)"
          /></el-icon>
          正在加载记录...
        </div>
        <div v-else-if="!hasMore && messages.length > 0">没有更多记录了</div>
      </div>
    </div>
  </el-dialog>
</template>

<style lang="scss">
.chat-record-dialog {
  border-radius: 24px !important;
  overflow: hidden;
  .el-dialog__header {
    padding: 0;
    margin-right: 0;
  }
  .el-dialog__body {
    padding: 0;
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
    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-thumb {
      background: #e5e7eb;
      border-radius: 10px;
    }
  }

  .voice-waves {
    display: flex;
    align-items: center;
    gap: 3px;
    height: 18px;
    padding-right: 4px;
    .wave-bar {
      width: 3px;
      height: 100%;
      background: currentColor;
      border-radius: 1px;
      animation: wave-breath 0.8s ease-in-out infinite;
      &:nth-child(2) {
        animation-delay: 0.15s;
        height: 70%;
      }
      &:nth-child(3) {
        animation-delay: 0.3s;
        height: 50%;
      }
    }
  }

  @keyframes wave-breath {
    0%,
    100% {
      height: 6px;
    }
    50% {
      height: 18px;
    }
  }
}

</style>
