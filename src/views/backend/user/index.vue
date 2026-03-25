<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getBackstageUserList } from "@/api/user";

defineOptions({
  name: "BackendUser"
});

const searchQuery = ref("");
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const loading = ref(false);
const tableData = ref([]);

const fetchList = async () => {
  loading.value = true;
  try {
    const res = await getBackstageUserList({
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      searchKey: searchQuery.value
    });

    const { data, total: totalCount } = res as any;

    if (data) {
      tableData.value = data || [];
      total.value = totalCount || 0;
    }
  } catch (error) {
    console.error("Failed to fetch backend user list:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchList();
});

const handleSearch = () => {
  currentPage.value = 1;
  fetchList();
};

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  fetchList();
};
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  fetchList();
};
</script>

<template>
  <div class="backend-user-container p-4">
    <el-card shadow="never" class="main-card border-none border-radius-16">
      <!-- Search Filter Area -->
      <div class="filter-wrapper mb-6 flex items-center justify-between">
        <div class="flex items-center">
          <span class="mr-4 text-sm text-gray-600">用户名</span>
          <el-input
            v-model="searchQuery"
            placeholder="请输入登录名"
            class="search-input mr-4"
            clearable
            @keyup.enter="handleSearch"
          />
          <el-button type="primary" class="px-8" @click="handleSearch"
            >查询</el-button
          >
        </div>
      </div>

      <!-- Table Section -->
      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        class="custom-table flex-1"
        height="100%"
      >
        <el-table-column prop="id" label="用户ID" width="100" align="center" />
        <el-table-column
          prop="loginName"
          label="用户名"
          min-width="120"
          align="center"
        />
        <el-table-column
          prop="name"
          label="昵称"
          min-width="120"
          align="center"
        />
        <el-table-column
          prop="loginTime"
          label="最近登录时间"
          min-width="150"
          align="center"
        />
        <el-table-column label="状态" width="120" align="center">
          <template #default="scope">
            <span
              :class="[
                'status-tag',
                scope.row.state === 1 ? 'status-normal' : 'status-abnormal'
              ]"
            >
              {{ scope.row.state === 1 ? "正常" : "禁用" }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center">
          <template #default>
            <el-button link type="primary" class="op-link">修改</el-button>
            <el-button link type="primary" class="op-link">重置密码</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination Section -->
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
.backend-user-container {
  background: transparent;
  width: 100%;
  min-height: 100%;

  .border-radius-16 {
    border-radius: 16px !important;
  }

  .main-card {
    padding: 10px;
    height: calc(100vh - 140px);
    display: flex;
    flex-direction: column;

    :deep(.el-card__body) {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
    }

    .filter-wrapper {
      flex-shrink: 0;
      .search-input {
        width: 280px;
        :deep(.el-input__wrapper) {
          background-color: #f7f8fa;
          box-shadow: none;
          border-radius: 8px;
          height: 40px;
        }
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
      height: 64px;
      td {
        border-bottom: 1px solid #f0f0f0;
      }
    }

    .role-text {
      color: #333;
      text-decoration: underline;
      cursor: pointer;
      &:hover {
        color: #0076fe;
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
      &.el-button--danger {
        color: #ef4444;
      }
    }
  }

  .pagination-wrapper {
    flex-shrink: 0;
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
}
</style>
