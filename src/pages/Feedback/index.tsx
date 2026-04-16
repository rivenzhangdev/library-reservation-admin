import { Roles } from '@/constants/roles';
import {
  addComment,
  deleteFeedbackImage,
  getAllFeedbacks,
  getFeedbackDetail,
  getMyFeedbacks,
  processFeedback,
  submitFeedback,
} from '@/services/library/feedback';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl, useModel } from '@umijs/max';
import {
  Button,
  Card,
  Descriptions,
  Form,
  Image,
  Input,
  message,
  Modal,
  Popconfirm,
  Select,
  Tag,
  Timeline,
} from 'antd';
import dayjs from 'dayjs';
import React, { useRef, useState } from 'react';

const { TextArea } = Input;

const STATUS_COLOR_MAP: Record<number, string> = {
  1: 'default',
  2: 'processing',
  3: 'success',
  4: 'error',
};

const URGENCY_COLOR_MAP: Record<number, string> = {
  1: 'green',
  2: 'blue',
  3: 'orange',
  4: 'red',
};

interface FeedbackType {
  id: string;
  title: string;
  typeId?: number;
  typeName?: string;
  urgencyId?: number;
  urgencyName?: string;
  status?: number;
  statusName?: string;
  createdAt?: string;
  updatedByName?: string;
  updatedBy?: { name?: string; username?: string };
  commentsCount?: number;
}

const FeedbackPage: React.FC = () => {
  const [form] = Form.useForm();
  const [processForm] = Form.useForm();
  const [replyText, setReplyText] = useState('');
  const { initialState } = useModel('@@initialState');
  const intl = useIntl();
  const isAdmin = initialState?.currentUser?.role === Roles.ADMIN;
  const actionRef = useRef<ActionType>();

  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const openDetail = async (id: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res: any = await getFeedbackDetail(id);
      setDetail(res.data);
    } catch {
      /* ignore */
    }
    setDetailLoading(false);
  };

  const reloadDetail = async () => {
    if (!detail) return;
    const id = detail.id || detail._id;
    try {
      const res: any = await getFeedbackDetail(id);
      setDetail(res.data);
    } catch {
      /* ignore */
    }
  };

  const handleProcess = async (values: any) => {
    const id = detail?.id || detail?._id;
    if (!id) return;
    try {
      await processFeedback(id, { status: values.status, reply: values.reply });
      message.success(
        intl.formatMessage({
          id: 'feedback.processSuccess',
          defaultMessage: 'Processed successfully',
        }),
      );
      processForm.resetFields();
      await reloadDetail();
      actionRef.current?.reload();
    } catch (e: any) {
      message.error(
        e?.message ||
          intl.formatMessage({
            id: 'feedback.apiError',
            defaultMessage: 'API error',
          }),
      );
    }
  };

  const getEffectiveFeedbackStatus = (feedback: any) => {
    const rawStatus = Number(feedback?.status);
    const commentsCount = Number(
      feedback?.commentsCount ||
        (Array.isArray(feedback?.comments) ? feedback.comments.length : 0),
    );
    const hasRecords = commentsCount > 0;
    if (hasRecords && rawStatus === 1) {
      return 2;
    }
    return rawStatus || 1;
  };

  const handleAddComment = async () => {
    const id = detail?.id || detail?._id;
    if (!id || !replyText.trim()) return;
    try {
      await addComment(id, { content: replyText });
      message.success(
        intl.formatMessage({
          id: 'feedback.replySuccess',
          defaultMessage: 'Reply sent',
        }),
      );
      setReplyText('');
      await reloadDetail();
    } catch (e: any) {
      message.error(
        e?.message ||
          intl.formatMessage({
            id: 'feedback.apiError',
            defaultMessage: 'API error',
          }),
      );
    }
  };

  const columns: ProColumns<FeedbackType>[] = [
    {
      title: intl.formatMessage({
        id: 'feedback.field.title',
        defaultMessage: 'Title',
      }),
      dataIndex: 'title',
      render: (v, r) => <a onClick={() => openDetail(r.id)}>{v}</a>,
      ellipsis: true,
      width: 200,
    },
    {
      title: intl.formatMessage({
        id: 'feedback.field.type',
        defaultMessage: 'Type',
      }),
      dataIndex: 'typeId',
      valueType: 'select',
      valueEnum: {
        1: { text: intl.formatMessage({ id: 'feedback.type.1' }) },
        2: { text: intl.formatMessage({ id: 'feedback.type.2' }) },
        3: { text: intl.formatMessage({ id: 'feedback.type.3' }) },
        4: { text: intl.formatMessage({ id: 'feedback.type.4' }) },
      },
      render: (_, r) =>
        r.typeName ||
        (r.typeId
          ? intl.formatMessage(
              { id: `feedback.type.${r.typeId}`, defaultMessage: 'Type {id}' },
              { id: r.typeId },
            )
          : '-'),
    },
    {
      title: intl.formatMessage({
        id: 'feedback.field.urgency',
        defaultMessage: 'Urgency',
      }),
      dataIndex: 'urgencyId',
      valueType: 'select',
      valueEnum: {
        1: { text: intl.formatMessage({ id: 'feedback.urgency.1' }) },
        2: { text: intl.formatMessage({ id: 'feedback.urgency.2' }) },
        3: { text: intl.formatMessage({ id: 'feedback.urgency.3' }) },
        4: { text: intl.formatMessage({ id: 'feedback.urgency.4' }) },
      },
      render: (_, r) => {
        const id = Number(r.urgencyId);
        const color = URGENCY_COLOR_MAP[id];
        const text = intl.formatMessage(
          { id: `feedback.urgency.${id}`, defaultMessage: 'Urgency {id}' },
          { id },
        );
        return id && color ? (
          <Tag color={color}>{text}</Tag>
        ) : (
          r.urgencyName || '-'
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'feedback.form.status',
        defaultMessage: 'Status',
      }),
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        1: { text: intl.formatMessage({ id: 'feedback.status.1' }) },
        2: { text: intl.formatMessage({ id: 'feedback.status.2' }) },
        3: { text: intl.formatMessage({ id: 'feedback.status.3' }) },
        4: { text: intl.formatMessage({ id: 'feedback.status.4' }) },
      },
      render: (_, r) => {
        const id = getEffectiveFeedbackStatus(r);
        const color = STATUS_COLOR_MAP[id];
        const text = intl.formatMessage(
          { id: `feedback.status.${id}`, defaultMessage: 'Status {id}' },
          { id },
        );
        return id && color ? (
          <Tag color={color}>{text}</Tag>
        ) : (
          r.statusName || String(r.status || '-')
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
        id: 'feedback.field.createdAt',
        defaultMessage: 'Created at',
      }),
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      search: false,
    },
    {
      title: intl.formatMessage({
        id: 'common.action',
        defaultMessage: 'Actions',
      }),
      key: 'option',
      valueType: 'option',
      width: 80,
      fixed: 'right',
      render: (_: any, record: any) => [
        <Button key="detail" type="link" onClick={() => openDetail(record.id)}>
          {intl.formatMessage({ id: 'common.view', defaultMessage: 'Details' })}
        </Button>,
      ],
    },
  ];

  const onSubmit = async (values: any) => {
    try {
      await submitFeedback(values);
      message.success(
        intl.formatMessage({
          id: 'feedback.submitSuccess',
          defaultMessage: 'Submitted successfully',
        }),
      );
      form.resetFields();
      actionRef.current?.reload();
    } catch (e: any) {
      message.error(
        e?.message ||
          intl.formatMessage({
            id: 'feedback.apiError',
            defaultMessage: 'Submission API error',
          }),
      );
    }
  };

  return (
    <PageContainer>
      {!isAdmin && (
        <Card
          title={intl.formatMessage({
            id: 'feedback.submitCardTitle',
            defaultMessage: 'Submit Feedback',
          })}
          style={{ marginBottom: 16 }}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={onSubmit}
            initialValues={{ typeId: 2, urgencyId: 2 }}
          >
            <Form.Item
              name="typeId"
              label={intl.formatMessage({
                id: 'feedback.field.type',
                defaultMessage: 'Type',
              })}
              rules={[{ required: true }]}
            >
              <Select>
                <Select.Option value={1}>
                  {intl.formatMessage({
                    id: 'feedback.type.1',
                    defaultMessage: 'Feature request',
                  })}
                </Select.Option>
                <Select.Option value={2}>
                  {intl.formatMessage({
                    id: 'feedback.type.2',
                    defaultMessage: 'Bug report',
                  })}
                </Select.Option>
                <Select.Option value={3}>
                  {intl.formatMessage({
                    id: 'feedback.type.3',
                    defaultMessage: 'Complaint',
                  })}
                </Select.Option>
                <Select.Option value={4}>
                  {intl.formatMessage({
                    id: 'feedback.type.4',
                    defaultMessage: 'Other',
                  })}
                </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="urgencyId"
              label={intl.formatMessage({
                id: 'feedback.field.urgency',
                defaultMessage: 'Urgency',
              })}
            >
              <Select>
                <Select.Option value={1}>
                  {intl.formatMessage({
                    id: 'feedback.urgency.1',
                    defaultMessage: 'Low',
                  })}
                </Select.Option>
                <Select.Option value={2}>
                  {intl.formatMessage({
                    id: 'feedback.urgency.2',
                    defaultMessage: 'Medium',
                  })}
                </Select.Option>
                <Select.Option value={3}>
                  {intl.formatMessage({
                    id: 'feedback.urgency.3',
                    defaultMessage: 'High',
                  })}
                </Select.Option>
                <Select.Option value={4}>
                  {intl.formatMessage({
                    id: 'feedback.urgency.4',
                    defaultMessage: 'Urgent',
                  })}
                </Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="title"
              label={intl.formatMessage({
                id: 'feedback.field.title',
                defaultMessage: 'Title',
              })}
              rules={[{ required: true }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="description"
              label={intl.formatMessage({
                id: 'feedback.field.description',
                defaultMessage: 'Description',
              })}
              rules={[{ required: true }]}
            >
              <TextArea rows={4} />
            </Form.Item>
            <Form.Item
              name="contact"
              label={intl.formatMessage({
                id: 'feedback.field.contact',
                defaultMessage: 'Contact (optional)',
              })}
            >
              <Input />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                {intl.formatMessage({
                  id: 'common.submit',
                  defaultMessage: 'Submit',
                })}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

      <Card
        title={
          isAdmin
            ? intl.formatMessage({
                id: 'feedback.all',
                defaultMessage: 'All Feedback',
              })
            : intl.formatMessage({
                id: 'feedback.mine',
                defaultMessage: 'My Feedback',
              })
        }
      >
        <ProTable<FeedbackType>
          actionRef={actionRef}
          rowKey="id"
          scroll={{ x: 800 }}
          search={{ labelWidth: 'auto', defaultCollapsed: false }}
          pagination={{ pageSize: 10 }}
          request={async (params) => {
            const p = Number(params.current || 1);
            const l = Number(params.pageSize || 10);
            const q: any = { page: p, limit: l };
            if (params.title) q.title = params.title;
            if (params.typeId !== undefined && params.typeId !== '')
              q.typeId = Number(params.typeId);
            if (params.status !== undefined && params.status !== '')
              q.status = Number(params.status);
            if (params.urgencyId !== undefined && params.urgencyId !== '')
              q.urgencyId = Number(params.urgencyId);
            try {
              const res: any = isAdmin
                ? await getAllFeedbacks(q)
                : await getMyFeedbacks(q);
              const raw = res?.data || {};
              const list = (raw.feedbacks || raw.list || []).map(
                (item: any) => ({ ...item, id: item.id || item._id }),
              );
              return {
                data: list,
                success: res?.success !== false,
                total: raw.total || 0,
              };
            } catch (e) {
              return { data: [], success: false, total: 0 };
            }
          }}
          columns={columns}
        />
      </Card>

      {/* Feedback details modal */}
      <Modal
        title={intl.formatMessage({
          id: 'feedback.detailTitle',
          defaultMessage: 'Feedback Details',
        })}
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false);
          setDetail(null);
          processForm.resetFields();
          setReplyText('');
        }}
        footer={null}
        width={840}
        destroyOnClose
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            {intl.formatMessage({
              id: 'common.loading',
              defaultMessage: 'Loading',
            })}
          </div>
        ) : detail ? (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item
                label={intl.formatMessage({
                  id: 'feedback.field.title',
                  defaultMessage: 'Title',
                })}
                span={2}
              >
                {detail.title}
              </Descriptions.Item>
              <Descriptions.Item
                label={intl.formatMessage({
                  id: 'feedback.field.type',
                  defaultMessage: 'Type',
                })}
              >
                {detail.typeName ||
                  (detail.typeId
                    ? intl.formatMessage(
                        {
                          id: `feedback.type.${detail.typeId}`,
                          defaultMessage: 'Type {id}',
                        },
                        { id: detail.typeId },
                      )
                    : '-')}
              </Descriptions.Item>
              <Descriptions.Item
                label={intl.formatMessage({
                  id: 'feedback.field.urgency',
                  defaultMessage: 'Urgency',
                })}
              >
                {(() => {
                  const id = Number(detail.urgencyId);
                  const color = URGENCY_COLOR_MAP[id];
                  const text = intl.formatMessage(
                    {
                      id: `feedback.urgency.${id}`,
                      defaultMessage: 'Urgency {id}',
                    },
                    { id },
                  );
                  return id && color ? (
                    <Tag color={color}>{text}</Tag>
                  ) : (
                    detail.urgencyName || '-'
                  );
                })()}
              </Descriptions.Item>
              <Descriptions.Item
                label={intl.formatMessage({
                  id: 'feedback.form.status',
                  defaultMessage: 'Status',
                })}
              >
                {(() => {
                  const id = getEffectiveFeedbackStatus(detail);
                  const color = STATUS_COLOR_MAP[id];
                  const text = intl.formatMessage(
                    {
                      id: `feedback.status.${id}`,
                      defaultMessage: 'Status {id}',
                    },
                    { id },
                  );
                  return id && color ? (
                    <Tag color={color}>{text}</Tag>
                  ) : (
                    detail.statusName || String(detail.status || '-')
                  );
                })()}
              </Descriptions.Item>
              <Descriptions.Item
                label={intl.formatMessage({
                  id: 'feedback.field.createdAt',
                  defaultMessage: 'Created at',
                })}
              >
                {detail.createdAt
                  ? dayjs(detail.createdAt).format('YYYY-MM-DD HH:mm')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item
                label={intl.formatMessage({
                  id: 'feedback.field.submitter',
                  defaultMessage: 'Submitter',
                })}
                span={2}
              >
                {detail.userName ||
                  intl.formatMessage({
                    id: 'right.guest',
                    defaultMessage: 'Guest',
                  })}
                {detail.userId?.studentId
                  ? ` (${detail.userId.studentId})`
                  : ''}
                {detail.contact
                  ? ` | ${intl.formatMessage({
                      id: 'feedback.field.contact',
                      defaultMessage: 'Contact',
                    })}: ${detail.contact}`
                  : ''}
              </Descriptions.Item>
              <Descriptions.Item
                label={intl.formatMessage({
                  id: 'feedback.field.description',
                  defaultMessage: 'Description',
                })}
                span={2}
              >
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {detail.description}
                </div>
              </Descriptions.Item>
              {Array.isArray(detail.images) && detail.images.length > 0 && (
                <Descriptions.Item
                  label={intl.formatMessage({
                    id: 'feedback.field.images',
                    defaultMessage: 'Images',
                  })}
                  span={2}
                >
                  <Image.PreviewGroup>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {detail.images.map((src: string) => (
                        <div
                          key={src}
                          style={{
                            position: 'relative',
                            border: '1px solid #f0f0f0',
                            borderRadius: 4,
                            padding: 4,
                            background: '#fafafa',
                          }}
                        >
                          <Image
                            width={80}
                            height={80}
                            src={src}
                            style={{ objectFit: 'cover', borderRadius: 4 }}
                            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F/PQAJpAN42gNMJAAAAABJRU5ErkJggg=="
                          />
                          {isAdmin && (
                            <Popconfirm
                              title={intl.formatMessage({
                                id: 'feedback.removeImageConfirm',
                                defaultMessage:
                                  'Confirm removing this image association? This will not delete the stored file immediately; admin must remove it in Upload Management.',
                              })}
                              onConfirm={async () => {
                                try {
                                  const res: any = await deleteFeedbackImage(
                                    detail.id || detail._id,
                                    { url: src },
                                  );
                                  if (res?.success) {
                                    message.success(
                                      intl.formatMessage({
                                        id: 'common.deleteSuccessRefresh',
                                        defaultMessage: 'Association removed',
                                      }),
                                    );
                                    reloadDetail();
                                  } else
                                    message.error(
                                      res?.message ||
                                        intl.formatMessage({
                                          id: 'common.operationFailed',
                                          defaultMessage: 'Operation failed',
                                        }),
                                    );
                                } catch (e: any) {
                                  message.error(
                                    e?.message ||
                                      intl.formatMessage({
                                        id: 'feedback.apiError',
                                        defaultMessage: 'API error',
                                      }),
                                  );
                                }
                              }}
                            >
                              <Button
                                size="small"
                                danger
                                type="text"
                                style={{
                                  position: 'absolute',
                                  top: -8,
                                  right: -8,
                                  width: 20,
                                  height: 20,
                                  fontSize: 12,
                                  padding: 0,
                                  lineHeight: '20px',
                                  minWidth: 20,
                                  borderRadius: '50%',
                                  background: '#fff',
                                  boxShadow: '0 1px 3px rgba(0,0,0,.2)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                ×
                              </Button>
                            </Popconfirm>
                          )}
                        </div>
                      ))}
                    </div>
                  </Image.PreviewGroup>
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* 处理记录 */}
            <div style={{ marginTop: 16, width: '100%' }}>
              <h4>
                {intl.formatMessage({
                  id: 'feedback.records',
                  defaultMessage: 'Processing records',
                })}
              </h4>
              {Array.isArray(detail.comments) && detail.comments.length > 0 ? (
                <div style={{ width: '100%', padding: '20px 0' }}>
                  <Timeline
                    style={{ width: '100%' }}
                    items={detail.comments.map((c: any) => ({
                      children: (
                        <div>
                          <div>
                            <strong>{c.operator}</strong>
                            {c.isOfficial && (
                              <Tag color="blue" style={{ marginLeft: 8 }}>
                                {intl.formatMessage({
                                  id: 'feedback.official',
                                  defaultMessage: 'Official',
                                })}
                              </Tag>
                            )}
                            <span style={{ color: '#999', marginLeft: 8 }}>
                              {dayjs(c.date).format('YYYY-MM-DD HH:mm')}
                            </span>
                          </div>
                          <div style={{ marginTop: 4 }}>{c.content}</div>
                        </div>
                      ),
                    }))}
                  />
                </div>
              ) : (
                <div style={{ color: '#999' }}>
                  {intl.formatMessage({
                    id: 'feedback.noRecords',
                    defaultMessage: 'No records',
                  })}
                </div>
              )}
            </div>

            {/* 管理员操作区 */}
            {isAdmin && (
              <>
                <div
                  style={{
                    marginTop: 20,
                    borderTop: '1px solid #f0f0f0',
                    paddingTop: 16,
                  }}
                >
                  <h4 style={{ marginBottom: 12 }}>
                    {intl.formatMessage({
                      id: 'feedback.processFeedback',
                      defaultMessage: 'Process feedback',
                    })}
                  </h4>
                  <Form
                    form={processForm}
                    onFinish={handleProcess}
                    initialValues={{
                      status: getEffectiveFeedbackStatus(detail),
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: 12,
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                      }}
                    >
                      <Form.Item
                        name="status"
                        label={intl.formatMessage({
                          id: 'feedback.form.status',
                          defaultMessage: 'Status',
                        })}
                        rules={[{ required: true }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Select style={{ width: 120 }}>
                          <Select.Option value={1}>
                            {intl.formatMessage({
                              id: 'feedback.status.1',
                              defaultMessage: 'Pending',
                            })}
                          </Select.Option>
                          <Select.Option value={2}>
                            {intl.formatMessage({
                              id: 'feedback.status.2',
                              defaultMessage: 'Processing',
                            })}
                          </Select.Option>
                          <Select.Option value={3}>
                            {intl.formatMessage({
                              id: 'feedback.status.3',
                              defaultMessage: 'Resolved',
                            })}
                          </Select.Option>
                          <Select.Option value={4}>
                            {intl.formatMessage({
                              id: 'feedback.status.4',
                              defaultMessage: 'Rejected',
                            })}
                          </Select.Option>
                        </Select>
                      </Form.Item>
                      <Form.Item
                        name="reply"
                        label={intl.formatMessage({
                          id: 'feedback.form.reply',
                          defaultMessage: 'Processing remarks',
                        })}
                        rules={[
                          {
                            required: true,
                            message: intl.formatMessage({
                              id: 'feedback.form.replyRequired',
                              defaultMessage: 'Please enter processing remarks',
                            }),
                          },
                        ]}
                        style={{ flex: 1, minWidth: 200, marginBottom: 0 }}
                      >
                        <Input
                          placeholder={intl.formatMessage({
                            id: 'feedback.form.replyPlaceholder',
                            defaultMessage: 'Please enter processing remarks',
                          })}
                        />
                      </Form.Item>
                      <Form.Item style={{ marginBottom: 0 }}>
                        <Button type="primary" htmlType="submit">
                          {intl.formatMessage({
                            id: 'feedback.form.submit',
                            defaultMessage: 'Submit',
                          })}
                        </Button>
                      </Form.Item>
                    </div>
                  </Form>
                </div>

                <div
                  style={{
                    marginTop: 20,
                    borderTop: '1px solid #f0f0f0',
                    paddingTop: 16,
                  }}
                >
                  <h4 style={{ marginBottom: 12 }}>
                    {intl.formatMessage({
                      id: 'feedback.addReply',
                      defaultMessage: 'Add reply',
                    })}
                  </h4>
                  <div
                    style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}
                  >
                    <TextArea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={intl.formatMessage({
                        id: 'feedback.replyPlaceholder',
                        defaultMessage: 'Enter reply...',
                      })}
                      style={{ flex: 1 }}
                    />
                    <Button
                      type="primary"
                      onClick={handleAddComment}
                      disabled={!replyText.trim()}
                      style={{ flexShrink: 0, alignSelf: 'flex-end' }}
                    >
                      {intl.formatMessage({
                        id: 'feedback.send',
                        defaultMessage: 'Send',
                      })}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : null}
      </Modal>
    </PageContainer>
  );
};

export default FeedbackPage;
