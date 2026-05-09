// utils/calendar.ts
export interface CalendarDay {
    year: number;
    month: number;
    dateObj: Date;
    day: string;
    week: string;
    isToday: boolean;
    fullDate: string; // 格式: yyyy-MM-dd 作为本地存储的唯一 Key
  }
  
  export default class CalendarManager {
    // 修改 range 默认值为 15 (前后各 15 天，共计 31 天)
    static generateDays(range: number = 15): CalendarDay[] {
      const days: CalendarDay[] = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0); 
      
      const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  
      for (let i = -range; i <= range; i++) {
        const target = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
        const isToday = i === 0;
        const yyyy = target.getFullYear();
        const mm = String(target.getMonth() + 1).padStart(2, '0');
        const dd = String(target.getDate()).padStart(2, '0');
  
        days.push({
          year: yyyy,
          month: target.getMonth() + 1,
          dateObj: target,
          day: String(target.getDate()),
          week: isToday ? "今天" : weekdays[target.getDay()],
          isToday: isToday,
          fullDate: `${yyyy}-${mm}-${dd}`
        });
      }
      return days;
    }
  }