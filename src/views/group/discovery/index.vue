<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  getGroupDiscoveryList,
  getGroupDiscoveryAdd,
  getGroupDiscoveryUpdate,
  getGroupDiscoveryDelete
} from "@/api/user";

defineOptions({
  name: "DiscoveryManage"
});

const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const tableData = ref([]);
const loading = ref(false);

const fetchList = async () => {
  loading.value = true;
  try {
    const { data } = await getGroupDiscoveryList({
      pageNo: currentPage.value,
      pageSize: pageSize.value
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
    console.error("Failed to fetch discovery list:", error);
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

// Dialog state
const dialogVisible = ref(false);
const dialogTitle = ref("新增");
const isEdit = ref(false);
const submitLoading = ref(false);

// Form Data
const formData = reactive({
  id: null as number | null,
  name: "",
  url: "",
  icon: ""
});

const resetForm = () => {
  formData.id = null;
  formData.name = "";
  formData.url = "";
  formData.icon = "";
};

const openAddDialog = () => {
  resetForm();
  isEdit.value = false;
  dialogTitle.value = "新增";
  dialogVisible.value = true;
};

const handleEdit = (row: any) => {
  isEdit.value = true;
  dialogTitle.value = "编辑";
  formData.id = row.id;
  formData.name = row.name || "";
  formData.url = row.url || "";
  formData.icon = row.icon || "";
  dialogVisible.value = true;
};

const submitForm = async () => {
  if (!formData.name) {
    ElMessage.warning("请输入名称");
    return;
  }
  if (!formData.url) {
    ElMessage.warning("请输入URL");
    return;
  }
  submitLoading.value = true;
  try {
    const params: any = {
      name: formData.name,
      url: formData.url,
      icon: formData.icon
    };
    if (isEdit.value) {
      params.id = formData.id;
      await getGroupDiscoveryUpdate(params);
      ElMessage.success("更新成功");
    } else {
      await getGroupDiscoveryAdd(params);
      ElMessage.success("新增成功");
    }
    dialogVisible.value = false;
    fetchList();
  } catch (error) {
    console.error("Submit failed:", error);
  } finally {
    submitLoading.value = false;
  }
};

const handleDelete = (row: any) => {
  ElMessageBox.confirm("确定要删除该发现项吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      await getGroupDiscoveryDelete({ id: row.id });
      ElMessage.success("删除成功");
      fetchList();
    } catch (error) {
      console.error("Delete failed:", error);
    }
  }).catch(() => {});
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
        v-loading="loading"
        :data="tableData" 
        style="width: 100%" 
        class="custom-table flex-1"
        height="100%"
      >
        <el-table-column prop="id" label="序号" width="100" align="center" />
        <el-table-column label="图标" width="160" align="center">
          <template #default="scope">
            <div class="flex justify-center">
              <el-image 
                v-if="scope.row.icon" 
                :src="scope.row.icon" 
                class="discovery-avatar-img"
                fit="cover"
              >
                <template #error>
                  <div class="discovery-avatar-text">
                    {{ (scope.row.name || "用").substring(0,1) }}
                  </div>
                </template>
              </el-image>
              <div v-else class="discovery-avatar-text">
                {{ (scope.row.name || "用").substring(0,1) }}
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

    <!-- Add/Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="440px"
      align-center
      class="custom-dialog"
      append-to-body
    >
      <el-form label-position="top">
        <el-form-item label="名称">
          <el-input 
            v-model="formData.name" 
            placeholder="请输入名称" 
          />
        </el-form-item>
        <el-form-item label="URL">
          <el-input 
            v-model="formData.url" 
            placeholder="请输入URL" 
          />
        </el-form-item>
        <el-form-item label="图标链接">
          <el-input 
            v-model="formData.icon" 
            placeholder="请输入图标URL" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false" class="cancel-btn">取消</el-button>
          <el-button type="primary" @click="submitForm" :loading="submitLoading" class="submit-btn ml-4">保存</el-button>
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

    .discovery-avatar-img {
      width: 40px;
      height: 40px;
      border-radius: 8px;
    }

    .discovery-avatar-text {
      width: 40px;
      height: 40px;
      background-color: #0076fe;
      color: #fff;
      border-radius: 8px;
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
</style>

<style lang="scss">
.custom-dialog {
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
}
</style>
