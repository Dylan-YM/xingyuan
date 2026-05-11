// utils/storage.ts
const TASKS_KEY = "StarShine_UserTasks"; // 全局任务模板
const DAILY_PREFIX = "StarShine_Date_"; // 每日数据前缀
const TOTAL_STARS_KEY = "StarShine_TotalStars"; // 总积分
export interface ScoreLog {
    title: string;      // 任务标题
    amount: number;     // 变化值 (如 +3, -2)
    date: string;       // 日期 (2024-05-09)
    time: string;       // 精确时间 (10:30)
    type: 'add' | 'sub';// 增加还是减少
  }
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
  
// 💡 新增：获取积分历史记录
static getScoreHistory(): ScoreLog[] {
    return wx.getStorageSync('StarShine_ScoreHistory') || [];
  }

  // 💡 新增：添加一条历史记录
  static addScoreLog(log: ScoreLog) {
    let history = this.getScoreHistory();
    history.unshift(log); // 新记录插到最前面
    // 只保留最近的100条记录，防止存储溢出
    if (history.length > 100) history = history.slice(0, 100);
    wx.setStorageSync('StarShine_ScoreHistory', history);
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

/**
   * 💡 新增核心方法：全局添加目标
   * 原理：遍历本地存过的所有历史日期以及全局模板，把新目标强制插入
   */
static addGlobalTask(categoryName: string, taskItem: { title: string, iconColor: string }) {
    try {
      const info = wx.getStorageInfoSync();
      
      // 找出所有日期的账本 key (例如 StarShine_Date_2026-05-09) 以及 全局模板 key
      const keysToUpdate = info.keys.filter(k => 
        k.startsWith("StarShine_Date_") || k === "StarShine_UserTasks"
      );

      keysToUpdate.forEach(key => {
        let sections = wx.getStorageSync(key);
        if (sections && Array.isArray(sections)) {
          // 找到对应的分类（如：劳动）
          const secIdx = sections.findIndex((s: any) => s.name === categoryName);
          if (secIdx > -1) {
            // 检查这个目标是否已经存在，防止重复添加
            const isExist = sections[secIdx].tasks.some((t: any) => t.title === taskItem.title);
            if (!isExist) {
              sections[secIdx].tasks.push({
                title: taskItem.title,
                iconColor: taskItem.iconColor,
                rating: 0 // 新加的任务默认 0 星
              });
              // 更新分类下的总数
              sections[secIdx].count = sections[secIdx].tasks.length;
              // 重新存回本地
              wx.setStorageSync(key, sections);
            }
          }
        }
      });
    } catch (e) {
      console.error("全局同步目标失败", e);
    }
  }


}