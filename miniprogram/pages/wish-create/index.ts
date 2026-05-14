import StorageManager from '../../utils/storage';

Page({
  data: {
    statusBarHeight: 20,
    title: '',
    image: '', // 👈 必须定义 image 字段
    color: '#E8FAEA',
    unit: '次',
    units: ['次', '个', '天', '份'],
    price: 1,      
    quantity: 1,   
    description: ''
  },

  onLoad(options: any) {
    const sysInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: sysInfo.statusBarHeight,
      title: options.title || '',
      image: options.image ? decodeURIComponent(options.image) : '', // 👈 接收图片参数
      price: options.price ? parseInt(options.price) : 1
    });
  },

  onTitleInput(e: any) { this.setData({ title: e.detail.value }); },
  onDescInput(e: any) { this.setData({ description: e.detail.value }); },
  onUnitChange(e: any) { this.setData({ unit: this.data.units[e.detail.value] }); },

  changePrice(e: any) {
    const delta = parseInt(e.currentTarget.dataset.val);
    let newPrice = this.data.price + delta;
    if (newPrice < 1) newPrice = 1;
    this.setData({ price: newPrice });
  },

  changeQty(e: any) {
    const delta = parseInt(e.currentTarget.dataset.val);
    let newQty = this.data.quantity + delta;
    if (newQty < 1) newQty = 1;
    this.setData({ quantity: newQty });
  },

  onBack() { wx.navigateBack(); },
  onNavToLib() { wx.navigateTo({ url: '/pages/wish-lib/index' }); },
// 1. 修改输入事件：允许临时为空，方便用户删除后重新输入
onPriceInput(e: any) {
  const val = e.detail.value;
  // 如果是空的，就先让它是空的，不强制变回 1
  if (val === '') {
    this.setData({ price: '' as any });
    return;
  }
  this.setData({ price: parseInt(val) || 0 });
},

onQtyInput(e: any) {
  const val = e.detail.value;
  if (val === '') {
    this.setData({ quantity: '' as any });
    return;
  }
  this.setData({ quantity: parseInt(val) || 0 });
},

// 2. 增加失去焦点事件：当用户输入完点别处时，补回最小值
onPriceBlur(e: any) {
  let val = parseInt(e.detail.value);
  if (isNaN(val) || val < 1) {
    this.setData({ price: 1 });
  }
},

onQtyBlur(e: any) {
  let val = parseInt(e.detail.value);
  if (isNaN(val) || val < 1) {
    this.setData({ quantity: 1 });
  }
},
  onAdd() {
    if (!this.data.title.trim()) {
      wx.showToast({ title: '请输入名称', icon: 'none' });
      return;
    }
    
    // 💡 核心修复：保存时，务必把 image 存入缓存
    StorageManager.addWish({
      title: this.data.title,
      description: this.data.description,
      price: this.data.price,
      quantity: this.data.quantity,
      image: this.data.image, // 👈 就是这一行，把图片存下来！
      color: this.data.color || '#D5F8F3', 
      type: this.data.price >= 50 ? 'progress' : 'instant' 
    });

    wx.showToast({ title: '添加成功', icon: 'success' });
    setTimeout(() => { wx.navigateBack({ delta: 1 }); }, 1000);
  }
});