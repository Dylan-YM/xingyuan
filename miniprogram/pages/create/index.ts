import StorageManager from '../../utils/storage';

Page({
  data: {
    statusBarHeight: 20,
    title: '',
    category: '劳动',
    hexColor: '#34C759',
    dateStr: '',
    
    // 表单状态
    categoriesList: ["常用", "劳动", "学习", "生活", "兴趣", "独立", "表扬", "批评"],
    scoreType: 0, // 0: 自由评分, 1: 固定评分
  },

  onLoad(options: any) {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight,
      title: options.title || '',
      category: options.cat || '劳动',
      hexColor: options.color ? decodeURIComponent(options.color) : '#5AC8FA',
      dateStr: options.date || ''
    });
  },

  onTitleInput(e: any) {
    this.setData({ title: e.detail.value });
  },

  onCategoryChange(e: any) {
    const idx = e.detail.value;
    this.setData({ category: this.data.categoriesList[idx] });
  },

  // 切换评分方式 (自由评分/固定评分)
  onScoreTypeChange(e: WechatMiniprogram.TouchEvent) {
    this.setData({ scoreType: Number(e.currentTarget.dataset.type) });
  },

  onBack() {
    wx.navigateBack({ delta: 1 });
  },

  // 点击添加按钮，保存数据到 Storage
  onAdd() {
    if (!this.data.title.trim()) {
      wx.showToast({ title: '请输入目标名称', icon: 'none' });
      return;
    }

    // 💡 核心修改：不再只存一天，而是调用全局添加方法，让所有日期都能看到
    StorageManager.addGlobalTask(this.data.category, {
      title: this.data.title,
      iconColor: this.data.hexColor
    });

    wx.showToast({ title: '添加成功', icon: 'success' });
    setTimeout(() => {
      // 成功后，连退两页回到首页
      wx.navigateBack({ delta: 2 });
    }, 1000);
  }
});