<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import lottie, { type AnimationItem } from "lottie-web";
import { ungzip } from "pako";
import Loading from "~icons/ep/loading";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";

const props = withDefaults(
  defineProps<{
    src: string;
    autoplay?: boolean;
    loop?: boolean;
  }>(),
  {
    autoplay: true,
    loop: true
  }
);

const containerRef = ref<HTMLElement | null>(null);
const loading = ref(false);
const isError = ref(false);
const isImageFallback = ref(false);
let animItem: AnimationItem | null = null;

// 全局静态缓存，避免同一个 tgs 重复请求与解压
const tgsCache = new Map<string, any>();

const destroyAnimation = () => {
  if (animItem) {
    try {
      animItem.destroy();
    } catch (e) {}
    animItem = null;
  }
  if (containerRef.value) {
    containerRef.value.innerHTML = "";
  }
};

const loadTgs = async () => {
  destroyAnimation();
  isError.value = false;
  isImageFallback.value = false;

  if (!props.src) return;

  // 如果判断是常见普通图片扩展名，走普通图片降级模式
  const lowerUrl = props.src.toLowerCase();
  if (
    lowerUrl.endsWith(".png") ||
    lowerUrl.endsWith(".jpg") ||
    lowerUrl.endsWith(".jpeg") ||
    lowerUrl.endsWith(".gif") ||
    lowerUrl.endsWith(".webp") ||
    lowerUrl.endsWith(".svg")
  ) {
    isImageFallback.value = true;
    return;
  }

  // 检查内存缓存
  if (tgsCache.has(props.src)) {
    renderAnimation(tgsCache.get(props.src));
    return;
  }

  loading.value = true;
  try {
    const res = await fetch(props.src);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const buffer = await res.arrayBuffer();
    const uint8 = new Uint8Array(buffer);

    let jsonStr = "";
    // 优先尝试 gzip 解压 (tgs 标准格式)
    try {
      const decompressed = ungzip(uint8);
      jsonStr = new TextDecoder("utf-8").decode(decompressed);
    } catch (gzipErr) {
      // 如果不是 gzip 压缩，尝试直接文本解码（纯 JSON）
      jsonStr = new TextDecoder("utf-8").decode(uint8);
    }

    const animationData = JSON.parse(jsonStr);
    tgsCache.set(props.src, animationData);

    renderAnimation(animationData);
  } catch (err) {
    console.warn("TGS 解码或加载失败，尝试降级为普通图片:", err);
    // 若不是 tgs/lottie，降级为普通图片
    isImageFallback.value = true;
  } finally {
    loading.value = false;
  }
};

const renderAnimation = (animationData: any) => {
  if (!containerRef.value) return;
  destroyAnimation();

  try {
    animItem = lottie.loadAnimation({
      container: containerRef.value,
      renderer: "svg",
      loop: props.loop,
      autoplay: props.autoplay,
      animationData
    });
  } catch (err) {
    console.error("Lottie 渲染异常:", err);
    isError.value = true;
  }
};

watch(
  () => props.src,
  () => {
    loadTgs();
  }
);

onMounted(() => {
  loadTgs();
});

onBeforeUnmount(() => {
  destroyAnimation();
});
</script>

<template>
  <div class="tgs-player-wrapper relative flex items-center justify-center w-full h-full overflow-hidden">
    <!-- 正在加载中 -->
    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center bg-blue-50/40"
    >
      <component
        :is="useRenderIcon(Loading)"
        class="text-blue-500 animate-spin text-lg"
      />
    </div>

    <!-- 普通图片回退模式 -->
    <img
      v-if="isImageFallback"
      :src="props.src"
      alt="emoji"
      class="w-full h-full object-contain"
      @error="isError = true"
    />

    <!-- Lottie SVG 动画渲染容器 -->
    <div
      v-else
      ref="containerRef"
      class="lottie-container w-full h-full flex items-center justify-center"
    />

    <!-- 错误状态 -->
    <div
      v-if="isError"
      class="absolute inset-0 flex items-center justify-center text-xs text-gray-400 bg-gray-50"
    >
      加载失败
    </div>
  </div>
</template>

<style scoped lang="scss">
.tgs-player-wrapper {
  .lottie-container {
    :deep(svg) {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain;
    }
  }
}
</style>
