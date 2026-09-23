<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { FormInstance, FormRules, UploadFile } from "element-plus";
import { ElMessageBox } from "element-plus";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import ArrowLeft from "~icons/ep/arrow-left";
import Plus from "~icons/ep/plus";
import Close from "~icons/ep/close";
import UploadFilled from "~icons/ep/upload-filled";
import Document from "~icons/ep/document";
import Delete from "~icons/ep/delete";
import Loading from "~icons/ep/loading";
import {
  getEmojiDetailList,
  deleteEmojiDetailItem,
  createEmojiDetailItem,
  getQiNiuDomain
} from "@/api/user";
import { uploadToQiniu } from "@/utils/upload";
import { message } from "@/utils/message";
import TgsPlayer from "./components/TgsPlayer.vue";

defineOptions({
  name: "EmojiDetail"
});

const route = useRoute();
const router = useRouter();

const emojiId = ref<string | number>(
  (route.query.id as string) || (route.params.id as string) || ""
);
const emojiName = ref<string>((route.query.name as string) || "表情包");

const loading = ref(false);
const emojiList = ref<any[]>([]);
const qiniuDomain = ref("");
const detailId = ref<string | number>("");
const detailMainId = ref<string | number>("");

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
  const strPath = String(path).trim();
  if (strPath.startsWith("http://") || strPath.startsWith("https://")) {
    return strPath;
  }
  let domainBase = "";
  if (typeof qiniuDomain.value === "string") {
    domainBase = qiniuDomain.value.trim();
  } else if (qiniuDomain.value && typeof qiniuDomain.value === "object") {
    domainBase =
      (qiniuDomain.value as any).url ||
      (qiniuDomain.value as any).domain ||
      (qiniuDomain.value as any).qiniuDomain ||
      "";
  }

  if (!domainBase) return strPath;

  if (!domainBase.startsWith("http://") && !domainBase.startsWith("https://")) {
    domainBase = `https://${domainBase}`;
  }

  const domain = domainBase.replace(/\/+$/, "");
  const cleanPath = strPath.replace(/^\/+/, "");
  return `${domain}/${cleanPath}`;
};

// 去除域名，提取相对路径用于接口传参（如 emoji/xxx.tgs 或 xxx.tgs）
const extractPath = (urlOrPath: string) => {
  if (!urlOrPath) return "";
  let path = String(urlOrPath).trim();
  try {
    if (path.startsWith("http://") || path.startsWith("https://")) {
      const urlObj = new URL(path);
      path = urlObj.pathname;
    }
  } catch (e) {}
  return path.replace(/^\/+/, "");
};

// 获取表情子列表
const fetchDetailList = async () => {
  if (!emojiId.value) return;
  loading.value = true;
  try {
    const res = await getEmojiDetailList({
      mainId: emojiId.value
    });

    const data = res?.data;
    let list: any[] = [];
    if (Array.isArray(data)) {
      list = data;
    } else if (data?.list && Array.isArray(data.list)) {
      list = data.list;
    }
    emojiList.value = list;

    // 获取接口返回的第一项中的 id 和 mainId
    if (list.length > 0) {
      if (list[0].id !== undefined) detailId.value = list[0].id;
      if (list[0].mainId !== undefined) detailMainId.value = list[0].mainId;
    }
  } catch (error) {
    console.error("获取表情详情列表失败:", error);
    emojiList.value = [];
  } finally {
    loading.value = false;
  }
};

// 返回上一级
const handleBack = () => {
  router.push("/emoji/index");
};

// 删除单个表情
const handleDeleteItem = (item: any) => {
  ElMessageBox.confirm(
    `确认要删除表情“${item.name || item.id || ""}”吗？`,
    "提示",
    {
      confirmButtonText: "确定删除",
      cancelButtonText: "取消",
      type: "warning"
    }
  )
    .then(async () => {
      try {
        const res = await deleteEmojiDetailItem({
          id: item.id,
          mainId:
            item.mainId !== undefined && item.mainId !== null
              ? item.mainId
              : detailMainId.value || emojiId.value
        });
        if ((res as any)?.code === "0000" || res) {
          message("删除成功", { type: "success" });
          fetchDetailList();
        }
      } catch (error) {
        console.error("删除单个表情失败:", error);
      }
    })
    .catch(() => {});
};

// ================= 新增表情弹窗 =================
const addDialogVisible = ref(false);
const submitLoading = ref(false);
const fileUploading = ref(false);
const uploadedFileName = ref("");

const formRef = ref<FormInstance>();
const formModel = reactive({
  name: "",
  url: ""
});

const formRules = reactive<FormRules>({
  name: [{ required: true, message: "请输入表情名称", trigger: "blur" }],
  url: [{ required: true, message: "请上传表情文件", trigger: "change" }]
});

// 打开新增表情弹窗
const handleAddEmoji = () => {
  formModel.name = "";
  formModel.url = "";
  uploadedFileName.value = "";
  addDialogVisible.value = true;
  formRef.value?.clearValidate();
};

// 表情文件上传七牛云
const handleFileUpload = async (uploadFile: UploadFile) => {
  const rawFile = uploadFile.raw;
  if (!rawFile) return;

  fileUploading.value = true;
  uploadedFileName.value = rawFile.name;

  // 若用户尚未输入名称，默认自动填入文件名（去除后缀）
  if (!formModel.name) {
    const baseName = rawFile.name.replace(/\.[^/.]+$/, "");
    formModel.name = baseName;
  }

  try {
    const url = await uploadToQiniu(rawFile, "emoji");
    formModel.url = extractPath(url);
    formRef.value?.clearValidate("url");
  } catch (err) {
    console.error("表情文件上传失败:", err);
    uploadedFileName.value = "";
    formModel.url = "";
  } finally {
    fileUploading.value = false;
  }
};

const removeFile = () => {
  formModel.url = "";
  uploadedFileName.value = "";
};

// 提交新增表情
const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async valid => {
    if (!valid) return;

    submitLoading.value = true;
    try {
      const params = {
        name: formModel.name.trim(),
        url: extractPath(formModel.url),
        mainId: detailMainId.value || emojiId.value
      };

      const res = await createEmojiDetailItem(params);
      if ((res as any)?.code === "0000" || res) {
        addDialogVisible.value = false;
        fetchDetailList();
      }
    } catch (error) {
      console.error("新增表情失败:", error);
    } finally {
      submitLoading.value = false;
    }
  });
};

onMounted(async () => {
  await fetchQiNiuDomain();
  fetchDetailList();
});
</script>

<template>
  <div class="emoji-detail-container p-4">
    <el-card shadow="never" class="main-card border-none border-radius-16">
      <!-- 顶部导航与操作栏 -->
      <div
        class="header-bar mb-6 flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-gray-100"
      >
        <div class="flex items-center gap-3">
          <el-button
            class="back-btn"
            :icon="useRenderIcon(ArrowLeft)"
            circle
            @click="handleBack"
          />
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-lg font-bold text-gray-800">{{ emojiName }}</h2>
              <span
                class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full"
              >
                共 {{ emojiList.length }} 个表情
              </span>
            </div>
          </div>
        </div>

        <!-- 右上角新增表情按钮 -->
        <div>
          <el-button
            type="primary"
            class="add-btn px-6"
            :icon="useRenderIcon(Plus)"
            @click="handleAddEmoji"
          >
            新增表情
          </el-button>
        </div>
      </div>

      <!-- 表情网格列表展示区域 -->
      <div v-loading="loading" class="emoji-grid-wrap flex-1 overflow-y-auto">
        <div
          v-if="emojiList.length > 0"
          class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-5 p-2"
        >
          <div
            v-for="item in emojiList"
            :key="item.id"
            class="emoji-card relative bg-white rounded-2xl p-4 flex flex-col items-center justify-between border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all duration-200"
          >
            <!-- 右上角删除按钮 -->
            <button
              class="delete-btn absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center text-xs shadow transition-transform hover:scale-110 active:scale-95 z-10"
              title="删除此表情"
              @click.stop="handleDeleteItem(item)"
            >
              <component
                :is="useRenderIcon(Close)"
                class="text-xs stroke-[2.5]"
              />
            </button>

            <!-- 表情图像预览区 (支持 .tgs 动画及普通图片) -->
            <div
              class="emoji-icon-box w-20 h-20 rounded-full bg-blue-50/70 flex items-center justify-center mb-3 overflow-hidden p-1.5"
            >
              <TgsPlayer
                v-if="item.url || item.icon || item.img"
                :src="getUrl(item.url || item.icon || item.img)"
                class="w-full h-full"
              />
              <span v-else class="text-xs text-gray-400">暂无图片</span>
            </div>

            <!-- 表情名称 -->
            <div
              class="emoji-name text-sm font-medium text-gray-700 truncate w-full text-center"
              :title="item.name"
            >
              {{ item.name || "未命名" }}
            </div>
          </div>
        </div>

        <!-- 空状态展示 -->
        <div
          v-else-if="!loading"
          class="empty-wrap h-full flex flex-col items-center justify-center py-20"
        >
          <el-empty description="当前表情包暂无表情数据" />
        </div>
      </div>
    </el-card>

    <!-- 新增表情弹窗 -->
    <el-dialog
      v-model="addDialogVisible"
      title="新增表情"
      width="480px"
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

        <!-- 表情文件 -->
        <el-form-item label="文件" prop="url">
          <div class="w-full">
            <!-- 正在上传中 -->
            <div
              v-if="fileUploading"
              class="flex flex-col items-center justify-center p-6 rounded-lg border border-dashed border-blue-300 bg-blue-50/30"
            >
              <component
                :is="useRenderIcon(Loading)"
                class="text-3xl text-blue-500 animate-spin mb-2"
              />
              <div class="text-xs text-gray-400 mt-1">
                {{ uploadedFileName }}
              </div>
            </div>

            <!-- 已上传完成（展示预览与文件名） -->
            <div
              v-else-if="formModel.url"
              class="uploaded-file-card flex items-center justify-between p-3 rounded-lg border border-blue-100 bg-blue-50/40"
            >
              <div class="flex items-center gap-3 overflow-hidden">
                <div
                  class="w-12 h-12 rounded-lg bg-white border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 p-1"
                >
                  <TgsPlayer
                    :src="getUrl(formModel.url)"
                    class="w-full h-full"
                  />
                </div>
                <div class="overflow-hidden">
                  <div
                    class="text-sm font-medium text-gray-800 truncate"
                    :title="uploadedFileName || formModel.url"
                  >
                    {{ uploadedFileName || formModel.url }}
                  </div>
                </div>
              </div>
              <el-button
                link
                type="danger"
                :icon="useRenderIcon(Delete)"
                @click="removeFile"
              >
                移除
              </el-button>
            </div>

            <!-- 未上传时展示上传拖拽框 -->
            <el-upload
              v-else
              class="file-uploader w-full"
              drag
              :auto-upload="false"
              :show-file-list="false"
              accept=".tgs,.json,image/*"
              :on-change="handleFileUpload"
            >
              <div class="flex flex-col items-center justify-center py-4">
                <component
                  :is="useRenderIcon(UploadFilled)"
                  class="text-4xl text-gray-400 mb-2"
                />
                <div class="el-upload__text text-sm">
                  将表情文件拖到此处，或 <em>点击上传</em>
                </div>
                <div class="text-xs text-gray-400 mt-1">
                  支持 .tgs 贴纸动画或常见图片格式
                </div>
              </div>
            </el-upload>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer flex justify-end gap-3 px-2 pb-2">
          <el-button @click="addDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="submitLoading || fileUploading"
            @click="handleSubmit"
          >
            立即添加
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.emoji-detail-container {
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
      padding: 20px;
    }

    .header-bar {
      flex-shrink: 0;

      .back-btn {
        width: 36px;
        height: 36px;
        background-color: #f7f8fa;
        border: 1px solid #e4e7ed;
        color: #606266;

        &:hover {
          background-color: #eef0f4;
          color: #0076fe;
          border-color: #0076fe;
        }
      }

      .add-btn {
        height: 40px;
        border-radius: 8px;
        background-color: #0076fe;
        border: none;
      }
    }

    .emoji-grid-wrap {
      min-height: 0;

      .emoji-card {
        aspect-ratio: 1 / 1.15;
        border: 1px solid #f0f2f5;

        // &:hover {
        //   transform: translateY(-2px);
        //   box-shadow: 0 4px 12px rgb(0 118 254 / 8%);
        // }

        .delete-btn {
          border: none;
          cursor: pointer;
          line-height: 1;
        }
      }
    }
  }
}

// 弹窗样式
.dialog-input {
  :deep(.el-input__wrapper) {
    background-color: #f7f8fa;
    box-shadow: none;
    border-radius: 8px;
    height: 40px;
  }
}

.file-uploader {
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
