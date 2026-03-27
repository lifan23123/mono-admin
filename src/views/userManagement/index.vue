<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { getUserList, getUserUpdate } from "@/api/user";
import { message } from "@/utils/message";
import { type FormInstance, ElMessageBox } from "element-plus";
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

const tableData = ref([]);
const loading = ref(false);

const fetchUserList = async () => {
  loading.value = true;
  try {
    const { data } = await getUserList({
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      searchKey: searchQuery.value
    });
    if (data) {
      if (Array.isArray(data)) {
        tableData.value = data;
        total.value = data.length;
      } else if (data.list) {
        tableData.value = data.list;
        total.value = data.total || 0;
      }
    }
  } catch (error) {
    console.error("Failed to fetch user list:", error);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchUserList();
});

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  fetchUserList();
};
const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  fetchUserList();
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchUserList();
};

// Dialog visibility state
const passwordDialogVisible = ref(false);
const ipDialogVisible = ref(false);

// Form Refs
const passwordFormRef = ref<FormInstance>();
const ipFormRef = ref<FormInstance>();

// Form Data
const passwordForm = reactive({
  loginPassword: ""
});

const ipForm = reactive({
  bindIp: ""
});

const currentItem = ref<any>(null);

// Validation Rules
const passwordRules = reactive({
  loginPassword: [{ required: true, message: "请输入新密码", trigger: "blur" }]
});

const ipRules = reactive({
  bindIp: [{ required: true, message: "请输入绑定IP", trigger: "blur" }]
});

// Dialog handlers
const openPasswordDialog = (row: any) => {
  currentItem.value = row;
  passwordForm.loginPassword = "";
  passwordDialogVisible.value = true;
  passwordFormRef.value?.clearValidate();
};

const openIpDialog = (row: any) => {
  currentItem.value = row;
  ipForm.bindIp = row.bindIp || "";
  ipDialogVisible.value = true;
  ipFormRef.value?.clearValidate();
};

const submitPassword = async () => {
  if (!passwordFormRef.value) return;
  await passwordFormRef.value.validate(async valid => {
    if (valid) {
      try {
        const res = await getUserUpdate({
          id: currentItem.value.id,
          pwd: passwordForm.loginPassword
        });
        if ((res as any).code === "0000") {
          message("密码修改成功", { type: "success" });
          passwordDialogVisible.value = false;
          fetchUserList();
        } else {
          message((res as any).message || "修改失败", { type: "error" });
        }
      } catch (e) {
        message("操作异常", { type: "error" });
      }
    }
  });
};

const submitIp = async () => {
  if (!ipFormRef.value) return;
  await ipFormRef.value.validate(async valid => {
    if (valid) {
      try {
        const res = await getUserUpdate({
          id: currentItem.value.id,
          bindIp: ipForm.bindIp
        });
        if ((res as any).code === "0000") {
          message("IP绑定成功", { type: "success" });
          ipDialogVisible.value = false;
          fetchUserList();
        } else {
          message((res as any).message || "绑定失败", { type: "error" });
        }
      } catch (e) {
        message("操作异常", { type: "error" });
      }
    }
  });
};

const handleToggleTequan = (row: any) => {
  const isEnabling = row.isTequan !== 1;
  const newState = isEnabling ? 1 : 0;
  const actionText = isEnabling ? "开启特权" : "关闭特权";

  ElMessageBox.confirm(
    `确认要为用户“${row.name || row.nickname}”${actionText}吗？`,
    "提示",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning"
    }
  ).then(async () => {
    try {
      const res = await getUserUpdate({
        id: row.id,
        isTequan: newState
      });
      if ((res as any).code === "0000") {
        message(`${actionText}成功`, { type: "success" });
        fetchUserList();
      } else {
        message((res as any).message || `${actionText}失败`, { type: "error" });
      }
    } catch (e) {
      message("操作异常", { type: "error" });
    }
  });
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
            class="search-input mr-4"
            clearable
            @keyup.enter="handleSearch"
          />
          <el-button
            type="primary"
            class="search-btn ml-4 px-6"
            @click="handleSearch"
            >搜索</el-button
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
        <el-table-column type="selection" width="55" align="center" />

        <el-table-column label="用户" min-width="150">
          <template #default="scope">
            <div class="flex items-center">
              <el-image
                v-if="scope.row.icon"
                :src="scope.row.icon"
                class="avatar-wrapper mr-3"
                fit="cover"
              >
                <template #error>
                  <div class="avatar-wrapper avatar-text mr-3">
                    {{
                      (scope.row.name || scope.row.nickname || "用").substring(
                        0,
                        1
                      )
                    }}
                  </div>
                </template>
              </el-image>
              <div v-else class="avatar-wrapper avatar-text mr-3">
                {{
                  (scope.row.name || scope.row.nickname || "用").substring(0, 1)
                }}
              </div>
              <span class="text-gray-700 font-medium">{{
                scope.row.name || scope.row.nickname
              }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="账号/邮箱/手机号" min-width="220">
          <template #default="scope">
            <div class="flex items-center text-gray-500">
              <component :is="useRenderIcon(UserIcon)" class="mr-2 text-base" />
              <span>{{ scope.row.loginName || scope.row.account }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="loginIp"
          label="地区/IP"
          min-width="150"
          align="center"
        />

        <el-table-column
          prop="createTime"
          label="注册时间"
          min-width="180"
          align="center"
        />

        <el-table-column
          prop="loginTime"
          label="最近登录"
          min-width="180"
          align="center"
        />

        <el-table-column label="账号状态" width="120" align="center">
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

        <el-table-column label="操作" width="280" align="center">
          <template #default="scope">
            <el-button
              link
              type="primary"
              class="op-link"
              @click="openPasswordDialog(scope.row)"
              >编辑密码</el-button
            >
            <el-button
              link
              :type="scope.row.isTequan === 1 ? 'danger' : 'success'"
              class="op-link"
              @click="handleToggleTequan(scope.row)"
            >
              {{ scope.row.isTequan === 1 ? "关闭特权" : "开启特权" }}
            </el-button>
            <el-button
              link
              type="warning"
              class="op-link"
              @click="openIpDialog(scope.row)"
              >绑定IP</el-button
            >
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

    <el-dialog
      v-model="passwordDialogVisible"
      title="编辑密码"
      width="440px"
      align-center
      class="custom-dialog"
    >
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-position="top"
      >
        <el-form-item label="新密码" prop="loginPassword">
          <el-input
            v-model="passwordForm.loginPassword"
            placeholder="请输入新密码"
            type="password"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="passwordDialogVisible = false" class="cancel-btn"
            >取消</el-button
          >
          <el-button
            type="primary"
            @click="submitPassword"
            class="submit-btn ml-4"
            >保存</el-button
          >
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
      <el-form
        ref="ipFormRef"
        :model="ipForm"
        :rules="ipRules"
        label-position="top"
      >
        <el-form-item label="绑定IP" prop="bindIp">
          <el-input
            v-model="ipForm.bindIp"
            type="textarea"
            :rows="6"
            placeholder="请输入绑定IP，多个IP逗号分隔 例如:127.0.0.1,127.0.0.1,127.0.0.1"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="ipDialogVisible = false" class="cancel-btn"
            >取消</el-button
          >
          <el-button type="primary" @click="submitIp" class="submit-btn ml-4"
            >保存</el-button
          >
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

      .search-btn {
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

  .el-input__wrapper,
  .el-textarea__inner {
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
