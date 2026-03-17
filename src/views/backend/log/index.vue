<script setup lang="ts">
import { ref } from "vue";

defineOptions({
  name: "BackendLog"
});

const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(10);

const tableData = ref([
  {
    id: 1,
    username: "admin",
    nickname: "超级管理员",
    role: "超级管理员",
    ip: "超级管理员",
    device: "正常",
    loginTime: "2026-03-15 22:45:05"
  }
]);

const handleSizeChange = (val: number) => {
  console.log(`${val} items per page`);
};
const handleCurrentChange = (val: number) => {
  console.log(`current page: ${val}`);
};
</script>

<template>
  <div class="backend-log-container p-4">
    <el-card shadow="never" class="main-card border-none border-radius-16">
      <!-- Table Section -->
      <el-table 
        :data="tableData" 
        style="width: 100%" 
        class="custom-table flex-1"
        height="100%"
      >
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column prop="username" label="用户名" min-width="120" align="center" />
        <el-table-column prop="nickname" label="昵称" min-width="120" align="center" />
        <el-table-column prop="role" label="所属角色" min-width="150" align="center" />
        <el-table-column label="地区/IP" min-width="150" align="center">
          <template #default="scope">
            <span class="underline-link">{{ scope.row.ip }}</span>
          </template>
        </el-table-column>
        <el-table-column label="设备信息" min-width="120" align="center">
          <template #default="scope">
            <span class="status-tag status-normal">
              {{ scope.row.device }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="loginTime" label="登录时间" min-width="180" align="center" />
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
