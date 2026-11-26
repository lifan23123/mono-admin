<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ArrowLeft from "~icons/ep/arrow-left";
import Picture from "~icons/ep/picture";
import {
  getPostList,
  getQiNiuDomain,
  updateUserState,
  getPostReplyPage,
  deletePostReply,
  deletePost
} from "@/api/user";
import { message } from "@/utils/message";

defineOptions({
  name: "PostManagementDetail"
});

interface PostMediaItem {
  url: string;
  type?: number;
  coverUrl?: string | null;
  duration?: number | null;
  width?: number | null;
  height?: number | null;
  size?: number | null;
}

interface ImsUserResp {
  id?: number;
  name?: string;
  icon?: string;
}

interface PostReplyItem {
  id: number;
  momentId?: number;
  userId?: number;
  userResp?: ImsUserResp;
  replyUserId?: number;
  replyUserResp?: ImsUserResp;
  parentId?: number;
  content?: string;
  likeCount?: number;
  commentCount?: number;
  state?: string | number;
  createTime?: string;
}

interface ApiPostItem {
  id: number;
  userId?: number;
  companyId?: number;
  content?: string;
  contentType?: string;
  createTime?: string;
  updateTime?: string;
  likeCount?: number;
  commentCount?: number;
  visitCount?: number;
  state?: string | number;
  visibility?: string;
  url?: PostMediaItem[];
  imsUserResp?: ImsUserResp;
  [key: string]: any;
}

const route = useRoute();
const router = useRouter();

const postId = computed(() => Number(route.query.id));
const loading = ref(false);
const postDetail = ref<ApiPostItem | null>(null);
const qiniuDomain = ref("");

const fetchQiNiuDomain = async () => {
  try {
    const res = await getQiNiuDomain();
    const { data } = res as any;
    if (data) qiniuDomain.value = data;
  } catch (e) {
    console.error("Failed to fetch qiniu domain:", e);
  }
};

const getUrl = (path?: string | null) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  let domainBase = "";
  if (typeof qiniuDomain.value === "string") {
    domainBase = qiniuDomain.value;
  } else if (qiniuDomain.value && typeof qiniuDomain.value === "object") {
    domainBase = (qiniuDomain.value as any).url || "";
  }
  const domain = domainBase.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return domain ? domain + cleanPath : path;
};

const loadPostDetail = async () => {
  if (!postId.value) return;

  // 优先读取列表页跳转时缓存的详情数据
  try {
    const cached = sessionStorage.getItem(`post_detail_${postId.value}`);
    if (cached) {
      postDetail.value = JSON.parse(cached);
      return;
    }
  } catch (e) {
    console.error("Failed to parse cached post detail:", e);
  }

  // 刷新页面或直接访问时，从列表接口中匹配对应帖子
  loading.value = true;
  try {
    const res = (await getPostList({
      pageNo: 1,
      pageSize: 100
    })) as any;
    if (res?.code === "0000") {
      const list: ApiPostItem[] = Array.isArray(res.data)
        ? res.data
        : res.data?.list || [];
      postDetail.value =
        list.find(item => Number(item.id) === postId.value) || null;
    }
  } catch (e) {
    console.error("Failed to fetch post detail:", e);
  } finally {
    loading.value = false;
  }
};

const imageUrls = computed(() => {
  const mediaList = postDetail.value?.url || [];
  return mediaList
    .filter(
      item =>
        item?.url &&
        (item.type === 1 ||
          (item.type === undefined && postDetail.value?.contentType !== "5"))
    )
    .map(item => getUrl(item.url));
});

const videoList = computed(() => {
  const mediaList = postDetail.value?.url || [];
  return mediaList
    .filter(
      item =>
        item?.url &&
        (item.type === 2 ||
          (item.type === undefined && postDetail.value?.contentType === "5"))
    )
    .map(item => ({
      src: getUrl(item.url),
      poster: getUrl(item.coverUrl)
    }));
});

const handleBack = () => {
  router.push("/post-management/index");
};

/** 封号 */
const handleBanUser = () => {
  if (!postDetail.value) return;
  const userId = postDetail.value.imsUserResp?.id ?? postDetail.value.userId;
  if (userId === undefined || userId === null) {
    message("未获取到发帖人用户ID", { type: "error" });
    return;
  }
  const userName = postDetail.value.imsUserResp?.name || `用户(${userId})`;
  ElMessageBox.confirm(
    `确定要对发帖人「${userName}」执行封号操作吗？`,
    "提示",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  )
    .then(async () => {
      try {
        const res = (await updateUserState({
          id: userId,
          state: 2
        })) as any;
        if (res?.code === "0000") {
          message("封号成功", { type: "success" });
        } else {
          message(res?.message || "封号失败", { type: "error" });
        }
      } catch (e) {
        message("操作异常", { type: "error" });
      }
    })
    .catch(() => {});
};

/** 删除帖子 */
const handleDeletePost = () => {
  if (!postDetail.value) return;
  const targetId = postDetail.value.id;
  ElMessageBox.confirm(`确定要删除帖子（ID: ${targetId}）吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      try {
        const res = (await deletePost({ id: targetId })) as any;
        if (res?.code === "0000") {
          sessionStorage.removeItem(`post_detail_${targetId}`);
          message("删除成功", { type: "success" });
          handleBack();
        } else {
          message(res?.message || "删除失败", { type: "error" });
        }
      } catch (e) {
        message("操作异常", { type: "error" });
      }
    })
    .catch(() => {});
};

const commentList = ref<PostReplyItem[]>([]);
const commentLoading = ref(false);
const commentPageNo = ref(1);
const commentPageSize = ref(20);
const commentTotal = ref(0);

const fetchComments = async () => {
  if (!postId.value) return;
  commentLoading.value = true;
  try {
    const res = (await getPostReplyPage({
      momentId: postId.value,
      pageNo: commentPageNo.value,
      pageSize: commentPageSize.value
    })) as any;
    if (res?.code === "0000") {
      const list = Array.isArray(res.data) ? res.data : res.data?.list || [];
      commentList.value = list;
      commentTotal.value = res.total ?? res.data?.total ?? list.length;
    } else {
      commentList.value = [];
      commentTotal.value = 0;
    }
  } catch (e) {
    console.error("Failed to fetch post comments:", e);
  } finally {
    commentLoading.value = false;
  }
};

const handleCommentPageChange = (val: number) => {
  commentPageNo.value = val;
  fetchComments();
};

/** 删除评论 */
const handleDeleteComment = (comment: PostReplyItem) => {
  ElMessageBox.confirm("确定要删除该条评论吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      try {
        const res = (await deletePostReply({ id: comment.id })) as any;
        if (res?.code === "0000") {
          message("删除成功", { type: "success" });
          if (
            postDetail.value &&
            typeof postDetail.value.commentCount === "number"
          ) {
            postDetail.value.commentCount = Math.max(
              0,
              postDetail.value.commentCount - 1
            );
          }
          if (commentList.value.length === 1 && commentPageNo.value > 1) {
            commentPageNo.value -= 1;
          }
          fetchComments();
        } else {
          message(res?.message || "删除失败", { type: "error" });
        }
      } catch (e) {
        message("操作异常", { type: "error" });
      }
    })
    .catch(() => {});
};

onMounted(async () => {
  await fetchQiNiuDomain();
  await loadPostDetail();
  fetchComments();
});
</script>

<template>
  <div class="post-detail-container p-4">
    <el-card
      v-loading="loading"
      shadow="never"
      class="main-card border-none border-radius-16"
    >
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
            type="warning"
            plain
            class="action-btn"
            @click="handleBanUser"
          >
            封号
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
        <div class="post-section">
          <!-- 发布者信息 -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <el-image
                v-if="postDetail.imsUserResp?.icon"
                :src="getUrl(postDetail.imsUserResp.icon)"
                class="avatar-wrapper mr-3"
                fit="cover"
              >
                <template #error>
                  <div class="avatar-wrapper avatar-text mr-3">
                    {{ (postDetail.imsUserResp?.name || "用").substring(0, 1) }}
                  </div>
                </template>
              </el-image>
              <div v-else class="avatar-wrapper avatar-text mr-3">
                {{ (postDetail.imsUserResp?.name || "用").substring(0, 1) }}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-base font-semibold text-gray-800">
                    {{ postDetail.imsUserResp?.name || "-" }}
                  </span>
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  <span>
                    用户ID：{{
                      postDetail.imsUserResp?.id ?? postDetail.userId ?? "-"
                    }}
                  </span>
                  <span class="mx-2">·</span>
                  <span>发布于 {{ postDetail.createTime || "-" }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 帖子文字内容 -->
          <div
            v-if="postDetail.content"
            class="post-text text-gray-700 text-sm leading-7 mb-4"
          >
            {{ postDetail.content }}
          </div>

          <!-- 九宫格图片展示 -->
          <div
            v-if="imageUrls.length > 0"
            class="nine-grid mb-4"
            :class="{
              'grid-single': imageUrls.length === 1,
              'grid-four': imageUrls.length === 4
            }"
          >
            <div
              v-for="(imgUrl, index) in imageUrls.slice(0, 9)"
              :key="index"
              class="grid-item"
            >
              <el-image
                :src="imgUrl"
                :preview-src-list="imageUrls"
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
          <div v-if="videoList.length > 0" class="video-list mb-4 space-y-3">
            <div
              v-for="(video, index) in videoList"
              :key="index"
              class="video-wrapper"
            >
              <video
                :src="video.src"
                :poster="video.poster || undefined"
                controls
                preload="metadata"
                class="post-video"
              />
            </div>
          </div>

          <!-- 互动数据 -->
          <div class="flex items-center gap-6 text-xs text-gray-500 mt-2">
            <span>点赞 {{ postDetail.likeCount ?? 0 }}</span>
            <span>评论 {{ postDetail.commentCount ?? 0 }}</span>
            <span>浏览 {{ postDetail.visitCount ?? 0 }}</span>
          </div>
        </div>

        <!-- 评论区 -->
        <div v-loading="commentLoading" class="comment-section">
          <div class="comment-header flex items-center justify-between">
            <h3 class="comment-title text-base font-semibold text-gray-800 m-0">
              全部评论 ({{ commentTotal || postDetail.commentCount || 0 }})
            </h3>
          </div>

          <div v-if="commentList.length > 0" class="comment-list space-y-4">
            <div
              v-for="comment in commentList"
              :key="comment.id"
              class="comment-item p-4 rounded-xl bg-gray-50/80 border border-gray-100"
            >
              <div class="flex items-start gap-3">
                <el-image
                  v-if="comment.userResp?.icon"
                  :src="getUrl(comment.userResp.icon)"
                  class="avatar-wrapper avatar-sm"
                  fit="cover"
                >
                  <template #error>
                    <div class="avatar-wrapper avatar-sm avatar-text">
                      {{ (comment.userResp?.name || "评").substring(0, 1) }}
                    </div>
                  </template>
                </el-image>
                <div v-else class="avatar-wrapper avatar-sm avatar-text">
                  {{ (comment.userResp?.name || "评").substring(0, 1) }}
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="text-sm font-medium text-gray-800">
                        {{ comment.userResp?.name || "-" }}
                      </span>
                      <span class="text-xs text-gray-400">
                        (ID:
                        {{ comment.userResp?.id ?? comment.userId ?? "-" }})
                      </span>
                      <!-- <span
                        v-if="
                          comment.parentId &&
                          comment.parentId > 0 &&
                          comment.replyUserResp?.name
                        "
                        class="text-xs text-gray-500"
                      >
                        回复
                        <span class="text-blue-500 font-medium">
                          @{{ comment.replyUserResp.name }}
                        </span>
                      </span> -->
                    </div>
                    <span class="text-xs text-gray-400 shrink-0">
                      {{ comment.createTime || "-" }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 leading-6 mt-2 mb-0">
                    {{ comment.content }}
                  </p>
                  <div
                    class="flex items-center justify-between text-xs text-gray-400 mt-2"
                  >
                    <span>点赞 {{ comment.likeCount ?? 0 }}</span>
                    <el-button
                      link
                      type="danger"
                      size="small"
                      @click="handleDeleteComment(comment)"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="commentTotal > commentPageSize"
              class="flex justify-center pt-2"
            >
              <el-pagination
                v-model:current-page="commentPageNo"
                :page-size="commentPageSize"
                layout="prev, pager, next, total"
                :total="commentTotal"
                @current-change="handleCommentPageChange"
              />
            </div>
          </div>

          <el-empty v-else description="暂无评论" :image-size="90" />
        </div>
      </div>

      <el-empty v-else-if="!loading" description="未找到该帖子" />
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
