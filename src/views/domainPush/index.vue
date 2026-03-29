<script setup lang="ts">
import { reactive, ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { message } from "@/utils/message";
import { pushAllHost } from "@/api/user";

defineOptions({
  name: "DomainPush"
});

const formRef = ref<FormInstance>();
const pushForm = reactive({
  qq: "",
  domain: "",
  imgUrl: ""
});

const loading = ref(false);

// 自定义校验规则：QQ和域名至少填写一项
const validateAtLeastOne = (rule: any, value: any, callback: any) => {
  if (!pushForm.qq && !pushForm.domain) {
    callback(new Error("QQ和域名至少填写一项"));
  } else {
    if (formRef.value) {
      formRef.value.clearValidate(["qq", "domain"]);
    }
    callback();
  }
};

const rules = reactive<FormRules>({
  qq: [{ validator: validateAtLeastOne, trigger: "blur" }],
  domain: [{ validator: validateAtLeastOne, trigger: "blur" }]
});

const handlePush = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true;
      try {
        const { code } = await pushAllHost({
          qq: pushForm.qq,
          url: pushForm.domain,
          imgUrl: pushForm.imgUrl
        });

        if (code === "0000") {
          message("推送成功", { type: "success" });
          formRef.value.resetFields();
          // 手动重置一下，因为 resetFields 有时没法清除自定义校验
          pushForm.qq = "";
          pushForm.domain = "";
          pushForm.imgUrl = "";
        }
      } catch (error) {
        console.error("Push failed:", error);
      } finally {
        loading.value = false;
      }
    } else {
      message("请按规则填写表单", { type: "warning" });
    }
  });
};
</script>

<template>
  <div class="domain-push-container p-4">
    <el-card shadow="never" class="main-card border-none border-radius-16">
      <div class="card-header mb-8">
        <h2 class="text-base font-bold text-gray-800">域名推送配置</h2>
      </div>

      <el-form
        ref="formRef"
        label-position="top"
        :model="pushForm"
        :rules="rules"
        class="flex-1 flex flex-col justify-between"
      >
        <el-row :gutter="32">
          <!-- QQ Input -->
          <el-col :xs="24" :sm="12">
            <el-form-item label="QQ" prop="qq">
              <el-input
                v-model="pushForm.qq"
                placeholder="请输入QQ号"
                class="custom-input"
                clearable
              />
            </el-form-item>
          </el-col>

          <!-- Domain Input -->
          <el-col :xs="24" :sm="12">
            <el-form-item label="域名" prop="domain">
              <el-input
                v-model="pushForm.domain"
                placeholder="请输入推送域名"
                class="custom-input"
                clearable
              />
            </el-form-item>
          </el-col>

          <!-- Image URL Input -->
          <el-col :xs="24" :sm="12">
            <el-form-item label="图片地址" prop="imgUrl">
              <el-input
                v-model="pushForm.imgUrl"
                placeholder="请输入图片地址"
                class="custom-input"
                clearable
              />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Form Actions -->
        <div class="form-actions mt-12 flex justify-end">
          <el-button type="primary" class="push-btn" @click="handlePush">推送</el-button>
        </div>
      </el-form>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.domain-push-container {
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

      &:hover, &.is-focus {
        border-color: #dcdfe6;
      }
    }
  }

  .form-actions {
    margin-top: auto;
    padding-top: 40px;

    .push-btn {
      height: 44px;
      border-radius: 8px;
      padding: 0 48px;
      font-weight: 500;
      font-size: 14px;
      background-color: #0076fe;
      border: none;
      
      &:hover {
        background-color: #3391ff;
      }
    }
  }
}
</style>
