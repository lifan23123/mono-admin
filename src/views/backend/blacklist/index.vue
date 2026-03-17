<script setup lang="ts">
import { ref, reactive } from "vue";

defineOptions({
  name: "BackendBlacklist"
});

const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(10);

const tableData = ref([
  {
    id: 1,
    ip: "1.1.1.1",
    remark: "超级管理员"
  }
]);

// Dialog visibility state
const addDialogVisible = ref(false);

// Form Data
const addForm = reactive({
  ip: "",
  remark: ""
});

const handleSizeChange = (val: number) => {
  console.log(`${val} items per page`);
};

const handleCurrentChange = (val: number) => {
  console.log(`current page: ${val}`);
};

const openAddDialog = () => {
  addForm.ip = "";
  addForm.remark = "";
  addDialogVisible.value = true;
};

const submitAdd = () => {
  console.log("Submit Blacklist IP:", addForm);
  addDialogVisible.value = false;
};

const handleDelete = (row: any) => {
  console.log("Delete IP:", row.ip);
};
</script>

<template>
  <div class="backend-blacklist-container p-4">
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
        <el-table-column prop="ip" label="IP地址" min-width="150" align="center" />
        <el-table-column prop="remark" label="备注" min-width="200" align="center" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="scope">
            <el-button link type="danger" class="op-link" @click="handleDelete(scope.row)">
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

    <!-- Add IP Dialog -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增"
      width="440px"
      align-center
      class="custom-dialog"
    >
      <el-form label-position="top">
        <el-form-item label="IP地址">
          <el-input 
            v-model="addForm.ip" 
            placeholder="需要加黑名单得IP地址示例：192.168.32.31" 
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input 
            v-model="addForm.remark" 
            placeholder="请输入备注（可不填写）" 
            type="textarea"
            :rows="4"
          />
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
.backend-blacklist-container {
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

    .op-link {
      font-weight: 500;
      color: #ef4444;
      padding: 0;
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
  
  .el-input__wrapper, .el-textarea__inner {
    background-color: #f7f8fa;
    box-shadow: none;
    border-radius: 8px;
    border: none;
  }

  .el-input__wrapper {
    height: 48px;
  }

  .el-textarea__inner {
    padding: 12px;
    resize: none;
  }

  .dialog-footer {
    display: flex;
    justify-content: center;
    padding: 0 0 10px;
    
    .el-button {
      height: 44px;
      border-radius: 8px;
      padding: 0 45px;
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
