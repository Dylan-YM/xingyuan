import { TargetLibrary, TaskItem } from '../../data/library';

Page({
  data: {
    statusBarHeight: 20,
    categories: ["常用", "劳动", "学习", "生活", "兴趣", "独立", "表扬", "批评"],
    currentCategory: "劳动", // 默认显示劳动
    listData: [] as TaskItem[],
    targetDateStr: '' // 记录要把任务加到哪一天
  },

  onLoad(options: any) {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight,
      targetDateStr: options.date || '' // 接收传过来的日期
    });
    this.loadCategoryData('劳动');
  },

  loadCategoryData(category: string) {
    // 如果选了“常用”，为了演示，我们先拿一部分拼起来
    let items = [];
    if (category === '常用') {
      items = [...(TargetLibrary['生活']||[]).slice(0, 4), ...(TargetLibrary['学习']||[]).slice(0, 4)];
    } else {
      items = TargetLibrary[category] || [];
    }
    
    this.setData({
      currentCategory: category,
      listData: items
    });
  },

  onTabClick(e: WechatMiniprogram.TouchEvent) {
    const cat = e.currentTarget.dataset.cat;
    this.loadCategoryData(cat);
  },

  // 点击具体的模板 -> 跳到创建页，并把参数带过去
  onItemClick(e: WechatMiniprogram.TouchEvent) {
    const item = this.data.listData[e.currentTarget.dataset.index];
    wx.navigateTo({
      url: `/pages/create/index?title=${item.title}&cat=${this.data.currentCategory}&color=${encodeURIComponent(item.hexColor)}&date=${this.data.targetDateStr}`
    });
  },

  // 点击底部“自定义添加” -> 跳到创建页，不带参数（全空）
  onCustomAdd() {
    wx.navigateTo({
      url: `/pages/create/index?date=${this.data.targetDateStr}`
    });
  },

  // 点击右上角导入
  onImportTap() {
    wx.navigateTo({
      url: `/pages/import/index?date=${this.data.targetDateStr}`
    });
  },

  onBack() {
    wx.navigateBack({ delta: 1 });
  }
});