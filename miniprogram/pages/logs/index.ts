import StorageManager from '../../utils/storage';

Page({
  data: {
    statusBarHeight: 20, // 初始高度
    history: [] as any[]
  },

  onLoad() {
    // 获取手机状态栏高度，确保标题不被刘海遮挡
    const sysInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight
    });
  },

  onShow() {
    const logs = StorageManager.getScoreHistory();
    this.setData({ history: logs });
  },

  // 点击返回按钮
  onBack() {
    wx.navigateBack();
  }
});