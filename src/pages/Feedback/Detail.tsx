import { Roles } from '@/constants/roles';
import {
  deleteFeedbackImage,
  getFeedbackDetail,
  processFeedback,
} from '@/services/library/feedback';
import { history, useParams } from '@umijs/max';
import {
  Button,
  Card,
  Descriptions,
  Form,
  Image,
  Input,
  Popconfirm,
  Select,
  Space,
  message,
} from 'antd';
import React, { useEffect, useState } from 'react';

const DetailPage: React.FC = () => {
  const params = useParams() as any;
  const id = params.id as string;
  const [data, setData] = useState<any>(null);
  // loading state removed: not used in UI
  const [form] = Form.useForm();

  async function load() {
    try {
      const res: any = await getFeedbackDetail(id);
      setData(res.data);
    } catch (e: any) {
      message.error(e?.message || '加载详情失败');
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const onFinish = async (vals: any) => {
    try {
      await processFeedback(id, { status: vals.status, reply: vals.reply });
      message.success('处理成功');
      load();
    } catch (e: any) {
      message.error(e?.message || '接口异常');
    }
  };

  if (!data) return <div>加载中...</div>;

  return (
    <div>
      <Card
        title="反馈详情"
        extra={
          <Space>
            <Button onClick={() => history.back()}>返回</Button>
          </Space>
        }
      >
        <Descriptions column={1} bordered>
          <Descriptions.Item label="标题">{data.title}</Descriptions.Item>
          <Descriptions.Item label="类型">
            {data.typeName || data.typeId}
          </Descriptions.Item>
          <Descriptions.Item label="紧急度">
            {data.urgencyName || data.urgencyId || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="提交人">
            {data.userId?.name || '游客'}
          </Descriptions.Item>
          <Descriptions.Item label="联系方式">
            {data.contact || '无'}
          </Descriptions.Item>
          <Descriptions.Item label="描述">{data.description}</Descriptions.Item>
          <Descriptions.Item label="图片">
            <Space>
              {Array.isArray(data.images) && data.images.length > 0 ? (
                data.images.map((src: string) => {
                  const currentUserRaw = localStorage.getItem('currentUser');
                  let isAdmin = false;
                  try {
                    const cu = currentUserRaw
                      ? JSON.parse(currentUserRaw)
                      : null;
                    isAdmin = cu?.role === Roles.ADMIN;
                  } catch (e) {
                    isAdmin = false;
                  }
                  return (
                    <div
                      key={src}
                      style={{ display: 'inline-block', textAlign: 'center' }}
                    >
                      <Image width={120} src={src} />
                      {isAdmin ? (
                        <div style={{ marginTop: 6 }}>
                          <Popconfirm
                            title="确认从该反馈中移除该图片的关联？此操作不会立即删除存储文件，需在“上传管理”中由管理员确认并删除。"
                            onConfirm={async () => {
                              try {
                                await deleteFeedbackImage(data.id, {
                                  url: src,
                                });
                                message.success('已解除关联');
                                load();
                              } catch (e: any) {
                                message.error(e?.message || '接口异常');
                              }
                            }}
                          >
                            <Button size="small" danger>
                              移除关联
                            </Button>
                          </Popconfirm>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <span>无</span>
              )}
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="当前状态">
            {data.status === undefined
              ? '-'
              : data.status === 1
              ? '待处理'
              : data.status === 2
              ? '处理中'
              : data.status === 3
              ? '已解决'
              : data.status === 4
              ? '已拒绝'
              : data.status}
          </Descriptions.Item>
          <Descriptions.Item label="处理原因">
            {data.processedReason || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="处理记录">
            {Array.isArray(data.comments) && data.comments.length > 0 ? (
              data.comments.map((c: any, idx: number) => (
                <div key={idx} style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 600 }}>
                    {c.operator}{' '}
                    {c.isOfficial ? (
                      <span
                        style={{
                          color: '#888',
                          fontWeight: 400,
                          marginLeft: 8,
                        }}
                      >
                        （官方）
                      </span>
                    ) : null}
                  </div>
                  <div style={{ marginTop: 6 }}>{c.content}</div>
                  <div style={{ color: '#888', marginTop: 6 }}>
                    {new Date(c.date).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div>暂无处理记录</div>
            )}
          </Descriptions.Item>
        </Descriptions>

        <Card title="处理反馈" style={{ marginTop: 16 }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ status: data.status || 2 }}
          >
            <Form.Item name="status" label="状态" rules={[{ required: true }]}>
              <Select>
                <Select.Option value={2}>处理中</Select.Option>
                <Select.Option value={3}>已解决</Select.Option>
                <Select.Option value={4}>已拒绝</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="reply"
              label="处理意见"
              rules={[{ required: true, message: '请填写处理意见' }]}
            >
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                提交处理
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Card>
    </div>
  );
};

export default DetailPage;
