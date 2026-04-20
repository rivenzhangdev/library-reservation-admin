export enum BookingStatus {
  Upcoming = 0,
  Ongoing = 1,
  Completed = 2,
  Canceled = 3,
  Violated = 4,
  Waitlisted = 5,
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
// Map enum values to i18n message ids. Components should call
// `intl.formatMessage({ id: BookingStatusText[value] })` to get localized labels.
export const BookingStatusText: Record<number, string> = {
  [BookingStatus.Upcoming]: 'booking.status.upcoming',
  [BookingStatus.Ongoing]: 'booking.status.ongoing',
  [BookingStatus.Completed]: 'booking.status.completed',
  [BookingStatus.Canceled]: 'booking.status.canceled',
  [BookingStatus.Violated]: 'booking.status.violated',
  [BookingStatus.Waitlisted]: 'booking.status.waitlisted',
};

export const TimeSlotText: Record<number, string> = {
  [TimeSlot.Morning]: 'timeslot.morning',
  [TimeSlot.Afternoon]: 'timeslot.afternoon',
  [TimeSlot.Evening]: 'timeslot.evening',
};

export const SeatTypeText: Record<number, string> = {
  [SeatType.Single]: 'seat.type.single',
  [SeatType.Double]: 'seat.type.double',
  [SeatType.Group]: 'seat.type.group',
};

export const SeatStatusText: Record<number, string> = {
  [SeatStatus.Available]: 'seat.status.available',
  [SeatStatus.Maintenance]: 'seat.status.maintenance',
};

export const ActivityStatusText: Record<number, string> = {
  [ActivityStatus.Upcoming]: 'activity.status.upcoming',
  [ActivityStatus.Ongoing]: 'activity.status.ongoing',
  [ActivityStatus.Ended]: 'activity.status.ended',
};

export enum NotificationType {
  System = 0,
  Booking = 1,
  Activity = 2,
  Marketing = 3,
}

export const NotificationTypeText: Record<number, string> = {
  [NotificationType.System]: 'notification.type.system',
  [NotificationType.Booking]: 'notification.type.booking',
  [NotificationType.Activity]: 'notification.type.activity',
  [NotificationType.Marketing]: 'notification.type.marketing',
};

export enum CreditType {
  Add = 0,
  Deduct = 1,
}

export const CreditTypeText: Record<number, string> = {
  [CreditType.Add]: 'credit.type.add',
  [CreditType.Deduct]: 'credit.type.deduct',
};

export enum ViolationRecordType {
  Violation = 1,
}

export enum CreditReason {
  ViolationPenalty = 'VIOLATION_PENALTY',
  BookingCheckin = 'BOOKING_CHECKIN',
  BookingCheckoutReward = 'BOOKING_CHECKOUT_REWARD',
  ActivityCheckin = 'ACTIVITY_CHECKIN',
  ActivityCheckoutReward = 'ACTIVITY_CHECKOUT_REWARD',
  ActivityMissedCheckout = 'ACTIVITY_MISSED_CHECKOUT',
  AdminAdd = 'ADMIN_ADD',
  AdminDeduct = 'ADMIN_DEDUCT',
}

export const CreditReasonText: Record<string, string> = {
  [CreditReason.ViolationPenalty]: 'credit.reason.violationPenalty',
  [CreditReason.BookingCheckin]: 'credit.reason.bookingCheckin',
  [CreditReason.BookingCheckoutReward]: 'credit.reason.bookingCheckoutReward',
  [CreditReason.ActivityCheckin]: 'credit.reason.activityCheckin',
  [CreditReason.ActivityCheckoutReward]: 'credit.reason.activityCheckoutReward',
  [CreditReason.ActivityMissedCheckout]: 'credit.reason.activityMissedCheckout',
  [CreditReason.AdminAdd]: 'credit.reason.adminAdd',
  [CreditReason.AdminDeduct]: 'credit.reason.adminDeduct',
  'Violation penalty': 'credit.reason.violationPenalty',
  'Booking check-in': 'credit.reason.bookingCheckin',
  'Booking checkout reward': 'credit.reason.bookingCheckoutReward',
  'Activity check-in': 'credit.reason.activityCheckin',
  'Activity checkout reward': 'credit.reason.activityCheckoutReward',
  'Activity missed checkout': 'credit.reason.activityMissedCheckout',
  'Admin add points': 'credit.reason.adminAdd',
  'Admin deduct points': 'credit.reason.adminDeduct',
};

export const SystemDisplayName = 'System';

// ========== 企业增强功能枚举 ==========

export enum WaitlistStatus {
  Waiting = 'waiting',
  Notified = 'notified',
  Confirmed = 'confirmed',
  Expired = 'expired',
  Cancelled = 'cancelled',
}

export const WaitlistStatusText: Record<string, string> = {
  [WaitlistStatus.Waiting]: 'waitlist.status.waiting',
  [WaitlistStatus.Notified]: 'waitlist.status.notified',
  [WaitlistStatus.Confirmed]: 'waitlist.status.confirmed',
  [WaitlistStatus.Expired]: 'waitlist.status.expired',
  [WaitlistStatus.Cancelled]: 'waitlist.status.cancelled',
};

export enum ChangeRequestType {
  Reschedule = 'reschedule',
  SeatChange = 'seat_change',
  Cancel = 'cancel',
}

export const ChangeRequestTypeText: Record<string, string> = {
  [ChangeRequestType.Reschedule]: 'approval.changeType.reschedule',
  [ChangeRequestType.SeatChange]: 'approval.changeType.seat_change',
  [ChangeRequestType.Cancel]: 'approval.changeType.cancel',
};

export enum ChangeRequestStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  AutoApproved = 'auto_approved',
}

export const ChangeRequestStatusText: Record<string, string> = {
  [ChangeRequestStatus.Pending]: 'approval.status.pending',
  [ChangeRequestStatus.Approved]: 'approval.status.approved',
  [ChangeRequestStatus.Rejected]: 'approval.status.rejected',
  [ChangeRequestStatus.AutoApproved]: 'approval.status.auto_approved',
};
