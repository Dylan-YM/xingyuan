// pages/import/index.ts
import { TargetLibrary, TaskItem } from '../../data/library';
import StorageManager from '../../utils/storage';

// 扩展原始数据模型，增加已存在标记和分类标记
interface ExtendedTaskItem extends TaskItem {
  isExisting?: boolean; 
  category?: string; // 💡 新增：记录该任务到底属于哪个分类
}

Page({
  data: {
    statusBarHeight: 20,
    categories: ["劳动", "学习", "生活", "兴趣", "独立", "表扬", "批评"],
    currentCategory: "劳动",
    listData: [] as ExtendedTaskItem[],
    selectedItems: [] as ExtendedTaskItem[],
    targetDateStr: '',
    existingTitles: [] as string[] 
  },

  onLoad(options: any) {
    const sysInfo = wx.getSystemInfoSync();
    const date = options.date || '';

    const sections = StorageManager.load(date);
    let titles: string[] = [];
    sections.forEach((sec: any) => {
      sec.tasks.forEach((t: any) => {
        titles.push(t.title);
      });
    });

    this.setData({
      statusBarHeight: sysInfo.statusBarHeight,
      targetDateStr: date,
      existingTitles: titles 
    });

    this.loadCategoryData('劳动');
  },

  loadCategoryData(category: string) {
    const items = TargetLibrary[category] || [];
    
    const mappedItems = items.map(item => ({
      ...item,
      category: category, // 💡 关键修复1：为每个加载的任务绑定它的真实分类
      isExisting: this.data.existingTitles.includes(item.title),
      isSelected: this.data.selectedItems.some(s => s.title === item.title)
    }));

    this.setData({
      currentCategory: category,
      listData: mappedItems
    });
  },

  onTabClick(e: WechatMiniprogram.TouchEvent) {
    const cat = e.currentTarget.dataset.cat;
    this.loadCategoryData(cat);
  },

  onItemClick(e: WechatMiniprogram.TouchEvent) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.listData[index];

    if (item.isExisting) return;

    let selected = [...this.data.selectedItems];
    const sIdx = selected.findIndex(s => s.title === item.title);
    
    if (sIdx > -1) {
      selected.splice(sIdx, 1);
      item.isSelected = false;
    } else {
      selected.push(item);
      item.isSelected = true;
    }

    const newListData = [...this.data.listData];
    newListData[index] = item;

    this.setData({
      selectedItems: selected,
      listData: newListData
    });
  },

  onBack() {
    wx.navigateBack({ delta: 1 });
  },

  onConfirm() {
    if (this.data.selectedItems.length === 0) return;
    
    let sections = StorageManager.load(this.data.targetDateStr);
    
    this.data.selectedItems.forEach(item => {
      // 💡 关键修复2：不再使用 this.data.currentCategory，而是使用 item.category 找归属
      const secIdx = sections.findIndex((s: any) => s.name === item.category);
      if (secIdx > -1) {
        const isExist = sections[secIdx].tasks.some((t: any) => t.title === item.title);
        if (!isExist) {
          sections[secIdx].tasks.push({
            title: item.title,
            iconColor: item.hexColor,
            rating: 0 
          });
        }
      }
    });

    StorageManager.save(sections, this.data.targetDateStr);
    
    wx.showToast({ title: '导入成功', icon: 'success' });
    setTimeout(() => {
      wx.navigateBack({ delta: 1 });
    }, 1000);
  }
});