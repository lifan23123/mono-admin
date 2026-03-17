<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import UserIcon from "~icons/ep/user";
import MessageIcon from "~icons/ep/message";
import PhoneIcon from "~icons/ep/iphone";

defineOptions({
  name: "UserManagement"
});

const searchQuery = ref("");
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(120);

const tableData = ref(
  Array.from({ length: 10 }).map((_, i) => ({
    id: i + 1,
    nickname: "admin01",
    avatarInitial: "王",
    account: i % 2 === 0 ? "980826418376@163.com" : "15765653566",
    accountType: i % 2 === 0 ? "email" : "phone",
    region: "8.210.146.33",
    registerTime: "2026-03-11 13:42:54",
    lastLogin: "2026-03-11 13:42:54",
    status: "正常"
  }))
);

const handleSizeChange = (val: number) => {
  console.log(`${val} items per page`);
};
const handleCurrentChange = (val: number) => {
  console.log(`current page: ${val}`);
};

// Dialog visibility state
const passwordDialogVisible = ref(false);
const ipDialogVisible = ref(false);

// Form Data
const passwordForm = reactive({
  newPassword: ""
});

const ipForm = reactive({
  ips: ""
});

const currentItem = ref<any>(null);

// Dialog handlers
const openPasswordDialog = (row: any) => {
  currentItem.value = row;
  passwordForm.newPassword = "";
  passwordDialogVisible.value = true;
};

const openIpDialog = (row: any) => {
  currentItem.value = row;
  ipForm.ips = "";
  ipDialogVisible.value = true;
};

const submitPassword = () => {
  console.log("Submit Password for:", currentItem.value.nickname, passwordForm.newPassword);
  passwordDialogVisible.value = false;
};

const submitIp = () => {
  console.log("Submit IPs for:", currentItem.value.nickname, ipForm.ips);
  ipDialogVisible.value = false;
};
</script>

<template>
  <div class="user-management-container p-4">
    <el-card shadow="never" class="main-card border-none border-radius-16">
      <!-- Search Filter Area -->
      <div class="filter-wrapper mb-6">
        <div class="flex items-center">
          <span class="mr-4 text-sm text-gray-600">用户</span>
          <el-input
            v-model="searchQuery"
            placeholder="昵称/账号/ID"
            class="search-input"
            clearable
          />
        </div>
      </div>

      <!-- Table Section -->
      <el-table 
        :data="tableData" 
        style="width: 100%" 
        class="custom-table flex-1"
        height="100%"
      >
        <el-table-column type="selection" width="55" align="center" />
        
        <el-table-column label="用户" min-width="150">
          <template #default="scope">
            <div class="flex items-center">
              <div class="avatar-circle mr-3">
                {{ scope.row.avatarInitial }}
              </div>
              <span class="text-gray-700 font-medium">{{ scope.row.nickname }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="账号/邮箱/手机号" min-width="220">
          <template #default="scope">
            <div class="flex items-center text-gray-500">
              <component 
                :is="useRenderIcon(scope.row.accountType === 'email' ? MessageIcon : UserIcon)" 
                class="mr-2 text-base"
              />
              <span>{{ scope.row.account }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="region" label="地区/IP" min-width="150" align="center" />
        
        <el-table-column prop="registerTime" label="注册时间" min-width="180" align="center" />
        
        <el-table-column prop="lastLogin" label="最近登录" min-width="180" align="center" />

        <el-table-column label="账号状态" width="120" align="center">
          <template #default="scope">
            <span class="status-tag status-normal">
              {{ scope.row.status }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="280" align="center">
          <template #default="scope">
            <el-button link type="primary" class="op-link" @click="openPasswordDialog(scope.row)">编辑密码</el-button>
            <el-button link type="success" class="op-link">开启特权</el-button>
            <el-button link type="warning" class="op-link" @click="openIpDialog(scope.row)">绑定IP</el-button>
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

    <!-- Edit Password Dialog -->
    <el-dialog
      v-model="passwordDialogVisible"
      title="编辑密码"
      width="440px"
      align-center
      class="custom-dialog"
    >
      <el-form label-position="top">
        <el-form-item label="新密码">
          <el-input 
            v-model="passwordForm.newPassword" 
            placeholder="请输入新密码" 
            type="password"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="passwordDialogVisible = false" class="cancel-btn">取消</el-button>
          <el-button type="primary" @click="submitPassword" class="submit-btn ml-4">新增</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Bind IP Dialog -->
    <el-dialog
      v-model="ipDialogVisible"
      title="绑定IP"
      width="440px"
      align-center
      class="custom-dialog"
    >
      <el-form label-position="top">
        <el-form-item label="绑定IP">
          <el-input
            v-model="ipForm.ips"
            type="textarea"
            :rows="6"
            placeholder="请输入绑定IP，多个IP逗号分隔 例如:127.0.0.1,127.0.0.1,127.0.0.1"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="ipDialogVisible = false" class="cancel-btn">取消</el-button>
          <el-button type="primary" @click="submitIp" class="submit-btn ml-4">保存</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.user-management-container {
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

    .avatar-circle {
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

    .status-tag {
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 12px;
      
      &.status-normal {
        background-color: #ecfdf5;
        color: #10b981;
      }
    }

    .op-link {
      font-weight: 500;
      margin: 0 8px;
      padding: 0;
      
      &.el-button--primary { color: #0076fe; }
      &.el-button--success { color: #10b981; }
      &.el-button--warning { color: #f59e0b; }
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
</style>
