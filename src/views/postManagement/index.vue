<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { getPostList } from "@/api/user";
import { message } from "@/utils/message";
import { MOCK_POST_LIST, type PostItem } from "./mockData";

defineOptions({
  name: "PostManagementIndex"
});

const router = useRouter();

const searchQuery = ref("");
const currentPage = ref(1);
const pageSize = ref(20);
const loading = ref(false);

// 暂时使用写死的测试数据，后续可直接替换为接口返回数据
const allPosts = ref<PostItem[]>(MOCK_POST_LIST.map(item => ({ ...item })));

const filteredList = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase();
  if (!keyword) return allPosts.value;
  return allPosts.value.filter(
    item =>
      String(item.id).includes(keyword) ||
      item.authorName.toLowerCase().includes(keyword) ||
      item.authorAccount.toLowerCase().includes(keyword) ||
      item.content.toLowerCase().includes(keyword)
  );
});

const total = computed(() => filteredList.value.length);

const tableData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredList.value.slice(start, start + pageSize.value);
});

// 保留原有接口调用逻辑
const fetchPostList = async () => {
  try {
    const res = await getPostList({
      pageNo: currentPage.value,
      pageSize: pageSize.value
    });
    console.log("post list:", res);
  } catch (e) {
    console.error("Failed to fetch post list:", e);
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchPostList();
};

const handleReset = () => {
  searchQuery.value = "";
  currentPage.value = 1;
  fetchPostList();
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

/** 查看详情 */
const handleViewDetail = (row: PostItem) => {
  router.push({
    path: "/post-management/detail",
    query: { id: String(row.id) }
  });
};

/** 封号（暂时给定方法，后续对接封号接口） */
const handleBanUser = (row: PostItem) => {
  const actionText = row.authorStatus === 1 ? "封号" : "解封";
  ElMessageBox.confirm(
    `确定要对用户「${row.authorName}」执行${actionText}操作吗？`,
    "提示",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  )
    .then(() => {
      // TODO: 对接封号/解封接口
      row.authorStatus = row.authorStatus === 1 ? 0 : 1;
      message(`${actionText}成功（测试数据演示）`, { type: "success" });
    })
    .catch(() => {});
};

/** 删除帖子（暂时给定方法，后续对接删除接口） */
const handleDeletePost = (row: PostItem) => {
  ElMessageBox.confirm(`确定要删除帖子（ID: ${row.id}）吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      // TODO: 对接删除帖子接口
      allPosts.value = allPosts.value.filter(item => item.id !== row.id);
      message("删除成功（测试数据演示）", { type: "success" });
    })
    .catch(() => {});
};

const getMediaTypeText = (row: PostItem) => {
  if (row.mediaType === "video") return "视频";
  if (row.mediaType === "image") return `图片(${row.images.length})`;
  return "纯文字";
};

onMounted(() => {
  fetchPostList();
});
</script>

<template>
  <div class="post-management-container p-4">
    <el-card shadow="never" class="main-card border-none border-radius-16">
      <!-- 顶部筛选区 -->
      <div class="filter-wrapper mb-6">
        <div class="flex items-center flex-wrap">
          <span class="mr-4 text-sm text-gray-600">关键词</span>
          <el-input
            v-model="searchQuery"
            placeholder="帖子ID / 发布者 / 帖子内容"
            class="search-input mr-4"
            clearable
            @keyup.enter="handleSearch"
          />
          <el-button
            type="primary"
            class="search-btn ml-2 px-6"
            @click="handleSearch"
          >
            搜索
          </el-button>
          <el-button class="reset-btn ml-3 px-6" @click="handleReset">
            重置
          </el-button>
        </div>
      </div>

      <!-- 表格区域 -->
      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        class="custom-table flex-1"
        height="100%"
      >
        <el-table-column prop="id" label="帖子ID" width="100" align="center" />

        <el-table-column label="发布者" min-width="170">
          <template #default="{ row }">
            <div class="flex items-center">
              <el-image
                v-if="row.authorAvatar"
                :src="row.authorAvatar"
                class="avatar-wrapper mr-3"
                fit="cover"
              >
                <template #error>
                  <div class="avatar-wrapper avatar-text mr-3">
                    {{ (row.authorName || "用").substring(0, 1) }}
                  </div>
                </template>
              </el-image>
              <div v-else class="avatar-wrapper avatar-text mr-3">
                {{ (row.authorName || "用").substring(0, 1) }}
              </div>
              <div class="flex flex-col">
                <span class="text-gray-700 font-medium leading-tight">
                  {{ row.authorName }}
                </span>
                <span class="text-xs text-gray-400 mt-0.5">
                  {{ row.authorAccount }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="帖子内容" min-width="300">
          <template #default="{ row }">
            <div class="post-content-cell">
              <p class="content-text text-gray-700">{{ row.content }}</p>
              <div class="mt-1 flex items-center gap-2">
                <span
                  :class="[
                    'media-tag',
                    row.mediaType === 'video'
                      ? 'media-video'
                      : row.mediaType === 'image'
                        ? 'media-image'
                        : 'media-text'
                  ]"
                >
                  {{ getMediaTypeText(row) }}
                </span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="点赞 / 评论" width="130" align="center">
          <template #default="{ row }">
            <span class="text-gray-600">
              {{ row.likeCount }} / {{ row.commentCount }}
            </span>
          </template>
        </el-table-column>

        <el-table-column
          prop="createTime"
          label="发布时间"
          min-width="170"
          align="center"
        />

        <el-table-column label="账号状态" width="110" align="center">
          <template #default="{ row }">
            <span
              :class="[
                'status-tag',
                row.authorStatus === 1 ? 'status-normal' : 'status-abnormal'
              ]"
            >
              {{ row.authorStatus === 1 ? "正常" : "已封号" }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" align="center" fixed="right">
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
              :type="row.authorStatus === 1 ? 'warning' : 'success'"
              class="op-link"
              @click="handleBanUser(row)"
            >
              {{ row.authorStatus === 1 ? "封号" : "解封" }}
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

    .filter-wrapper {
      flex-shrink: 0;

      .search-input {
        width: 280px;
        :deep(.el-input__wrapper) {
          border-radius: 8px;
          height: 40px;
        }
      }

      .search-btn {
        height: 40px;
        border-radius: 8px;
        background-color: #0076fe;
        border: none;
      }

      .reset-btn {
        height: 40px;
        border-radius: 8px;
      }
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
</style>
