<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { getConfigDetail, getConfigUpdate } from "@/api/user";
import { message } from "@/utils/message";

defineOptions({
  name: "KeyConfig"
});

const configForm = reactive({
  appKey: "",
  appSecret: "",
  masterKey: ""
});

const configId = ref<number | null>(null);

const fetchConfig = async () => {
  try {
    const res = await getConfigDetail({ ident: "IMINFO" });
    const { data, code } = res as any;
    if (code === "0000" && data) {
      configId.value = data.id;
      // 解析 JSON 字符串
      let dm: any = {};
      try {
        dm = JSON.parse(data.data || "{}");
      } catch (e) {
        console.error("解析配置数据失败:", e);
      }
      configForm.appKey = dm.appKey || "";
      configForm.appSecret = dm.appSerect || ""; // 映射 appSerect
      configForm.masterKey = dm.pwd || ""; // 映射 pwd
    }
  } catch (error) {
    console.error("Fetch key config failed:", error);
  }
};

onMounted(() => {
  fetchConfig();
});

const handleSave = async () => {
  try {
    // 根据返回格式，保存时也应将对象转为 JSON 字符串放入 data 字段
    const res = await getConfigUpdate({
      ident: "IMINFO",
      data: JSON.stringify({
        appKey: configForm.appKey,
        appSerect: configForm.appSecret,
        pwd: configForm.masterKey
      })
    });
    if ((res as any).code === "0000") {
      message("配置保存成功", { type: "success" });
      fetchConfig();
    } else {
      message((res as any).message || "保存失败", { type: "error" });
    }
  } catch (e) {
    message("操作异常", { type: "error" });
  }
};

const handleReset = () => {
  configForm.appKey = "";
  configForm.appSecret = "";
  configForm.masterKey = "";
};
</script>

<template>
  <div class="key-config-container p-4">
    <el-card shadow="never" class="main-card border-none border-radius-16">
      <div class="card-header mb-8">
        <h2 class="text-base font-bold text-gray-800">通讯秘钥</h2>
      </div>

      <el-form
        label-position="top"
        :model="configForm"
        class="flex-1 flex flex-col justify-between"
      >
        <el-row :gutter="32">
          <!-- IM App Key -->
          <el-col :xs="24" :sm="8">
            <el-form-item label="IM App Key">
              <el-input
                v-model="configForm.appKey"
                placeholder="请输入 App Key"
                class="custom-input"
              />
            </el-form-item>
          </el-col>

          <!-- IM App Secret -->
          <el-col :xs="24" :sm="8">
            <el-form-item label="IM App Secret">
              <el-input
                v-model="configForm.appSecret"
                placeholder="请输入 App Secret/秘钥"
                class="custom-input"
              />
            </el-form-item>
          </el-col>

          <!-- Communication Master Key -->
          <el-col :xs="24" :sm="8">
            <el-form-item label="通讯主秘钥">
              <el-input
                v-model="configForm.masterKey"
                placeholder="选填，主秘钥或 Token"
                class="custom-input"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Form Actions -->
        <div class="form-actions mt-12 flex justify-end gap-4">
          <el-button class="reset-btn" @click="handleReset"
            >重置为空白</el-button
          >
          <el-button type="primary" class="save-btn" @click="handleSave"
            >保存配置</el-button
          >
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.key-config-container {
  background: transparent;
  width: 100%;
  padding-bottom: 24px;

  .border-radius-16 {
    border-radius: 16px !important;
  }

  .main-card {
    padding: 24px 32px;
    height: calc(100vh - 140px);
    display: flex;
    flex-direction: column;

    :deep(.el-card__body) {
      flex: 1;
      display: flex;
      flex-direction: column;
      padding: 0;
    }

    .card-header {
      border-bottom: none;
    }
  }

  :deep(.el-form-item__label) {
    color: #333;
    font-weight: 500;
    font-size: 14px;
    padding-bottom: 8px;
  }

  .custom-input {
    :deep(.el-input__wrapper) {
      background-color: #f7f8fa;
      box-shadow: none;
      border-radius: 8px;
      height: 48px;
      border: 1px solid transparent;
      transition: all 0.3s;

      &:hover,
      &.is-focus {
        border-color: #dcdfe6;
      }
    }
  }

  .form-actions {
    margin-top: auto;
    padding-top: 40px;

    .el-button {
      height: 44px;
      border-radius: 8px;
      padding: 0 32px;
      font-weight: 500;
      font-size: 14px;
    }

    .reset-btn {
      color: #606266;
      border: 1px solid #dcdfe6;
      background-color: #fff;

      &:hover {
        border-color: #0076fe;
        color: #0076fe;
      }
    }

    .save-btn {
      background-color: #0076fe;
      border: none;

      &:hover {
        background-color: #3391ff;
      }
    }
  }
}
</style>
