import { WishLibrary, WishItem } from '../../data/library'; // 注意这里路径检查一下，你提供的是 library，我这里写的是 wish-library，保持和你实际文件一致即可


Page({
  data: {
    statusBarHeight: 20,
    tabs: ["常用", "体验", "奖品", "特权", "成长", "运动", "旅游"],
    currentTab: "常用",
    allWishes: [] as WishItem[],
    displayWishes: [] as WishItem[],
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    
    // 💡 将导入的全局库赋值给当前页面的 data
    this.setData({ 
      statusBarHeight: sysInfo.statusBarHeight,
      allWishes: WishLibrary
    });
    
    // 默认展示“常用”分类
    this.filterWishes('常用');
  },

  onTabClick(e: any) {
    this.filterWishes(e.currentTarget.dataset.tab);
  },

  filterWishes(tab: string) {
    // 从 allWishes 里面筛选对应分类
    let filtered = this.data.allWishes.filter(w => w.category === tab);
    
    // 如果这个分类下没有数据，为了防止白屏，兜底显示全部数据
    if (filtered.length === 0) filtered = this.data.allWishes;
    
    this.setData({ 
      currentTab: tab, 
      displayWishes: filtered 
    });
  },

  onBack() { wx.navigateBack(); },

  onItemClick(e: any) {
    // 1. 确保拿到正确的 index 和数据
    const index = parseInt(e.currentTarget.dataset.index);
    const item = this.data.displayWishes[index];

    if (!item) return;

    // 2. 获取页面栈
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];

    if (prevPage) {
      // 3. 强制覆盖上一页（添加页）的数据
      prevPage.setData({
        title: item.title,
        image: item.image, // 👈 确保图片传回去了
        color: item.color,
        price: item.price
      });
      wx.navigateBack(); 
    }
  }
});