<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getBackstageLoginLogList } from "@/api/user";

defineOptions({
  name: "BackendLog"
});

const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const loading = ref(false);
const tableData = ref([]);

const fetchList = async () => {
  loading.value = true;
  try {
    const res = await getBackstageLoginLogList({
      pageNo: currentPage.value,
      pageSize: pageSize.value
    });
    const { data, total: totalCount } = res as any;
    if (data) {
      tableData.value = data || [];
      total.value = totalCount || 0;
    }
  } catch (error) {
    console.error("Failed to fetch login logs:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchList();
});

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
  <div class="backend-log-container p-4">
    <el-card shadow="never" class="main-card border-none border-radius-16">
      <!-- Table Section -->
      <el-table 
        v-loading="loading"
        :data="tableData" 
        style="width: 100%" 
        class="custom-table flex-1"
        height="100%"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="loginName" label="用户名" min-width="120" align="center" />
        <el-table-column prop="userName" label="昵称" min-width="120" align="center" />
        <el-table-column prop="role" label="所属角色" min-width="150" align="center">
          <template #default="scope">
            {{ scope.row.role || '普通管理员' }}
          </template>
        </el-table-column>
        <el-table-column label="地区/IP" min-width="150" align="center">
          <template #default="scope">
            <span class="underline-link">{{ scope.row.ip }}</span>
          </template>
        </el-table-column>
        <!-- <el-table-column label="设备信息" min-width="120" align="center">
          <template #default="scope">
            <span class="status-tag status-normal">
              {{ scope.row.browser || scope.row.device || '浏览器' }}
            </span>
          </template>
        </el-table-column> -->
        <el-table-column prop="createTime" label="登录时间" min-width="180" align="center" />
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
.backend-log-container {
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

    .underline-link {
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
    
    .btn-prev, .btn-next {
      background: none;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
    }
  }
}
</style>
