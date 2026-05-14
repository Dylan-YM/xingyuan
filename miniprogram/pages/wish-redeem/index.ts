import StorageManager from '../../utils/storage';

Page({
  data: {
    statusBarHeight: 20,
    totalStars: 0,
    pendingCount: 1, // 待兑换数量
    redeemedCount: 0, // 已兑换数量
    wishes: [] as any[],
    currentTab: '全部',
    displayWishes: [] as any[], // 过滤后的显示列表 👈 确保有这一行

    clickCount: 0,     // 💡 记录点击次数
    lastClickTime: 0   // 💡 记录上次点击时间，防止点击太慢也触发
  },

  onLoad() {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({ statusBarHeight: sysInfo.statusBarHeight });
  },
// 1. 读取本地数据
loadData() {
  const stars = StorageManager.getTotalStars();
  // 从缓存读取，如果没有就给个空数组
  const activeWishes = wx.getStorageSync('StarShine_ActiveWishes') || [];
  
  this.setData({
    totalStars: stars,
    wishes: activeWishes
  });
  
  // 刚进页面时，默认筛选当前选中的 Tab（比如“全部”）
  this.filterWishes(this.data.currentTab); 
},

// 点击分类 Tab 时触发
onTabClick(e: any) {
  const tab = e.currentTarget.dataset.tab;
  this.filterWishes(tab);
},
onScoreTap() {
  const now = Date.now();
  // 如果两次点击间隔超过 1 秒，重置计数器
  
  let count = this.data.clickCount || 0;
    this.setData({ clickCount: count, lastClickTime: now });
// 3. 更新数据
count ++;
this.setData({
  clickCount: count,
  lastClickTime: now
});

console.log("当前点击次数：", count); // 💡 你可以看控制台有没有数字在跳
    // 💡 达到 5 次触发彩蛋
    if (count === 5) {
      this.setData({ clickCount: 0 }); // 触发后重置
      this.showAdminEdit();
    }
},

// 弹出修改框
showAdminEdit() {
  wx.showModal({
    title: '管理员权限',
    placeholderText: '请输入新的积分总数',
    editable: true, // 💡 开启带输入框的弹窗
    success: (res) => {
      if (res.confirm && res.content) {
        const newScore = parseInt(res.content);
        if (isNaN(newScore)) {
          wx.showToast({ title: '请输入数字', icon: 'none' });
          return;
        }

        // 1. 更新本地缓存
        StorageManager.setTotalStars(newScore);

        // 2. 增加一条特殊日志（可选，方便对账）
        StorageManager.addScoreLog({
          title: '管理员调整积分',
          amount: newScore - this.data.totalStars, // 记录差额
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          type: 'admin',
          balance: newScore
        });

        // 3. 更新 UI
        this.setData({ totalStars: newScore });
        
        wx.vibrateLong(); // 长震动提醒
        wx.showToast({ title: '修改成功', icon: 'success' });
      }
    }
  });
},

// 2. 核心过滤逻辑（在这里给 displayWishes 赋值！）
filterWishes(tab: string) {
  let filtered = this.data.wishes;
  
  if (tab !== '全部') {
    filtered = this.data.wishes.filter((w: any) => w.category === tab);
  }
  
  // 💡 重点：在这里把过滤好的数据正式赋值给 displayWishes！
  this.setData({
    currentTab: tab,
    displayWishes: filtered
  });
},
  onShow() {
    // 💡 每次页面显示，重新加载本地缓存的心愿和总分
    this.setData({
      totalStars: StorageManager.getTotalStars(),
      wishes: StorageManager.loadActiveWishes()
    });
  },
  // 💡 点击下面的 + 号按钮跳转
  onAddWish() {
    wx.navigateTo({
      url: '/pages/wish-create/index'
    });
  },
  onNavToHistory() {
    wx.navigateTo({ url: '/pages/wish-history/index' });
  },
  onLongPressWish(e: any) {
    // 确保 index 是纯数字
    const index = parseInt(e.currentTarget.dataset.index);
    
    // 💡 终极防报错：优先去 displayWishes 找，找不到再去 wishes 找
    const item = this.data.displayWishes[index] || this.data.wishes[index];

    // 如果还是拿不到（比如因为各种意外），直接拦截，绝不报错！
    if (!item) {
      console.error("未能获取到心愿数据，index为:", index);
      return; 
    }

    wx.vibrateShort({ type: 'medium' });

    wx.showActionSheet({
      itemList: ['删除心愿：' + item.title],
      itemColor: '#FF3B30',
      success: (res) => {
        if (res.tapIndex === 0) {
          this.executeDeleteWish(item);
        }
      }
    });
  },

  // 💡 新增：执行删除逻辑
  executeDeleteWish(targetItem: any) {
    let allWishes = this.data.wishes;
    
    // 优先通过唯一 id 匹配，如果没有 id 则通过 title 匹配
    const targetIndex = allWishes.findIndex((w: any) => 
      (targetItem.id && w.id === targetItem.id) || w.title === targetItem.title
    );

    if (targetIndex > -1) {
      // 1. 从内存数组中删除
      allWishes.splice(targetIndex, 1);
      
      // 2. 同步保存到本地缓存
      wx.setStorageSync('StarShine_ActiveWishes', allWishes);
      
      // 3. 更新 UI
      this.setData({ wishes: allWishes });
      this.filterWishes(this.data.currentTab); // 重新过滤一遍保持分类正确
      
      wx.showToast({ title: '已删除', icon: 'success' });
    }
  },

  // 执行兑换逻辑
  onRedeem(e: any) {
    const index = e.currentTarget.dataset.index;
    const wishes = this.data.wishes;
    const item = wishes[index];

    if (this.data.totalStars < item.price) {
      wx.showToast({ title: '星星不足', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '确认兑换',
      content: `确定要用 ${item.price} 颗星星兑换 "${item.title}" 吗？`,
      success: (res) => {
        if (res.confirm) {
          const newTotal = this.data.totalStars - item.price;
          StorageManager.setTotalStars(newTotal);
          
          // 记录积分减少日志
          StorageManager.addScoreLog({
            title: `${item.title}`, // 去掉前面的“兑换:”字眼，UI更好看
            amount: -item.price,
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().slice(0, 5),
            type: 'sub',
            balance: newTotal // 👈 记录交易后的余额
          });

          this.setData({ totalStars: newTotal });
          // 如果想让“已兑换”数字实时加1，也可以在这里更新 redeemedCount
          this.setData({ redeemedCount: (this.data.redeemedCount || 0) + 1 });
          
          wx.vibrateShort({ type: 'light' });
          wx.showToast({ title: '兑换成功！', icon: 'success' });
        }
      }
    });
  }
});