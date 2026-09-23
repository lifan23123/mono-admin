<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import type { FormInstance, FormRules, UploadFile } from "element-plus";
import { ElMessageBox } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import Plus from "~icons/ep/plus";
import Delete from "~icons/ep/delete";
import Document from "~icons/ep/document";
import UploadFilled from "~icons/ep/upload-filled";
import Loading from "~icons/ep/loading";
import {
  getEmojiList,
  createEmoji,
  updateEmoji,
  deleteEmoji,
  getQiNiuDomain
} from "@/api/user";
import { uploadToQiniu } from "@/utils/upload";
import { message } from "@/utils/message";

defineOptions({
  name: "EmojiIndex"
});

// 筛选与分页
const searchName = ref("");
const searchState = ref<number | string>("");
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const tableData = ref<any[]>([]);
const loading = ref(false);

const qiniuDomain = ref("");

// 获取七牛云域名用于图片展示
const fetchQiNiuDomain = async () => {
  try {
    const res = await getQiNiuDomain();
    const { data } = res as any;
    if (data) qiniuDomain.value = data;
  } catch (e) {
    console.error("Failed to fetch qiniu domain:", e);
  }
};

const getUrl = (path: string | number) => {
  if (!path) return "";
  const strPath = String(path);
  if (strPath.startsWith("http")) return strPath;
  let domainBase = "";
  if (typeof qiniuDomain.value === "string") {
    domainBase = qiniuDomain.value;
  } else if (qiniuDomain.value && typeof qiniuDomain.value === "object") {
    domainBase = (qiniuDomain.value as any).url || "";
  }
  const domain = domainBase.replace(/\/$/, "");
  const cleanPath = strPath.startsWith("/") ? strPath : `/${strPath}`;
  return domain ? domain + cleanPath : strPath;
};

// 去除域名，提取相对路径用于接口传参（如 emoji/xxx.png）
const extractPath = (urlOrPath: string) => {
  if (!urlOrPath) return "";
  let path = urlOrPath;
  try {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      const urlObj = new URL(path);
      path = urlObj.pathname;
    }
  } catch (e) {}
  return path.replace(/^\/+/, "");
};

// 获取表情列表
const fetchList = async () => {
  loading.value = true;
  try {
    const res = await getEmojiList({
      pageNo: currentPage.value,
      pageSize: pageSize.value,
      name: searchName.value || undefined,
      state: searchState.value !== "" ? searchState.value : undefined
    });

    const data = res?.data;
    if (Array.isArray(data)) {
      tableData.value = data;
      total.value = res.total ?? data.length;
    } else if (data?.list) {
      tableData.value = data.list;
      total.value = res.total ?? data.total ?? 0;
    } else {
      tableData.value = [];
      total.value = 0;
    }
  } catch (error) {
    console.error("Failed to fetch emoji list:", error);
    tableData.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  currentPage.value = 1;
  fetchList();
};

const handleReset = () => {
  searchName.value = "";
  searchState.value = "";
  currentPage.value = 1;
  fetchList();
};

// 启用 / 禁用 操作（调用更新接口）
const handleToggleState = (row: any) => {
  const isEnabling = row.state === 1;
  const newState = isEnabling ? 0 : 1;
  const actionText = isEnabling ? "启用" : "禁用";

  ElMessageBox.confirm(
    `确认要${actionText}表情“${row.name || row.id}”吗？`,
    "提示",
    {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: isEnabling ? "success" : "warning"
    }
  )
    .then(async () => {
      try {
        const res = await updateEmoji({
          id: row.id,
          state: newState
        });
        if ((res as any)?.code === "0000" || res) {
          message(`${actionText}成功`, { type: "success" });
          fetchList();
        } else {
          message((res as any)?.message || `${actionText}失败`, {
            type: "error"
          });
        }
      } catch (error) {
        console.error(`${actionText}表情失败:`, error);
        message("操作异常，请稍后重试", { type: "error" });
      }
    })
    .catch(() => {});
};

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  fetchList();
};

const handleCurrentChange = (val: number) => {
  currentPage.value = val;
  fetchList();
};

// ================= 弹窗表单状态 =================
const dialogVisible = ref(false);
const isEdit = ref(false);
const submitLoading = ref(false);
const currentItem = ref<any>(null);

const formRef = ref<FormInstance>();
const formModel = reactive({
  name: "",
  icon: "",
  url: ""
});

const formRules = reactive<FormRules>({
  name: [{ required: true, message: "请输入表情名称", trigger: "blur" }]
});

// 图标上传
const iconUploading = ref(false);

const handleIconUpload = async (uploadFile: UploadFile) => {
  const rawFile = uploadFile.raw;
  if (!rawFile) return;

  const isImg = rawFile.type.startsWith("image/");
  if (!isImg) {
    message("请上传图片格式文件", { type: "error" });
    return;
  }

  iconUploading.value = true;
  try {
    const url = await uploadToQiniu(rawFile, "emoji");
    formModel.icon = extractPath(url);
  } catch (err) {
    console.error("图标上传失败:", err);
  } finally {
    iconUploading.value = false;
  }
};

const removeIcon = () => {
  formModel.icon = "";
};

// zip 压缩包上传七牛云
const zipUploading = ref(false);
const zipFileName = ref("");

const handleZipUpload = async (uploadFile: UploadFile) => {
  const rawFile = uploadFile.raw;
  if (!rawFile) return;

  const isZip =
    rawFile.name.endsWith(".zip") ||
    rawFile.type === "application/zip" ||
    rawFile.type === "application/x-zip-compressed";

  if (!isZip) {
    message("只能上传 .zip 格式的压缩包", { type: "error" });
    return;
  }

  zipUploading.value = true;
  zipFileName.value = rawFile.name;
  try {
    const url = await uploadToQiniu(rawFile, "emoji");
    formModel.url = url;
  } catch (err) {
    console.error("Zip包上传七牛云失败:", err);
    zipFileName.value = "";
    formModel.url = "";
  } finally {
    zipUploading.value = false;
  }
};

const removeZip = () => {
  formModel.url = "";
  zipFileName.value = "";
};

// 打开新增弹窗
const openAddDialog = () => {
  isEdit.value = false;
  currentItem.value = null;
  formModel.name = "";
  formModel.icon = "";
  formModel.url = "";
  zipFileName.value = "";
  dialogVisible.value = true;
  formRef.value?.clearValidate();
};

// 打开编辑弹窗（仅需名称和图标）
const handleEdit = (row: any) => {
  isEdit.value = true;
  currentItem.value = row;
  formModel.name = row.name || "";
  formModel.icon = extractPath(row.icon || "");
  formModel.url = "";
  zipFileName.value = "";
  dialogVisible.value = true;
  formRef.value?.clearValidate();
};

// 提交表单（编辑只提交 name 和 icon，新增提交 name、icon、url）
const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async valid => {
    if (!valid) return;

    submitLoading.value = true;
    try {
      let params: Record<string, any>;
      if (isEdit.value) {
        params = {
          id: currentItem.value?.id,
          name: formModel.name.trim(),
          icon: extractPath(formModel.icon)
        };
      } else {
        params = {
          name: formModel.name.trim(),
          icon: extractPath(formModel.icon),
          url: formModel.url
        };
      }

      const apiMethod = isEdit.value ? updateEmoji : createEmoji;
      const res = await apiMethod(params);

      if ((res as any)?.code === "0000" || res) {
        message(isEdit.value ? "编辑成功" : "创建成功", { type: "success" });
        dialogVisible.value = false;
        fetchList();
      } else {
        message(
          (res as any)?.message || (isEdit.value ? "编辑失败" : "创建失败"),
          {
            type: "error"
          }
        );
      }
    } catch (error) {
      console.error("提交表情失败:", error);
      message("操作异常，请稍后重试", { type: "error" });
    } finally {
      submitLoading.value = false;
    }
  });
};

const router = useRouter();

// 详情操作（跳转详情页）
const handleDetail = (row: any) => {
  router.push({
    path: "/emoji/detail",
    query: {
      id: row.id,
      name: row.name || ""
    }
  });
};

// 删除操作
const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确认要删除表情“${row.name || row.id}”吗？`, "警告", {
    confirmButtonText: "确定删除",
    cancelButtonText: "取消",
    type: "warning"
  })
    .then(async () => {
      try {
        const res = await deleteEmoji({ id: row.id });
        if ((res as any)?.code === "0000" || res) {
          message("删除成功", { type: "success" });
          if (tableData.value.length === 1 && currentPage.value > 1) {
            currentPage.value--;
          }
          fetchList();
        } else {
          message((res as any)?.message || "删除失败", {
            type: "error"
          });
        }
      } catch (error) {
        console.error("删除表情失败:", error);
        message("删除异常，请稍后重试", { type: "error" });
      }
    })
    .catch(() => {});
};

onMounted(() => {
  fetchQiNiuDomain();
  fetchList();
});
</script>

<template>
  <div class="emoji-management-container p-4">
    <el-card shadow="never" class="main-card border-none border-radius-16">
      <!-- Search Filter & Add Area -->
      <div
        class="filter-wrapper mb-6 flex items-center justify-between flex-wrap gap-4"
      >
        <div class="flex items-center flex-wrap gap-4">
          <div class="flex items-center">
            <span class="mr-3 text-sm text-gray-600">名称</span>
            <el-input
              v-model="searchName"
              placeholder="请输入表情名称"
              class="search-input mr-3"
              clearable
              @keyup.enter="handleSearch"
            />
          </div>
          <div class="flex items-center">
            <span class="mr-3 text-sm text-gray-600">状态</span>
            <el-select
              v-model="searchState"
              placeholder="全部状态"
              class="search-select mr-3"
              clearable
              @change="handleSearch"
            >
              <el-option label="全部状态" value="" />
              <el-option label="启用" :value="0" />
              <el-option label="禁用" :value="1" />
            </el-select>
          </div>
          <div class="flex items-center">
            <el-button
              type="primary"
              class="search-btn px-6"
              @click="handleSearch"
            >
              搜索
            </el-button>
            <el-button class="reset-btn px-6" @click="handleReset">
              重置
            </el-button>
          </div>
        </div>

        <!-- 右上角新增表情按钮 -->
        <div>
          <el-button
            type="primary"
            class="add-btn px-6"
            :icon="useRenderIcon(Plus)"
            @click="openAddDialog"
          >
            新增表情
          </el-button>
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
        <el-table-column type="index" label="序号" width="70" align="center" />

        <el-table-column
          prop="name"
          label="名称"
          min-width="140"
          align="center"
        >
          <template #default="{ row }">
            <span class="font-medium text-gray-800">{{ row.name || "-" }}</span>
          </template>
        </el-table-column>

        <el-table-column
          prop="icon"
          label="图标"
          min-width="120"
          align="center"
        >
          <template #default="{ row }">
            <div class="flex items-center justify-center">
              <el-image
                v-if="row.icon"
                :src="getUrl(row.icon)"
                :preview-src-list="[getUrl(row.icon)]"
                preview-teleported
                class="emoji-icon-preview"
                fit="cover"
              >
                <template #error>
                  <div class="emoji-icon-placeholder">
                    <span class="text-xs text-gray-400">无图片</span>
                  </div>
                </template>
              </el-image>
              <div v-else class="emoji-icon-placeholder">
                <span class="text-xs text-gray-400">暂无</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="num"
          label="表情数量"
          min-width="120"
          align="center"
        >
          <template #default="{ row }">
            <el-tag type="info" effect="light" class="num-tag">
              {{ row.num ?? 0 }}
            </el-tag>
          </template>
        </el-table-column>

        <!-- 状态列：0启用 1禁用 -->
        <el-table-column label="状态" width="120" align="center">
          <template #default="{ row }">
            <span
              :class="[
                'status-tag',
                row.state === 0 ? 'status-normal' : 'status-abnormal'
              ]"
            >
              {{ row.state === 0 ? "启用" : "禁用" }}
            </span>
          </template>
        </el-table-column>

        <!-- 操作列 -->
        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <el-button
              link
              type="primary"
              class="op-link"
              @click="handleDetail(row)"
            >
              详情
            </el-button>
            <el-button
              link
              type="primary"
              class="op-link"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              link
              :type="row.state === 0 ? 'warning' : 'success'"
              class="op-link"
              @click="handleToggleState(row)"
            >
              {{ row.state === 0 ? "禁用" : "启用" }}
            </el-button>
            <el-button
              link
              type="danger"
              class="op-link"
              @click="handleDelete(row)"
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

    <!-- 新增 / 编辑表情弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑表情' : '新增表情'"
      width="540px"
      align-center
      destroy-on-close
      class="custom-dialog"
      append-to-body
    >
      <el-form
        ref="formRef"
        :model="formModel"
        :rules="formRules"
        label-position="top"
        class="px-2"
      >
        <!-- 表情名称 -->
        <el-form-item label="名称" prop="name">
          <el-input
            v-model="formModel.name"
            placeholder="请输入表情名称"
            maxlength="50"
            show-word-limit
            class="dialog-input"
          />
        </el-form-item>

        <!-- 图标上传 -->
        <el-form-item label="图标" prop="icon">
          <div class="flex items-center gap-4">
            <el-upload
              class="icon-uploader"
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              :on-change="handleIconUpload"
            >
              <div v-if="formModel.icon" class="uploaded-icon-box">
                <img
                  :src="getUrl(formModel.icon)"
                  class="uploaded-img"
                  alt="icon"
                />
                <div class="upload-mask">
                  <span>更换</span>
                </div>
              </div>
              <div v-else class="upload-trigger-box">
                <component
                  :is="useRenderIcon(iconUploading ? Loading : Plus)"
                  :class="[
                    'text-2xl text-gray-400',
                    iconUploading ? 'animate-spin' : ''
                  ]"
                />
                <span class="mt-1 text-xs text-gray-500">
                  {{ iconUploading ? "上传中..." : "上传图标" }}
                </span>
              </div>
            </el-upload>
            <div v-if="formModel.icon">
              <el-button
                link
                type="danger"
                :icon="useRenderIcon(Delete)"
                @click="removeIcon"
              >
                删除图标
              </el-button>
            </div>
          </div>
        </el-form-item>

        <!-- zip 压缩包上传七牛云（仅在新增时展示） -->
        <el-form-item v-if="!isEdit" label="文件" prop="url">
          <div class="w-full">
            <!-- 正在上传七牛云 -->
            <div
              v-if="zipUploading"
              class="flex flex-col items-center justify-center p-6 rounded-lg border border-dashed border-blue-300 bg-blue-50/30"
            >
              <component
                :is="useRenderIcon(Loading)"
                class="text-3xl text-blue-500 animate-spin mb-2"
              />
              <div class="text-xs text-gray-400 mt-1">{{ zipFileName }}</div>
            </div>

            <!-- 已有上传好的文件/url -->
            <div
              v-else-if="formModel.url"
              class="zip-file-card flex items-center justify-between p-3 rounded-lg border border-blue-100 bg-blue-50/50"
            >
              <div class="flex items-center gap-3 overflow-hidden">
                <component
                  :is="useRenderIcon(Document)"
                  class="text-2xl text-blue-500 flex-shrink-0"
                />
                <div class="overflow-hidden">
                  <div
                    class="text-sm font-medium text-gray-800 truncate"
                    :title="zipFileName || formModel.url"
                  >
                    {{ zipFileName || formModel.url }}
                  </div>
                </div>
              </div>
              <el-button
                link
                type="danger"
                :icon="useRenderIcon(Delete)"
                @click="removeZip"
              >
                移除
              </el-button>
            </div>

            <!-- 未选择文件时展示上传区域 -->
            <el-upload
              v-else
              class="zip-uploader w-full"
              drag
              :auto-upload="false"
              :show-file-list="false"
              accept=".zip,application/zip,application/x-zip-compressed"
              :on-change="handleZipUpload"
            >
              <div class="flex flex-col items-center justify-center py-4">
                <component
                  :is="useRenderIcon(UploadFilled)"
                  class="text-4xl text-gray-400 mb-2"
                />
                <div class="el-upload__text text-sm">
                  将 zip 压缩包拖到此处，或 <em>点击上传</em>
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  只能上传 .zip 压缩包{{
                    isEdit ? "（编辑时若不更换可不上传）" : ""
                  }}
                </div>
              </div>
            </el-upload>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer flex justify-end gap-3 px-2 pb-2">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="submitLoading || iconUploading || zipUploading"
            @click="handleSubmit"
          >
            {{ isEdit ? "保存更新" : "立即创建" }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.emoji-management-container {
  padding: 10px;
  height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;

  .main-card {
    border-radius: 16px;
    background: #ffffff;
    border: none;
    box-shadow: 0 1px 4px rgb(0 21 41 / 8%);
    height: 100%;
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

      .reset-btn {
        height: 40px;
        border-radius: 8px;
        background-color: #f7f8fa;
        color: #606266;
        border: 1px solid #e4e7ed;

        &:hover {
          background-color: #eef0f4;
          color: #0076fe;
        }
      }

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

    .emoji-icon-preview {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      border: 1px solid #ebeef5;
      overflow: hidden;
      flex-shrink: 0;
    }

    .emoji-icon-placeholder {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      background-color: #f5f7fa;
      border: 1px dashed #dcdfe6;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .num-tag {
      border-radius: 6px;
      padding: 0 10px;
      font-weight: 500;
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
      margin: 0 6px;
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

      &.el-button--danger {
        color: #f56c6c;
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

// 弹窗表单样式
.dialog-input {
  :deep(.el-input__wrapper) {
    background-color: #f7f8fa;
    box-shadow: none;
    border-radius: 8px;
    height: 40px;
  }
}

.icon-uploader {
  .uploaded-icon-box {
    position: relative;
    width: 80px;
    height: 80px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e4e7ed;
    cursor: pointer;

    .uploaded-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .upload-mask {
      position: absolute;
      inset: 0;
      background-color: rgb(0 0 0 / 45%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ffffff;
      font-size: 12px;
      opacity: 0;
      transition: opacity 0.2s;
    }

    &:hover .upload-mask {
      opacity: 1;
    }
  }

  .upload-trigger-box {
    width: 80px;
    height: 80px;
    border-radius: 8px;
    border: 1px dashed #dcdfe6;
    background-color: #f7f8fa;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: border-color 0.2s;

    &:hover {
      border-color: #0076fe;
    }
  }
}

.zip-uploader {
  :deep(.el-upload-dragger) {
    background-color: #f7f8fa;
    border: 1px dashed #dcdfe6;
    border-radius: 8px;
    padding: 16px;

    &:hover {
      border-color: #0076fe;
    }
  }
}
</style>
