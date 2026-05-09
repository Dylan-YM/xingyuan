// pages/index/index.ts
import CalendarManager, { CalendarDay } from '../../utils/calendar';
import StorageManager from '../../utils/storage';

Page({
  data: {
    paddingTop: 48,      // 默认给一个安全距离
    scrollLeft: 0,       // 日历横向滚动距离
    userName: 'Ryan',
    totalScore: 0,
    dates: [] as CalendarDay[],
    categories: [] as any[],
    currentDateStr: ''
  },

  onLoad() {
    // 1. 获取胶囊按钮的位置，完美适配所有机型的刘海和状态栏！
    let safePadding = 48; 
    try {
      const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
      safePadding = menuButtonInfo.top; // 直接对齐微信右上角的胶囊按钮顶部
    } catch (e) {
      const sysInfo = wx.getSystemInfoSync();
      safePadding = sysInfo.statusBarHeight + 10;
    }

    // 2. 初始化日历
    const days = CalendarManager.generateDays(15);
    const todayIndex = days.findIndex(d => d.isToday);
    const todayStr = days[todayIndex].fullDate;

    this.setData({
      paddingTop: safePadding, // 注入安全高度
      dates: days,
      currentDateStr: todayStr
    });

    // 3. 【修复日历不滑动】：必须加一个 setTimeout 延时，等页面渲染完再滑动才有效！
    setTimeout(() => {
      this.centerCalendar(todayIndex);
    }, 300);
  },

  onShow() {
    if (this.data.currentDateStr) {
      this.refreshDailyData(this.data.currentDateStr);
    }
  },

  refreshDailyData(dateStr: string) {
    const data = StorageManager.load(dateStr);
    this.setData({
      categories: data,
      totalScore: StorageManager.getTotalStars()
    });
  },

  // 计算并滚动日历到屏幕中间
  centerCalendar(index: number) {
    const sysInfo = wx.getSystemInfoSync();
    const screenWidth = sysInfo.windowWidth;
    // 110rpx宽度 + 20rpx间距 = 130rpx，换算成 px
    const itemWidthPx = 130 * (screenWidth / 750); 
    // 居中公式：元素的左偏移 - 屏幕的一半 + 元素本身的一半
    const scrollLeft = (index * itemWidthPx) - (screenWidth / 2) + (itemWidthPx / 2);
    
    this.setData({ scrollLeft });
  },

  // 点击日历日期
  onSelectDate(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    const selectedDay = this.data.dates[index];

    const newDates = this.data.dates.map((item, i) => ({
      ...item,
      isToday: i === index
    }));

    this.setData({ 
      dates: newDates,
      currentDateStr: selectedDay.fullDate 
    });

    // 点击时立马居中
    this.centerCalendar(index);
    this.refreshDailyData(selectedDay.fullDate);
  },
  // 任务打分
  onRate(e: WechatMiniprogram.TouchEvent) {
    const { cidx, tidx, val } = e.currentTarget.dataset;
    const categories = this.data.categories;
    const task = categories[cidx].tasks[tidx];
    const scoreVal = Number(val);

    // 如果已经打过分了，阻止重复打分
    if (task.rating > 0) return; 

    task.rating = scoreVal;
    
    // 判断当前是否是批评分类
    const isCriticism = categories[cidx].name === '批评';
    let newTotal = this.data.totalScore;

    if (isCriticism) {
      // 1. 扣分逻辑
      newTotal -= scoreVal;
      
      // 2. 负面反馈：提示扣分 + 较重的震动
      wx.showToast({
        title: `积分 -${scoreVal}`,
        icon: 'error', // 微信原生 error 图标
        duration: 1200
      });
      wx.vibrateShort({ type: 'heavy' }); // 重震动
      
    } else {
      // 1. 加分逻辑
      newTotal += scoreVal;
      
      // 2. 正面反馈：提示加分 + 轻快的震动
      wx.showToast({
        title: `积分 +${scoreVal}`,
        icon: 'success', // 微信原生 success 图标
        duration: 1200
      });
      wx.vibrateShort({ type: 'light' }); // 轻震动
    }

    // 保存到本地并更新UI
    StorageManager.save(categories, this.data.currentDateStr);
    StorageManager.setTotalStars(newTotal);

    this.setData({ categories, totalScore: newTotal });
  },

  // 悬浮加号点击，跳转导入页 (必须带上当前的日期过去！)
  onAddTap() {
    wx.navigateTo({
      url: `/pages/import/index?date=${this.data.currentDateStr}`
    });
  },

  // 展开/收缩分类
  toggleCategory(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    const key = `categories[${index}].expanded`;
    this.setData({ [key]: !this.data.categories[index].expanded });
  },

  // 清除按钮
  onClearTap() {
    wx.showModal({
      title: '危险操作',
      content: '确定要清空所有数据吗？不可恢复',
      success: (res) => {
        if (res.confirm) {
          StorageManager.clearAll();
          this.refreshDailyData(this.data.currentDateStr);
          wx.showToast({ title: '已清空', icon: 'success' });
        }
      }
    });
  }
});