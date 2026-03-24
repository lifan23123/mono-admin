<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import * as echarts from "echarts";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import PieChart from "~icons/ep/pie-chart";
import TrendUp from "~icons/ep/caret-top";
import TrendDown from "~icons/ep/caret-bottom";
import data1 from "@/assets/images/data-1.png";
import data2 from "@/assets/images/data-2.png";
import data3 from "@/assets/images/data-3.png";
import data4 from "@/assets/images/data-4.png";
import { getPlatformDataStatistics } from "@/api/user";

defineOptions({
  name: "Statistics"
});

const lineChartRef = ref<HTMLDivElement>();
const wordCloudRef = ref<HTMLDivElement>();
let lineChart: echarts.ECharts | null = null;

const statisticsData = ref({
  accountCount: 0,
  userCount: 0,
  todayLoginCount: 0,
  registerCount: 0,
  userNewTodayCount: 0,
  userNewTodayWeekRank: "0%",
  userNewLastWeekCount: 0,
  userNewTodayDayRank: "0%",
  userNewYesterdayCount: 0,
  dauTodayCount: 0,
  dauTodayWeekRank: "0%",
  dauLastWeekCount: 0,
  dauTodayDayRank: "0%",
  dauYesterdayCount: 0
});

const initLineChart = () => {
  if (!lineChartRef.value) return;
  lineChart = echarts.init(lineChartRef.value);
  const option = {
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      borderRadius: 10,
      padding: 10,
      textStyle: {
        color: "#666"
      },
      extraCssText: "box-shadow: 0 0 10px rgba(0,0,0,0.1)"
    },
    legend: {
      data: ["男生", "女生"],
      left: 60,
      top: 0,
      icon: "rect",
      itemWidth: 10,
      itemHeight: 10
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "3%",
      containLabel: true
    },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: ["03-11", "03-12", "03-13", "03-14", "03-15", "03-16", "03-17"],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#999" }
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: {
        lineStyle: {
          type: "dashed",
          color: "#eee"
        }
      },
      axisLabel: { color: "#999" }
    },
    series: [
      {
        name: "男生",
        type: "line",
        smooth: true,
        showSymbol: false,
        data: [70, 160, 155, 240, 160, 245, 120],
        lineStyle: {
          width: 3,
          color: "#007aff"
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(0, 122, 255, 0.2)" },
            { offset: 1, color: "rgba(0, 122, 255, 0)" }
          ])
        }
      },
      {
        name: "女生",
        type: "line",
        smooth: true,
        showSymbol: false,
        data: [130, 185, 150, 175, 120, 115, 60],
        lineStyle: {
          width: 3,
          color: "#ff5b5b"
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(255, 91, 91, 0.2)" },
            { offset: 1, color: "rgba(255, 91, 91, 0)" }
          ])
        }
      }
    ]
  };
  lineChart.setOption(option);
};

const handleResize = () => {
  lineChart?.resize();
};

const fetchStatistics = async () => {
  try {
    const { data } = await getPlatformDataStatistics();
    Object.keys(data).forEach(key => {
      statisticsData.value[key] = data[key] || 0;
    });
  } catch (error) {
    console.error("Failed to fetch statistics:", error);
  }
};

onMounted(async () => {
  await fetchStatistics();
  await new Promise(resolve => setTimeout(resolve, 300)); // Ensure layout is stable
  initLineChart();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<template>
  <div class="statistics-container p-4">
    <!-- Top Group Card (Title + 4 Core Stats) -->
    <el-card
      shadow="never"
      class="main-top-card mb-4 border-none border-radius-16"
    >
      <div class="flex items-center mb-6">
        <div class="header-icon flex items-center justify-center mr-2">
          <component
            :is="useRenderIcon(PieChart)"
            class="text-blue-500 text-xl"
          />
        </div>
        <span class="text-lg font-bold text-gray-800">平台统计</span>
      </div>

      <el-row :gutter="16">
        <el-col :xs="24" :sm="12" :md="6">
          <div
            class="stat-inner-box bg-gray-50 flex items-center p-4 border-radius-12"
          >
            <div class="icon-wrapper mr-4">
              <img :src="data1" class="w-20 h-20 object-contain" />
            </div>
            <div class="ml-4 overflow-hidden">
              <div class="text-gray-400 text-xs mb-1 truncate">子账号数量</div>
              <div class="text-2xl font-bold text-gray-800">
                {{ statisticsData.accountCount }}
              </div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div
            class="stat-inner-box bg-gray-50 flex items-center p-4 border-radius-12"
          >
            <div class="icon-wrapper mr-4">
              <img :src="data2" class="w-20 h-20 object-contain" />
            </div>
            <div class="ml-4 overflow-hidden">
              <div class="text-gray-400 text-xs mb-1 truncate">总用户数量</div>
              <div class="text-2xl font-bold text-gray-800">
                {{ statisticsData.userCount }}
              </div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div
            class="stat-inner-box bg-gray-50 flex items-center p-4 border-radius-12"
          >
            <div class="icon-wrapper mr-4">
              <img :src="data3" class="w-20 h-20 object-contain" />
            </div>
            <div class="ml-4 overflow-hidden">
              <div class="text-gray-400 text-xs mb-1 truncate">
                今日总上线数量
              </div>
              <div class="text-2xl font-bold text-gray-800">
                {{ statisticsData.todayLoginCount }}
              </div>
            </div>
          </div>
        </el-col>
        <el-col :xs="24" :sm="12" :md="6">
          <div
            class="stat-inner-box bg-gray-50 flex items-center p-4 border-radius-12"
          >
            <div class="icon-wrapper mr-4">
              <img :src="data4" class="w-20 h-20 object-contain" />
            </div>
            <div class="ml-4 overflow-hidden">
              <div class="text-gray-400 text-xs mb-1 truncate">
                今日总注册用户数量
              </div>
              <div class="text-2xl font-bold text-gray-800">
                {{ statisticsData.registerCount }}
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- Comparison Group Card (Title + 4 Core Stats) -->
    <el-card
      shadow="never"
      class="main-comparison-card mb-4 border-none border-radius-16"
    >
      <el-row :gutter="0">
        <!-- New Users Module -->
        <el-col :xs="24" :md="12" class="comparison-module relative pr-8">
          <div class="flex items-center h-full">
            <div class="main-stat text-center p-6 bg-gray-50 border-radius-12">
              <div class="text-2xl font-bold text-gray-800">
                {{ statisticsData.userNewTodayCount }}
              </div>
              <div class="text-gray-400 text-sm">新增用户</div>
            </div>
            <div class="flex items-center ml-36">
              <div class="comp-item text-left mr-16">
                <div class="flex items-center text-xs text-gray-400 mb-1">
                  周同比
                  <component
                    :is="useRenderIcon(TrendUp)"
                    class="text-red-500 ml-1"
                  />
                  <span class="text-red-500 ml-1">{{
                    statisticsData.userNewTodayWeekRank
                  }}</span>
                </div>
                <div class="text-lg font-bold text-gray-800">
                  {{ statisticsData.userNewLastWeekCount }}
                </div>
                <div class="text-xs text-gray-300">上周新增用户</div>
              </div>
              <div class="divider-v"></div>
              <div class="comp-item text-left ml-16">
                <div class="flex items-center text-xs text-gray-400 mb-1">
                  日同比
                  <component
                    :is="useRenderIcon(TrendDown)"
                    class="text-green-500 ml-1"
                  />
                  <span class="text-green-500 ml-1">{{
                    statisticsData.userNewTodayDayRank
                  }}</span>
                </div>
                <div class="text-lg font-bold text-gray-800">
                  {{ statisticsData.userNewYesterdayCount }}
                </div>
                <div class="text-xs text-gray-300">昨日新增用户</div>
              </div>
            </div>
          </div>
          <!-- Internal Divider Line -->
          <div
            class="absolute right-0 top-1/2 -translate-y-1/2 w-[1px] h-16 bg-gray-100 hidden md:block"
          ></div>
        </el-col>

        <!-- Daily Active Users Module -->
        <el-col :xs="24" :md="12" class="comparison-module pl-8">
          <div class="flex items-center h-full">
            <div class="main-stat text-center p-6 bg-gray-50 border-radius-12">
              <div class="text-2xl font-bold text-gray-800">
                {{ statisticsData.dauTodayCount }}
              </div>
              <div class="text-gray-400 text-sm">日活用户</div>
            </div>
            <div class="flex items-center ml-36">
              <div class="comp-item text-left mr-16">
                <div class="flex items-center text-xs text-gray-400 mb-1">
                  周同比
                  <component
                    :is="useRenderIcon(TrendUp)"
                    class="text-red-500 ml-1"
                  />
                  <span class="text-red-500 ml-1">{{
                    statisticsData.dauTodayWeekRank
                  }}</span>
                </div>
                <div class="text-lg font-bold text-gray-800">
                  {{ statisticsData.dauLastWeekCount }}
                </div>
                <div class="text-xs text-gray-300">上周日活用户</div>
              </div>
              <div class="divider-v"></div>
              <div class="comp-item text-left ml-16">
                <div class="flex items-center text-xs text-gray-400 mb-1">
                  日同比
                  <component
                    :is="useRenderIcon(TrendDown)"
                    class="text-green-500 ml-1"
                  />
                  <span class="text-green-500 ml-1">{{
                    statisticsData.dauTodayDayRank
                  }}</span>
                </div>
                <div class="text-lg font-bold text-gray-800">
                  {{ statisticsData.dauYesterdayCount }}
                </div>
                <div class="text-xs text-gray-300">昨日日活用户</div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- Charts Group Card -->
    <!-- <el-card
      shadow="never"
      class="main-charts-card border-none border-radius-16"
    >
      <el-row :gutter="32">
        <el-col :xs="24" :lg="14">
          <div class="chart-box">
            <div class="chart-header mb-4">
              <span class="font-bold text-gray-700 text-sm"
                >近一周男女在线人数</span
              >
            </div>
            <div ref="lineChartRef" class="chart-content"></div>
          </div>
        </el-col>
        <el-col :xs="24" :lg="10">
          <div class="chart-box">
            <div class="chart-header mb-4">
              <span class="font-bold text-gray-700 text-sm">关键词统计</span>
            </div>
            <div class="word-cloud-container">
              <div class="keyword-tags">
                <div class="tag-row row-1">
                  <span class="keyword size-s">实用</span>
                  <span class="keyword size-xs">认同</span>
                  <span class="keyword size-s">信任</span>
                </div>
                <div class="tag-row row-2">
                  <span class="keyword size-xs">蓝色</span>
                  <span class="keyword size-xs">沉浸</span>
                  <span class="keyword size-m font-bold">智能</span>
                  <span class="keyword size-xs">沉浸</span>
                  <span class="keyword size-xs">科技</span>
                  <span class="keyword size-xs">毛玻璃</span>
                </div>
                <div class="tag-row row-3">
                  <span class="keyword size-xs">灰色</span>
                  <span class="keyword size-xs">白色</span>
                  <span class="keyword size-s">降噪</span>
                  <span class="keyword size-l text-blue-500 font-bold"
                    >沉浸</span
                  >
                  <span class="keyword size-l text-blue-600 font-bold"
                    >专业</span
                  >
                  <span class="keyword size-l text-blue-500 font-bold"
                    >友好</span
                  >
                  <span class="keyword size-s">极简</span>
                  <span class="keyword size-xs">线条</span>
                  <span class="keyword size-xs">背景图</span>
                  <span class="keyword size-xs">背景图</span>
                </div>
                <div class="tag-row row-4">
                  <span class="keyword size-xs">黄色</span>
                  <span class="keyword size-m font-bold">简便</span>
                  <span class="keyword size-xs">数据</span>
                </div>
                <div class="tag-row row-5">
                  <span class="keyword size-xs">空白</span>
                  <span class="keyword size-s">智能</span>
                  <span class="keyword size-xs">美感</span>
                  <span class="keyword size-s">商业</span>
                </div>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card> -->
  </div>
</template>

<style lang="scss" scoped>
.statistics-container {
  background: transparent;
  width: 100%;
  min-height: 100%;
}

.border-radius-16 {
  border-radius: 16px !important;
}

.border-radius-12 {
  border-radius: 12px !important;
}

.header-card {
  .header-icon {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }
}

.stat-inner-box {
  .icon-wrapper {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

.main-top-card {
  .stat-inner-box {
    height: 140px; /* 增加高度 */
  }
}

.main-comparison-card {
  height: 160px; /* 增加高度 */

  :deep(.el-card__body) {
    height: 100%;
    display: flex;
    align-items: center;
    padding: 0 24px;
  }

  .el-row {
    width: 100%;
  }

  .main-stat {
    min-width: 140px;
  }

  .divider-v {
    width: 1px;
    height: 40px;
    background: #f0f0f0;
  }

  .comp-item {
    text-align: left;
  }
}

.main-charts-card {
  .chart-content {
    height: 400px; /* 增加高度 */
    width: 100%;
  }
}

.word-cloud-container {
  height: 400px; /* 增加高度 */
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  background: #fcfcfc;
  border-radius: 8px;

  .keyword-tags {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .tag-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    margin: 10px 0;
  }

  .keyword {
    color: #999;
    white-space: nowrap;

    &.size-xs {
      font-size: 12px;
      opacity: 0.6;
    }
    &.size-s {
      font-size: 14px;
      color: #777;
    }
    &.size-m {
      font-size: 18px;
      color: #555;
    }
    &.size-l {
      font-size: 24px;
    }
  }
}

:deep(.el-card__header) {
  border-bottom: 1px solid #f5f5f5;
  padding: 12px 20px;
}

:deep(.el-card__body) {
  padding: 20px;
}
</style>
