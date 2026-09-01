<script setup lang="ts">
import { ref, reactive, onMounted, shallowRef, onBeforeUnmount, computed } from "vue";
import { ElMessage } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import WarningFilled from "~icons/ep/warning-filled";
import "@wangeditor/editor/dist/css/style.css";
import { Editor, Toolbar } from "@wangeditor/editor-for-vue";
import type { IEditorConfig, IToolbarConfig } from "@wangeditor/editor";
import { uploadToQiniu } from "@/utils/upload";
import { useUserStoreHook } from "@/store/modules/user";
import {
  getAnnouncementList,
  getAnnouncementCreate,
  getAnnouncementUpdate,
  getAnnouncementDelete,
  getAnnouncementDetail,
  getSubAccountList
} from "@/api/user";

defineOptions({
  name: "NoticeManagement"
});

/** 是否是普通角色 */
const isCommonRole = computed(() => useUserStoreHook().roles.includes("common"));

// 公司子账号选项
const companyOptions = ref<{ label: string; value: string }[]>([]);
const companyLoading = ref(false);

const fetchCompanyOptions = async (query = "") => {
  if (isCommonRole.value) return;
  companyLoading.value = true;
  try {
    const { data } = await getSubAccountList({
      pageNo: 1,
      pageSize: 50,
      type: 2,
      loginName: query
    });
    let list = [];
    if (data) {
      list = Array.isArray(data) ? data : data.list || [];
    }
    const seen = new Set<string>();
    companyOptions.value = list
      .filter((item: any) => {
        const resp = item.imsUserManagerResp;
        if (!resp || !resp.companyId) return false;
        if (seen.has(String(resp.companyId))) return false;
        seen.add(String(resp.companyId));
        return true;
      })
      .map((item: any) => ({
        label: item.imsUserManagerResp.loginName || "未命名",
        value: String(item.imsUserManagerResp.companyId)
      }));
  } catch (error) {
    console.error("Failed to fetch company options:", error);
  } finally {
    companyLoading.value = false;
  }
};

const handleCompanyRemoteSearch = (query: string) => {
  if (isCommonRole.value) return;
  fetchCompanyOptions(query);
};

// 列表查询条件
const searchName = ref("");
const searchState = ref<number | string>("");
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const tableData = ref<any[]>([]);
const loading = ref(false);

// 富文本编辑器实例
const editorRef = shallowRef();
const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: ["uploadVideo", "insertVideo", "group-video"]
};
const editorConfig: Partial<IEditorConfig> = {
  placeholder: "请输入公告正文内容...",
  MENU_CONF: {
    uploadImage: {
      async customUpload(file: File, insertFn: any) {
        try {
          const imgUrl = await uploadToQiniu(file);
          insertFn(imgUrl, file.name, imgUrl);
          ElMessage.success("图片上传成功");
        } catch (error: any) {
          console.error("七牛上传失败:", error);
          ElMessage.error(error?.message || "图片上传失败");
        }
      }
    }
  }
};

// 组件销毁时销毁编辑器
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor == null) return;
  editor.destroy();
});

const handleCreated = (editor: any) => {
  editorRef.value = editor;
};

// 获取公告列表
const fetchList = async () => {
  loading.value = true;
  try {
    const params: any = {
      pageNo: currentPage.value,
      pageSize: pageSize.value
    };
    if (searchName.value.trim()) {
      params.name = searchName.value.trim();
    }
    if (searchState.value !== "") {
      params.state = Number(searchState.value);
    }

    const { data } = await getAnnouncementList(params);
    if (data) {
      if (Array.isArray(data)) {
        tableData.value = data;
        total.value = data.length;
      } else if (data.list) {
        tableData.value = data.list;
        total.value = data.total || 0;
      } else {
        tableData.value = [];
        total.value = 0;
      }
    } else {
      tableData.value = [];
      total.value = 0;
    }
  } catch (error) {
    console.error("获取公告列表失败:", error);
    ElMessage.error("获取公告列表失败");
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchList();
  if (!isCommonRole.value) {
    fetchCompanyOptions();
  }
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

// 新增/编辑弹窗状态
const dialogVisible = ref(false);
const dialogTitle = ref("新增公告");
const isEdit = ref(false);
const submitLoading = ref(false);
const draftLoading = ref(false);

// 表单数据
const formData = reactive({
  id: null as number | null,
  name: "",
  icon: "",
  content: "",
  companyId: "" as string | number,
  state: 1
});

const resetForm = () => {
  formData.id = null;
  formData.name = "";
  formData.icon = "";
  formData.content = "";
  formData.companyId = "";
  formData.state = 1;
};

// 打开新增弹窗
const openAddDialog = () => {
  resetForm();
  isEdit.value = false;
  dialogTitle.value = "新增公告";
  if (!isCommonRole.value) {
    fetchCompanyOptions();
  }
  dialogVisible.value = true;
};

// 打开编辑弹窗
const handleEdit = async (row: any) => {
  isEdit.value = true;
  dialogTitle.value = "编辑公告";
  resetForm();
  formData.id = row.id;
  formData.name = row.name || "";
  formData.icon = row.icon || "";
  formData.content = row.content || "";
  formData.companyId =
    row.companyId && String(row.companyId) !== "-1"
      ? String(row.companyId)
      : "";
  formData.state = typeof row.state === "number" ? row.state : 1;
  if (!isCommonRole.value) {
    fetchCompanyOptions();
  }
  dialogVisible.value = true;

  if (row.id) {
    try {
      const res = await getAnnouncementDetail({ id: row.id });
      if (res?.data) {
        const detail = res.data;
        formData.name = detail.name || formData.name;
        formData.icon = detail.icon || formData.icon;
        formData.content = detail.content || formData.content;
        if (detail.companyId !== undefined && detail.companyId !== null) {
          formData.companyId =
            String(detail.companyId) !== "-1" ? String(detail.companyId) : "";
        }
        if (typeof detail.state === "number") {
          formData.state = detail.state;
        }
      }
    } catch (e) {
      console.warn("获取公告详情失败，采用列表行数据:", e);
    }
  }
};

// 提交表单：targetState 为 1 (发布) 或 2 (存为草稿)
const submitForm = async (targetState: number = 1) => {
  if (!formData.name.trim()) {
    ElMessage.warning("请输入公告标题");
    return;
  }

  // 校验富文本内容是否为空
  const plainText = formData.content.replace(/<[^>]+>/g, "").trim();
  if (!plainText && !formData.content.includes("<img")) {
    ElMessage.warning("请输入公告正文内容");
    return;
  }

  if (targetState === 2) {
    draftLoading.value = true;
  } else {
    submitLoading.value = true;
  }

  try {
    // 若没选任何公司则 companyId 传 -1
    const companyIdVal =
      formData.companyId &&
      String(formData.companyId).trim() !== "" &&
      String(formData.companyId) !== "-1"
        ? String(formData.companyId)
        : -1;

    const payload: any = {
      name: formData.name.trim(),
      icon: formData.icon.trim(),
      content: formData.content,
      companyId: companyIdVal,
      state: targetState
    };

    if (isEdit.value && formData.id) {
      payload.id = formData.id;
      await getAnnouncementUpdate(payload);
      ElMessage.success(
        targetState === 2 ? "已保存为草稿" : "公告更新并发布成功"
      );
    } else {
      await getAnnouncementCreate(payload);
      ElMessage.success(targetState === 2 ? "草稿创建成功" : "公告发布成功");
    }
    dialogVisible.value = false;
    fetchList();
  } catch (error) {
    console.error("提交公告失败:", error);
    ElMessage.error("操作失败，请重试");
  } finally {
    submitLoading.value = false;
    draftLoading.value = false;
  }
};

// 删除弹窗状态
const deleteDialogVisible = ref(false);
const currentDeleteItem = ref<any>(null);
const deleteLoading = ref(false);

const openDeleteDialog = (row: any) => {
  currentDeleteItem.value = row;
  deleteDialogVisible.value = true;
};

const submitDelete = async () => {
  if (!currentDeleteItem.value?.id) return;
  deleteLoading.value = true;
  try {
    await getAnnouncementDelete({ id: currentDeleteItem.value.id });
    ElMessage.success("删除成功");
    deleteDialogVisible.value = false;
    fetchList();
  } catch (error) {
    console.error("删除公告失败:", error);
    ElMessage.error("删除失败");
  } finally {
    deleteLoading.value = false;
  }
};

// 详情预览弹窗
const previewVisible = ref(false);
const previewData = ref<any>({});

const handlePreview = async (row: any) => {
  previewData.value = { ...row };
  previewVisible.value = true;
  if (row.id) {
    try {
      const res = await getAnnouncementDetail({ id: row.id });
      if (res?.data) {
        previewData.value = res.data;
      }
    } catch (e) {
      console.warn("获取公告详情失败:", e);
    }
  }
};
</script>

<template>
  <div class="notice-container p-4">
    <el-card shadow="never" class="table-card border-none border-radius-16">
      <!-- Search and Add Area -->
      <div class="filter-wrapper mb-6 flex justify-between items-center">
        <div class="search-box flex items-center">
          <span class="mr-4 text-sm text-gray-600">标题</span>
          <el-input
            v-model="searchName"
            placeholder="请输入公告标题"
            class="search-input mr-4"
            clearable
            @keyup.enter="handleSearch"
          />
          <span class="mr-4 text-sm text-gray-600">状态</span>
          <el-select
            v-model="searchState"
            placeholder="全部状态"
            class="search-select mr-4"
            clearable
            @change="handleSearch"
          >
            <el-option label="全部状态" value="" />
            <el-option label="已发送" :value="1" />
            <el-option label="草稿" :value="2" />
            <el-option label="已删除" :value="3" />
          </el-select>
          <el-button
            type="primary"
            class="search-btn px-6"
            @click="handleSearch"
          >
            搜索
          </el-button>
        </div>
        <el-button type="primary" class="add-btn px-6" @click="openAddDialog">
          新增公告
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
        <el-table-column label="序列" width="80" align="center">
          <template #default="scope">
            {{ (currentPage - 1) * pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>

        <el-table-column label="封面" width="120" align="center">
          <template #default="scope">
            <div class="flex justify-center items-center">
              <el-image
                v-if="scope.row.icon"
                :src="scope.row.icon"
                :preview-src-list="[scope.row.icon]"
                preview-teleported
                class="notice-avatar-img"
                fit="cover"
              >
                <template #error>
                  <div class="notice-avatar-placeholder">
                    {{ (scope.row.name || "告").substring(0, 1) }}
                  </div>
                </template>
              </el-image>
              <div v-else class="notice-avatar-placeholder">
                {{ (scope.row.name || "告").substring(0, 1) }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="name"
          label="标题"
          min-width="200"
          align="center"
          show-overflow-tooltip
        />

        <el-table-column
          prop="visitCount"
          label="阅读量"
          min-width="100"
          align="center"
        >
          <template #default="scope">
            <span>{{ scope.row.visitCount ?? 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column
          prop="createTime"
          label="创建时间"
          min-width="180"
          align="center"
          show-overflow-tooltip
        />

        <el-table-column label="状态" width="120" align="center">
          <template #default="scope">
            <span
              :class="[
                'status-tag',
                scope.row.state === 1 ? 'status-normal' : 'status-abnormal'
              ]"
            >
              {{
                scope.row.state === 1
                  ? "已发送"
                  : scope.row.state === 2
                    ? "草稿"
                    : "已删除"
              }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="220" align="center">
          <template #default="scope">
            <!-- <el-button
              link
              type="primary"
              class="op-link"
              @click="handlePreview(scope.row)"
            >
              预览
            </el-button> -->
            <el-button
              link
              type="primary"
              class="op-link"
              @click="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              link
              type="danger"
              class="op-link"
              @click="openDeleteDialog(scope.row)"
            >
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

    <!-- 新增 / 编辑公告弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="820px"
      top="6vh"
      class="custom-dialog"
      append-to-body
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form label-position="top" class="notice-form">
        <el-form-item label="公告标题" required>
          <el-input
            v-model="formData.name"
            placeholder="请输入公告标题"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>

        <el-form-item v-if="!isCommonRole" label="公司">
          <el-select
            v-model="formData.companyId"
            placeholder="全部"
            clearable
            filterable
            remote
            :remote-method="handleCompanyRemoteSearch"
            :loading="companyLoading"
            class="w-full"
          >
            <el-option
              v-for="item in companyOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="封面图片">
          <el-input
            v-model="formData.icon"
            placeholder="请输入封面图片 URL 地址 (如 https://...)"
            clearable
          />
        </el-form-item>

        <el-form-item label="公告正文" required>
          <div class="editor-wrapper border rounded w-full">
            <Toolbar
              style="border-bottom: 1px solid #e4e7ed"
              :editor="editorRef"
              :defaultConfig="toolbarConfig"
              mode="default"
            />
            <Editor
              style="height: 340px; overflow-y: hidden"
              v-model="formData.content"
              :defaultConfig="editorConfig"
              mode="default"
              @onCreated="handleCreated"
            />
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer flex justify-end gap-3">
          <el-button @click="dialogVisible = false" class="cancel-btn"
            >取消</el-button
          >
          <el-button :loading="draftLoading" @click="submitForm(2)">
            存为草稿
          </el-button>
          <el-button
            type="primary"
            class="submit-btn"
            :loading="submitLoading"
            @click="submitForm(1)"
          >
            {{ isEdit ? "保存发布" : "立即发布" }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 公告详情预览弹窗 -->
    <el-dialog
      v-model="previewVisible"
      title="公告预览"
      width="700px"
      top="8vh"
      append-to-body
    >
      <div class="notice-preview-content">
        <h2 class="text-xl font-bold text-gray-900 mb-3 text-center">
          {{ previewData.name || "未命名公告" }}
        </h2>
        <div
          class="flex items-center justify-center gap-6 text-xs text-gray-500 mb-6 pb-3 border-b"
        >
          <span>阅读量: {{ previewData.visitCount ?? 0 }}</span>
          <span v-if="previewData.createTime"
            >创建时间: {{ previewData.createTime }}</span
          >
          <span v-if="previewData.updateTime"
            >更新时间: {{ previewData.updateTime }}</span
          >
        </div>

        <div v-if="previewData.icon" class="mb-6 flex justify-center">
          <el-image
            :src="previewData.icon"
            fit="contain"
            class="max-h-60 rounded shadow-sm"
            :preview-src-list="[previewData.icon]"
            preview-teleported
          />
        </div>

        <div
          class="notice-rich-body leading-relaxed text-gray-800"
          v-html="
            previewData.content ||
            '<p class=\'text-gray-400 text-center\'>暂无正文内容</p>'
          "
        />
      </div>
      <template #footer>
        <div class="flex justify-end">
          <el-button type="primary" @click="previewVisible = false"
            >关闭</el-button
          >
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
      append-to-body
    >
      <div class="delete-content text-center py-4">
        <div class="warning-icon-wrapper mb-4">
          <component
            :is="useRenderIcon(WarningFilled)"
            class="text-6xl text-red-500"
          />
        </div>
        <div class="text-xl font-bold text-gray-800 mb-2">确认删除</div>
        <div class="text-gray-500">
          确定要删除公告「{{
            currentDeleteItem?.name || currentDeleteItem?.id
          }}」吗？
        </div>
        <div class="text-gray-500">删除后无法恢复</div>
      </div>
      <template #footer>
        <div class="dialog-footer flex justify-center pb-4">
          <el-button
            @click="deleteDialogVisible = false"
            class="cancel-btn w-32"
          >
            取消
          </el-button>
          <el-button
            type="primary"
            :loading="deleteLoading"
            @click="submitDelete"
            class="submit-btn w-32 ml-4"
          >
            确认删除
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.notice-container {
  background: transparent;
  width: 100%;
  min-height: 100%;

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

      .search-select {
        width: 140px;
        :deep(.el-select__wrapper) {
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

  .notice-avatar-img {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    object-fit: cover;
  }

  .notice-avatar-placeholder {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    background-color: #eef2ff;
    color: #4f46e5;
    font-weight: bold;
    font-size: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
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

      &.el-button--primary {
        color: #0076fe;
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

.editor-wrapper {
  border-color: #dcdfe6;
  z-index: 100;

  :deep(.w-e-toolbar) {
    background-color: #fafafa;
  }

  :deep(.w-e-text-container) {
    background-color: #fff;
  }
}

.notice-preview-content {
  max-height: 65vh;
  overflow-y: auto;
  padding: 8px 16px;

  .notice-rich-body {
    font-size: 14px;
    line-height: 1.8;

    :deep(img) {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
      margin: 8px 0;
    }

    :deep(p) {
      margin-bottom: 8px;
    }

    :deep(ul),
    :deep(ol) {
      padding-left: 20px;
      margin-bottom: 8px;
    }
  }
}
</style>

<style lang="scss">
.delete-dialog {
  .delete-content {
    .warning-icon-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }

  .el-dialog__footer {
    .dialog-footer {
      justify-content: center !important;
    }
  }

  .submit-btn {
    background-color: #0076fe !important;
  }
}
</style>
