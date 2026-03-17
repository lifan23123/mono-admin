<script setup lang="ts">
import "animate.css";
// 引入 src/components/ReIcon/src/offlineIcon.ts 文件中所有使用addIcon添加过的本地图标
import "@/components/ReIcon/src/offlineIcon";
import { setType } from "./types";
import { useLayout } from "./hooks/useLayout";
import { useAppStoreHook } from "@/store/modules/app";
import { useSettingStoreHook } from "@/store/modules/settings";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";
import {
  h,
  ref,
  reactive,
  computed,
  onMounted,
  onBeforeMount,
  defineComponent
} from "vue";
import {
  useDark,
  useGlobal,
  deviceDetection,
  useResizeObserver
} from "@pureadmin/utils";

import LayTag from "./components/lay-tag/index.vue";
import LayNavbar from "./components/lay-navbar/index.vue";
import LayContent from "./components/lay-content/index.vue";
import LaySetting from "./components/lay-setting/index.vue";
import NavVertical from "./components/lay-sidebar/NavVertical.vue";
import NavHorizontal from "./components/lay-sidebar/NavHorizontal.vue";
import BackTopIcon from "@/assets/svg/back_top.svg?component";

const appWrapperRef = ref();
const { isDark } = useDark();
const { layout } = useLayout();
const isMobile = deviceDetection();
const pureSetting = useSettingStoreHook();
const { $storage } = useGlobal<GlobalPropertiesApi>();

const set: setType = reactive({
  sidebar: computed(() => {
    return useAppStoreHook().sidebar;
  }),

  device: computed(() => {
    return useAppStoreHook().device;
  }),

  fixedHeader: computed(() => {
    return pureSetting.fixedHeader;
  }),

  classes: computed(() => {
    return {
      hideSidebar: !set.sidebar.opened,
      openSidebar: set.sidebar.opened,
      withoutAnimation: set.sidebar.withoutAnimation,
      mobile: set.device === "mobile"
    };
  }),

  hideTabs: computed(() => {
    return $storage?.configure.hideTabs;
  })
});

function setTheme(layoutModel: string) {
  window.document.body.setAttribute("layout", layoutModel);
  $storage.layout = {
    layout: `${layoutModel}`,
    theme: $storage.layout?.theme,
    darkMode: $storage.layout?.darkMode,
    sidebarStatus: $storage.layout?.sidebarStatus,
    epThemeColor: $storage.layout?.epThemeColor,
    themeColor: $storage.layout?.themeColor,
    overallStyle: $storage.layout?.overallStyle
  };
}

function toggle(device: string, bool: boolean) {
  useAppStoreHook().toggleDevice(device);
  useAppStoreHook().toggleSideBar(bool, "resize");
}

// 判断是否可自动关闭菜单栏
let isAutoCloseSidebar = true;

useResizeObserver(appWrapperRef, entries => {
  if (isMobile) return;
  const entry = entries[0];
  const [{ inlineSize: width, blockSize: height }] = entry.borderBoxSize;
  useAppStoreHook().setViewportSize({ width, height });
  width <= 760 ? setTheme("vertical") : setTheme(useAppStoreHook().layout);
  /** width app-wrapper类容器宽度
   * 0 < width <= 760 隐藏侧边栏
   * 760 < width <= 990 折叠侧边栏
   * width > 990 展开侧边栏
   */
  if (width > 0 && width <= 760) {
    toggle("mobile", false);
    isAutoCloseSidebar = true;
  } else if (width > 760 && width <= 990) {
    if (isAutoCloseSidebar) {
      toggle("desktop", false);
      isAutoCloseSidebar = false;
    }
  } else if (width > 990 && !set.sidebar.isClickCollapse) {
    toggle("desktop", true);
    isAutoCloseSidebar = true;
  } else {
    toggle("desktop", false);
    isAutoCloseSidebar = false;
  }
});

onMounted(() => {
  if (isMobile) {
    toggle("mobile", false);
  }
});

onBeforeMount(() => {
  useDataThemeChange().dataThemeChange($storage.layout?.overallStyle);
});

const LayHeader = defineComponent({
  name: "LayHeader",
  render() {
    return h(
      "div",
      {
        class: { "fixed-header": set.fixedHeader },
        style: [
          set.hideTabs && layout.value.includes("horizontal")
            ? isDark.value
              ? "box-shadow: 0 1px 4px #0d0d0d"
              : "box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08)"
            : ""
        ]
      },
      {
        default: () => [
          !pureSetting.hiddenSideBar &&
          (layout.value.includes("vertical") || layout.value.includes("mix"))
            ? h(LayNavbar)
            : null,
          !pureSetting.hiddenSideBar && layout.value.includes("horizontal")
            ? h(NavHorizontal)
            : null,
          h(LayTag)
        ]
      }
    );
  }
});
</script>

<template>
  <div ref="appWrapperRef" :class="['app-wrapper', set.classes]">
    <div
      v-show="
        set.device === 'mobile' &&
        set.sidebar.opened &&
        layout.includes('vertical')
      "
      class="app-mask"
      @click="useAppStoreHook().toggleSideBar()"
    />

    <!-- 侧边栏 -->
    <NavVertical
      v-show="
        !pureSetting.hiddenSideBar &&
        (layout.includes('vertical') || layout.includes('mix'))
      "
      class="custom-sidebar"
    />

    <div
      :class="[
        'main-container',
        pureSetting.hiddenSideBar ? 'main-hidden' : ''
      ]"
    >
      <!-- 顶部导航：完全悬浮透明 -->
      <div class="header-section">
        <LayHeader />
      </div>

      <!-- 内容区域：独立的圆角卡片 -->
      <div class="content-section">
        <div class="content-card">
          <el-scrollbar v-if="!set.fixedHeader">
            <el-backtop
              title="回到顶部"
              target=".main-container .el-scrollbar__wrap"
            >
              <BackTopIcon />
            </el-backtop>
            <LayContent :fixed-header="set.fixedHeader" />
          </el-scrollbar>
          <div v-else class="content-wrapper">
            <LayContent :fixed-header="set.fixedHeader" />
          </div>
        </div>
      </div>
    </div>
    <!-- 系统设置 -->
    <LaySetting />
  </div>
</template>

<style lang="scss">
/* 全局强效透明覆盖：直接清空所有框架层背景，确保基底背景图透出 */
html,
body,
#app {
  height: 100%;
  margin: 0;
  padding: 0;
}

.app-wrapper {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-image: url("@/assets/images/layout-background.png") !important;
  background-size: cover !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
  background-attachment: fixed !important;

  &::after {
    clear: both;
    display: table;
    content: "";
  }
}

/* 强力清除侧边栏及导航栏的所有背景、边框和阴影 */
.sidebar-container,
.sidebar-logo-container,
.outer-most,
.el-menu,
.el-scrollbar,
.el-scrollbar__view,
.el-scrollbar__wrap,
.navbar,
.fixed-header,
.header-section,
.main-container {
  background: transparent !important;
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
}

/* 隐藏侧边栏子菜单的箭头按钮 */
.el-sub-menu__icon-arrow {
  display: none !important;
}

/* 侧边栏菜单项样式微调 */
.custom-sidebar {
  z-index: 1001;

  .el-scrollbar {
    padding-top: 10px;
  }

  .el-menu {
    border: none !important;
    background: transparent !important;

    /* 统一所有层级的菜单项基础样式 */
    .el-menu-item,
    .el-sub-menu__title {
      margin: 4px 12px !important;
      height: 44px !important;
      line-height: 44px !important;
      border-radius: 10px !important;
      color: #333 !important;
      font-weight: 500 !important;
      transition: all 0.2s !important;
      display: flex !important;
      align-items: center !important;

      &:hover {
        background: rgba(255, 255, 255, 0.4) !important;
        color: #007aff !important;
      }

      &.is-active {
        background: #007aff !important;
        color: #fff !important;
        box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2) !important;

        i,
        svg,
        .sub-menu-icon {
          color: #fff !important;
        }

        &::before {
          display: none !important;
        }
      }

      i,
      svg,
      .sub-menu-icon {
        color: #444;
        font-size: 18px !important;
        margin-right: 6px !important;
      }
    }

    /* 二级菜单选中样式 - 确保短且右侧圆角可见 */
    .el-menu--inline {
      background: transparent !important;

      .el-menu-item {
        /* 使用 calc 强制限制宽度，确保右侧留出足够空间 */
        width: calc(100% - 90px) !important;
        margin: 4px 20px 4px 60px !important;
        padding-left: 10px !important;
        height: 38px !important;
        line-height: 38px !important;
        border-radius: 10px !important;
        font-size: 13px !important;
        display: flex !important;
        align-items: center !important;
        transition: all 0.2s !important;

        &.is-active {
          background: #007aff !important;
          color: #fff !important;
          box-shadow: 0 4px 12px rgba(0, 122, 255, 0.2) !important;

          &::after,
          &::before {
            display: none !important;
          }
        }
      }
    }

    /* 隐藏子菜单箭头 */
    .el-sub-menu__icon-arrow {
      display: none !important;
    }
  }
}

.main-container {
  position: relative;
  z-index: 1;
  flex: 1;
  height: 100vh;
  margin-left: 0;
  transition: margin-left var(--pure-transition-duration);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 顶部导航样式 */
.header-section {
  flex-shrink: 0;
  height: 70px;
  z-index: 1000;

  .navbar {
    height: 70px;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }
}

/* 内容区域样式 - 浮动卡片 */
.content-section {
  height: calc(100vh - 70px);
  padding: 0 20px 10px 0px;
  overflow: hidden;
  display: flex;
  box-sizing: border-box;

  .content-card {
    flex: 1;
    background: transparent !important;
    border-radius: 0;
    border: none;
    box-shadow: none;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  // .main-content {
  //   margin: 24px !important;
  // }

  .app-main,
  .app-main-nofixed-header {
    height: 100% !important;
    padding-top: 0 !important;
  }
}

.app-mask {
  position: absolute;
  top: 0;
  z-index: 2001;
  width: 100%;
  height: 100%;
  background: #000;
  opacity: 0.3;
}

.re-screen {
  margin-top: 12px;
}
</style>
