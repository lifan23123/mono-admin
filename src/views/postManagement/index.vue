<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessageBox } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Picture from "~icons/ep/picture";
import {
  getPostList,
  getQiNiuDomain,
  updateUserState,
  deletePost,
  getPostReplyPage,
  deletePostReply
} from "@/api/user";
import { message } from "@/utils/message";

defineOptions({
  name: "PostManagementIndex"
});

interface ImsUserResp {
  id?: number;
  name?: string;
  icon?: string;
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
  url?: any[];
  imsUserResp?: ImsUserResp;
  [key: string]: any;
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

const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const loading = ref(false);
const tableData = ref<ApiPostItem[]>([]);
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

const getUrl = (path?: string) => {
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

// 调用帖子列表接口
const fetchPostList = async () => {
  loading.value = true;
  try {
    const res = (await getPostList({
      pageNo: currentPage.value,
      pageSize: pageSize.value
    })) as any;
    console.log("post list:", res);
    if (res?.code === "0000") {
      const list = Array.isArray(res.data) ? res.data : res.data?.list || [];
      tableData.value = list;
      total.value = res.total ?? res.data?.total ?? list.length;
    } else {
      tableData.value = [];
      total.value = 0;
    }
  } catch (e) {
    console.error("Failed to fetch post list:", e);
  } finally {
    loading.value = false;
  }
};

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  currentPage.value = 1;
  fetchPostList();
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  fetchPostList();
};

/** 帖子详情弹窗 */
const detailDialogVisible = ref(false);
const currentDetailPost = ref<ApiPostItem | null>(null);

const detailImageUrls = computed(() => {
  const mediaList = currentDetailPost.value?.url || [];
  return mediaList
    .filter(
      item =>
        item?.url &&
        (item.type === 1 ||
          (item.type === undefined &&
            currentDetailPost.value?.contentType !== "5"))
    )
    .map(item => getUrl(item.url));
});

const detailVideoList = computed(() => {
  const mediaList = currentDetailPost.value?.url || [];
  return mediaList
    .filter(
      item =>
        item?.url &&
        (item.type === 2 ||
          (item.type === undefined &&
            currentDetailPost.value?.contentType === "5"))
    )
    .map(item => ({
      src: getUrl(item.url),
      poster: getUrl(item.coverUrl)
    }));
});

/** 查看详情 */
const handleViewDetail = (row: ApiPostItem) => {
  currentDetailPost.value = row;
  detailDialogVisible.value = true;
};

/** 通用封号确认与请求 */
const confirmBanUser = (
  userId: number | string | undefined,
  userName: string,
  roleLabel = "用户",
  onSuccess?: () => void
) => {
  if (userId === undefined || userId === null) {
    message(`未获取到${roleLabel}ID`, { type: "error" });
    return;
  }
  ElMessageBox.confirm(
    `确定要对${roleLabel}「${userName}」执行封号操作吗？`,
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
          onSuccess?.();
        } else {
          message(res?.message || "封号失败", { type: "error" });
        }
      } catch (e) {
        message("操作异常", { type: "error" });
      }
    })
    .catch(() => {});
};

/** 封号 */
const handleBanUser = (row: ApiPostItem) => {
  const userId = row.imsUserResp?.id ?? row.userId;
  const userName = row.imsUserResp?.name || `用户(${userId})`;
  confirmBanUser(userId, userName, "发帖人", fetchPostList);
};

/** 删除帖子 */
const handleDeletePost = (row: ApiPostItem) => {
  ElMessageBox.confirm(`确定要删除帖子（ID: ${row.id}）吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      try {
        const res = (await deletePost({ id: row.id })) as any;
        if (res?.code === "0000") {
          message("删除成功", { type: "success" });
          if (tableData.value.length === 1 && currentPage.value > 1) {
            currentPage.value -= 1;
          }
          fetchPostList();
        } else {
          message(res?.message || "删除失败", { type: "error" });
        }
      } catch (e) {
        message("操作异常", { type: "error" });
      }
    })
    .catch(() => {});
};

/** 审核评论弹窗 */
const commentDialogVisible = ref(false);
const currentReviewPost = ref<ApiPostItem | null>(null);
const commentList = ref<PostReplyItem[]>([]);
const commentLoading = ref(false);
const commentPageNo = ref(1);
const commentPageSize = ref(20);
const commentTotal = ref(0);

const fetchCommentList = async () => {
  if (!currentReviewPost.value?.id) return;
  commentLoading.value = true;
  try {
    const res = (await getPostReplyPage({
      momentId: currentReviewPost.value.id,
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

const openCommentDialog = (row: ApiPostItem) => {
  currentReviewPost.value = row;
  commentPageNo.value = 1;
  commentList.value = [];
  commentTotal.value = 0;
  commentDialogVisible.value = true;
  fetchCommentList();
};

const handleCommentSizeChange = (val: number) => {
  commentPageSize.value = val;
  commentPageNo.value = 1;
  fetchCommentList();
};

const handleCommentPageChange = (val: number) => {
  commentPageNo.value = val;
  fetchCommentList();
};

/** 评论封号 */
const handleBanCommentUser = (comment: PostReplyItem) => {
  const userId = comment.userResp?.id ?? comment.userId;
  const userName = comment.userResp?.name || `用户(${userId})`;
  confirmBanUser(userId, userName, "评论用户");
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
            currentReviewPost.value &&
            typeof currentReviewPost.value.commentCount === "number"
          ) {
            currentReviewPost.value.commentCount = Math.max(
              0,
              currentReviewPost.value.commentCount - 1
            );
          }
          if (commentList.value.length === 1 && commentPageNo.value > 1) {
            commentPageNo.value -= 1;
          }
          fetchCommentList();
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
  fetchPostList();
});
</script>

<template>
  <div class="post-management-container p-4">
    <el-card shadow="never" class="main-card border-none border-radius-16">
      <!-- 表格区域 -->
      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        class="custom-table flex-1"
        height="100%"
      >
        <el-table-column prop="id" label="ID" width="120" align="center" />

        <el-table-column label="发帖人" min-width="220">
          <template #default="{ row }">
            <div class="flex items-center">
              <el-image
                v-if="row.imsUserResp?.icon"
                :src="getUrl(row.imsUserResp.icon)"
                class="avatar-wrapper mr-3"
                fit="cover"
              >
                <template #error>
                  <div class="avatar-wrapper avatar-text mr-3">
                    {{ (row.imsUserResp?.name || "用").substring(0, 1) }}
                  </div>
                </template>
              </el-image>
              <div v-else class="avatar-wrapper avatar-text mr-3">
                {{ (row.imsUserResp?.name || "用").substring(0, 1) }}
              </div>
              <div class="flex flex-col">
                <span class="text-gray-700 font-medium leading-tight">
                  {{ row.imsUserResp?.name || "-" }}
                </span>
                <span class="text-xs text-gray-400 mt-0.5">
                  ID: {{ row.imsUserResp?.id ?? row.userId ?? "-" }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="帖子状态" width="120" align="center">
          <template #default="{ row }">
            <span
              :class="[
                'status-tag',
                String(row.state) === '1' ? 'status-normal' : 'status-abnormal'
              ]"
            >
              {{ String(row.state) === "1" ? "正常" : "禁用" }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          prop="createTime"
          label="发布时间"
          min-width="180"
          align="center"
        />

        <el-table-column label="操作" width="320" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              class="op-link"
              @click="handleViewDetail(row)"
            >
              查看详情
            </el-button>
            <el-button
              link
              type="primary"
              class="op-link"
              @click="openCommentDialog(row)"
            >
              审核评论
            </el-button>
            <el-button
              link
              type="warning"
              class="op-link"
              @click="handleBanUser(row)"
            >
              封号
            </el-button>
            <el-button
              link
              type="danger"
              class="op-link"
              @click="handleDeletePost(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页区域 -->
      <div class="pagination-wrapper mt-8 flex justify-center">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="prev, pager, next, jumper, slot, total, sizes"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        >
          <template #default>
            <span class="mx-2 text-gray-400">页</span>
          </template>
        </el-pagination>
      </div>
    </el-card>

    <!-- 审核评论弹窗 -->
    <el-dialog
      v-model="commentDialogVisible"
      :title="`审核评论${currentReviewPost ? `（帖子ID: ${currentReviewPost.id}）` : ''}`"
      width="1100px"
      align-center
      class="custom-dialog"
      append-to-body
    >
      <div class="comment-dialog-body">
        <el-table
          v-loading="commentLoading"
          :data="commentList"
          style="width: 100%"
          height="520"
          class="comment-table"
        >
          <el-table-column prop="id" label="评论ID" width="90" align="center" />

          <el-table-column label="评论人" min-width="180">
            <template #default="{ row }">
              <div class="flex items-center">
                <el-image
                  v-if="row.userResp?.icon"
                  :src="getUrl(row.userResp.icon)"
                  class="comment-avatar mr-3"
                  fit="cover"
                >
                  <template #error>
                    <div class="comment-avatar comment-avatar-text mr-3">
                      {{ (row.userResp?.name || "评").substring(0, 1) }}
                    </div>
                  </template>
                </el-image>
                <div v-else class="comment-avatar comment-avatar-text mr-3">
                  {{ (row.userResp?.name || "评").substring(0, 1) }}
                </div>
                <div class="flex flex-col min-w-0">
                  <span
                    class="text-gray-700 font-medium leading-tight truncate"
                  >
                    {{ row.userResp?.name || "-" }}
                  </span>
                  <span class="text-xs text-gray-400 mt-0.5">
                    ID: {{ row.userResp?.id ?? row.userId ?? "-" }}
                  </span>
                </div>
              </div>
            </template>
          </el-table-column>

          <el-table-column label="评论内容" min-width="260">
            <template #default="{ row }">
              <div class="text-sm text-gray-700 leading-6 break-words">
                <!-- <span
                  v-if="
                    row.parentId &&
                    row.parentId > 0 &&
                    row.replyUserResp?.name
                  "
                  class="text-xs text-gray-500 mr-1"
                >
                  回复
                  <span class="text-blue-500 font-medium">
                    @{{ row.replyUserResp.name }}
                  </span>
                  :
                </span> -->
                <span>{{ row.content || "-" }}</span>
              </div>
            </template>
          </el-table-column>

          <el-table-column
            prop="createTime"
            label="评论时间"
            min-width="170"
            align="center"
          />

          <el-table-column
            label="操作"
            width="150"
            align="center"
            fixed="right"
          >
            <template #default="{ row }">
              <el-button
                link
                type="warning"
                class="op-link"
                @click="handleBanCommentUser(row)"
              >
                封号
              </el-button>
              <el-button
                link
                type="danger"
                class="op-link"
                @click="handleDeleteComment(row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="comment-pagination flex justify-center mt-5">
          <el-pagination
            v-model:current-page="commentPageNo"
            v-model:page-size="commentPageSize"
            :page-sizes="[10, 20, 50, 100]"
            layout="prev, pager, next, jumper, slot, total, sizes"
            :total="commentTotal"
            @size-change="handleCommentSizeChange"
            @current-change="handleCommentPageChange"
          >
            <template #default>
              <span class="mx-2 text-gray-400">页</span>
            </template>
          </el-pagination>
        </div>
      </div>
    </el-dialog>

    <!-- 帖子详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      :title="`帖子详情${currentDetailPost ? `（ID: ${currentDetailPost.id}）` : ''}`"
      width="760px"
      align-center
      class="custom-dialog"
      append-to-body
    >
      <div
        v-if="currentDetailPost"
        class="detail-dialog-body max-h-[68vh] overflow-y-auto pr-1"
      >
        <!-- 发布者信息 -->
        <div class="flex items-center mb-4 pb-4 border-b border-gray-100">
          <el-image
            v-if="currentDetailPost.imsUserResp?.icon"
            :src="getUrl(currentDetailPost.imsUserResp.icon)"
            class="detail-avatar mr-3"
            fit="cover"
          >
            <template #error>
              <div class="detail-avatar detail-avatar-text mr-3">
                {{
                  (currentDetailPost.imsUserResp?.name || "用").substring(0, 1)
                }}
              </div>
            </template>
          </el-image>
          <div v-else class="detail-avatar detail-avatar-text mr-3">
            {{ (currentDetailPost.imsUserResp?.name || "用").substring(0, 1) }}
          </div>
          <div>
            <div class="text-base font-semibold text-gray-800">
              {{ currentDetailPost.imsUserResp?.name || "-" }}
            </div>
            <div class="text-xs text-gray-400 mt-1">
              <span>
                用户ID：{{
                  currentDetailPost.imsUserResp?.id ??
                  currentDetailPost.userId ??
                  "-"
                }}
              </span>
              <span class="mx-2">·</span>
              <span>发布于 {{ currentDetailPost.createTime || "-" }}</span>
            </div>
          </div>
        </div>

        <!-- 帖子文字内容 -->
        <div
          v-if="currentDetailPost.content"
          class="detail-post-text text-gray-700 text-sm leading-7 mb-4"
        >
          {{ currentDetailPost.content }}
        </div>

        <!-- 九宫格图片展示 -->
        <div
          v-if="detailImageUrls.length > 0"
          class="detail-nine-grid mb-4"
          :class="{
            'grid-single': detailImageUrls.length === 1,
            'grid-four': detailImageUrls.length === 4
          }"
        >
          <div
            v-for="(imgUrl, index) in detailImageUrls.slice(0, 9)"
            :key="index"
            class="grid-item"
          >
            <el-image
              :src="imgUrl"
              :preview-src-list="detailImageUrls"
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
          v-if="detailVideoList.length > 0"
          class="detail-video-list mb-4 space-y-3"
        >
          <div
            v-for="(video, index) in detailVideoList"
            :key="index"
            class="detail-video-wrapper"
          >
            <video
              :src="video.src"
              :poster="video.poster || undefined"
              controls
              preload="metadata"
              class="detail-post-video"
            />
          </div>
        </div>

        <!-- 互动数据 -->
        <div class="flex items-center gap-6 text-xs text-gray-500 pt-2">
          <span>点赞 {{ currentDetailPost.likeCount ?? 0 }}</span>
          <span>评论 {{ currentDetailPost.commentCount ?? 0 }}</span>
          <span>浏览 {{ currentDetailPost.visitCount ?? 0 }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.post-management-container {
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

  .custom-table {
    :deep(.el-table__header-wrapper) {
      th {
        background-color: #f7f8fa !important;
        color: #909399;
        font-weight: 500;
        height: 50px;
        border: none;
      }
    }

    :deep(.el-table__row) {
      height: 76px;
      td {
        border-bottom: 1px solid #f0f0f0;
      }
    }

    .avatar-wrapper {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;

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

    .post-content-cell {
      .content-text {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        line-height: 1.5;
        margin: 0;
      }

      .media-tag {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 12px;
        line-height: 1.4;

        &.media-image {
          background-color: #eff6ff;
          color: #2563eb;
        }

        &.media-video {
          background-color: #f5f3ff;
          color: #7c3aed;
        }

        &.media-text {
          background-color: #f3f4f6;
          color: #6b7280;
        }
      }
    }

    .status-tag {
      padding: 4px 12px;
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

    .op-link {
      font-weight: 500;
      margin: 0 8px;
      padding: 0;

      &.el-button--primary {
        color: #0076fe;
      }
      &.el-button--success {
        color: #10b981;
      }
      &.el-button--warning {
        color: #f59e0b;
      }
      &.el-button--danger {
        color: #ef4444;
      }
    }
  }

  :deep(.el-pagination) {
    .el-pager li {
      background: none;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
      margin: 0 3px;
      font-weight: normal;

      &.is-active {
        background-color: #0076fe;
        color: #fff;
        border-color: #0076fe;
      }
    }

    .btn-prev,
    .btn-next {
      background: none;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
    }
  }

  .pagination-wrapper {
    flex-shrink: 0;
  }
}

.comment-table {
  :deep(.el-table__header-wrapper) {
    th {
      background-color: #f7f8fa !important;
      color: #909399;
      font-weight: 500;
      height: 46px;
      border: none;
    }
  }

  :deep(.el-table__row) {
    td {
      border-bottom: 1px solid #f0f0f0;
    }
  }

  .op-link {
    font-weight: 500;
    margin: 0 6px;
    padding: 0;
  }
}

.comment-pagination {
  :deep(.el-pagination) {
    .el-pager li {
      background: none;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
      margin: 0 3px;
      font-weight: normal;

      &.is-active {
        background-color: #0076fe;
        color: #fff;
        border-color: #0076fe;
      }
    }

    .btn-prev,
    .btn-next {
      background: none;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
    }
  }
}

.comment-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;

  &.comment-avatar-text {
    background-color: #0076fe;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    font-weight: bold;
    line-height: 1;
  }
}

.detail-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;

  &.detail-avatar-text {
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

.detail-post-text {
  white-space: pre-wrap;
  word-break: break-word;
}

.detail-nine-grid {
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

.detail-video-wrapper {
  max-width: 520px;
  border-radius: 12px;
  overflow: hidden;
  background-color: #000;

  .detail-post-video {
    width: 100%;
    max-height: 360px;
    display: block;
  }
}
</style>
