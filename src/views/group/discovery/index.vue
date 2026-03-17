<script setup lang="ts">
import { ref, reactive } from "vue";

defineOptions({
  name: "DiscoveryManage"
});

const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(10);

const tableData = ref([
  {
    id: 1,
    icon: "王",
    name: "admin01",
    url: "https://baidu.com"
  }
]);

// Dialog visibility state
const addDialogVisible = ref(false);

// Form Data
const addForm = reactive({
  name: "",
  url: "",
  iconFile: null
});

const handleSizeChange = (val: number) => {
  console.log(`${val} items per page`);
};

const handleCurrentChange = (val: number) => {
  console.log(`current page: ${val}`);
};

const openAddDialog = () => {
  addForm.name = "";
  addForm.url = "";
  addForm.iconFile = null;
  addDialogVisible.value = true;
};

const submitAdd = () => {
  console.log("Submit Discovery Item:", addForm);
  addDialogVisible.value = false;
};

const handleDelete = (row: any) => {
  console.log("Delete discovery item:", row.id);
};

const handleEdit = (row: any) => {
  console.log("Edit discovery item:", row.id);
};
</script>

<template>
  <div class="discovery-manage-container p-4">
    <el-card shadow="never" class="main-card border-none border-radius-16">
      <!-- Header Action Area -->
      <div class="header-action mb-6 flex justify-end">
        <el-button type="primary" class="add-btn px-8" @click="openAddDialog">
          新增
        </el-button>
      </div>

      <!-- Table Section -->
      <el-table 
        :data="tableData" 
        style="width: 100%" 
        class="custom-table flex-1"
        height="100%"
      >
        <el-table-column prop="id" label="序号" width="100" align="center" />
        <el-table-column label="图标" width="160" align="center">
          <template #default="scope">
            <div class="flex justify-center">
              <div class="discovery-avatar">
                {{ scope.row.icon }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="150" align="center" />
        <el-table-column prop="url" label="URL" min-width="250" align="center" />
        <el-table-column label="操作" width="150" align="center">
          <template #default="scope">
            <el-button link type="primary" class="op-link" @click="handleEdit(scope.row)">
              编辑
            </el-button>
            <el-button link type="danger" class="op-link ml-2" @click="handleDelete(scope.row)">
              删除
            </el-button>
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

    <!-- New Item Dialog -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增"
      width="440px"
      align-center
      class="custom-dialog"
    >
      <el-form label-position="top">
        <el-form-item label="名称">
          <el-input 
            v-model="addForm.name" 
            placeholder="请输入名称" 
          />
        </el-form-item>
        <el-form-item label="名称">
          <el-input 
            v-model="addForm.url" 
            placeholder="请输入名称" 
          />
        </el-form-item>
        <el-form-item label="图片">
          <div class="upload-placeholder">
            <div class="icon-upload-box">
              <span class="plus-icon">+</span>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="addDialogVisible = false" class="cancel-btn">取消</el-button>
          <el-button type="primary" @click="submitAdd" class="submit-btn ml-4">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.discovery-manage-container {
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

    .add-btn {
      height: 40px;
      border-radius: 8px;
      background-color: #0076fe;
      border: none;
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

    .discovery-avatar {
      width: 32px;
      height: 32px;
      background-color: #0076fe;
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: bold;
    }

    .op-link {
      font-weight: 500;
      padding: 0;
      
      &.el-button--primary { color: #0076fe; }
      &.el-button--danger { color: #ef4444; }
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
    border: none;
  }

  .icon-upload-box {
    width: 120px;
    height: 120px;
    background-color: #f7f8fa;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: 1px solid #dcdfe6;
    
    .plus-icon {
      font-size: 40px;
      color: #909399;
      font-weight: 300;
    }

    &:hover {
      border-color: #0076fe;
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: center;
    padding: 20px 0 10px;
    
    .el-button {
      height: 44px;
      border-radius: 12px;
      padding: 0 45px;
      font-size: 16px;
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
</style>
