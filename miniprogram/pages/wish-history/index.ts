Page({
  data: {
    statusBarHeight: 20,
    historyList: [] as any[]
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight });
  },

  onShow() {
    this.loadHistory();
  },

  loadHistory() {
    // 根据你的 StorageManager 实现，这里读取日志的 key。
    // 通常叫 StarShine_ScoreLogs 或类似名称，如果不对请根据实际情况调整
    const allLogs = wx.getStorageSync('StarShine_ScoreHistory') || [];
    
    // 过滤出消费记录（amount 为负数 或者 type 为 sub 的记录）
    const history = allLogs.filter((log: any) => log.amount < 0 || log.type === 'sub');
    
    // 倒序排列，最新的在最上面
    this.setData({ 
      historyList: history.reverse() 
    });
  },

  onBack() {
    wx.navigateBack();
  }
});