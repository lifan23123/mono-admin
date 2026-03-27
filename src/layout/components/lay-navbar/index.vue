<script setup lang="ts">
import { useNav } from "@/layout/hooks/useNav";
import LaySearch from "../lay-search/index.vue";
import LayNotice from "../lay-notice/index.vue";
import LayNavMix from "../lay-sidebar/NavMix.vue";
import LaySidebarFullScreen from "../lay-sidebar/components/SidebarFullScreen.vue";
import LaySidebarBreadCrumb from "../lay-sidebar/components/SidebarBreadCrumb.vue";
import LaySidebarTopCollapse from "../lay-sidebar/components/SidebarTopCollapse.vue";

import LogoutCircleRLine from "~icons/ri/logout-circle-r-line";
import Setting from "~icons/ri/settings-3-line";

const {
  layout,
  device,
  logout,
  onPanel,
  pureApp,
  username,
  nickname,
  userAvatar,
  avatarsStyle,
  toggleSideBar
} = useNav();
</script>

<template>
  <div class="navbar bg-transparent">
    <LaySidebarTopCollapse
      v-if="device === 'mobile'"
      class="hamburger-container"
      :is-active="pureApp.sidebar.opened"
      @toggleClick="toggleSideBar"
    />

    <!-- <LaySidebarBreadCrumb
      v-if="layout !== 'mix' && device !== 'mobile'"
      class="breadcrumb-container"
    /> -->

    <LayNavMix v-if="layout === 'mix'" />

    <div v-if="layout === 'vertical'" class="vertical-header-right">
      <!-- 菜单搜索 -->
      <!-- <LaySearch id="header-search" /> -->
      <!-- 全屏 -->
      <!-- <LaySidebarFullScreen id="full-screen" /> -->
      <!-- 消息通知 -->
      <LayNotice id="header-notice" />
      <el-dropdown trigger="click">
        <span class="el-dropdown-link navbar-bg-hover select-none">
          <img :src="userAvatar" :style="avatarsStyle" />
          <div class="user-info flex flex-col items-start mr-2">
            <span
              v-if="username"
              class="username text-sm font-bold text-black leading-tight"
              >{{ username }}</span
            >
            <span
              v-if="nickname"
              class="role text-[10px] text-blue-500 leading-tight"
              >{{ nickname }}</span
            >
          </div>
          <IconifyIconOffline
            icon="ep:arrow-down"
            class="text-black text-[10px]"
          />
        </span>
        <template #dropdown>
          <el-dropdown-menu class="logout">
            <el-dropdown-item @click="logout">
              <IconifyIconOffline
                :icon="LogoutCircleRLine"
                style="margin: 5px"
              />
              退出系统
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
      <!-- <span
        class="set-icon navbar-bg-hover"
        title="打开系统配置"
        @click="onPanel"
      >
        <IconifyIconOffline :icon="Setting" />
      </span> -->
    </div>
  </div>
</template>

<style lang="scss" scoped>
.navbar {
  height: 70px;
  overflow: hidden;

  .hamburger-container {
    float: left;
    height: 100%;
    line-height: 70px;
    cursor: pointer;
  }

  .vertical-header-right {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    min-width: 280px;
    height: 70px;
    color: #000000d9;

    .el-dropdown-link {
      display: flex;
      align-items: center;
      justify-content: space-around;
      height: 70px;
      padding: 0 12px;
      color: #000000d9;
      cursor: pointer;

      .username {
        font-size: 14px;
        font-weight: 700;
        margin-bottom: 2px;
      }

      .role {
        font-size: 10px;
        color: #007aff;
        font-weight: 500;
      }

      img {
        width: 38px;
        height: 38px;
        border-radius: 50%;
        object-fit: cover;
        margin-right: 8px;
      }
    }
  }

  .breadcrumb-container {
    float: left;
    margin-left: 16px;
  }
}

.logout {
  width: 120px;

  ::v-deep(.el-dropdown-menu__item) {
    display: inline-flex;
    flex-wrap: wrap;
    min-width: 100%;
  }
}
</style>
