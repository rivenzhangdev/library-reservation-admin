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
// Map enum values to i18n message ids. Components should call
// `intl.formatMessage({ id: BookingStatusText[value] })` to get localized labels.
export const BookingStatusText: Record<number, string> = {
  [BookingStatus.Upcoming]: 'booking.status.upcoming',
  [BookingStatus.Ongoing]: 'booking.status.ongoing',
  [BookingStatus.Completed]: 'booking.status.completed',
  [BookingStatus.Canceled]: 'booking.status.canceled',
  [BookingStatus.Violated]: 'booking.status.violated',
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
