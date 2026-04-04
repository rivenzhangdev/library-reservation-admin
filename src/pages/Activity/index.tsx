import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Button,
  DatePicker,
  Form,
  Image,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Tag,
  message,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityStatus, ActivityStatusText } from '../../constants/status';
import {
  createActivity,
  deleteActivity,
  getActivityList,
  updateActivity,
} from '../../services/library/activity';
import { getFloors } from '../../services/library/floor';

/**
 * 活动数据类型
 */
interface ActivityType {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  startTime: string;
  endTime: string;
  location: string;
  floorId?: string;
  floorName?: string;
  status: ActivityStatus;
  participants: number;
  maxParticipants: number;
}

/**
 * 活动管理页面
 */
const ActivityManagement: React.FC = () => {
  const intl = useIntl();

  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
  const [form] = Form.useForm();

  /**
   * 删除活动
   */
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: intl.formatMessage({
        id: 'user.confirmDeleteTitle',
        defaultMessage: '确认删除',
      }),
      content: '确定要删除该活动吗？',
      onOk: async () => {
        try {
          await deleteActivity(id);
          message.success('删除成功');
          actionRef.current?.reload?.();
        } catch (e: any) {
          message.error(e?.message || '删除失败');
        }
      },
    });
  };

  const columns: ProColumns<ActivityType>[] = [
    {
      title: intl.formatMessage({
        id: 'activity.column.timeRange',
        defaultMessage: '时间范围',
      }),
      dataIndex: 'timeRange',
      valueType: 'dateRange',
      hideInTable: true,
    },
    {
      title: intl.formatMessage({
        id: 'activity.column.cover',
        defaultMessage: '封面',
      }),
      dataIndex: 'coverImage',
      hideInSearch: true,
      width: 80,
      render: (_, record) => {
        const src = record.coverImage || record.cover_image || record.cover;
        return src ? (
          <Image
            src={src}
            alt={record.title}
            width={60}
            height={60}
            style={{ objectFit: 'cover', borderRadius: '4px' }}
          />
        ) : (
          <div
            style={{
              width: 60,
              height: 60,
              background: '#f5f5f5',
              borderRadius: 4,
            }}
          />
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'activity.form.title',
        defaultMessage: '标题',
      }),
      dataIndex: 'title',
      copyable: true,
      width: 160,
      ellipsis: true,
    },
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
        id: 'activity.form.location',
        defaultMessage: '地点',
      }),
      dataIndex: 'location',
      width: 120,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: 'table.schedule.startTime',
        defaultMessage: '开始时间',
      }),
      dataIndex: 'startTime',
      valueType: 'dateTime',
      width: 160,
      sorter: true,
    },
    {
      title: intl.formatMessage({
        id: 'activity.column.endTime',
        defaultMessage: '结束时间',
      }),
      dataIndex: 'endTime',
      valueType: 'dateTime',
      width: 160,
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'seat.form.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        [ActivityStatus.Ongoing]: {
          text: ActivityStatusText[ActivityStatus.Ongoing],
          status: 'Success',
        },
        [ActivityStatus.Upcoming]: {
          text: ActivityStatusText[ActivityStatus.Upcoming],
          status: 'Processing',
        },
        [ActivityStatus.Ended]: {
          text: ActivityStatusText[ActivityStatus.Ended],
          status: 'Default',
        },
      },
      render: (_, record) => {
        const statusMap: Record<number, string> = {
          [ActivityStatus.Ongoing]: 'success',
          [ActivityStatus.Upcoming]: 'processing',
          [ActivityStatus.Ended]: 'default',
        };
        return (
          <Tag color={statusMap[record.status]}>
            {ActivityStatusText[record.status]}
          </Tag>
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'activity.column.participants',
        defaultMessage: '报名人数',
      }),
      dataIndex: 'participants',
      hideInSearch: true,
      width: 100,
      render: (_, record) => {
        const p = record.participants || 0;
        if (record.maxParticipants && record.maxParticipants > 0) {
          return `${p} / ${record.maxParticipants} 人`;
        }
        return `${p} 人`;
      },
    },
    {
      title: intl.formatMessage({
        id: 'common.action',
        defaultMessage: '操作',
      }),
      valueType: 'option',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={async () => {
              setEditingId(record.id);
              // populate form
              try {
                const values: any = {
                  title: record.title,
                  description: record.description,
                  coverImage: record.coverImage,
                  location: record.location,
                  maxParticipants: record.maxParticipants,
                  status: record.status,
                  floorId: record.floorId,
                };
                if (record.startTime && record.endTime) {
                  // lazy import dayjs to convert to date objects compatible with DatePicker
                  const dayjs = (await import('dayjs')).default;
                  values.time = [
                    dayjs(record.startTime),
                    dayjs(record.endTime),
                  ];
                }
                form.setFieldsValue(values);
                setModalVisible(true);
              } catch (e) {
                // ignore
              }
            }}
          >
            {intl.formatMessage({ id: 'common.edit', defaultMessage: '编辑' })}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            size="small"
            onClick={() => handleDelete(record.id)}
          >
            {intl.formatMessage({
              id: 'common.delete',
              defaultMessage: '删除',
            })}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'menu.activity',
        defaultMessage: '活动管理',
      })}
    >
      <ProTable<ActivityType>
        headerTitle="活动列表"
        actionRef={actionRef}
        rowKey="id"
        scroll={{ x: 1100 }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
        request={async (params) => {
          try {
            const res: any = await getActivityList(params);
            const raw = res?.data;
            let list: any[] = [];
            if (Array.isArray(raw)) list = raw;
            else if (Array.isArray(raw?.list)) list = raw.list;
            else if (Array.isArray(raw?.activities)) list = raw.activities;
            else list = [];
            list = list.map((item: any) => ({
              ...item,
              id: item.id || item._id,
            }));
            const total = raw?.total ?? (Array.isArray(list) ? list.length : 0);
            return { data: list, success: true, total };
          } catch (e) {
            return { data: [], success: false, total: 0 };
          }
        }}
        columns={columns}
        toolBarRender={() => [
          <Button
            key="new"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingId(null);
              setModalVisible(true);
            }}
          >
            {intl.formatMessage({
              id: 'activity.publish',
              defaultMessage: '发布活动',
            })}
          </Button>,
        ]}
        pagination={{
          pageSize: 10,
        }}
      />
      <Modal
        title={intl.formatMessage({
          id: 'activity.publish',
          defaultMessage: '发布活动',
        })}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingId(null);
        }}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            const payload: any = { ...values };
            if (values.time && Array.isArray(values.time)) {
              payload.startTime = values.time[0].format();
              payload.endTime = values.time[1].format();
              delete payload.time;
            }
            if (editingId) {
              await updateActivity(editingId, payload);
              message.success('更新成功');
            } else {
              await createActivity(payload);
              message.success('发布成功');
            }
            setModalVisible(false);
            form.resetFields();
            setEditingId(null);
            actionRef.current?.reload?.();
          } catch (e: any) {
            if (e?.errorFields) return; // form validation errors shown inline
            message.error(e?.message || (editingId ? '更新失败' : '发布失败'));
          }
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label={intl.formatMessage({
              id: 'activity.form.title',
              defaultMessage: '标题',
            })}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label={intl.formatMessage({
              id: 'floor.form.description',
              defaultMessage: '描述',
            })}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="coverImage"
            label={intl.formatMessage({
              id: 'activity.form.cover',
              defaultMessage: '封面图片 URL',
            })}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="location"
            label={intl.formatMessage({
              id: 'activity.form.location',
              defaultMessage: '地点',
            })}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="time"
            label={intl.formatMessage({
              id: 'activity.form.timeRange',
              defaultMessage: '开始 / 结束 时间',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'activity.form.timeRequired',
                  defaultMessage: '请选择开始和结束时间',
                }),
              },
            ]}
          >
            <DatePicker.RangePicker
              showTime
              style={{ width: '100%' }}
              disabledDate={(current) =>
                current && current.endOf('day').isBefore(new Date())
              }
            />
          </Form.Item>
          <Form.Item
            name="maxParticipants"
            label={intl.formatMessage({
              id: 'activity.form.maxParticipants',
              defaultMessage: '最大报名人数',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'activity.form.maxParticipantsRequired',
                  defaultMessage: '请输入最大报名人数',
                }),
              },
              {
                type: 'number',
                min: 1,
                message: intl.formatMessage({
                  id: 'activity.form.minValue',
                  defaultMessage: '最小值为 1',
                }),
              },
            ]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="status"
            label={intl.formatMessage({
              id: 'seat.form.status',
              defaultMessage: '状态',
            })}
            initialValue={ActivityStatus.Upcoming}
          >
            <Select>
              <Select.Option value={ActivityStatus.Ongoing}>
                {intl.formatMessage({
                  id: 'activity.status.ongoing',
                  defaultMessage: '进行中',
                })}
              </Select.Option>
              <Select.Option value={ActivityStatus.Upcoming}>
                {intl.formatMessage({
                  id: 'activity.status.upcoming',
                  defaultMessage: '未开始',
                })}
              </Select.Option>
              <Select.Option value={ActivityStatus.Ended}>
                {intl.formatMessage({
                  id: 'activity.status.ended',
                  defaultMessage: '已结束',
                })}
              </Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ActivityManagement;
