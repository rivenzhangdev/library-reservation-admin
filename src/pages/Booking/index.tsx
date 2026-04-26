import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { history, useIntl } from '@umijs/max';
import dayjs from 'dayjs';
import {
  Button,
  DatePicker,
  Form,
  Modal,
  Select,
  Space,
  Spin,
  Tag,
  TimePicker,
  Typography,
  message,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  BookingStatus,
  BookingStatusText,
  TimeSlot,
  TimeSlotText,
} from '../../constants/status';
import {
  batchCancelBookings,
  cancelBooking,
  checkIn,
  checkOut,
  createBooking,
  getBookingDetail,
  getBookingList,
  updateBookingStatus,
} from '../../services/library/booking';
import { getConfigTimeSlots } from '../../services/library/config';
import { getFloors } from '../../services/library/floor';
import { getSeatList } from '../../services/library/seat';
import { getUserList } from '../../services/library/user';
import {
  STANDARD_ACTION_COLUMN,
  STANDARD_TABLE_SCROLL,
  STANDARD_TABLE_SEARCH,
  toTableDataSource,
} from '../../utils/table';

/**
 * 预约数据类型
 */
interface BookingType {
  id: number;
  userName: string;
  user?: any;
  seatName: string;
  seat?: any;
  floorId?: string;
  floorName?: string;
  date: string;
  timeSlot: TimeSlot | string;
  startTime: string;
  endTime: string;
  start_time?: string;
  end_time?: string;
  start?: string;
  end?: string;
  updatedByName?: string;
  updatedBy?: { name?: string; username?: string };
  status: BookingStatus;
}

/**
 * 预约管理页面
 */
const BookingManagement: React.FC = () => {
  const intl = useIntl();

  const actionRef = useRef<ActionType>();
  const [form] = Form.useForm();
  const [selectedRows, setSelectedRows] = useState<number[] | string[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [detailVisible, setDetailVisible] = useState<boolean>(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [qrModalVisible, setQrModalVisible] = useState<boolean>(false);
  const [qrPayload, setQrPayload] = useState<string>('');
  const [qrTitle, setQrTitle] = useState<string>('');
  const [qrLoading, setQrLoading] = useState<boolean>(false);
  const [floors, setFloors] = useState<Array<{ id: string; name: string }>>([]);
  const [userOptions, setUserOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [seatOptions, setSeatOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [seatLoading, setSeatLoading] = useState<boolean>(false);
  const [configSummary, setConfigSummary] = useState<string>('');
  const [configLoading, setConfigLoading] = useState<boolean>(false);
  const [timeSlotConfigs, setTimeSlotConfigs] = useState<Array<any>>([]);

  useEffect(() => {
    (async () => {
      try {
        const list: any[] = await getFloors();
        setFloors(list.map((f) => ({ id: f.id, name: f.name })));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  useEffect(() => {
    const fetchConfig = async () => {
      setConfigLoading(true);
      try {
        const res: any = await getConfigTimeSlots();
        const raw = res?.data ?? res;
        const configs = Array.isArray(raw) ? raw : [];
        setTimeSlotConfigs(configs);
        setConfigSummary(
          configs.length
            ? configs
                .map(
                  (item) =>
                    `${item.label || item.timeSlot}: ${
                      item.startTime || item.start
                    } - ${item.endTime || item.end}`,
                )
                .join('； ')
            : intl.formatMessage({
                id: 'booking.config.noTimeSlots',
                defaultMessage: 'No time slot configuration found.',
              }),
        );
      } catch (e) {
        setConfigSummary(
          intl.formatMessage({
            id: 'booking.config.summaryLoadError',
            defaultMessage: 'Failed to load current configuration.',
          }),
        );
      } finally {
        setConfigLoading(false);
      }
    };
    fetchConfig();
  }, [intl]);

  function parseTimeToMinutes(time: string): number | undefined {
    if (!time || typeof time !== 'string') {
      return undefined;
    }
    const match = time.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
    if (!match) {
      return undefined;
    }
    return Number(match[1]) * 60 + Number(match[2]);
  }

  function getTimeSlotRange(timeSlot: TimeSlot | string): {
    start: string;
    end: string;
  } {
    const candidate = timeSlotConfigs.find(
      (item) =>
        String(item.value) === String(timeSlot) ||
        String(item.timeSlot) === String(timeSlot),
    );
    if (candidate) {
      return {
        start: candidate.startTime || candidate.start || '00:00',
        end: candidate.endTime || candidate.end || '23:59',
      };
    }

    switch (timeSlot) {
      case TimeSlot.Morning:
        return { start: '08:00', end: '12:00' };
      case TimeSlot.Afternoon:
        return { start: '13:00', end: '17:00' };
      case TimeSlot.Evening:
        return { start: '18:00', end: '22:00' };
      default:
        return { start: '00:00', end: '23:59' };
    }
  }

  function normalizeTimeValue(value: any): string | undefined {
    if (!value) return undefined;
    if (typeof value === 'string') return value;
    if (typeof value.format === 'function') return value.format('HH:mm');
    return undefined;
  }

  async function fetchSeatOptions(keyword?: string) {
    setSeatLoading(true);
    try {
      const res: any = await getSeatList({
        q: keyword,
        page: 1,
        limit: 20,
      });
      const raw = res?.data || {};
      const list = Array.isArray(raw.list) ? raw.list : [];
      setSeatOptions(
        list.map((seat: any) => ({
          label: `${seat.floorName || ''} ${seat.zone || ''} ${
            seat.name || `R${seat.rowNum}C${seat.colNum}`
          }`.trim(),
          value: String(seat.id),
        })),
      );
    } catch (e) {
      setSeatOptions([]);
    } finally {
      setSeatLoading(false);
    }
  }

  const createQrImageUrl = (payload: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
      payload,
    )}`;

  const generateBookingQr = (
    record: BookingType,
    action: 'checkin' | 'checkout',
  ) => {
    const title =
      action === 'checkin'
        ? intl.formatMessage({
            id: 'booking.action.checkInQr',
            defaultMessage: 'Check-in QR',
          })
        : intl.formatMessage({
            id: 'booking.action.checkOutQr',
            defaultMessage: 'Check-out QR',
          });
    const payload = `booking:${record.id}:${action}`;
    setQrTitle(title);
    setQrPayload(payload);
    setQrLoading(true);
    setQrModalVisible(true);
  };

  function ensureCustomTimeIsValid(
    timeSlot: TimeSlot,
    startTime?: string | any,
    endTime?: string | any,
  ) {
    const range = getTimeSlotRange(timeSlot);
    const normalizedStartTime = normalizeTimeValue(startTime);
    const normalizedEndTime = normalizeTimeValue(endTime);
    const startMinutes = normalizedStartTime
      ? parseTimeToMinutes(normalizedStartTime)
      : undefined;
    const endMinutes = normalizedEndTime
      ? parseTimeToMinutes(normalizedEndTime)
      : undefined;

    if (
      (normalizedStartTime && !normalizedEndTime) ||
      (!normalizedStartTime && normalizedEndTime)
    ) {
      throw new Error(
        intl.formatMessage({
          id: 'booking.form.customTimeBoth',
          defaultMessage:
            'Please provide both start and end time for a custom time range.',
        }),
      );
    }
    if (normalizedStartTime && startMinutes === undefined) {
      throw new Error(
        intl.formatMessage({
          id: 'booking.form.timeFormatError',
          defaultMessage: 'Please enter time as HH:mm',
        }),
      );
    }
    if (normalizedEndTime && endMinutes === undefined) {
      throw new Error(
        intl.formatMessage({
          id: 'booking.form.timeFormatError',
          defaultMessage: 'Please enter time as HH:mm',
        }),
      );
    }
    if (
      startMinutes !== undefined &&
      endMinutes !== undefined &&
      endMinutes <= startMinutes
    ) {
      throw new Error(
        intl.formatMessage({
          id: 'booking.form.endTimeAfterStart',
          defaultMessage: 'End time must be after start time',
        }),
      );
    }
    if (startMinutes !== undefined) {
      if (startMinutes < parseTimeToMinutes(range.start)!) {
        throw new Error(
          intl.formatMessage({
            id: 'booking.form.startTimeOutOfRange',
            defaultMessage: 'Start time must be within the selected slot',
          }),
        );
      }
      if (startMinutes >= parseTimeToMinutes(range.end)!) {
        throw new Error(
          intl.formatMessage({
            id: 'booking.form.startTimeOutOfRange',
            defaultMessage: 'Start time must be within the selected slot',
          }),
        );
      }
    }
    if (endMinutes !== undefined) {
      if (endMinutes <= parseTimeToMinutes(range.start)!) {
        throw new Error(
          intl.formatMessage({
            id: 'booking.form.endTimeOutOfRange',
            defaultMessage: 'End time must be within the selected slot',
          }),
        );
      }
      if (endMinutes > parseTimeToMinutes(range.end)!) {
        throw new Error(
          intl.formatMessage({
            id: 'booking.form.endTimeOutOfRange',
            defaultMessage: 'End time must be within the selected slot',
          }),
        );
      }
    }
    if (
      startTime === range.start &&
      endTime === range.end &&
      startTime &&
      endTime
    ) {
      throw new Error(
        intl.formatMessage({
          id: 'booking.form.customTimeSameAsSlot',
          defaultMessage:
            'Custom time cannot equal the default full time slot range.',
        }),
      );
    }
  }

  /**
   * 取消预约
   */
  const handleCancel = (id: number) => {
    Modal.confirm({
      title: intl.formatMessage({
        id: 'booking.confirmCancelTitle',
        defaultMessage: 'Confirm cancellation',
      }),
      content: intl.formatMessage({
        id: 'booking.confirmCancelContent',
        defaultMessage: 'Are you sure you want to cancel this booking?',
      }),
      onOk: async () => {
        try {
          await cancelBooking(id);
          message.success(
            intl.formatMessage({
              id: 'booking.cancelSuccess',
              defaultMessage: 'Cancelled successfully',
            }),
          );
          actionRef.current?.reload?.();
        } catch (e: any) {
          message.error(
            e?.message ||
              intl.formatMessage({
                id: 'booking.cancelFailed',
                defaultMessage: 'Cancellation failed',
              }),
          );
        }
      },
    });
  };

  const handleCheckIn = async (id: number) => {
    try {
      await checkIn(id);
      message.success(
        intl.formatMessage({
          id: 'booking.checkInSuccess',
          defaultMessage: 'Checked in successfully',
        }),
      );
      actionRef.current?.reload?.();
    } catch (e: any) {
      message.error(
        e?.message ||
          intl.formatMessage({
            id: 'booking.checkInFailed',
            defaultMessage: 'Check-in failed',
          }),
      );
    }
  };

  const handleCheckOut = async (id: number) => {
    try {
      await checkOut(id);
      message.success(
        intl.formatMessage({
          id: 'booking.checkOutSuccess',
          defaultMessage: 'Checked out successfully',
        }),
      );
      actionRef.current?.reload?.();
    } catch (e: any) {
      message.error(
        e?.message ||
          intl.formatMessage({
            id: 'booking.checkOutFailed',
            defaultMessage: 'Check-out failed',
          }),
      );
    }
  };

  const handleMarkViolated = (id: number) => {
    Modal.confirm({
      title: intl.formatMessage({
        id: 'booking.action.markViolated',
        defaultMessage: 'Mark as violated (test)',
      }),
      content: intl.formatMessage({
        id: 'booking.action.markViolated.confirm',
        defaultMessage:
          'This operation is for test verification and will release the seat slot. Continue?',
      }),
      onOk: async () => {
        try {
          await updateBookingStatus(id, String(BookingStatus.Violated));
          message.success(
            intl.formatMessage({
              id: 'booking.action.markViolated.success',
              defaultMessage: 'Booking marked as violated',
            }),
          );
          actionRef.current?.reload?.();
        } catch (e: any) {
          message.error(
            e?.message ||
              intl.formatMessage({
                id: 'booking.action.markViolated.failed',
                defaultMessage: 'Failed to mark violated',
              }),
          );
        }
      },
    });
  };

  const handleShowDetail = async (id: number) => {
    try {
      const res: any = await getBookingDetail(id);
      const raw = res?.data ?? res;
      setDetailData(raw);
      setDetailVisible(true);
    } catch (e: any) {
      message.error(
        e?.message ||
          intl.formatMessage({
            id: 'booking.detailFailed',
            defaultMessage: 'Failed to fetch details',
          }),
      );
    }
  };

  const columns: ProColumns<BookingType>[] = [
    {
      title: intl.formatMessage({
        id: 'seat.form.floor',
        defaultMessage: 'Floor',
      }),
      dataIndex: 'floorId',
      valueType: 'select',
      hideInTable: true,
      valueEnum: (() => {
        const map: Record<string, any> = {};
        floors.forEach((f) => {
          map[f.id] = { text: f.name };
        });
        return map;
      })(),
      render: (_, record) => record.floorName || '',
    },
    {
      title: intl.formatMessage({
        id: 'credit.tab.users',
        defaultMessage: 'User',
      }),
      dataIndex: 'userName',
      width: 100,
      render: (_, record) => record.userName || '-',
    },
    {
      title: intl.formatMessage({
        id: 'booking.column.seat',
        defaultMessage: 'Seat',
      }),
      dataIndex: 'seatName',
      width: 120,
      render: (_, record) => record.seatName || '-',
    },
    {
      title: intl.formatMessage({
        id: 'booking.form.date',
        defaultMessage: 'Date',
      }),
      dataIndex: 'date',
      valueType: 'date',
      width: 110,
    },
    {
      title: intl.formatMessage({
        id: 'booking.form.timeSlot',
        defaultMessage: 'Time slot',
      }),
      dataIndex: 'timeSlot',
      valueType: 'select',
      valueEnum: {
        [TimeSlot.Morning]: {
          text: intl.formatMessage({ id: TimeSlotText[TimeSlot.Morning] }),
        },
        [TimeSlot.Afternoon]: {
          text: intl.formatMessage({ id: TimeSlotText[TimeSlot.Afternoon] }),
        },
        [TimeSlot.Evening]: {
          text: intl.formatMessage({ id: TimeSlotText[TimeSlot.Evening] }),
        },
      },
    },
    {
      title: intl.formatMessage({
        id: 'credit.column.date',
        defaultMessage: 'Time',
      }),
      hideInSearch: true,
      width: 160,
      render: (_, record) => {
        const start =
          record.startTime ?? record.start_time ?? record.start ?? '-';
        const end = record.endTime ?? record.end_time ?? record.end ?? '-';
        return `${start} - ${end}`;
      },
    },
    {
      title: intl.formatMessage({
        id: 'seat.form.status',
        defaultMessage: 'Status',
      }),
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        [BookingStatus.Upcoming]: {
          text: intl.formatMessage({
            id: BookingStatusText[BookingStatus.Upcoming],
          }),
          status: 'Processing',
        },
        [BookingStatus.Ongoing]: {
          text: intl.formatMessage({
            id: BookingStatusText[BookingStatus.Ongoing],
          }),
          status: 'Success',
        },
        [BookingStatus.Completed]: {
          text: intl.formatMessage({
            id: BookingStatusText[BookingStatus.Completed],
          }),
          status: 'Default',
        },
        [BookingStatus.Canceled]: {
          text: intl.formatMessage({
            id: BookingStatusText[BookingStatus.Canceled],
          }),
          status: 'Error',
        },
        [BookingStatus.Violated]: {
          text: intl.formatMessage({
            id: BookingStatusText[BookingStatus.Violated],
          }),
          status: 'Error',
        },
      },
      render: (_, record) => {
        const statusMap: Record<number, string> = {
          [BookingStatus.Upcoming]: 'processing',
          [BookingStatus.Ongoing]: 'success',
          [BookingStatus.Completed]: 'default',
          [BookingStatus.Canceled]: 'error',
          [BookingStatus.Violated]: 'error',
        };
        return (
          <Tag color={statusMap[record.status]}>
            {intl.formatMessage({ id: BookingStatusText[record.status] })}
          </Tag>
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'common.updatedBy',
        defaultMessage: 'Updated By',
      }),
      dataIndex: 'updatedByName',
      width: 120,
      hideInSearch: true,
      render: (_, record) => record.updatedByName || '-',
    },
    {
      title: intl.formatMessage({
        id: 'common.action',
        defaultMessage: 'Action',
      }),
      valueType: 'option',
      ...STANDARD_ACTION_COLUMN,
      width: 280,
      render: (_, record) => {
        const statusValue = Number(record.status);
        return (
          <Space size="small" wrap style={{ minWidth: 240 }}>
            <Button
              type="link"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleShowDetail(record.id)}
            >
              {intl.formatMessage({
                id: 'booking.action.details',
                defaultMessage: 'Details',
              })}
            </Button>
            {statusValue === BookingStatus.Upcoming && (
              <>
                <Button
                  type="link"
                  size="small"
                  onClick={() => handleCheckIn(record.id)}
                >
                  {intl.formatMessage({
                    id: 'booking.action.checkIn',
                    defaultMessage: 'Test Check-in',
                  })}
                </Button>
                <Button
                  type="link"
                  size="small"
                  onClick={() => generateBookingQr(record, 'checkin')}
                >
                  {intl.formatMessage({
                    id: 'booking.action.checkInQr',
                    defaultMessage: 'Check-in QR',
                  })}
                </Button>
              </>
            )}
            {statusValue === BookingStatus.Ongoing && (
              <>
                <Button
                  type="link"
                  size="small"
                  onClick={() => handleCheckOut(record.id)}
                >
                  {intl.formatMessage({
                    id: 'booking.action.checkOut',
                    defaultMessage: 'Test Check-out',
                  })}
                </Button>
                <Button
                  type="link"
                  size="small"
                  onClick={() => generateBookingQr(record, 'checkout')}
                >
                  {intl.formatMessage({
                    id: 'booking.action.checkOutQr',
                    defaultMessage: 'Check-out QR',
                  })}
                </Button>
                <Button
                  type="link"
                  danger
                  size="small"
                  onClick={() => handleMarkViolated(record.id)}
                >
                  {intl.formatMessage({
                    id: 'booking.action.markViolated',
                    defaultMessage: 'Mark violated',
                  })}
                </Button>
              </>
            )}
            {statusValue === BookingStatus.Upcoming && (
              <Button
                type="link"
                danger
                size="small"
                onClick={() => handleCancel(record.id)}
              >
                {intl.formatMessage({
                  id: 'common.cancel',
                  defaultMessage: 'Cancel',
                })}
              </Button>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'menu.booking',
        defaultMessage: 'Booking management',
      })}
      extra={[
        <Button
          key="configCenter"
          type="default"
          onClick={() => history.push('/system-config')}
        >
          {intl.formatMessage({
            id: 'booking.config.goToConfig',
            defaultMessage: 'Configuration Center',
          })}
        </Button>,
      ]}
      content={
        <Space direction="vertical" size="small">
          <Typography.Text strong>
            {intl.formatMessage({
              id: 'booking.config.summaryTitle',
              defaultMessage: 'Current effective configuration',
            })}
          </Typography.Text>
          {configLoading ? (
            <Spin size="small" />
          ) : (
            <Typography.Text>{configSummary}</Typography.Text>
          )}
        </Space>
      }
    >
      <ProTable<BookingType>
        headerTitle={intl.formatMessage({
          id: 'booking.listTitle',
          defaultMessage: 'Booking list',
        })}
        actionRef={actionRef}
        rowKey="id"
        scroll={STANDARD_TABLE_SCROLL}
        search={STANDARD_TABLE_SEARCH}
        rowSelection={{
          onChange: (_, rows) => setSelectedRows(rows.map((r: any) => r.id)),
        }}
        toolBarRender={() => [
          <Button
            key="batchCancel"
            danger
            disabled={selectedRows.length === 0}
            onClick={async () => {
              Modal.confirm({
                title: intl.formatMessage({
                  id: 'booking.confirmBatchCancelTitle',
                  defaultMessage: 'Confirm batch cancellation',
                }),
                content: intl.formatMessage(
                  {
                    id: 'booking.confirmBatchCancelContent',
                    defaultMessage:
                      'Are you sure you want to cancel {count} bookings?',
                  },
                  { count: selectedRows.length },
                ),
                onOk: async () => {
                  try {
                    await batchCancelBookings(selectedRows);
                    message.success(
                      intl.formatMessage({
                        id: 'booking.batchCancelSuccess',
                        defaultMessage: 'Batch cancellation successful',
                      }),
                    );
                    setSelectedRows([]);
                    actionRef.current?.reload?.();
                  } catch (e: any) {
                    message.error(
                      e?.message ||
                        intl.formatMessage({
                          id: 'booking.batchCancelFailed',
                          defaultMessage: 'Batch cancellation failed',
                        }),
                    );
                  }
                },
              });
            }}
          >
            {intl.formatMessage({
              id: 'booking.batchCancel',
              defaultMessage: 'Batch cancel',
            })}
          </Button>,
          <Button
            key="new"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            {intl.formatMessage({
              id: 'booking.new',
              defaultMessage: 'New booking',
            })}
          </Button>,
        ]}
        request={async (params) => {
          try {
            const res: any = await getBookingList(params);
            return toTableDataSource<BookingType>(res);
          } catch (e) {
            return { data: [], success: false, total: 0 };
          }
        }}
        columns={columns}
        pagination={{
          pageSize: 10,
        }}
      />
      <Modal
        title={intl.formatMessage({
          id: 'booking.action.details',
          defaultMessage: 'Details',
        })}
        open={detailVisible}
        onCancel={() => {
          setDetailVisible(false);
          setDetailData(null);
        }}
        footer={null}
      >
        {detailData ? (
          <div>
            <p>
              <strong>
                {intl.formatMessage({
                  id: 'common.user',
                  defaultMessage: 'User',
                })}
                ：
              </strong>
              {detailData.userName ||
                detailData.user?.username ||
                detailData.user?.name ||
                detailData.createdByName ||
                '-'}
            </p>
            <p>
              <strong>
                {intl.formatMessage({
                  id: 'booking.column.seat',
                  defaultMessage: 'Seat',
                })}
                ：
              </strong>
              {detailData.seatName ||
                detailData.seat?.name ||
                [
                  detailData.floorName,
                  detailData.zone,
                  detailData.rowNum && detailData.colNum
                    ? `R${detailData.rowNum}C${detailData.colNum}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' ') ||
                '-'}
            </p>
            <p>
              <strong>
                {intl.formatMessage({
                  id: 'booking.form.date',
                  defaultMessage: 'Date',
                })}
                ：
              </strong>
              {detailData.date || detailData.book_date || '-'}
            </p>
            <p>
              <strong>
                {intl.formatMessage({
                  id: 'booking.detail.time',
                  defaultMessage: 'Time',
                })}
                ：
              </strong>
              {(detailData.startTime ?? detailData.start ?? '-') +
                ' - ' +
                (detailData.endTime ?? detailData.end ?? '-')}
            </p>
            <p>
              <strong>
                {intl.formatMessage({
                  id: 'seat.form.status',
                  defaultMessage: 'Status',
                })}
                ：
              </strong>
              {typeof detailData.status === 'number'
                ? intl.formatMessage({
                    id: BookingStatusText[detailData.status],
                  })
                : detailData.status}
            </p>
          </div>
        ) : (
          <div>
            {intl.formatMessage({
              id: 'common.loading',
              defaultMessage: 'Loading',
            })}
          </div>
        )}
      </Modal>

      <Modal
        title={qrTitle}
        open={qrModalVisible}
        onCancel={() => {
          setQrModalVisible(false);
        }}
        afterClose={() => {
          setQrPayload('');
          setQrTitle('');
          setQrLoading(false);
        }}
        footer={null}
        destroyOnClose
      >
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: 16 }}>
            {intl.formatMessage({
              id: 'booking.qr.hint',
              defaultMessage:
                'Scan this QR to simulate a booking check-in or check-out event.',
            })}
          </p>
          <div
            style={{
              width: 260,
              height: 260,
              margin: '0 auto',
              border: '1px solid #f0f0f0',
              borderRadius: 12,
              background: '#fafafa',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {qrLoading && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.92)',
                  padding: 16,
                  textAlign: 'center',
                }}
              >
                <Spin size="large" />
                <div
                  style={{
                    marginTop: 12,
                    color: '#666',
                    fontSize: 14,
                    lineHeight: '20px',
                    whiteSpace: 'normal',
                    maxWidth: 220,
                  }}
                >
                  {intl.formatMessage({
                    id: 'common.loading',
                    defaultMessage: 'Loading',
                  })}
                </div>
              </div>
            )}
            {qrPayload ? (
              <img
                key={qrPayload}
                alt={qrTitle}
                src={createQrImageUrl(qrPayload)}
                width={260}
                height={260}
                onLoad={() => setQrLoading(false)}
                onError={() => setQrLoading(false)}
                style={{
                  display: qrLoading ? 'none' : 'block',
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <div
                style={{
                  color: '#999',
                  padding: 16,
                  textAlign: 'center',
                  fontSize: 14,
                }}
              >
                {intl.formatMessage({
                  id: 'booking.qr.placeholder',
                  defaultMessage: 'QR code will appear here once generated.',
                })}
              </div>
            )}
          </div>
          <p style={{ marginTop: 16, color: '#666' }}>
            {intl.formatMessage(
              {
                id: 'booking.qr.payload',
                defaultMessage: 'Payload: {payload}',
              },
              { payload: qrPayload },
            )}
          </p>
        </div>
      </Modal>

      <Modal
        title={intl.formatMessage({
          id: 'booking.new',
          defaultMessage: 'New booking',
        })}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            const { timeSlot, startTime, endTime, date } = values;
            if (startTime || endTime) {
              ensureCustomTimeIsValid(timeSlot, startTime, endTime);
            }
            const range = getTimeSlotRange(timeSlot);
            const payload = {
              ...values,
              date:
                typeof date?.format === 'function'
                  ? date.format('YYYY-MM-DD')
                  : date,
              startTime: normalizeTimeValue(startTime) || range.start,
              endTime: normalizeTimeValue(endTime) || range.end,
            };
            await createBooking(payload);
            message.success(
              intl.formatMessage({
                id: 'booking.createSuccess',
                defaultMessage: 'Created successfully',
              }),
            );
            setModalVisible(false);
            form.resetFields();
            actionRef.current?.reload?.();
          } catch (e: any) {
            if (e?.errorFields) return;
            message.error(
              e?.message ||
                intl.formatMessage({
                  id: 'booking.createFailed',
                  defaultMessage: 'Creation failed',
                }),
            );
          }
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="userId"
            label={intl.formatMessage({
              id: 'login.username',
              defaultMessage: 'Username',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'user.form.usernameRequired',
                  defaultMessage: 'Please enter username',
                }),
              },
            ]}
          >
            <Select
              showSearch
              placeholder={intl.formatMessage({
                id: 'booking.userSearchPlaceholder',
                defaultMessage: 'Type username/name to search and select user',
              })}
              filterOption={false}
              onSearch={async (val: string) => {
                try {
                  const res: any = await getUserList({
                    q: val,
                    page: 1,
                    limit: 10,
                  });
                  const list = Array.isArray(res?.data?.list)
                    ? res.data.list
                    : [];
                  setUserOptions(
                    list.map((u: any) => ({
                      label: `${u.name || u.username}${
                        u.studentId ? ' (' + u.studentId + ')' : ''
                      }`,
                      value: u.id,
                    })),
                  );
                } catch (e) {
                  setUserOptions([]);
                }
              }}
            >
              {userOptions.map((o) => (
                <Select.Option key={o.value} value={o.value}>
                  {o.label}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="floorId"
            label={intl.formatMessage({
              id: 'seat.form.floor',
              defaultMessage: 'Floor',
            })}
          >
            <Select>
              {floors.map((f) => (
                <Select.Option key={f.id} value={f.id}>
                  {f.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="seatId"
            label={intl.formatMessage({
              id: 'booking.column.seat',
              defaultMessage: 'Seat',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'booking.form.seatNameRequired',
                  defaultMessage: 'Please select a seat',
                }),
              },
            ]}
          >
            <Select
              showSearch
              placeholder={intl.formatMessage({
                id: 'booking.form.seatSearchPlaceholder',
                defaultMessage: 'Type floor/zone/seat to search',
              })}
              filterOption={false}
              onSearch={(val) => fetchSeatOptions(val)}
              onFocus={() => {
                if (!seatOptions.length) fetchSeatOptions('');
              }}
              loading={seatLoading}
              options={seatOptions}
              notFoundContent={
                seatLoading
                  ? intl.formatMessage({
                      id: 'common.loading',
                      defaultMessage: 'Loading',
                    })
                  : intl.formatMessage({
                      id: 'booking.noSeatsFound',
                      defaultMessage: 'No seats found',
                    })
              }
            />
          </Form.Item>
          <Form.Item
            name="date"
            label={intl.formatMessage({
              id: 'booking.form.date',
              defaultMessage: 'Date',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'booking.form.dateRequired',
                  defaultMessage: 'Please select a date',
                }),
              },
            ]}
          >
            <DatePicker
              style={{ width: '100%' }}
              disabledDate={(current) =>
                current && current.endOf('day').isBefore(dayjs())
              }
            />
          </Form.Item>
          <Form.Item
            name="timeSlot"
            label={intl.formatMessage({
              id: 'booking.form.timeSlot',
              defaultMessage: 'Time slot',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'booking.form.timeSlotRequired',
                  defaultMessage: 'Please select a time slot',
                }),
              },
            ]}
          >
            <Select>
              {timeSlotConfigs.length > 0
                ? timeSlotConfigs.map((item) => (
                    <Select.Option
                      key={item.id || item.value}
                      value={item.value}
                    >
                      {item.label || item.timeSlot}
                    </Select.Option>
                  ))
                : [
                    {
                      value: TimeSlot.Morning,
                      label: intl.formatMessage({
                        id: 'booking.timeSlot.morning',
                        defaultMessage: 'Morning',
                      }),
                    },
                    {
                      value: TimeSlot.Afternoon,
                      label: intl.formatMessage({
                        id: 'booking.timeSlot.afternoon',
                        defaultMessage: 'Afternoon',
                      }),
                    },
                    {
                      value: TimeSlot.Evening,
                      label: intl.formatMessage({
                        id: 'booking.timeSlot.evening',
                        defaultMessage: 'Evening',
                      }),
                    },
                  ].map((item) => (
                    <Select.Option key={item.value} value={item.value}>
                      {item.label}
                    </Select.Option>
                  ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="startTime"
            label={intl.formatMessage({
              id: 'booking.form.startTime',
              defaultMessage: 'Start time',
            })}
            extra={intl.formatMessage({
              id: 'booking.form.timeHint',
              defaultMessage: 'Optional, format HH:mm',
            })}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const endTime = getFieldValue('endTime');
                  const normalizedValue = normalizeTimeValue(value);
                  const normalizedEndTime = normalizeTimeValue(endTime);
                  if (!normalizedValue && normalizedEndTime) {
                    return Promise.reject(
                      new Error(
                        intl.formatMessage({
                          id: 'booking.form.customTimeBoth',
                          defaultMessage:
                            'Please provide both start and end time for a custom time range.',
                        }),
                      ),
                    );
                  }
                  if (
                    normalizedValue &&
                    !/^([01]\d|2[0-3]):([0-5]\d)$/.test(normalizedValue)
                  ) {
                    return Promise.reject(
                      new Error(
                        intl.formatMessage({
                          id: 'booking.form.timeFormatError',
                          defaultMessage: 'Please enter time as HH:mm',
                        }),
                      ),
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <TimePicker
              style={{ width: '100%' }}
              format="HH:mm"
              minuteStep={5}
              placeholder="08:00"
            />
          </Form.Item>
          <Form.Item
            name="endTime"
            label={intl.formatMessage({
              id: 'booking.form.endTime',
              defaultMessage: 'End time',
            })}
            extra={intl.formatMessage({
              id: 'booking.form.timeHint',
              defaultMessage: 'Optional, format HH:mm',
            })}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const startTime = getFieldValue('startTime');
                  const normalizedValue = normalizeTimeValue(value);
                  const normalizedStartTime = normalizeTimeValue(startTime);
                  if (!normalizedValue && normalizedStartTime) {
                    return Promise.reject(
                      new Error(
                        intl.formatMessage({
                          id: 'booking.form.customTimeBoth',
                          defaultMessage:
                            'Please provide both start and end time for a custom time range.',
                        }),
                      ),
                    );
                  }
                  if (
                    normalizedValue &&
                    !/^([01]\d|2[0-3]):([0-5]\d)$/.test(normalizedValue)
                  ) {
                    return Promise.reject(
                      new Error(
                        intl.formatMessage({
                          id: 'booking.form.timeFormatError',
                          defaultMessage: 'Please enter time as HH:mm',
                        }),
                      ),
                    );
                  }
                  if (
                    normalizedValue &&
                    normalizedStartTime &&
                    normalizedValue <= normalizedStartTime
                  ) {
                    return Promise.reject(
                      new Error(
                        intl.formatMessage({
                          id: 'booking.form.endTimeAfterStart',
                          defaultMessage: 'End time must be after start time',
                        }),
                      ),
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <TimePicker
              style={{ width: '100%' }}
              format="HH:mm"
              minuteStep={5}
              placeholder="17:00"
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default BookingManagement;
