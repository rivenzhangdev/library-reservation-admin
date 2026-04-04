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
import { useModel } from '@umijs/max';
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
import React, { useRef, useState } from 'react';

const { TextArea } = Input;

const STATUS_MAP: Record<number, { text: string; color: string }> = {
  1: { text: '待处理', color: 'default' },
  2: { text: '处理中', color: 'processing' },
  3: { text: '已解决', color: 'success' },
  4: { text: '已拒绝', color: 'error' },
};

const TYPE_MAP: Record<number, string> = {
  1: '功能建议',
  2: '问题上报',
  3: '投诉建议',
  4: '其他',
};
const URGENCY_MAP: Record<number, { text: string; color: string }> = {
  1: { text: '低', color: 'green' },
  2: { text: '中', color: 'blue' },
  3: { text: '高', color: 'orange' },
  4: { text: '紧急', color: 'red' },
};

interface FeedbackType {
  id: string;
  title: string;
  typeId?: number;
  typeName?: string;
  urgencyId?: number;
  urgencyName?: string;
  status?: number;
  createdAt?: string;
}

const FeedbackPage: React.FC = () => {
  const [form] = Form.useForm();
  const [processForm] = Form.useForm();
  const [replyText, setReplyText] = useState('');
  const { initialState } = useModel('@@initialState');
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
      message.success('处理成功');
      processForm.resetFields();
      await reloadDetail();
      actionRef.current?.reload();
    } catch (e: any) {
      message.error(e?.message || '接口异常');
    }
  };

  const handleAddComment = async () => {
    const id = detail?.id || detail?._id;
    if (!id || !replyText.trim()) return;
    try {
      await addComment(id, { content: replyText });
      message.success('回复成功');
      setReplyText('');
      await reloadDetail();
    } catch (e: any) {
      message.error(e?.message || '接口异常');
    }
  };

  const columns: ProColumns<FeedbackType>[] = [
    {
      title: '标题',
      dataIndex: 'title',
      render: (v, r) => <a onClick={() => openDetail(r.id)}>{v}</a>,
      ellipsis: true,
      width: 200,
    },
    {
      title: '类型',
      dataIndex: 'typeId',
      valueType: 'select',
      valueEnum: {
        1: { text: '功能建议' },
        2: { text: '问题上报' },
        3: { text: '投诉建议' },
        4: { text: '其他' },
      },
      render: (_, r) => r.typeName || (r.typeId ? TYPE_MAP[r.typeId] : '-'),
    },
    {
      title: '紧急度',
      dataIndex: 'urgencyId',
      valueType: 'select',
      valueEnum: {
        1: { text: '低' },
        2: { text: '中' },
        3: { text: '高' },
        4: { text: '紧急' },
      },
      render: (_, r) => {
        const u = URGENCY_MAP[r.urgencyId as number];
        return u ? <Tag color={u.color}>{u.text}</Tag> : r.urgencyName || '-';
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        1: { text: '待处理' },
        2: { text: '处理中' },
        3: { text: '已解决' },
        4: { text: '已拒绝' },
      },
      render: (_, r) => {
        const s = STATUS_MAP[r.status as number];
        return s ? <Tag color={s.color}>{s.text}</Tag> : String(r.status);
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '操作',
      key: 'option',
      valueType: 'option',
      width: 80,
      fixed: 'right',
      render: (_: any, record: any) => [
        <Button key="detail" type="link" onClick={() => openDetail(record.id)}>
          详情
        </Button>,
      ],
    },
  ];

  const onSubmit = async (values: any) => {
    try {
      await submitFeedback(values);
      message.success('提交成功');
      form.resetFields();
      actionRef.current?.reload();
    } catch (e: any) {
      message.error(e?.message || '提交接口异常');
    }
  };

  return (
    <PageContainer>
      {!isAdmin && (
        <Card title="提交反馈" style={{ marginBottom: 16 }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onSubmit}
            initialValues={{ typeId: 2, urgencyId: 2 }}
          >
            <Form.Item name="typeId" label="类型" rules={[{ required: true }]}>
              <Select>
                <Select.Option value={1}>功能建议</Select.Option>
                <Select.Option value={2}>问题上报</Select.Option>
                <Select.Option value={3}>投诉建议</Select.Option>
                <Select.Option value={4}>其他</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="urgencyId" label="紧急度">
              <Select>
                <Select.Option value={1}>低</Select.Option>
                <Select.Option value={2}>中</Select.Option>
                <Select.Option value={3}>高</Select.Option>
                <Select.Option value={4}>紧急</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item name="title" label="标题" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item
              name="description"
              label="描述"
              rules={[{ required: true }]}
            >
              <TextArea rows={4} />
            </Form.Item>
            <Form.Item name="contact" label="联系方式(选填)">
              <Input />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                提交
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

      <Card title={isAdmin ? '全部反馈' : '我的反馈'}>
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
            if (params.typeId) q.typeId = params.typeId;
            if (params.status) q.status = params.status;
            if (params.urgencyId) q.urgencyId = params.urgencyId;
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

      {/* 反馈详情弹窗 */}
      <Modal
        title="反馈详情"
        open={detailOpen}
        onCancel={() => {
          setDetailOpen(false);
          setDetail(null);
          processForm.resetFields();
          setReplyText('');
        }}
        footer={null}
        width={720}
        destroyOnClose
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
        ) : detail ? (
          <div>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="标题" span={2}>
                {detail.title}
              </Descriptions.Item>
              <Descriptions.Item label="类型">
                {detail.typeName || TYPE_MAP[detail.typeId] || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="紧急度">
                {(() => {
                  const u = URGENCY_MAP[detail.urgencyId];
                  return u ? (
                    <Tag color={u.color}>{u.text}</Tag>
                  ) : (
                    detail.urgencyName || '-'
                  );
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {(() => {
                  const s = STATUS_MAP[detail.status];
                  return s ? (
                    <Tag color={s.color}>{s.text}</Tag>
                  ) : (
                    String(detail.status)
                  );
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {detail.createdAt
                  ? new Date(detail.createdAt).toLocaleString()
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="提交人" span={2}>
                {detail.userId?.name || '游客'}
                {detail.userId?.studentId
                  ? ` (${detail.userId.studentId})`
                  : ''}
                {detail.contact ? ` | 联系方式: ${detail.contact}` : ''}
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {detail.description}
                </div>
              </Descriptions.Item>
              {Array.isArray(detail.images) && detail.images.length > 0 && (
                <Descriptions.Item label="图片" span={2}>
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
                              title="确认从该反馈中移除该图片的关联？此操作不会立即删除存储文件，需在“上传管理”中由管理员确认并删除。"
                              onConfirm={async () => {
                                try {
                                  const res: any = await deleteFeedbackImage(
                                    detail.id || detail._id,
                                    { url: src },
                                  );
                                  if (res?.success) {
                                    message.success('已解除关联');
                                    reloadDetail();
                                  } else
                                    message.error(res?.message || '操作失败');
                                } catch (e: any) {
                                  message.error(e?.message || '接口异常');
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
            <div style={{ marginTop: 16 }}>
              <h4>处理记录</h4>
              {Array.isArray(detail.comments) && detail.comments.length > 0 ? (
                <Timeline
                  items={detail.comments.map((c: any) => ({
                    children: (
                      <div>
                        <div>
                          <strong>{c.operator}</strong>
                          {c.isOfficial && (
                            <Tag color="blue" style={{ marginLeft: 8 }}>
                              官方
                            </Tag>
                          )}
                          <span style={{ color: '#999', marginLeft: 8 }}>
                            {new Date(c.date).toLocaleString()}
                          </span>
                        </div>
                        <div style={{ marginTop: 4 }}>{c.content}</div>
                      </div>
                    ),
                  }))}
                />
              ) : (
                <div style={{ color: '#999' }}>暂无处理记录</div>
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
                  <h4 style={{ marginBottom: 12 }}>处理反馈</h4>
                  <Form
                    form={processForm}
                    onFinish={handleProcess}
                    initialValues={{ status: detail.status || 2 }}
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
                        label="状态"
                        rules={[{ required: true }]}
                        style={{ marginBottom: 0 }}
                      >
                        <Select style={{ width: 120 }}>
                          <Select.Option value={2}>处理中</Select.Option>
                          <Select.Option value={3}>已解决</Select.Option>
                          <Select.Option value={4}>已拒绝</Select.Option>
                        </Select>
                      </Form.Item>
                      <Form.Item
                        name="reply"
                        label="处理意见"
                        rules={[{ required: true, message: '请填写处理意见' }]}
                        style={{ flex: 1, minWidth: 200, marginBottom: 0 }}
                      >
                        <Input placeholder="请输入处理意见" />
                      </Form.Item>
                      <Form.Item style={{ marginBottom: 0 }}>
                        <Button type="primary" htmlType="submit">
                          提交处理
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
                  <h4 style={{ marginBottom: 12 }}>添加回复</h4>
                  <div
                    style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}
                  >
                    <TextArea
                      rows={3}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="输入回复内容..."
                      style={{ flex: 1 }}
                    />
                    <Button
                      type="primary"
                      onClick={handleAddComment}
                      disabled={!replyText.trim()}
                      style={{ flexShrink: 0, alignSelf: 'flex-end' }}
                    >
                      发送
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
