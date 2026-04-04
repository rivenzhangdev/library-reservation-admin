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
        defaultMessage: '确认取消',
      }),
      content: '确定要取消该预约吗？',
      onOk: async () => {
        try {
          await cancelBooking(id);
          message.success('取消成功');
          actionRef.current?.reload?.();
        } catch (e: any) {
          message.error(e?.message || '取消失败');
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
      message.error(e?.message || '获取详情失败');
    }
  };

  const columns: ProColumns<BookingType>[] = [
    {
      title: intl.formatMessage({
        id: 'seat.form.floor',
        defaultMessage: '楼层',
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
        defaultMessage: '用户',
      }),
      dataIndex: 'userName',
      width: 100,
      render: (_, record) =>
        record.userName || record.user?.name || record.user?.username || '-',
    },
    {
      title: intl.formatMessage({
        id: 'booking.column.seat',
        defaultMessage: '座位',
      }),
      dataIndex: 'seatName',
      width: 120,
      render: (_, record) => record.seatName || record.seat?.name || '-',
    },
    {
      title: intl.formatMessage({
        id: 'booking.form.date',
        defaultMessage: '日期',
      }),
      dataIndex: 'date',
      valueType: 'date',
      width: 110,
    },
    {
      title: intl.formatMessage({
        id: 'booking.column.dateRange',
        defaultMessage: '日期范围',
      }),
      dataIndex: 'dateRange',
      valueType: 'dateRange',
      hideInTable: true,
    },
    {
      title: intl.formatMessage({
        id: 'booking.form.timeSlot',
        defaultMessage: '时段',
      }),
      dataIndex: 'timeSlot',
      valueType: 'select',
      valueEnum: {
        [TimeSlot.Morning]: { text: TimeSlotText[TimeSlot.Morning] },
        [TimeSlot.Afternoon]: { text: TimeSlotText[TimeSlot.Afternoon] },
        [TimeSlot.Evening]: { text: TimeSlotText[TimeSlot.Evening] },
      },
    },
    {
      title: intl.formatMessage({
        id: 'credit.column.date',
        defaultMessage: '时间',
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
        defaultMessage: '状态',
      }),
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        [BookingStatus.Upcoming]: {
          text: BookingStatusText[BookingStatus.Upcoming],
          status: 'Processing',
        },
        [BookingStatus.Ongoing]: {
          text: BookingStatusText[BookingStatus.Ongoing],
          status: 'Success',
        },
        [BookingStatus.Completed]: {
          text: BookingStatusText[BookingStatus.Completed],
          status: 'Default',
        },
        [BookingStatus.Canceled]: {
          text: BookingStatusText[BookingStatus.Canceled],
          status: 'Error',
        },
        [BookingStatus.Violated]: {
          text: BookingStatusText[BookingStatus.Violated],
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
            {BookingStatusText[record.status]}
          </Tag>
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'common.action',
        defaultMessage: '操作',
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
              defaultMessage: '详情',
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
                defaultMessage: '取消',
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
        defaultMessage: '预约管理',
      })}
    >
      <ProTable<BookingType>
        headerTitle="预约列表"
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
                  defaultMessage: '确认批量取消',
                }),
                content: `确定要取消 ${selectedRows.length} 条预约吗？`,
                onOk: async () => {
                  try {
                    await batchCancelBookings(selectedRows);
                    message.success('批量取消成功');
                    setSelectedRows([]);
                    actionRef.current?.reload?.();
                  } catch (e: any) {
                    message.error(e?.message || '批量取消失败');
                  }
                },
              });
            }}
          >
            {intl.formatMessage({
              id: 'booking.batchCancel',
              defaultMessage: '批量取消',
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
              defaultMessage: '新增预约',
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
          defaultMessage: '详情',
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
              <strong>用户：</strong>
              {detailData.userName ||
                detailData.user?.name ||
                detailData.user?.username ||
                '-'}
            </p>
            <p>
              <strong>座位：</strong>
              {detailData.seatName || detailData.seat?.name || '-'}
            </p>
            <p>
              <strong>日期：</strong>
              {detailData.date || detailData.book_date || '-'}
            </p>
            <p>
              <strong>时间：</strong>
              {(detailData.startTime ?? detailData.start ?? '-') +
                ' - ' +
                (detailData.endTime ?? detailData.end ?? '-')}
            </p>
            <p>
              <strong>状态：</strong>
              {detailData.status}
            </p>
          </div>
        ) : (
          <div>加载中...</div>
        )}
      </Modal>
      <Modal
        title={intl.formatMessage({
          id: 'booking.new',
          defaultMessage: '新增预约',
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
            message.success('创建成功');
            setModalVisible(false);
            form.resetFields();
            actionRef.current?.reload?.();
          } catch (e: any) {
            if (e?.errorFields) return;
            message.error(e?.message || '创建失败');
          }
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="userName"
            label={intl.formatMessage({
              id: 'login.username',
              defaultMessage: '用户名',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'user.form.usernameRequired',
                  defaultMessage: '请输入用户名',
                }),
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="floorId"
            label={intl.formatMessage({
              id: 'seat.form.floor',
              defaultMessage: '楼层',
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
              defaultMessage: '座位',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'booking.form.seatNameRequired',
                  defaultMessage: '请选择座位',
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
              defaultMessage: '日期',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'booking.form.dateRequired',
                  defaultMessage: '请选择日期',
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
              defaultMessage: '时段',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'booking.form.timeSlotRequired',
                  defaultMessage: '请选择时段',
                }),
              },
            ]}
          >
            <Select>
              <Select.Option value={TimeSlot.Morning}>
                {intl.formatMessage({
                  id: 'timeslot.morning',
                  defaultMessage: '上午',
                })}
              </Select.Option>
              <Select.Option value={TimeSlot.Afternoon}>
                {intl.formatMessage({
                  id: 'timeslot.afternoon',
                  defaultMessage: '下午',
                })}
              </Select.Option>
              <Select.Option value={TimeSlot.Evening}>
                {intl.formatMessage({
                  id: 'timeslot.evening',
                  defaultMessage: '晚上',
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
