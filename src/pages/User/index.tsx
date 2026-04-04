import { Roles } from '@/constants/roles';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Avatar,
  Button,
  Form,
  Input,
  message,
  Modal,
  Select,
  Space,
  Switch,
  Tag,
  Upload,
} from 'antd';
import React, { useRef, useState } from 'react';
import {
  batchUpdateUserStatus,
  createUser,
  deleteUser,
  getUserList,
  updateUser,
  uploadImage,
} from '../../services/library/user';

/**
 * 用户数据类型
 */
interface UserType {
  id: string;
  username: string;
  avatar?: string;
  email: string;
  phone: string;
  studentId: string;
  name: string;
  role: string;
  creditScore: number;
  blacklisted: boolean;
  createdAt: string;
}

/**
 * 用户管理页面
 */
const UserManagement: React.FC = () => {
  const intl = useIntl();

  const actionRef = useRef<ActionType>();
  const [selectedRows, setSelectedRows] = useState<UserType[]>([]);
  const [batchModalVisible, setBatchModalVisible] = useState<boolean>(false);
  const [batchStatus, setBatchStatus] = useState<number>(0);
  const [batchForm] = Form.useForm();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<Partial<UserType> | null>(
    null,
  );
  const [form] = Form.useForm();

  /**
   * 删除用户
   */
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: intl.formatMessage({
        id: 'user.confirmDeleteTitle',
        defaultMessage: '确认删除',
      }),
      content: '确定要删除该用户吗？',
      onOk: () => {
        deleteUser(id)
          .then(() => {
            message.success('删除成功');
            actionRef.current?.reload?.();
          })
          .catch((e: any) => {
            message.error(e?.message || '删除失败');
          });
      },
    });
  };

  const columns: ProColumns<UserType>[] = [
    {
      title: intl.formatMessage({
        id: 'user.column.info',
        defaultMessage: '用户信息',
      }),
      dataIndex: 'username',
      width: 180,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar src={record.avatar} style={{ marginRight: 12 }}>
            {!record.avatar && record.name ? record.name.charAt(0) : null}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600 }}>{record.name}</div>
            <div style={{ color: '#999' }}>{record.username}</div>
          </div>
        </div>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'user.form.studentId',
        defaultMessage: '学号',
      }),
      dataIndex: 'studentId',
      width: 100,
    },
    {
      title: intl.formatMessage({
        id: 'user.form.email',
        defaultMessage: '邮箱',
      }),
      dataIndex: 'email',
      valueType: 'text',
      width: 160,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: 'user.form.phone',
        defaultMessage: '手机号',
      }),
      dataIndex: 'phone',
      width: 120,
    },
    {
      title: intl.formatMessage({
        id: 'user.form.role',
        defaultMessage: '角色',
      }),
      dataIndex: 'role',
      valueType: 'select',
      valueEnum: {
        [Roles.USER]: {
          text: intl.formatMessage({
            id: 'user.role.user',
            defaultMessage: '普通用户',
          }),
          status: 'Default',
        },
        [Roles.ADMIN]: {
          text: intl.formatMessage({
            id: 'user.role.admin',
            defaultMessage: '管理员',
          }),
          status: 'Success',
        },
      },
    },
    {
      title: intl.formatMessage({
        id: 'user.column.creditScore',
        defaultMessage: '信用分',
      }),
      dataIndex: 'creditScore',
      width: 90,
      sorter: true,
      render: (_, record) => (
        <Tag
          color={
            record.creditScore >= 80
              ? 'green'
              : record.creditScore >= 60
              ? 'orange'
              : 'red'
          }
        >
          {record.creditScore}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'credit.tab.blacklist',
        defaultMessage: '黑名单',
      }),
      dataIndex: 'blacklisted',
      valueType: 'switch',
      width: 100,
      render: (_, record) => (
        <Tag color={record.blacklisted ? 'red' : 'green'}>
          {record.blacklisted ? '是' : '否'}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'user.column.createdAt',
        defaultMessage: '创建时间',
      }),
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      width: 160,
      hideInSearch: true,
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
            onClick={() => {
              setEditingUser(record);
              form.setFieldsValue(record as any);
              setModalVisible(true);
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
        id: 'menu.user',
        defaultMessage: '用户管理',
      })}
    >
      <ProTable<UserType>
        headerTitle="用户列表"
        actionRef={actionRef}
        rowKey="id"
        scroll={{ x: 1100 }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
        toolBarRender={() => [
          <Button
            key="export"
            onClick={() => {
              if (!selectedRows || selectedRows.length === 0) {
                message.info('请先选择要导出的用户（复选框）');
                return;
              }
              // 导出为 CSV
              const header = [
                'id',
                'username',
                'name',
                'studentId',
                'email',
                'phone',
                'role',
                'creditScore',
                'blacklisted',
                'createdAt',
              ];
              const rows = selectedRows.map((r) =>
                header
                  .map((h) => JSON.stringify((r as any)[h] ?? ''))
                  .join(','),
              );
              const csv = [header.join(','), ...rows].join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `users_export_${Date.now()}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            {intl.formatMessage({
              id: 'user.export.csv',
              defaultMessage: '导出 CSV',
            })}
          </Button>,
          <Button
            key="batch"
            disabled={!selectedRows || selectedRows.length === 0}
            onClick={() => {
              batchForm.setFieldsValue({ status: String(batchStatus) });
              setBatchModalVisible(true);
            }}
          >
            {intl.formatMessage({
              id: 'user.batchSetStatus',
              defaultMessage: '批量设置状态',
            })}
          </Button>,
          <Button
            key="new"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setModalVisible(true)}
          >
            {intl.formatMessage({
              id: 'user.newUser',
              defaultMessage: '新建用户',
            })}
          </Button>,
        ]}
        rowSelection={{
          // 受控 selectedRowKeys，保证在调用 setSelectedRows([]) 后表格复选框会被清空
          selectedRowKeys: selectedRows.map((r) => r.id),
          onChange: (_, rows) => setSelectedRows(rows),
        }}
        request={async (params) => {
          try {
            const res: any = await getUserList(params);
            const raw = res?.data;
            let list: any[] = [];
            if (Array.isArray(raw)) list = raw;
            else if (Array.isArray(raw?.list)) list = raw.list;
            else if (Array.isArray(raw?.users)) list = raw.users;
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
        pagination={{
          pageSize: 10,
        }}
      />
      <Modal
        title={editingUser ? '编辑用户' : '新建用户'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingUser(null);
          form.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            // 如果 avatar 是 base64，先上传获取 URL
            if (
              values.avatar &&
              typeof values.avatar === 'string' &&
              values.avatar.startsWith('data:')
            ) {
              try {
                const uploadRes: any = await uploadImage(values.avatar);
                const avatarUrl =
                  uploadRes?.url ||
                  (uploadRes && uploadRes.data && uploadRes.data.url) ||
                  uploadRes;
                values.avatar = avatarUrl;
              } catch (e) {
                console.error('上传头像失败', e);
              }
            }
            if (editingUser && editingUser.id) {
              // 编辑时不发送密码字段（除非用户填写了新密码）
              if (!values.password) delete values.password;
              await updateUser(editingUser.id, values);
              message.success('更新成功');
            } else {
              await createUser(values);
              message.success('创建成功');
            }
            setModalVisible(false);
            setEditingUser(null);
            form.resetFields();
            actionRef.current?.reload?.();
          } catch (err: any) {
            if (err?.errorFields) return;
            message.error(err?.message || '操作失败');
          }
        }}
      >
        <Form
          form={form}
          initialValues={editingUser || { role: Roles.USER }}
          layout="vertical"
        >
          <Form.Item
            label={intl.formatMessage({
              id: 'user.form.avatar',
              defaultMessage: '头像',
            })}
          >
            <Upload
              listType="picture-card"
              showUploadList={false}
              beforeUpload={async (file) => {
                const getBase64 = (fileParam: File) =>
                  new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(fileParam);
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = (error) => reject(error);
                  });
                const base64 = await getBase64(file as File);
                form.setFieldsValue({ avatar: base64 });
                return false;
              }}
            >
              {form.getFieldValue('avatar') ? (
                <img
                  src={form.getFieldValue('avatar')}
                  alt="avatar"
                  style={{ width: '100%' }}
                />
              ) : (
                <div>
                  {intl.formatMessage({
                    id: 'user.upload',
                    defaultMessage: '上传',
                  })}
                </div>
              )}
            </Upload>
          </Form.Item>
          <Form.Item name="avatar" hidden>
            <Input />
          </Form.Item>
          <Form.Item
            name="username"
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
            name="name"
            label={intl.formatMessage({
              id: 'user.form.name',
              defaultMessage: '姓名',
            })}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="studentId"
            label={intl.formatMessage({
              id: 'user.form.studentId',
              defaultMessage: '学号',
            })}
            rules={[
              {
                pattern: /^[0-9A-Za-z_-]{4,20}$/,
                message: intl.formatMessage({
                  id: 'user.form.studentIdInvalid',
                  defaultMessage: '请输入有效学号',
                }),
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label={intl.formatMessage({
              id: 'user.form.email',
              defaultMessage: '邮箱',
            })}
            rules={[
              {
                type: 'email',
                message: intl.formatMessage({
                  id: 'user.form.emailInvalid',
                  defaultMessage: '请输入有效邮箱',
                }),
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label={intl.formatMessage({
              id: 'user.form.phone',
              defaultMessage: '手机号',
            })}
            rules={[
              {
                pattern: /^\d{10,15}$/,
                message: intl.formatMessage({
                  id: 'user.form.phoneInvalid',
                  defaultMessage: '请输入有效手机号',
                }),
              },
            ]}
          >
            <Input />
          </Form.Item>
          {!editingUser && (
            <Form.Item
              name="password"
              label={intl.formatMessage({
                id: 'user.form.password',
                defaultMessage: '密码',
              })}
              rules={[
                {
                  required: !editingUser,
                  message: intl.formatMessage({
                    id: 'user.form.passwordRequired',
                    defaultMessage: '请输入密码',
                  }),
                },
                {
                  min: 6,
                  message: intl.formatMessage({
                    id: 'user.form.passwordMin',
                    defaultMessage: '密码至少6位',
                  }),
                },
              ]}
            >
              <Input.Password />
            </Form.Item>
          )}
          {editingUser && (
            <Form.Item
              name="password"
              label={intl.formatMessage({
                id: 'user.form.newPassword',
                defaultMessage: '新密码（留空则不修改）',
              })}
              rules={[
                {
                  min: 6,
                  message: intl.formatMessage({
                    id: 'user.form.passwordMin',
                    defaultMessage: '密码至少6位',
                  }),
                },
              ]}
            >
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item
            name="role"
            label={intl.formatMessage({
              id: 'user.form.role',
              defaultMessage: '角色',
            })}
          >
            <Select>
              <Select.Option value={Roles.USER}>
                {intl.formatMessage({
                  id: 'user.role.user',
                  defaultMessage: '普通用户',
                })}
              </Select.Option>
              <Select.Option value={Roles.ADMIN}>
                {intl.formatMessage({
                  id: 'user.role.admin',
                  defaultMessage: '管理员',
                })}
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="blacklisted"
            label={intl.formatMessage({
              id: 'credit.tab.blacklist',
              defaultMessage: '黑名单',
            })}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title={intl.formatMessage({
          id: 'user.batchModal.title',
          defaultMessage: '批量设置用户状态',
        })}
        open={batchModalVisible}
        forceRender
        onCancel={() => {
          setBatchModalVisible(false);
          batchForm.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await batchForm.validateFields();
            const statusNum = Number(values.status);
            const ids = selectedRows.map((r) => r.id);
            await batchUpdateUserStatus(ids, statusNum);
            message.success('批量更新成功');
            setBatchModalVisible(false);
            setSelectedRows([]);
            batchForm.resetFields();
            actionRef.current?.reload?.();
          } catch (e: any) {
            message.error(e?.message || '批量更新失败');
          }
        }}
      >
        <Form
          layout="vertical"
          form={batchForm}
          initialValues={{ status: String(batchStatus) }}
        >
          <Form.Item
            name="status"
            label={intl.formatMessage({
              id: 'seat.form.status',
              defaultMessage: '状态',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'user.batch.statusRequired',
                  defaultMessage: '请选择状态',
                }),
              },
            ]}
          >
            <Select onChange={(v) => setBatchStatus(Number(v))}>
              <Select.Option value="0">
                {intl.formatMessage({
                  id: 'user.batch.status.normal',
                  defaultMessage: '正常',
                })}
              </Select.Option>
              <Select.Option value="1">
                {intl.formatMessage({
                  id: 'credit.tab.blacklist',
                  defaultMessage: '黑名单',
                })}
              </Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default UserManagement;
