<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ArrowLeft from "~icons/ep/arrow-left";
import Picture from "~icons/ep/picture";
import { message } from "@/utils/message";
import { MOCK_POST_LIST, type PostItem } from "./mockData";

defineOptions({
  name: "PostManagementDetail"
});

const route = useRoute();
const router = useRouter();

const postId = computed(() => Number(route.query.id));

const postDetail = ref<PostItem | null>(
  MOCK_POST_LIST.find(item => item.id === postId.value)
    ? {
        ...MOCK_POST_LIST.find(item => item.id === postId.value)!,
        comments: [
          ...MOCK_POST_LIST.find(item => item.id === postId.value)!.comments
        ]
      }
    : {
        ...MOCK_POST_LIST[0],
        comments: [...MOCK_POST_LIST[0].comments]
      }
);

const handleBack = () => {
  router.push("/post-management/index");
};

/** 封号（暂时给定方法） */
const handleBanUser = () => {
  if (!postDetail.value) return;
  const actionText = postDetail.value.authorStatus === 1 ? "封号" : "解封";
  ElMessageBox.confirm(
    `确定要对用户「${postDetail.value.authorName}」执行${actionText}操作吗？`,
    "提示",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  )
    .then(() => {
      if (!postDetail.value) return;
      postDetail.value.authorStatus =
        postDetail.value.authorStatus === 1 ? 0 : 1;
      message(`${actionText}成功（测试数据演示）`, { type: "success" });
    })
    .catch(() => {});
};

/** 删除帖子（暂时给定方法） */
const handleDeletePost = () => {
  if (!postDetail.value) return;
  ElMessageBox.confirm(
    `确定要删除帖子（ID: ${postDetail.value.id}）吗？`,
    "提示",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  )
    .then(() => {
      message("删除成功（测试数据演示）", { type: "success" });
      handleBack();
    })
    .catch(() => {});
};
</script>

<template>
  <div class="post-detail-container p-4">
    <el-card shadow="never" class="main-card border-none border-radius-16">
      <!-- 顶部导航栏 -->
      <div
        class="header-bar mb-6 flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-gray-100"
      >
        <div class="flex items-center gap-3">
          <el-button
            class="back-btn"
            :icon="useRenderIcon(ArrowLeft)"
            circle
            @click="handleBack"
          />
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-bold text-gray-800 m-0">帖子详情</h2>
            <span
              v-if="postDetail"
              class="text-xs text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full"
            >
              ID: {{ postDetail.id }}
            </span>
          </div>
        </div>

        <div v-if="postDetail" class="flex items-center gap-3">
          <el-button
            :type="postDetail.authorStatus === 1 ? 'warning' : 'success'"
            plain
            class="action-btn"
            @click="handleBanUser"
          >
            {{ postDetail.authorStatus === 1 ? "封号" : "解封" }}
          </el-button>
          <el-button
            type="danger"
            plain
            class="action-btn"
            @click="handleDeletePost"
          >
            删除帖子
          </el-button>
        </div>
      </div>

      <!-- 主体滚动区域 -->
      <div v-if="postDetail" class="detail-body flex-1 overflow-y-auto pr-2">
        <!-- 帖子内容卡片 -->
        <div class="post-section pb-6 border-b border-gray-100">
          <!-- 发布者信息 -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <el-image
                v-if="postDetail.authorAvatar"
                :src="postDetail.authorAvatar"
                class="avatar-wrapper mr-3"
                fit="cover"
              >
                <template #error>
                  <div class="avatar-wrapper avatar-text mr-3">
                    {{ (postDetail.authorName || "用").substring(0, 1) }}
                  </div>
                </template>
              </el-image>
              <div v-else class="avatar-wrapper avatar-text mr-3">
                {{ (postDetail.authorName || "用").substring(0, 1) }}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-base font-semibold text-gray-800">
                    {{ postDetail.authorName }}
                  </span>
                  <span
                    :class="[
                      'status-tag',
                      postDetail.authorStatus === 1
                        ? 'status-normal'
                        : 'status-abnormal'
                    ]"
                  >
                    {{ postDetail.authorStatus === 1 ? "正常" : "已封号" }}
                  </span>
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  <span>账号：{{ postDetail.authorAccount }}</span>
                  <span class="mx-2">·</span>
                  <span>发布于 {{ postDetail.createTime }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 帖子文字内容 -->
          <div class="post-text text-gray-700 text-sm leading-7 mb-4">
            {{ postDetail.content }}
          </div>

          <!-- 九宫格图片展示 -->
          <div
            v-if="
              postDetail.mediaType === 'image' && postDetail.images.length > 0
            "
            class="nine-grid mb-4"
            :class="{
              'grid-single': postDetail.images.length === 1,
              'grid-four': postDetail.images.length === 4
            }"
          >
            <div
              v-for="(imgUrl, index) in postDetail.images.slice(0, 9)"
              :key="index"
              class="grid-item"
            >
              <el-image
                :src="imgUrl"
                :preview-src-list="postDetail.images"
                :initial-index="index"
                preview-teleported
                fit="cover"
                class="grid-image"
              >
                <template #error>
                  <div class="image-error">
                    <component :is="useRenderIcon(Picture)" class="text-2xl" />
                    <span class="text-xs mt-1">加载失败</span>
                  </div>
                </template>
              </el-image>
            </div>
          </div>

          <!-- 视频展示 -->
          <div
            v-else-if="postDetail.mediaType === 'video' && postDetail.videoUrl"
            class="video-wrapper mb-4"
          >
            <video
              :src="postDetail.videoUrl"
              :poster="postDetail.videoPoster"
              controls
              preload="metadata"
              class="post-video"
            />
          </div>

          <!-- 互动数据 -->
          <div class="flex items-center gap-6 text-xs text-gray-500 mt-2">
            <span>点赞 {{ postDetail.likeCount }}</span>
            <span>评论 {{ postDetail.comments.length }}</span>
          </div>
        </div>

        <!-- 评论区 -->
        <div class="comment-section">
          <div class="comment-header flex items-center justify-between">
            <h3 class="comment-title text-base font-semibold text-gray-800 m-0">
              全部评论 ({{ postDetail.comments.length }})
            </h3>
          </div>

          <div
            v-if="postDetail.comments.length > 0"
            class="comment-list space-y-4"
          >
            <div
              v-for="comment in postDetail.comments"
              :key="comment.id"
              class="comment-item p-4 rounded-xl bg-gray-50/80 border border-gray-100"
            >
              <div class="flex items-start gap-3">
                <div class="avatar-wrapper avatar-sm avatar-text">
                  {{ (comment.userName || "评").substring(0, 1) }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-sm font-medium text-gray-800">
                        {{ comment.userName }}
                      </span>
                      <span class="text-xs text-gray-400">
                        ({{ comment.userAccount }})
                      </span>
                      <span
                        v-if="comment.replyTo"
                        class="text-xs text-gray-500"
                      >
                        回复
                        <span class="text-blue-500 font-medium">
                          @{{ comment.replyTo }}
                        </span>
                      </span>
                    </div>
                    <span class="text-xs text-gray-400 shrink-0">
                      {{ comment.createTime }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 leading-6 mt-2 mb-0">
                    {{ comment.content }}
                  </p>
                  <div class="text-xs text-gray-400 mt-2">
                    点赞 {{ comment.likeCount }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <el-empty v-else description="暂无评论" :image-size="90" />
        </div>
      </div>

      <el-empty v-else description="未找到该帖子" />
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.post-detail-container {
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;

  .main-card {
    border-radius: 16px;
    background: #fff;
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    :deep(.el-card__body) {
      padding: 24px;
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
  }

  .header-bar {
    flex-shrink: 0;

    .action-btn {
      border-radius: 8px;
      height: 36px;
    }
  }

  .avatar-wrapper {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    overflow: hidden;
    flex-shrink: 0;

    &.avatar-sm {
      width: 36px;
      height: 36px;
      font-size: 14px;
    }

    &.avatar-text {
      background-color: #0076fe;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: bold;
      line-height: 1;
    }
  }

  .status-tag {
    padding: 2px 10px;
    border-radius: 4px;
    font-size: 12px;

    &.status-normal {
      background-color: #ecfdf5;
      color: #10b981;
    }

    &.status-abnormal {
      background-color: #fef2f2;
      color: #ef4444;
    }
  }

  .post-section {
    padding-bottom: 24px;
    border-bottom: 1px solid #f0f0f0;
  }

  .comment-section {
    margin-top: 28px;

    .comment-header {
      margin-bottom: 16px;
    }

    .comment-title {
      display: flex;
      align-items: center;

      &::before {
        content: "";
        display: inline-block;
        width: 4px;
        height: 16px;
        border-radius: 2px;
        background-color: #0076fe;
        margin-right: 8px;
      }
    }
  }

  .post-text {
    white-space: pre-wrap;
    word-break: break-word;
  }

  .nine-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    max-width: 420px;

    &.grid-single {
      grid-template-columns: 1fr;
      max-width: 260px;
    }

    &.grid-four {
      grid-template-columns: repeat(2, 1fr);
      max-width: 280px;
    }

    .grid-item {
      width: 100%;
      aspect-ratio: 1 / 1;
      border-radius: 10px;
      overflow: hidden;
      background-color: #f7f8fa;
      border: 1px solid #f0f0f0;
    }

    .grid-image {
      width: 100%;
      height: 100%;
      display: block;
    }

    .image-error {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #909399;
      background-color: #f7f8fa;
    }
  }

  .video-wrapper {
    max-width: 520px;
    border-radius: 12px;
    overflow: hidden;
    background-color: #000;

    .post-video {
      width: 100%;
      max-height: 360px;
      display: block;
    }
  }
}
</style>
