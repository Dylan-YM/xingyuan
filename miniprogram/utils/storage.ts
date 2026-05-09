// utils/storage.ts
const TASKS_KEY = "StarShine_UserTasks"; // 全局任务模板
const DAILY_PREFIX = "StarShine_Date_"; // 每日数据前缀
const TOTAL_STARS_KEY = "StarShine_TotalStars"; // 总积分

export default class StorageManager {
  // 获取和设置全局总积分
  static getTotalStars(): number {
    return wx.getStorageSync(TOTAL_STARS_KEY) || 0;
  }
  static setTotalStars(val: number) {
    wx.setStorageSync(TOTAL_STARS_KEY, val);
  }

  // 加载某一天的数据
  static load(dateString: string): any[] {
    const dailyData = wx.getStorageSync(DAILY_PREFIX + dateString);
    if (dailyData) return dailyData; // 如果今天有数据，直接返回

    // 如果今天没数据，读取全局模版（清空已有的星星评分）
    const template = wx.getStorageSync(TASKS_KEY);
    if (template) {
      return template.map((sec: any) => ({
        ...sec,
        tasks: sec.tasks.map((t: any) => ({ ...t, rating: 0 }))
      }));
    }

    // 如果连模版都没，返回初始空状态
    return [
      { name: "劳动", count: 0, expanded: true, tasks: [] },
      { name: "学习", count: 0, expanded: true, tasks: [] },
      { name: "生活", count: 0, expanded: true, tasks: [] },
      { name: "兴趣", count: 0, expanded: true, tasks: [] },
      { name: "独立", count: 0, expanded: true, tasks: [] },
      { name: "表扬", count: 0, expanded: true, tasks: [] },
      { name: "批评", count: 0, expanded: true, tasks: [] }
    ];
  }

  // 保存某一天的数据
  static save(sections: any[], dateString: string) {
    // 自动更新每个分类的数量 count
    sections.forEach(sec => sec.count = sec.tasks.length);
    // 存入具体日期
    wx.setStorageSync(DAILY_PREFIX + dateString, sections);
    // 同步更新一份模版给明天用
    wx.setStorageSync(TASKS_KEY, sections);
  }

  // 清空所有缓存
  static clearAll() {
    wx.clearStorageSync();
  }
}