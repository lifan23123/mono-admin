<script setup lang="ts">
import { useRouter } from "vue-router";
import { message } from "@/utils/message";
import { loginRules } from "./utils/rule";
import { ref, reactive } from "vue";
import { debounce } from "@pureadmin/utils";
import { useEventListener } from "@vueuse/core";
import type { FormInstance } from "element-plus";
import { useLayout } from "@/layout/hooks/useLayout";
import { useUserStoreHook } from "@/store/modules/user";
import { initRouter, getTopMenu } from "@/router/utils";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";

import Lock from "~icons/ri/lock-fill";
import User from "~icons/ri/user-3-fill";

defineOptions({
  name: "Login"
});

const router = useRouter();
const loading = ref(false);
const disabled = ref(false);
const agreed = ref(false);
const ruleFormRef = ref<FormInstance>();

const { initStorage } = useLayout();
initStorage();

const { overallStyle, dataThemeChange } = useDataThemeChange();
dataThemeChange(overallStyle.value);

const ruleForm = reactive({
  username: "admin",
  password: "admin123"
});

const onLogin = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  if (!agreed.value) {
    message("请先同意用户协议和隐私协议", { type: "warning" });
    return;
  }
  await formEl.validate(valid => {
    if (valid) {
      loading.value = true;
      useUserStoreHook()
        .loginByUsername({
          username: ruleForm.username,
          password: ruleForm.password
        })
        .then(res => {
          if (res.success) {
            // 获取后端路由
            return initRouter().then(() => {
              disabled.value = true;
              router
                .push(getTopMenu(true).path)
                .then(() => {
                  message("登录成功", { type: "success" });
                })
                .finally(() => (disabled.value = false));
            });
          } else {
            message("登录失败", { type: "error" });
          }
        })
        .finally(() => (loading.value = false));
    }
  });
};

const immediateDebounce: any = debounce(
  formRef => onLogin(formRef),
  1000,
  true
);

useEventListener(document, "keydown", ({ code }) => {
  if (
    ["Enter", "NumpadEnter"].includes(code) &&
    !disabled.value &&
    !loading.value
  )
    immediateDebounce(ruleFormRef.value);
});
</script>

<template>
  <div class="login-page">
    <!-- 左上角 Logo -->
    <div class="login-logo">
      <img
        src="@/assets/login/avatar.svg"
        alt="MOMO"
        class="login-logo-icon"
      />
      <span class="login-logo-text">MOMO</span>
      <span class="login-logo-subtitle">后台管理系统</span>
    </div>

    <!-- 右侧登录卡片 -->
    <div class="login-card-wrapper">
      <div class="login-card">
        <h2 class="login-card-title">欢迎登录平台</h2>

        <el-form
          ref="ruleFormRef"
          :model="ruleForm"
          :rules="loginRules"
          size="large"
          class="login-card-form"
        >
          <el-form-item
            :rules="[
              {
                required: true,
                message: '请输入账号',
                trigger: 'blur'
              }
            ]"
            prop="username"
          >
            <el-input
              v-model="ruleForm.username"
              clearable
              placeholder="请输入账号"
              :prefix-icon="useRenderIcon(User)"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="ruleForm.password"
              clearable
              show-password
              placeholder="请输入密码"
              :prefix-icon="useRenderIcon(Lock)"
            />
          </el-form-item>

          <el-form-item class="login-btn-item">
            <el-button
              class="login-btn"
              type="primary"
              :loading="loading"
              :disabled="disabled"
              @click="onLogin(ruleFormRef)"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>

        <div class="login-agreement">
          <el-checkbox v-model="agreed" class="agreement-checkbox">
            我已阅读且同意
            <a href="javascript:void(0)" class="agreement-link"
              >用户协议</a
            >和<a href="javascript:void(0)" class="agreement-link"
              >隐私协议</a
            >
          </el-checkbox>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #f0f4ff 0%, #e8edf8 40%, #f5f7fc 100%);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

/* 左上角 Logo */
.login-logo {
  position: absolute;
  top: 32px;
  left: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 10;

  .login-logo-icon {
    width: 40px;
    height: 40px;
  }

  .login-logo-text {
    font-size: 28px;
    font-weight: 800;
    color: #1a1a2e;
    letter-spacing: 2px;
  }

  .login-logo-subtitle {
    font-size: 22px;
    font-weight: 600;
    color: #333;
    letter-spacing: 1px;
  }
}

/* 右侧登录卡片容器 */
.login-card-wrapper {
  width: 480px;
  margin-right: 10%;
  flex-shrink: 0;
}

/* 白色登录卡片 */
.login-card {
  background: #fff;
  border-radius: 20px;
  padding: 48px 44px 40px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.06);

  .login-card-title {
    font-size: 22px;
    font-weight: 700;
    color: #1a1a2e;
    margin-bottom: 36px;
    text-align: left;
    letter-spacing: 1px;
  }

  .login-card-form {
    :deep(.el-input__wrapper) {
      border-radius: 10px;
      padding: 6px 14px;
      background: #f7f8fc;
      box-shadow: none !important;
      border: 1px solid transparent;
      transition: all 0.3s;

      &:hover,
      &.is-focus {
        border-color: #409eff;
        background: #fff;
      }
    }

    :deep(.el-input__inner) {
      font-size: 14px;
      color: #333;

      &::placeholder {
        color: #bbb;
      }
    }

    :deep(.el-input__prefix) {
      color: #999;
      font-size: 18px;
    }

    :deep(.el-form-item) {
      margin-bottom: 24px;
    }
  }
}

/* 登录按钮 */
.login-btn-item {
  margin-top: 8px;
  margin-bottom: 0 !important;
}

.login-btn {
  width: 100%;
  height: 48px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 4px;
  background: #2b7fff !important;
  border: none !important;
  box-shadow: 0 4px 16px rgba(43, 127, 255, 0.3);
  transition: all 0.3s;

  &:hover {
    background: #1a6fee !important;
    box-shadow: 0 6px 20px rgba(43, 127, 255, 0.4);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

/* 用户协议 */
.login-agreement {
  margin-top: 24px;
  text-align: center;

  .agreement-checkbox {
    :deep(.el-checkbox__label) {
      font-size: 13px;
      color: #999;
    }
  }

  .agreement-link {
    color: #2b7fff;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
}

/* 响应式 */
@media screen and (max-width: 768px) {
  .login-page {
    justify-content: center;
  }

  .login-card-wrapper {
    width: 90%;
    max-width: 420px;
    margin-right: 0;
  }

  .login-logo {
    top: 20px;
    left: 20px;

    .login-logo-text {
      font-size: 22px;
    }

    .login-logo-subtitle {
      font-size: 16px;
    }
  }
}
</style>
