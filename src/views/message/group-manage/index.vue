<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getChatList, getQiNiuDomain, getChatUpdate } from "@/api/user";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { message } from "@/utils/message";
import { ElMessageBox } from "element-plus";
import ChatRecordDialog from "../components/ChatRecordDialog.vue";
import RefreshIcon from "~icons/ri/refresh-line";

defineOptions({
  name: "MessageGroupManage"
});

const userName = ref("");
const name = ref("");
const state = ref("");
const loading = ref(false);
const tableData = ref([]);
const total = ref(0);
const pageNo = ref(1);
const pageSize = ref(20);
const qiniuDomain = ref("");

// 弹窗状态
const dialogVisible = ref(false);
const memberDialogVisible = ref(false);
const currentChatId = ref("");
const currentChatName = ref("");
const currentMembers = ref<any[]>([]);

const fetchQiNiuDomain = async () => {
  try {
    const res = await getQiNiuDomain();
    const { data } = res as any;
    if (data) qiniuDomain.value = data;
  } catch (e) {}
};

const getUrl = (path: string) => {
  if (!path || path.startsWith("http")) return path || "";
  let domainBase = "";
  if (typeof qiniuDomain.value === "string") domainBase = qiniuDomain.value;
  else if (qiniuDomain.value && typeof qiniuDomain.value === "object") {
    domainBase = (qiniuDomain.value as any).url || "";
  }
  const domain = domainBase.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return domain + cleanPath;
};

const fetchList = async () => {
  loading.value = true;
  try {
    const res = await getChatList({
      pageNo: pageNo.value,
      pageSize: pageSize.value,
      userName: userName.value, // 群主搜索
      name: name.value, // 群聊搜索
      state: state.value, // 状态筛选
      type: 2
    });

    const { data, code, total: totalCount } = res as any;
    if (code === "0000") {
      tableData.value = (data || []).map(item => ({
        ...item,
        groupInfo: {
          icon: getUrl(item.icon),
          name: item.name,
          owner: item.managerUsers?.[0]?.name || "未知"
        },
        ownerInfo: item.managerUsers?.[0] || {}
      }));
      total.value = totalCount || tableData.value.length;
    }
  } catch (error) {
    console.error("Fetch group management list failed:", error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  pageNo.value = 1;
  fetchList();
};

const openChatDialog = (row: any) => {
  currentChatId.value = row.id;
  currentChatName.value = row.groupInfo.name;
  dialogVisible.value = true;
};

const openMemberDialog = (row: any) => {
  currentMembers.value = (row.managerUsers || []).map((user: any) => ({
    ...user,
    fullIcon: getUrl(user.icon)
  }));
  memberDialogVisible.value = true;
};

const handleToggleState = (row: any) => {
  const isBanning = row.state === 1;
  const newState = isBanning ? 2 : 1;
  const actionText = isBanning ? "封停" : "解封";

  ElMessageBox.confirm(`确认要${actionText}该群聊吗？`, "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      const res = await getChatUpdate({
        id: row.id,
        state: newState,
        type: 2
      });
      if ((res as any).code === "0000") {
        message(`${actionText}成功`, { type: "success" });
        fetchList();
      } else {
        message((res as any).message || `${actionText}失败`, { type: "error" });
      }
    } catch (e) {
      console.error(e);
      message("操作异常", { type: "error" });
    }
  });
};

onMounted(() => {
  fetchQiNiuDomain();
  fetchList();
});
</script>

<template>
  <div class="message-group-manage-container p-4">
    <el-card shadow="never" class="filter-card mb-4 border-none border-radius-16">
      <div class="flex items-center gap-6 px-2 overflow-x-auto no-scrollbar">
        <div class="flex items-center shrink-0">
          <span class="mr-3 text-sm text-gray-500">群主</span>
          <el-input v-model="userName" placeholder="昵称/ID" class="search-input" clearable @keyup.enter="handleSearch" />
        </div>
        <div class="flex items-center shrink-0">
          <span class="mr-3 text-sm text-gray-500">群聊</span>
          <el-input v-model="name" placeholder="群名/ID" class="search-input" clearable @keyup.enter="handleSearch" />
        </div>
        <div class="flex items-center shrink-0">
          <span class="mr-3 text-sm text-gray-500">状态</span>
          <el-select v-model="state" placeholder="全部" class="status-select" clearable @change="handleSearch">
            <el-option label="禁用" value="0" />
          </el-select>
        </div>
        <el-button type="primary" class="query-btn px-8 shrink-0 ml-4" @click="handleSearch">查询</el-button>
      </div>
    </el-card>

    <el-card shadow="never" class="main-table-card border-none border-radius-16 flex-1 flex flex-col overflow-hidden">
      <el-table v-loading="loading" :data="tableData" height="100%" class="custom-table">
        <el-table-column label="群聊" min-width="220">
          <template #default="{ row }">
            <div class="flex items-center gap-3">
              <el-image :src="row.groupInfo.icon" class="w-12 h-12 rounded-lg shrink-0 shadow-sm" fit="cover">
                <template #error><div class="w-full h-full bg-blue-500 flex items-center justify-center text-white text-xs">群</div></template>
              </el-image>
              <div class="flex flex-col overflow-hidden">
                <span class="text-[15px] font-bold text-gray-800 truncate mb-0.5">{{ row.groupInfo.owner }}</span>
                <span class="text-xs text-gray-400 truncate">{{ row.groupInfo.name }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="成员" width="80" align="center">
          <template #default="{ row }">
            <span class="text-sm text-gray-600">{{ row.peopleNum || 0 }}</span>
          </template>
        </el-table-column>

        <el-table-column label="虚拟成员" width="110" align="center">
          <template #default>
            <div class="flex items-center justify-center gap-1 text-gray-400 text-sm italic">
              1000 <component :is="useRenderIcon('ri:edit-line')" class="text-xs cursor-pointer hover:text-blue-500" />
            </div>
          </template>
        </el-table-column>

        <el-table-column label="群主" min-width="150">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <el-avatar :src="row.ownerInfo.icon" :size="36" class="shrink-0" />
              <div class="flex flex-col overflow-hidden">
                <span class="text-[14px] font-bold text-gray-700 truncate mb-0.5">{{ row.ownerInfo.name }}</span>
                <span class="text-xs text-gray-400 truncate">ID: {{ row.ownerInfo.id }}</span>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="管理员" width="100" align="center">
          <template #default="{ row }">
            <el-button link type="primary" class="text-sm underline decoration-blue-300" @click="openMemberDialog(row)">查看</el-button>
          </template>
        </el-table-column>

        <el-table-column label="人员上限" width="100" align="center" prop="capacity">
          <template #default>500</template>
        </el-table-column>

        <el-table-column label="禁言名单" width="100" align="center">
          <template #default="{ row }">
            <span>{{ row.isJingyan == 1 ? '开启' : '关闭' }}</span>
          </template>
        </el-table-column>

        <el-table-column label="聊天记录" width="100" align="center">
          <template #default="{ row }">
            <el-button link type="primary" class="text-sm underline decoration-blue-300" @click="openChatDialog(row)">查看</el-button>
          </template>
        </el-table-column>

        <el-table-column label="登录时间" width="160" align="center">
          <template #default="{ row }">
            <div class="flex flex-col text-[11px] leading-tight text-gray-400">
              <!-- <span class="text-gray-600 mb-0.5">1小时前</span> -->
              <span>{{ row.createTime }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <span
              :class="[
                'px-3 py-1 rounded text-xs border truncate inline-block w-full',
                row.state === 1 ? 'bg-green-50 text-green-500 border-green-100' : 'bg-red-50 text-red-500 border-red-100'
              ]"
            >
              {{ row.state === 1 ? '正常' : '封停' }}
            </span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <div class="flex items-center justify-center">
              <el-button
                link
                :type="row.state === 1 ? 'danger' : 'primary'"
                class="text-sm"
                @click="handleToggleState(row)"
              >
                {{ row.state === 1 ? '封停' : '解封' }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container py-6 flex justify-center bg-white border-t border-gray-100 shrink-0">
        <el-pagination
          v-model:current-page="pageNo"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
          layout="prev, pager, next, jumper, slot, total, sizes"
          @size-change="fetchList"
          @current-change="fetchList"
        >
          <template #default>
            <span class="mx-2 text-gray-400">页</span>
          </template>
        </el-pagination>
      </div>
    </el-card>

    <ChatRecordDialog v-model:visible="dialogVisible" :chat-id="currentChatId" :chat-name="currentChatName" :qiniu-domain="qiniuDomain" :type="2" />

    <!-- 人员信息弹窗 -->
    <el-dialog v-model="memberDialogVisible" title="人员信息" width="600px" align-center class="custom-dialog" append-to-body>
      <div class="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        <div v-if="currentMembers.length > 0">
          <div class="mb-6">
            <div class="flex items-center gap-2 mb-4 ml-1">
              <span class="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              <span class="text-sm font-bold text-gray-500 uppercase tracking-wider">管理员</span>
            </div>
            <div class="flex items-center gap-5 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 shadow-sm">
              <el-avatar :src="currentMembers[0].fullIcon" :size="52" class="ring-2 ring-white shadow-md" />
              <div class="flex flex-col">
                <span class="font-bold text-gray-800 text-[17px]">{{ currentMembers[0].name }}</span>
              </div>
            </div>
          </div>
          
          <div v-if="currentMembers.length > 1">
            <div class="flex items-center gap-2 mb-4 ml-1">
              <span class="w-1.5 h-4 bg-gray-300 rounded-full"></span>
              <span class="text-sm font-bold text-gray-500 uppercase tracking-wider">群成员 ({{ currentMembers.length - 1 }})</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div v-for="(member, index) in currentMembers.slice(1)" :key="index" class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100 transition-all duration-300 cursor-default group">
                <el-avatar :src="member.fullIcon" :size="40" class="group-hover:scale-110 transition-transform shadow-sm" />
                <span class="text-gray-700 font-semibold truncate">{{ member.name }}</span>
              </div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无人员信息" :image-size="80" />
      </div>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.message-group-manage-container {
  height: calc(100vh - 84px);
  display: flex;
  flex-direction: column;
  padding: 24px;

  .border-radius-16 { border-radius: 16px !important; }

  .filter-card {
    :deep(.el-card__body) { padding: 16px 24px; }
    .search-input, .status-select {
      width: 180px;
      :deep(.el-input__wrapper) { background-color: #f7f8fa; border-radius: 8px; height: 40px; box-shadow: none; }
    }
    .query-btn { height: 40px; border-radius: 8px; font-weight: bold; }
  }

  .main-table-card {
    :deep(.el-card__body) { padding: 0; display: flex; flex-direction: column; flex: 1; overflow: hidden; }
  }

  .custom-table {
    :deep(.el-table__header-wrapper) {
      th { background-color: #f9fafb !important; color: #9ca3af; font-weight: 500; height: 50px; font-size: 13px; }
    }
    :deep(.el-table__row) {
      height: 80px;
      &:nth-child(even) { background-color: #fefeff; }
    }
  }

  .no-scrollbar { &::-webkit-scrollbar { display: none; } }
}

:deep(.el-pagination) {
  .el-pager li {
    background: none; border: 1px solid #e4e7ed; border-radius: 4px; margin: 0 3px; font-weight: normal;
    &.is-active { background-color: #0076fe; color: #fff; border-color: #0076fe; }
  }
  .btn-prev, .btn-next { background: none; border: 1px solid #e4e7ed; border-radius: 4px; }
}
</style>
