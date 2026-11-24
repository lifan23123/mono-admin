<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessageBox } from "element-plus";
import { getPostList, getQiNiuDomain, updateUserState } from "@/api/user";
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

const router = useRouter();

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

/** 查看详情 */
const handleViewDetail = (row: ApiPostItem) => {
  router.push({
    path: "/post-management/detail",
    query: { id: String(row.id) }
  });
};

/** 封号 */
const handleBanUser = (row: ApiPostItem) => {
  const userId = row.imsUserResp?.id ?? row.userId;
  if (userId === undefined || userId === null) {
    message("未获取到发帖人用户ID", { type: "error" });
    return;
  }
  const userName = row.imsUserResp?.name || `用户(${userId})`;
  ElMessageBox.confirm(`确定要对发帖人「${userName}」执行封号操作吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      try {
        const res = (await updateUserState({
          id: userId,
          state: 2
        })) as any;
        if (res?.code === "0000") {
          message("封号成功", { type: "success" });
          fetchPostList();
        } else {
          message(res?.message || "封号失败", { type: "error" });
        }
      } catch (e) {
        message("操作异常", { type: "error" });
      }
    })
    .catch(() => {});
};

/** 删除帖子（暂时给定方法，后续对接删除接口） */
const handleDeletePost = (row: ApiPostItem) => {
  ElMessageBox.confirm(`确定要删除帖子（ID: ${row.id}）吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(() => {
      // TODO: 对接删除帖子接口
      tableData.value = tableData.value.filter(item => item.id !== row.id);
      total.value = Math.max(0, total.value - 1);
      message("删除成功（待对接接口）", { type: "success" });
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

        <el-table-column label="操作" width="240" align="center" fixed="right">
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
</style>
