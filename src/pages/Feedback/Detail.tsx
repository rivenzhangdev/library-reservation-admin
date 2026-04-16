import { Roles } from '@/constants/roles';
import {
  deleteFeedbackImage,
  getFeedbackDetail,
  processFeedback,
} from '@/services/library/feedback';
import { history, useIntl, useParams } from '@umijs/max';
import {
  Button,
  Card,
  Descriptions,
  Form,
  Image,
  Input,
  message,
  Popconfirm,
  Select,
  Space,
  Tag,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

const DetailPage: React.FC = () => {
  const params = useParams() as any;
  const id = params.id as string;
  const intl = useIntl();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const isAdmin = (() => {
    try {
      const raw = localStorage.getItem('currentUser');
      const cu = raw ? JSON.parse(raw) : null;
      return cu?.role === Roles.ADMIN;
    } catch (e) {
      return false;
    }
  })();

  async function load() {
    setLoading(true);
    try {
      const res: any = await getFeedbackDetail(id);
      setData(res?.data || null);
    } catch (e: any) {
      message.error(
        intl.formatMessage({
          id: 'feedback.loadFailed',
          defaultMessage: 'Failed to load details',
        }),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const onFinish = async (vals: any) => {
    try {
      await processFeedback(id, { status: vals.status, reply: vals.reply });
      message.success(
        intl.formatMessage({
          id: 'feedback.processSuccess',
          defaultMessage: 'Processed successfully',
        }),
      );
      load();
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

  if (loading)
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        {intl.formatMessage({
          id: 'common.loading',
          defaultMessage: 'Loading',
        })}
      </div>
    );
  if (!data) return null;

  return (
    <div>
      <Card
        title={intl.formatMessage({
          id: 'feedback.detailTitle',
          defaultMessage: 'Feedback Details',
        })}
        extra={
          <Space>
            <Button onClick={() => history.back()}>
              {intl.formatMessage({
                id: 'common.back',
                defaultMessage: 'Back',
              })}
            </Button>
          </Space>
        }
      >
        <Descriptions column={1} bordered>
          <Descriptions.Item
            label={intl.formatMessage({
              id: 'feedback.field.title',
              defaultMessage: 'Title',
            })}
          >
            {data.title}
          </Descriptions.Item>
          <Descriptions.Item
            label={intl.formatMessage({
              id: 'feedback.field.type',
              defaultMessage: 'Type',
            })}
          >
            {data.typeName || data.typeId}
          </Descriptions.Item>
          <Descriptions.Item
            label={intl.formatMessage({
              id: 'feedback.field.urgency',
              defaultMessage: 'Urgency',
            })}
          >
            {data.urgencyName || data.urgencyId || '-'}
          </Descriptions.Item>
          <Descriptions.Item
            label={intl.formatMessage({
              id: 'feedback.field.submitter',
              defaultMessage: 'Submitter',
            })}
          >
            {data.userName ||
              intl.formatMessage({
                id: 'right.guest',
                defaultMessage: 'Guest',
              })}
          </Descriptions.Item>
          <Descriptions.Item
            label={intl.formatMessage({
              id: 'feedback.field.contact',
              defaultMessage: 'Contact',
            })}
          >
            {data.contact ||
              intl.formatMessage({
                id: 'common.noData',
                defaultMessage: 'No data',
              })}
          </Descriptions.Item>
          <Descriptions.Item
            label={intl.formatMessage({
              id: 'feedback.field.description',
              defaultMessage: 'Description',
            })}
          >
            {data.description}
          </Descriptions.Item>
          {Array.isArray(data.images) && data.images.length > 0 && (
            <Descriptions.Item
              label={intl.formatMessage({
                id: 'feedback.field.images',
                defaultMessage: 'Images',
              })}
            >
              <Image.PreviewGroup>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {data.images.map((src: string) => (
                    <div key={src} style={{ position: 'relative' }}>
                      <Image width={120} src={src} />
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
                                data.id || data._id,
                                { url: src },
                              );
                              if (res?.success) {
                                message.success(
                                  intl.formatMessage({
                                    id: 'feedback.imageRemoved',
                                    defaultMessage: 'Association removed',
                                  }),
                                );
                                load();
                              } else {
                                message.error(
                                  res?.message ||
                                    intl.formatMessage({
                                      id: 'common.operationFailed',
                                      defaultMessage: 'Operation failed',
                                    }),
                                );
                              }
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
                            style={{ position: 'absolute', top: 4, right: 4 }}
                          >
                            {intl.formatMessage({
                              id: 'feedback.removeAssociation',
                              defaultMessage: 'Remove association',
                            })}
                          </Button>
                        </Popconfirm>
                      )}
                    </div>
                  ))}
                </div>
              </Image.PreviewGroup>
            </Descriptions.Item>
          )}

          <Descriptions.Item
            label={intl.formatMessage({
              id: 'feedback.field.currentStatus',
              defaultMessage: 'Current status',
            })}
          >
            {data.status === undefined
              ? '-'
              : intl.formatMessage({
                  id: `feedback.status.${data.status}`,
                  defaultMessage: String(data.status),
                })}
          </Descriptions.Item>

          <Descriptions.Item
            label={intl.formatMessage({
              id: 'feedback.form.reply',
              defaultMessage: 'Processing remarks',
            })}
          >
            {Array.isArray(data.comments) && data.comments.length > 0 ? (
              data.comments.map((c: any, idx: number) => (
                <div key={idx} style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 600 }}>
                    {c.operator}{' '}
                    {c.isOfficial && (
                      <Tag color="blue">
                        {intl.formatMessage({
                          id: 'feedback.official',
                          defaultMessage: 'Official',
                        })}
                      </Tag>
                    )}
                  </div>
                  <div style={{ marginTop: 6 }}>{c.content}</div>
                  <div style={{ color: '#888', marginTop: 6 }}>
                    {dayjs(c.date).format('YYYY-MM-DD HH:mm')}
                  </div>
                </div>
              ))
            ) : (
              <div>
                {intl.formatMessage({
                  id: 'common.noData',
                  defaultMessage: 'No data',
                })}
              </div>
            )}
          </Descriptions.Item>
        </Descriptions>

        {isAdmin && (
          <Card
            title={intl.formatMessage({
              id: 'feedback.processFeedback',
              defaultMessage: 'Process feedback',
            })}
            style={{ marginTop: 16 }}
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              initialValues={{
                status: [2, 3, 4].includes(Number(data.status))
                  ? Number(data.status)
                  : 2,
              }}
            >
              <Form.Item
                name="status"
                label={intl.formatMessage({
                  id: 'feedback.form.status',
                  defaultMessage: 'Status',
                })}
                rules={[{ required: true }]}
              >
                <Select>
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
              >
                <Input.TextArea rows={4} />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit">
                  {intl.formatMessage({
                    id: 'feedback.form.submit',
                    defaultMessage: 'Submit',
                  })}
                </Button>
              </Form.Item>
            </Form>
          </Card>
        )}
      </Card>
    </div>
  );
};

export default DetailPage;
