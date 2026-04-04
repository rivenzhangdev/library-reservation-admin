export enum BookingStatus {
  Upcoming = 0,
  Ongoing = 1,
  Completed = 2,
  Canceled = 3,
  Violated = 4,
}

export enum TimeSlot {
  Morning = 0,
  Afternoon = 1,
  Evening = 2,
}

export enum SeatType {
  Single = 0,
  Double = 1,
  Group = 2,
}

export enum SeatStatus {
  Available = 0,
  Maintenance = 1,
}

export enum ActivityStatus {
  Upcoming = 0,
  Ongoing = 1,
  Ended = 2,
}

// Helper maps for display (optional usage in UI)
export const BookingStatusText: Record<number, string> = {
  [BookingStatus.Upcoming]: '待使用',
  [BookingStatus.Ongoing]: '使用中',
  [BookingStatus.Completed]: '已完成',
  [BookingStatus.Canceled]: '已取消',
  [BookingStatus.Violated]: '已违约',
};

export const TimeSlotText: Record<number, string> = {
  [TimeSlot.Morning]: '上午',
  [TimeSlot.Afternoon]: '下午',
  [TimeSlot.Evening]: '晚上',
};

export const SeatTypeText: Record<number, string> = {
  [SeatType.Single]: '单人桌',
  [SeatType.Double]: '双人桌',
  [SeatType.Group]: '多人桌',
};

export const SeatStatusText: Record<number, string> = {
  [SeatStatus.Available]: '可用',
  [SeatStatus.Maintenance]: '维护中',
};

export const ActivityStatusText: Record<number, string> = {
  [ActivityStatus.Upcoming]: '未开始',
  [ActivityStatus.Ongoing]: '进行中',
  [ActivityStatus.Ended]: '已结束',
};

export enum NotificationType {
  System = 0,
  Booking = 1,
  Activity = 2,
  Marketing = 3,
}

export const NotificationTypeText: Record<number, string> = {
  [NotificationType.System]: '系统通知',
  [NotificationType.Booking]: '预约通知',
  [NotificationType.Activity]: '活动通知',
  [NotificationType.Marketing]: '营销通知',
};

export enum CreditType {
  Add = 0,
  Deduct = 1,
}

export const CreditTypeText: Record<number, string> = {
  [CreditType.Add]: '加分',
  [CreditType.Deduct]: '减分',
};
