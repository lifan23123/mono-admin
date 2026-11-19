export interface PostCommentItem {
  id: number;
  userName: string;
  userAccount: string;
  userAvatar?: string;
  replyTo?: string;
  content: string;
  likeCount: number;
  createTime: string;
}

export interface PostItem {
  id: number;
  authorId: number;
  authorName: string;
  authorAccount: string;
  authorAvatar?: string;
  authorStatus: number; // 1: 正常, 0: 已封号
  content: string;
  mediaType: "image" | "video" | "text";
  images: string[];
  videoUrl?: string;
  videoPoster?: string;
  likeCount: number;
  commentCount: number;
  createTime: string;
  comments: PostCommentItem[];
}

export const MOCK_POST_LIST: PostItem[] = [
  {
    id: 10001,
    authorId: 2001,
    authorName: "林清风",
    authorAccount: "linqingfeng",
    authorAvatar: "",
    authorStatus: 1,
    content:
      "周末和朋友去西湖边散步，顺便拍了一组九宫格照片，秋天的光线真的太治愈了，分享给大家一起感受一下！",
    mediaType: "image",
    images: [
      "https://picsum.photos/seed/post10001-1/500/500",
      "https://picsum.photos/seed/post10001-2/500/500",
      "https://picsum.photos/seed/post10001-3/500/500",
      "https://picsum.photos/seed/post10001-4/500/500",
      "https://picsum.photos/seed/post10001-5/500/500",
      "https://picsum.photos/seed/post10001-6/500/500",
      "https://picsum.photos/seed/post10001-7/500/500",
      "https://picsum.photos/seed/post10001-8/500/500",
      "https://picsum.photos/seed/post10001-9/500/500"
    ],
    likeCount: 128,
    commentCount: 3,
    createTime: "2026-11-18 14:32:10",
    comments: [
      {
        id: 1,
        userName: "陈小雨",
        userAccount: "chenxiaoyu",
        content: "构图和色调都太好看了，请问用的是什么相机拍的呀？",
        likeCount: 12,
        createTime: "2026-11-18 14:40:21"
      },
      {
        id: 2,
        userName: "林清风",
        userAccount: "linqingfeng",
        replyTo: "陈小雨",
        content: "谢谢夸奖！是用富士相机直出加了一点点微调。",
        likeCount: 6,
        createTime: "2026-11-18 14:45:03"
      },
      {
        id: 3,
        userName: "张远航",
        userAccount: "zhangyh",
        content: "这周末天气确实舒服，我也准备去转转。",
        likeCount: 3,
        createTime: "2026-11-18 15:12:48"
      }
    ]
  },
  {
    id: 10002,
    authorId: 2002,
    authorName: "苏沐橙",
    authorAccount: "sumucheng88",
    authorAvatar: "",
    authorStatus: 1,
    content:
      "随手录了一段海边日落的视频，海浪声特别解压，建议戴上耳机看完整段。",
    mediaType: "video",
    images: [],
    videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4",
    videoPoster: "https://picsum.photos/seed/post10002-poster/640/360",
    likeCount: 256,
    commentCount: 2,
    createTime: "2026-11-18 11:15:42",
    comments: [
      {
        id: 4,
        userName: "顾北辰",
        userAccount: "gubeichen",
        content: "画面好稳，日落颜色绝了！",
        likeCount: 19,
        createTime: "2026-11-18 11:30:11"
      },
      {
        id: 5,
        userName: "周一一",
        userAccount: "zhouyiyi",
        content: "收藏了，下次去海边也要这样拍。",
        likeCount: 5,
        createTime: "2026-11-18 12:04:55"
      }
    ]
  },
  {
    id: 10003,
    authorId: 2003,
    authorName: "陆明泽",
    authorAccount: "lumingze",
    authorAvatar: "",
    authorStatus: 0,
    content:
      "分享几张最近打卡的咖啡馆环境图，安静又出片，很适合下午带电脑办公。",
    mediaType: "image",
    images: [
      "https://picsum.photos/seed/post10003-1/500/500",
      "https://picsum.photos/seed/post10003-2/500/500",
      "https://picsum.photos/seed/post10003-3/500/500",
      "https://picsum.photos/seed/post10003-4/500/500"
    ],
    likeCount: 64,
    commentCount: 1,
    createTime: "2026-11-17 19:20:05",
    comments: [
      {
        id: 6,
        userName: "沈念",
        userAccount: "shennian",
        content: "求地址！周末正好想找个安静的地方看书。",
        likeCount: 4,
        createTime: "2026-11-17 19:45:19"
      }
    ]
  },
  {
    id: 10004,
    authorId: 2004,
    authorName: "许知微",
    authorAccount: "xuzhiwei",
    authorAvatar: "",
    authorStatus: 1,
    content:
      "今天终于把拖了很久的读书笔记整理完了，坚持输出确实会让思考变得更清晰。大家最近都在看什么书？欢迎评论区推荐。",
    mediaType: "text",
    images: [],
    likeCount: 42,
    commentCount: 0,
    createTime: "2026-11-17 09:08:33",
    comments: []
  }
];
