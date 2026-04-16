import type { Role } from '../../constants/roles';

/**
 * 用户类型定义
 */
export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  studentId: string;
  name: string;
  avatar?: string;
  role: Role;
  creditScore: number;
  blacklisted: boolean;
  blacklistReason?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 座位类型定义
 */
export interface Seat {
  id: number;
  floorId: number;
  floorName: string;
  rowNum: number;
  colNum: number;
  // 状态数值：0=available,1=maintenance
  status: number;
  // 类型数值：0=single,1=double,2=group
  type: number;
  hasSocket: boolean;
  isWindow: boolean;
  zone?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 预约类型定义
 */
export interface Booking {
  id: number;
  userId: string;
  userName: string;
  seatId: number;
  seatName: string;
  date: string;
  // 时段数值：0=morning,1=afternoon,2=evening
  timeSlot: number;
  startTime: string;
  endTime: string;
  // 预约状态数值：0=upcoming,1=ongoing,2=completed,3=canceled,4=violated
  status: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 活动类型定义
 */
export interface Activity {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  startTime: string;
  endTime: string;
  location: string;
  // 活动状态数值：0=upcoming,1=ongoing,2=ended
  status: number;
  participants: number;
  maxParticipants: number;
  rules?: string;
  awards?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * 通知类型定义
 */
export interface Notification {
  id: string;
  userId: string;
  userName: string;
  type: number; // 0: system, 1: booking, 2: activity, 3: marketing
  title: string;
  content: string;
  time: string;
  isRead: boolean;
  relatedId?: string;
  data?: any;
}

/**
 * 信用记录类型定义
 */
export interface CreditRecord {
  id: string;
  userId: string;
  userName: string;
  type: 'add' | 'deduct';
  points: number;
  date: string;
  reason: string;
}

/**
 * 仪表盘数据类型定义
 */
export interface DashboardData {
  totalUsers: number;
  todayBookings: number;
  availableSeats: number;
  unreadNotifications: number;
  ongoingActivities: number;
  totalCredits: number;
}

/**
 * 通用响应类型
 */
export interface Response<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  total?: number;
}
