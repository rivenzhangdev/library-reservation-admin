import { EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Button,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Tag,
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
  createBooking,
  getBookingDetail,
  getBookingList,
} from '../../services/library/booking';
import { getFloors } from '../../services/library/floor';
import { getUserList } from '../../services/library/user';

/**
 * 预约数据类型
 */
interface BookingType {
  id: number;
  userName: string;
  seatName: string;
  floorId?: string;
  floorName?: string;
  date: string;
  timeSlot: TimeSlot;
  startTime: string;
  endTime: string;
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
  const [floors, setFloors] = useState<Array<{ id: string; name: string }>>([]);
  const [userOptions, setUserOptions] = useState<
    Array<{ label: string; value: string }>
  >([]);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await getFloors();
        const raw = res?.data;
        let list: any[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (Array.isArray(raw?.floors)) list = raw.floors;
        else list = [];
        setFloors(list.map((f) => ({ id: f.id, name: f.name })));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

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
      render: (_, record) =>
        record.userName || record.user?.name || record.user?.username || '-',
    },
    {
      title: intl.formatMessage({
        id: 'booking.column.seat',
        defaultMessage: 'Seat',
      }),
      dataIndex: 'seatName',
      width: 120,
      render: (_, record) => record.seatName || record.seat?.name || '-',
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
        id: 'booking.column.dateRange',
        defaultMessage: 'Date range',
      }),
      dataIndex: 'dateRange',
      valueType: 'dateRange',
      hideInTable: true,
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
        id: 'common.action',
        defaultMessage: 'Action',
      }),
      valueType: 'option',
      width: 140,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
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
          {record.status === BookingStatus.Upcoming && (
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
      ),
    },
  ];

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'menu.booking',
        defaultMessage: 'Booking management',
      })}
    >
      <ProTable<BookingType>
        headerTitle={intl.formatMessage({
          id: 'booking.listTitle',
          defaultMessage: 'Booking list',
        })}
        actionRef={actionRef}
        rowKey="id"
        scroll={{ x: 1000 }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
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
            const raw = res?.data;
            let list: any[] = [];
            if (Array.isArray(raw)) list = raw;
            else if (Array.isArray(raw?.list)) list = raw.list;
            else if (Array.isArray(raw?.bookings)) list = raw.bookings;
            else list = [];
            const total = raw?.total ?? (Array.isArray(list) ? list.length : 0);
            return { data: list, success: true, total };
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
                detailData.user?.name ||
                detailData.user?.username ||
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
              {detailData.seatName || detailData.seat?.name || '-'}
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
              {detailData.status}
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
            await createBooking(values);
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
                  const raw = res?.data || {};
                  const list = raw.list || raw.users || [];
                  setUserOptions(
                    list.map((u: any) => ({
                      label: `${u.name || u.username}${
                        u.studentId ? ' (' + u.studentId + ')' : ''
                      }`,
                      value: u.id || u._id,
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
            name="seatName"
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
            <Input />
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
                current && current.endOf('day').isBefore(new Date())
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
              <Select.Option value={TimeSlot.Morning}>
                {intl.formatMessage({
                  id: 'timeslot.morning',
                  defaultMessage: 'Morning',
                })}
              </Select.Option>
              <Select.Option value={TimeSlot.Afternoon}>
                {intl.formatMessage({
                  id: 'timeslot.afternoon',
                  defaultMessage: 'Afternoon',
                })}
              </Select.Option>
              <Select.Option value={TimeSlot.Evening}>
                {intl.formatMessage({
                  id: 'timeslot.evening',
                  defaultMessage: 'Evening',
                })}
              </Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default BookingManagement;
