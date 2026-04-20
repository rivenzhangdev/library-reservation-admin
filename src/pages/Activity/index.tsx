import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
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
  Radio,
  Select,
  Space,
  Spin,
  Tag,
  Upload,
  message,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityStatus, ActivityStatusText } from '../../constants/status';
import {
  createActivity,
  deleteActivity,
  getActivityList,
  updateActivity,
} from '../../services/library/activity';
import { getFloors } from '../../services/library/floor';
import { uploadImage } from '../../services/library/user';
import {
  STANDARD_ACTION_COLUMN,
  STANDARD_TABLE_SCROLL,
  STANDARD_TABLE_SEARCH,
  toTableDataSource,
} from '../../utils/table';

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
  participants: number | any[];
  maxParticipants: number;
  createdByName?: string;
  updatedByName?: string;
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
        const list: any[] = await getFloors();
        setFloors(list.map((f) => ({ id: f.id, name: f.name })));
      } catch (e) {
        // ignore
      }
    })();
  }, []);
  const [form] = Form.useForm();
  const [coverType, setCoverType] = useState<'url' | 'local'>('url');
  const [coverPreview, setCoverPreview] = useState<string>();
  const [localCoverDataUrl, setLocalCoverDataUrl] = useState<string>();
  const [qrModalVisible, setQrModalVisible] = useState<boolean>(false);
  const [qrPayload, setQrPayload] = useState<string>('');
  const [qrTitle, setQrTitle] = useState<string>('');
  const [qrLoading, setQrLoading] = useState<boolean>(false);
  const [previewLoading, setPreviewLoading] = useState(false);

  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const isDataUrl = (value?: string): boolean =>
    !!value && /^data:image\/[a-zA-Z]+;base64,/.test(value);

  const handleCoverBeforeUpload = async (file: File) => {
    const base64 = await getBase64(file);
    setCoverPreview(base64);
    setLocalCoverDataUrl(base64);
    setCoverType('local');
    setPreviewLoading(true);
    form.setFieldsValue({ coverType: 'local', coverImage: undefined });
    return Upload.LIST_IGNORE;
  };

  const handleCoverTypeChange = (e: any) => {
    const next = e.target.value as 'url' | 'local';
    setCoverType(next);
    form.setFieldsValue({ coverType: next });
    if (next === 'url') {
      const url = form.getFieldValue('coverImage');
      setCoverPreview(url || undefined);
      setLocalCoverDataUrl(undefined);
      setPreviewLoading(!!url);
    } else {
      setCoverPreview(undefined);
      setLocalCoverDataUrl(undefined);
      setPreviewLoading(false);
      form.setFieldsValue({ coverImage: undefined });
    }
  };

  const createQrImageUrl = (payload: string) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
      payload,
    )}`;
  };

  const openQrModal = (title: string, payload: string) => {
    setQrTitle(title);
    setQrPayload(payload);
    setQrLoading(true);
    setQrModalVisible(true);
  };

  const closeQrModal = () => {
    setQrModalVisible(false);
    setQrLoading(false);
  };

  /**
   * 删除活动
   */
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: intl.formatMessage({
        id: 'user.confirmDeleteTitle',
        defaultMessage: 'Confirm delete',
      }),
      content: intl.formatMessage({
        id: 'activity.confirmDeleteContent',
        defaultMessage: 'Are you sure you want to delete this activity?',
      }),
      onOk: async () => {
        try {
          await deleteActivity(id);
          message.success(
            intl.formatMessage({
              id: 'common.deleteSuccessRefresh',
              defaultMessage: 'Deleted successfully, refreshing',
            }),
          );
          actionRef.current?.reload?.();
        } catch (e: any) {
          message.error(
            e?.message ||
              intl.formatMessage({
                id: 'common.deleteFailed',
                defaultMessage: 'Delete failed, please try again',
              }),
          );
        }
      },
    });
  };

  const generateActivityQr = (
    record: ActivityType,
    action: 'checkin' | 'checkout',
  ) => {
    const payload = JSON.stringify({
      type: 'activity',
      id: String(record.id),
      action,
    });
    openQrModal(
      `${record.title} · ${action === 'checkin' ? '签到' : '签退'} QR`,
      payload,
    );
  };

  const columns: ProColumns<ActivityType>[] = [
    {
      title: intl.formatMessage({
        id: 'activity.column.timeRange',
        defaultMessage: 'Time range',
      }),
      dataIndex: 'timeRange',
      valueType: 'dateRange',
      hideInTable: true,
    },
    {
      title: intl.formatMessage({
        id: 'activity.column.cover',
        defaultMessage: 'Cover',
      }),
      dataIndex: 'coverImage',
      hideInSearch: true,
      width: 140,
      render: (_, record) => {
        const src = record.coverImage;
        return src ? (
          <Image
            src={src}
            alt={record.title}
            width={120}
            height={64}
            style={{ objectFit: 'cover', borderRadius: '4px' }}
          />
        ) : (
          <div
            style={{
              width: 120,
              height: 64,
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
        defaultMessage: 'Title',
      }),
      dataIndex: 'title',
      copyable: true,
      width: 160,
      ellipsis: true,
    },
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
        id: 'activity.form.location',
        defaultMessage: 'Location',
      }),
      dataIndex: 'location',
      width: 120,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: 'table.schedule.startTime',
        defaultMessage: 'Start time',
      }),
      dataIndex: 'startTime',
      valueType: 'dateTime',
      width: 160,
      sorter: true,
    },
    {
      title: intl.formatMessage({
        id: 'activity.column.endTime',
        defaultMessage: 'End time',
      }),
      dataIndex: 'endTime',
      valueType: 'dateTime',
      width: 160,
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'seat.form.status',
        defaultMessage: 'Status',
      }),
      dataIndex: 'status',
      width: 120,
      valueType: 'select',
      valueEnum: {
        [ActivityStatus.Ongoing]: {
          text: intl.formatMessage({
            id: ActivityStatusText[ActivityStatus.Ongoing],
          }),
          status: 'Success',
        },
        [ActivityStatus.Upcoming]: {
          text: intl.formatMessage({
            id: ActivityStatusText[ActivityStatus.Upcoming],
          }),
          status: 'Processing',
        },
        [ActivityStatus.Ended]: {
          text: intl.formatMessage({
            id: ActivityStatusText[ActivityStatus.Ended],
          }),
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
            {intl.formatMessage({
              id: ActivityStatusText[record.status],
              defaultMessage: '',
            })}
          </Tag>
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'common.createdBy',
        defaultMessage: 'Created By',
      }),
      dataIndex: 'createdByName',
      width: 120,
      hideInSearch: true,
      render: (_, record) => record.createdByName || '-',
    },
    {
      title: intl.formatMessage({
        id: 'activity.column.participants',
        defaultMessage: 'Participants',
      }),
      dataIndex: 'participants',
      hideInSearch: true,
      width: 120,
      render: (_, record) => {
        const count = Array.isArray(record.participants)
          ? record.participants.length
          : Number(record.participants) || 0;
        return intl.formatMessage(
          {
            id: 'activity.participantsCount',
            defaultMessage: '{count} people',
          },
          { count },
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'activity.column.maxParticipants',
        defaultMessage: 'Max participants',
      }),
      dataIndex: 'maxParticipants',
      hideInSearch: true,
      width: 120,
      render: (_, record) => {
        const m = record.maxParticipants;
        if (m === undefined || m === null) return '—';
        const count = Number(m);
        return intl.formatMessage(
          {
            id: 'activity.participantsCount',
            defaultMessage: '{count} people',
          },
          { count: count },
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'common.action',
        defaultMessage: 'Action',
      }),
      valueType: 'option',
      ...STANDARD_ACTION_COLUMN,
      render: (_, record) => (
        <Space size="small" wrap style={{ width: '100%', gap: 4 }}>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={async () => {
              setEditingId(record.id);
              // populate form
              try {
                const cover = record.coverImage;
                const isLocalCover = isDataUrl(String(cover || ''));
                const values: any = {
                  title: record.title,
                  description: record.description,
                  coverImage: cover,
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
                form.setFieldsValue({
                  ...values,
                  coverType: isLocalCover ? 'local' : 'url',
                });
                setCoverType(isLocalCover ? 'local' : 'url');
                setCoverPreview(values.coverImage);
                setLocalCoverDataUrl(isLocalCover ? String(cover) : undefined);
                setModalVisible(true);
              } catch (e) {
                // ignore
              }
            }}
          >
            {intl.formatMessage({ id: 'common.edit', defaultMessage: 'Edit' })}
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => generateActivityQr(record, 'checkin')}
          >
            {intl.formatMessage({
              id: 'activity.qr.checkin',
              defaultMessage: 'Check-in QR',
            })}
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => generateActivityQr(record, 'checkout')}
          >
            {intl.formatMessage({
              id: 'activity.qr.checkout',
              defaultMessage: 'Check-out QR',
            })}
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
              defaultMessage: 'Delete',
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
        defaultMessage: 'Activity management',
      })}
    >
      <ProTable<ActivityType>
        headerTitle={intl.formatMessage({
          id: 'activity.listTitle',
          defaultMessage: 'Activity list',
        })}
        actionRef={actionRef}
        rowKey="id"
        scroll={STANDARD_TABLE_SCROLL}
        search={STANDARD_TABLE_SEARCH}
        request={async (params) => {
          try {
            const res: any = await getActivityList(params);
            return toTableDataSource<ActivityType>(res);
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
              setCoverType('url');
              setCoverPreview(undefined);
              setLocalCoverDataUrl(undefined);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            {intl.formatMessage({
              id: 'activity.publish',
              defaultMessage: 'Publish activity',
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
          defaultMessage: 'Publish activity',
        })}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
          setEditingId(null);
          setCoverType('url');
          setCoverPreview(undefined);
          setLocalCoverDataUrl(undefined);
        }}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            const payload: any = { ...values };
            if (values.coverType === 'local' && localCoverDataUrl) {
              try {
                const uploadRes: any = await uploadImage(localCoverDataUrl);
                payload.coverImage = uploadRes?.url || localCoverDataUrl;
              } catch (uploadError: any) {
                message.error(
                  uploadError?.message ||
                    intl.formatMessage({
                      id: 'activity.form.coverUploadFailed',
                      defaultMessage: 'Uploaded cover image failed',
                    }),
                );
                return;
              }
            } else {
              payload.coverImage = values.coverImage;
            }
            delete payload.coverType;
            if (values.time && Array.isArray(values.time)) {
              payload.startTime = values.time[0].format();
              payload.endTime = values.time[1].format();
              delete payload.time;
            }
            if (editingId) {
              await updateActivity(editingId, payload);
              message.success(
                intl.formatMessage({
                  id: 'activity.updateSuccess',
                  defaultMessage: 'Updated successfully',
                }),
              );
            } else {
              await createActivity(payload);
              message.success(
                intl.formatMessage({
                  id: 'activity.publishSuccess',
                  defaultMessage: 'Published successfully',
                }),
              );
            }
            setModalVisible(false);
            form.resetFields();
            setEditingId(null);
            setCoverType('url');
            setCoverPreview(undefined);
            setLocalCoverDataUrl(undefined);
            actionRef.current?.reload?.();
          } catch (e: any) {
            if (e?.errorFields) return; // form validation errors shown inline
            message.error(
              e?.message ||
                intl.formatMessage({
                  id: editingId
                    ? 'activity.updateFailed'
                    : 'activity.publishFailed',
                  defaultMessage: editingId
                    ? 'Update failed'
                    : 'Publish failed',
                }),
            );
          }
        }}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label={intl.formatMessage({
              id: 'activity.form.title',
              defaultMessage: 'Title',
            })}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label={intl.formatMessage({
              id: 'floor.form.description',
              defaultMessage: 'Description',
            })}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item
            name="coverType"
            label={intl.formatMessage({
              id: 'activity.form.coverSource',
              defaultMessage: 'Cover source',
            })}
            initialValue="url"
          >
            <Radio.Group onChange={handleCoverTypeChange} value={coverType}>
              <Radio value="url">
                {intl.formatMessage({
                  id: 'activity.form.coverUrlOption',
                  defaultMessage: 'Use image URL',
                })}
              </Radio>
              <Radio value="local">
                {intl.formatMessage({
                  id: 'activity.form.coverLocalOption',
                  defaultMessage: 'Upload local image',
                })}
              </Radio>
            </Radio.Group>
          </Form.Item>
          {coverType === 'local' ? (
            <Form.Item
              label={intl.formatMessage({
                id: 'activity.form.cover',
                defaultMessage: 'Cover image',
              })}
            >
              <Upload
                accept="image/*"
                beforeUpload={handleCoverBeforeUpload}
                showUploadList={false}
                fileList={[]}
              >
                <Button icon={<UploadOutlined />}>
                  {intl.formatMessage({
                    id: 'activity.form.coverUploadButton',
                    defaultMessage: 'Upload local image',
                  })}
                </Button>
              </Upload>
            </Form.Item>
          ) : (
            <Form.Item
              name="coverImage"
              label={intl.formatMessage({
                id: 'activity.form.cover',
                defaultMessage: 'Cover image URL',
              })}
              rules={[
                {
                  type: 'url',
                  message: intl.formatMessage({
                    id: 'activity.form.coverUrlInvalid',
                    defaultMessage: 'Please enter a valid image URL',
                  }),
                },
              ]}
            >
              <Input
                onChange={(e) => {
                  const nextUrl = e.target.value;
                  setCoverType('url');
                  setCoverPreview(nextUrl || undefined);
                  setPreviewLoading(!!nextUrl);
                  form.setFieldsValue({ coverType: 'url' });
                }}
              />
            </Form.Item>
          )}
          {coverPreview ? (
            <Form.Item
              label={intl.formatMessage({
                id: 'activity.form.coverPreview',
                defaultMessage: 'Preview',
              })}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: 260,
                  height: 140,
                  borderRadius: 12,
                  overflow: 'hidden',
                  background: '#f5f5f5',
                }}
              >
                <Image
                  src={coverPreview}
                  preview={false}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  placeholder={
                    previewLoading ? (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#f5f5f5',
                        }}
                      >
                        <Spin />
                      </div>
                    ) : undefined
                  }
                  onLoad={() => setPreviewLoading(false)}
                  onError={() => setPreviewLoading(false)}
                />
              </div>
            </Form.Item>
          ) : null}
          <Form.Item
            name="location"
            label={intl.formatMessage({
              id: 'activity.form.location',
              defaultMessage: 'Location',
            })}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="time"
            label={intl.formatMessage({
              id: 'activity.form.timeRange',
              defaultMessage: 'Start / End time',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'activity.form.timeRequired',
                  defaultMessage: 'Please select start and end time',
                }),
              },
            ]}
          >
            <DatePicker.RangePicker
              showTime
              style={{ width: '100%' }}
              disabledDate={(current) =>
                current && current.endOf('day').isBefore(dayjs())
              }
            />
          </Form.Item>
          <Form.Item
            name="maxParticipants"
            label={intl.formatMessage({
              id: 'activity.form.maxParticipants',
              defaultMessage: 'Max participants',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'activity.form.maxParticipantsRequired',
                  defaultMessage: 'Please enter max participants',
                }),
              },
              {
                type: 'number',
                min: 1,
                message: intl.formatMessage({
                  id: 'activity.form.minValue',
                  defaultMessage: 'Minimum value is 1',
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
              defaultMessage: 'Status',
            })}
            initialValue={ActivityStatus.Upcoming}
          >
            <Select>
              <Select.Option value={ActivityStatus.Ongoing}>
                {intl.formatMessage({
                  id: 'activity.status.ongoing',
                  defaultMessage: 'Ongoing',
                })}
              </Select.Option>
              <Select.Option value={ActivityStatus.Upcoming}>
                {intl.formatMessage({
                  id: 'activity.status.upcoming',
                  defaultMessage: 'Upcoming',
                })}
              </Select.Option>
              <Select.Option value={ActivityStatus.Ended}>
                {intl.formatMessage({
                  id: 'activity.status.ended',
                  defaultMessage: 'Ended',
                })}
              </Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={qrTitle}
        open={qrModalVisible}
        footer={null}
        onCancel={closeQrModal}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              position: 'relative',
              display: 'inline-block',
              marginBottom: 20,
            }}
          >
            {qrLoading && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: 8,
                  zIndex: 1,
                }}
              >
                <Spin />
              </div>
            )}
            <Image
              key={qrPayload}
              preview={false}
              src={createQrImageUrl(qrPayload)}
              alt={qrTitle}
              width={260}
              height={260}
              style={{ marginBottom: 20 }}
              onLoad={() => setQrLoading(false)}
              onError={() => setQrLoading(false)}
            />
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
};

export default ActivityManagement;
