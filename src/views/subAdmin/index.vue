<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import WarningFilled from "~icons/ep/warning-filled";

defineOptions({
  name: "SubAdmin"
});

const searchQuery = ref("");
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(120);

const tableData = ref([
  {
    index: "01",
    account: "admin01",
    companyId: "IM980826418376",
    remark: "测试测试",
    createTime: "2026/3/14 22:21:38",
    status: "正常"
  },
  {
    index: "02",
    account: "admin01",
    companyId: "IM980826418376",
    remark: "测试测试",
    createTime: "2026/3/14 22:21:38",
    status: "异常"
  },
  {
    index: "03",
    account: "admin01",
    companyId: "IM980826418376",
    remark: "测试测试",
    createTime: "2026/3/14 22:21:38",
    status: "正常"
  },
  {
    index: "04",
    account: "admin01",
    companyId: "IM980826418376",
    remark: "测试测试",
    createTime: "2026/3/14 22:21:38",
    status: "正常"
  },
  {
    index: "05",
    account: "admin01",
    companyId: "IM980826418376",
    remark: "测试测试",
    createTime: "2026/3/14 22:21:38",
    status: "正常"
  },
  {
    index: "06",
    account: "admin01",
    companyId: "IM980826418376",
    remark: "测试测试",
    createTime: "2026/3/14 22:21:38",
    status: "正常"
  },
  {
    index: "07",
    account: "admin01",
    companyId: "IM980826418376",
    remark: "测试测试",
    createTime: "2026/3/14 22:21:38",
    status: "正常"
  },
  {
    index: "08",
    account: "admin01",
    companyId: "IM980826418376",
    remark: "测试测试",
    createTime: "2026/3/14 22:21:38",
    status: "正常"
  },
  {
    index: "09",
    account: "admin01",
    companyId: "IM980826418376",
    remark: "测试测试",
    createTime: "2026/3/14 22:21:38",
    status: "正常"
  },
  {
    index: "10",
    account: "admin01",
    companyId: "IM980826418376",
    remark: "测试测试",
    createTime: "2026/3/14 22:21:38",
    status: "正常"
  }
]);

const handleSizeChange = (val: number) => {
  console.log(`${val} items per page`);
};
const handleCurrentChange = (val: number) => {
  console.log(`current page: ${val}`);
};

// Dialog visibility state
const addDialogVisible = ref(false);
const editDialogVisible = ref(false);
const deleteDialogVisible = ref(false);

// Form Data
const addForm = reactive({
  account: "",
  password: "",
  remark: ""
});

const editForm = reactive({
  account: "",
  newPassword: "",
  remark: ""
});

const currentItem = ref<any>(null);

// Dialog handlers
const openAddDialog = () => {
  addForm.account = "";
  addForm.password = "";
  addForm.remark = "";
  addDialogVisible.value = true;
};

const openEditDialog = (row: any) => {
  editForm.account = row.account;
  editForm.newPassword = "";
  editForm.remark = row.remark;
  editDialogVisible.value = true;
};

const openDeleteDialog = (row: any) => {
  currentItem.value = row;
  deleteDialogVisible.value = true;
};

const submitAdd = () => {
  console.log("Submit Add:", addForm);
  addDialogVisible.value = false;
};

const submitEdit = () => {
  console.log("Submit Edit:", editForm);
  editDialogVisible.value = false;
};

const submitDelete = () => {
  console.log("Confirm Delete:", currentItem.value);
  deleteDialogVisible.value = false;
};
</script>

<template>
  <div class="sub-admin-container p-4">
    <!-- Blue Header Bar -->
    <div class="company-header mb-4">
      <span class="text-lg font-bold">山西太原XXX公司</span>
    </div>

    <el-card shadow="never" class="table-card border-none border-radius-16">
      <!-- Search and Add Area -->
      <div class="filter-wrapper mb-6 flex justify-between items-center">
        <div class="search-box flex items-center">
          <span class="mr-4 text-sm text-gray-600">账号</span>
          <el-input
            v-model="searchQuery"
            placeholder="请输入子账号登录名"
            class="search-input mr-4"
            clearable
          />
          <el-button type="primary" class="search-btn px-6">搜索</el-button>
        </div>
        <el-button type="primary" class="add-btn px-6" @click="openAddDialog">
          新增子账号
        </el-button>
      </div>

      <!-- Table Section -->
      <el-table 
        :data="tableData" 
        style="width: 100%" 
        class="custom-table flex-1"
        height="100%"
      >
        <el-table-column prop="index" label="序列" width="100" align="center" />
        <el-table-column prop="account" label="账号" min-width="120" align="center" />
        <el-table-column prop="companyId" label="公司ID" min-width="180" align="center" />
        <el-table-column prop="remark" label="备注" min-width="180" align="center" />
        <el-table-column prop="createTime" label="创建时间" min-width="180" align="center" />
        <el-table-column label="状态" width="120" align="center">
          <template #default="scope">
            <span
              :class="[
                'status-tag',
                scope.row.status === '正常' ? 'status-normal' : 'status-abnormal'
              ]"
            >
              {{ scope.row.status }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" align="center">
          <template #default="scope">
            <el-button link type="primary" class="op-link" @click="openEditDialog(scope.row)">编辑</el-button>
            <el-button link type="primary" class="op-link">查看</el-button>
            <el-button link type="warning" class="op-link">禁用</el-button>
            <el-button link type="danger" class="op-link" @click="openDeleteDialog(scope.row)">删除</el-button>
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

    <!-- Add Sub-account Dialog -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增子账号"
      width="440px"
      align-center
      class="custom-dialog"
    >
      <el-form label-position="top" :model="addForm">
        <el-form-item label="账号">
          <el-input v-model="addForm.account" placeholder="请输入子账号登录名" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input
            v-model="addForm.password"
            type="password"
            show-password
            placeholder="请输入密码"
          />
        </el-form-item>
        <el-form-item label="备注(选填)">
          <el-input
            v-model="addForm.remark"
            placeholder="如:客服A、运营张三"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addDialogVisible = false" class="cancel-btn">取消</el-button>
          <el-button type="primary" @click="submitAdd" class="submit-btn ml-4">新增</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Edit Sub-account Dialog -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑子账号"
      width="440px"
      align-center
      class="custom-dialog"
    >
      <el-form label-position="top" :model="editForm">
        <el-form-item label="账号">
          <el-input v-model="editForm.account" disabled />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input
            v-model="editForm.newPassword"
            type="password"
            show-password
            placeholder="留空则不修改"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="editForm.remark"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="editDialogVisible = false" class="cancel-btn">取消</el-button>
          <el-button type="primary" @click="submitEdit" class="submit-btn ml-4">新增</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Delete Confirmation Dialog -->
    <el-dialog
      v-model="deleteDialogVisible"
      width="400px"
      align-center
      class="custom-dialog delete-dialog"
      :show-close="false"
    >
      <div class="delete-content text-center py-4">
        <div class="warning-icon-wrapper mb-4">
          <component :is="useRenderIcon(WarningFilled)" class="text-6xl text-red-500" />
        </div>
        <div class="text-xl font-bold text-gray-800 mb-2">确认删除</div>
        <div class="text-gray-500">确定要删除子账号「{{ currentItem?.account }}」吗？</div>
        <div class="text-gray-500">删除后无法恢复</div>
      </div>
      <template #footer>
        <div class="dialog-footer flex justify-center pb-4">
          <el-button @click="deleteDialogVisible = false" class="cancel-btn w-32">取消</el-button>
          <el-button type="primary" @click="submitDelete" class="submit-btn w-32 ml-4">确认删除</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.sub-admin-container {
  background: transparent;
  width: 100%;
  min-height: 100%;

  .company-header {
    background: #eef2ff;
    padding: 16px 24px;
    border-radius: 12px;
    color: #333;
  }

  .border-radius-16 {
    border-radius: 16px !important;
  }

  .table-card {
    padding: 8px;
    height: calc(100vh - 210px);
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
        width: 240px;
        :deep(.el-input__wrapper) {
          background-color: #f7f8fa;
          box-shadow: none;
          border-radius: 8px;
          height: 40px;
        }
      }
      
      .search-btn,
      .add-btn {
        height: 40px;
        border-radius: 8px;
        background-color: #0076fe;
        border: none;
      }
    }
  }

  .custom-table {
    :deep(.el-table__header-wrapper) {
      th {
        background-color: #f7f8fa !important;
        color: #909399;
        font-weight: 500;
        height: 48px;
        border: none;
      }
    }

    :deep(.el-table__row) {
      height: 56px;
      td {
        border-bottom: 1px solid #f0f0f0;
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
      margin: 0 4px;
      padding: 0;
      
      &.el-button--primary { color: #0076fe; }
      &.el-button--warning { color: #f59e0b; }
      &.el-button--danger { color: #ef4444; }
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
    
    .btn-prev, .btn-next {
      background: none;
      border: 1px solid #e4e7ed;
      border-radius: 4px;
    }
  }

  .pagination-wrapper {
    flex-shrink: 0;
  }
}

/* Dialog Styles */
:deep(.custom-dialog) {
  border-radius: 20px;
  overflow: hidden;
  
  .el-dialog__header {
    margin-right: 0;
    padding: 24px 24px 12px;
    .el-dialog__title {
      font-weight: bold;
      font-size: 18px;
    }
  }
  
  .el-dialog__body {
    padding: 12px 24px 24px;
  }
  
  .el-form-item__label {
    color: #333;
    font-weight: 500;
    padding-bottom: 8px;
  }
  
  .el-input__wrapper {
    background-color: #f7f8fa;
    box-shadow: none;
    border-radius: 8px;
    height: 48px;
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
    padding: 0 0 10px;
    
    .el-button {
      height: 44px;
      border-radius: 8px;
      padding: 0 32px;
    }
    
    .cancel-btn {
      border: 1px solid #dcdfe6;
      color: #606266;
    }
    
    .submit-btn {
      background-color: #0076fe;
      border: none;
      &:hover {
        background-color: #3391ff;
      }
    }
  }
}

.delete-dialog {
  .delete-content {
    .warning-icon-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  :deep(.el-dialog__footer) {
    .dialog-footer {
      justify-content: center !important;
    }
  }

  .submit-btn {
    background-color: #0076fe !important;
  }
}
</style>
