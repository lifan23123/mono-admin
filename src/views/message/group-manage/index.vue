<script setup lang="ts">
import { ref } from "vue";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import EditPen from "~icons/ep/edit-pen";

defineOptions({
  name: "MessageGroupManage"
});

const ownerQuery = ref("");
const chatQuery = ref("");
const statusValue = ref("全部");
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(120);

const tableData = ref(
  Array.from({ length: 10 }).map((_, i) => ({
    id: i + 1,
    groupChat: {
      name: "admin01",
      desc: "山鸟与鱼不同路",
      avatarLogo: "王"
    },
    members: 2,
    virtualMembers: i === 0 ? 1000 : 2,
    owner: {
      name: "admin01",
      uid: "5454447",
      avatarInitial: "王"
    },
    limit: 1000,
    muteStatus: "关闭",
    loginTime: "1小时前",
    loginDetail: "2026-03-11 13:42:54",
    status: "正常"
  }))
);

const handleSizeChange = (val: number) => {
  console.log(`${val} items per page`);
};
const handleCurrentChange = (val: number) => {
  console.log(`current page: ${val}`);
};
</script>

<template>
  <div class="group-manage-container p-4">
    <el-card
      shadow="never"
      class="filter-card mb-4 border-none border-radius-16"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-8">
          <div class="flex items-center">
            <span class="mr-4 text-sm text-gray-600 whitespace-nowrap"
              >群主</span
            >
            <el-input
              v-model="ownerQuery"
              placeholder="昵称/ID"
              class="search-input"
              clearable
            />
          </div>
          <div class="flex items-center">
            <span class="mr-4 text-sm text-gray-600 whitespace-nowrap"
              >群聊</span
            >
            <el-input
              v-model="chatQuery"
              placeholder="昵称/ID"
              class="search-input"
              clearable
            />
          </div>
          <div class="flex items-center">
            <span class="mr-4 text-sm text-gray-600 whitespace-nowrap"
              >状态</span
            >
            <el-select v-model="statusValue" class="status-select">
              <el-option label="全部" value="全部" />
              <el-option label="正常" value="正常" />
              <el-option label="异常" value="异常" />
            </el-select>
          </div>
        </div>
        <el-button type="primary" class="query-btn px-8">查询</el-button>
      </div>
    </el-card>

    <el-card shadow="never" class="table-card border-none border-radius-16">
      <el-table
        :data="tableData"
        style="width: 100%"
        class="custom-table flex-1"
        height="100%"
        header-cell-class-name="custom-header-cell"
      >
        <!-- Group Chat Column -->
        <el-table-column label="群聊" min-width="160">
          <template #default="scope">
            <div class="flex items-center">
              <div class="group-avatar mr-3">
                <div
                  class="avatar-box flex items-center justify-center text-blue-500 font-bold bg-gray-100 rounded"
                >
                  {{ scope.row.groupChat.avatarLogo
                  }}{{ scope.row.groupChat.avatarLogo }}
                </div>
              </div>
              <div>
                <div class="text-sm font-bold text-gray-800">
                  {{ scope.row.groupChat.name }}
                </div>
                <div class="text-xs text-gray-400">
                  {{ scope.row.groupChat.desc }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column
          prop="members"
          label="成员"
          align="center"
          width="80"
        />

        <!-- Virtual Members Column -->
        <el-table-column label="虚拟成员" align="center" width="120">
          <template #default="scope">
            <div class="flex items-center justify-center">
              <span class="mr-2">{{ scope.row.virtualMembers }}</span>
              <component
                :is="useRenderIcon(EditPen)"
                class="text-gray-400 cursor-pointer hover:text-blue-500"
              />
            </div>
          </template>
        </el-table-column>

        <!-- Owner Column -->
        <el-table-column label="群主" min-width="150" align="center">
          <template #default="scope">
            <div class="flex items-center justify-center">
              <el-avatar class="mr-2 bg-blue-500 text-white" :size="32">
                {{ scope.row.owner.avatarInitial }}
              </el-avatar>
              <div class="text-left">
                <div class="text-sm font-bold text-gray-800">
                  {{ scope.row.owner.name }}
                </div>
                <div class="text-xs text-gray-400">
                  ID:{{ scope.row.owner.uid }}
                </div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="管理员" align="center" width="100">
          <template #default>
            <el-button link type="primary" class="underline-link"
              >查看</el-button
            >
          </template>
        </el-table-column>

        <el-table-column
          prop="limit"
          label="人员上限"
          align="center"
          width="100"
        />

        <el-table-column
          prop="muteStatus"
          label="禁言名单"
          align="center"
          width="100"
        />

        <el-table-column label="聊天记录" align="center" width="100">
          <template #default>
            <el-button link type="primary" class="underline-link"
              >查看</el-button
            >
          </template>
        </el-table-column>

        <!-- Login Time Column -->
        <el-table-column label="登录时间" min-width="180" align="center">
          <template #default="scope">
            <div>
              <div class="text-sm text-gray-800">{{ scope.row.loginTime }}</div>
              <div class="text-xs text-gray-400">
                {{ scope.row.loginDetail }}
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="scope">
            <span class="status-tag status-normal">{{ scope.row.status }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="150" align="center">
          <template #default>
            <el-button link type="primary" class="op-link">复制</el-button>
            <el-button link type="primary" class="op-link">封停</el-button>
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
  </div>
</template>

<style lang="scss" scoped>
.group-manage-container {
  background: transparent;
  width: 100%;
  min-height: 100%;

  .border-radius-16 {
    border-radius: 16px !important;
  }

  .filter-card {
    :deep(.el-card__body) {
      padding: 20px 24px;
    }

    .search-input {
      width: 200px;
      :deep(.el-input__wrapper) {
        background-color: #f7f8fa;
        box-shadow: none;
        border-radius: 8px;
        height: 40px;
      }
    }

    .status-select {
      width: 160px;
      :deep(.el-input__wrapper) {
        background-color: #f7f8fa;
        box-shadow: none;
        border-radius: 8px;
        height: 40px;
      }
    }

    .query-btn {
      height: 40px;
      border-radius: 8px;
      background-color: #0076fe;
      border: none;
    }
  }

  .table-card {
    padding: 8px;
    height: calc(100vh - 240px);
    display: flex;
    flex-direction: column;

    :deep(.el-card__body) {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: hidden;
    }
  }

  .custom-table {
    :deep(.custom-header-cell) {
      background-color: #f7f8fa !important;
      color: #909399;
      font-weight: 500;
      height: 50px;
      border: none;
    }

    :deep(.el-table__row) {
      height: 72px;
      td {
        border-bottom: 1px dotted #f0f0f0;
      }
    }

    .avatar-box {
      width: 40px;
      height: 40px;
      font-size: 12px;
      line-height: 1.2;
    }

    .underline-link {
      text-decoration: underline;
      color: #333;
      font-weight: normal;
      &:hover {
        color: #0076fe;
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
    }

    .op-link {
      font-weight: 500;
      margin: 0 8px;
      padding: 0;
      color: #0076fe;
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
</style>
