import { Roles } from '@/constants/roles';
import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl, useModel } from '@umijs/max';
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
import React, { useEffect, useRef, useState } from 'react';
import {
  batchUpdateUserStatus,
  createUser,
  deleteUser,
  getUserList,
  updateUser,
  uploadImage,
} from '../../services/library/user';
import {
  STANDARD_ACTION_COLUMN,
  STANDARD_TABLE_SCROLL,
  STANDARD_TABLE_SEARCH,
  toTableDataSource,
} from '../../utils/table';
import './index.less';

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
  role: number;
  creditScore: number;
  blacklisted: boolean;
  createdAt: string;
  updatedByName?: string;
}

/**
 * 用户管理页面
 */
const getBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const UserManagement: React.FC = () => {
  const intl = useIntl();
  const globalModel = (useModel as any)('global');
  const modelCurrentUser = globalModel?.currentUser;
  const modelSetCurrentUser = globalModel?.setCurrentUser;

  const actionRef = useRef<ActionType>();
  const [selectedRows, setSelectedRows] = useState<UserType[]>([]);
  const [batchModalVisible, setBatchModalVisible] = useState<boolean>(false);
  const [batchStatus, setBatchStatus] = useState<number>(0);
  const [batchForm] = Form.useForm();
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<Partial<UserType> | null>(
    null,
  );
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(
    undefined,
  );
  const [avatarPreviewError, setAvatarPreviewError] = useState(false);
  const [form] = Form.useForm();
  useEffect(() => {
    setAvatarPreviewError(false);
  }, [avatarPreview]);

  /**
   * 删除用户
   */
  const handleDelete = (id: string) => {
    Modal.confirm({
      title: intl.formatMessage({
        id: 'user.confirmDeleteTitle',
        defaultMessage: 'Confirm delete',
      }),
      content: intl.formatMessage({
        id: 'user.confirmDeleteContent',
        defaultMessage: 'Are you sure you want to delete this user?',
      }),
      onOk: () => {
        deleteUser(id)
          .then(() => {
            message.success(
              intl.formatMessage({
                id: 'common.deleteSuccessRefresh',
                defaultMessage: 'Deleted successfully',
              }),
            );
            actionRef.current?.reload?.();
          })
          .catch((e: any) => {
            message.error(
              e?.message ||
                intl.formatMessage({
                  id: 'common.deleteFailed',
                  defaultMessage: 'Delete failed, please try again',
                }),
            );
          });
      },
    });
  };

  useEffect(() => {
    if (editingUser) {
      form.setFieldsValue(editingUser as any);
      setAvatarPreview(editingUser.avatar);
    } else {
      setAvatarPreview(undefined);
    }
  }, [editingUser, form]);

  const handleAvatarBeforeUpload = async (file: File) => {
    const base64 = await getBase64(file);
    setAvatarPreview(base64);
    form.setFieldsValue({ avatar: base64 });
    return Upload.LIST_IGNORE;
  };

  const columns: ProColumns<UserType>[] = [
    {
      title: intl.formatMessage({
        id: 'user.column.info',
        defaultMessage: 'User info',
      }),
      dataIndex: 'username',
      width: 180,
      render: (_, record) => (
        <div className="user-info-cell">
          <div className="avatar-wrapper">
            <Avatar src={record.avatar} icon={<UserOutlined />} size={48}>
              {!record.avatar && record.name ? record.name.charAt(0) : null}
            </Avatar>
          </div>
          <div className="user-text">
            <div className="user-name">{record.name}</div>
            <div className="user-username">{record.username}</div>
          </div>
        </div>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'user.form.studentId',
        defaultMessage: 'Student ID',
      }),
      dataIndex: 'studentId',
      width: 100,
    },
    {
      title: intl.formatMessage({
        id: 'user.form.email',
        defaultMessage: 'Email',
      }),
      dataIndex: 'email',
      valueType: 'text',
      width: 160,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: 'user.form.phone',
        defaultMessage: 'Phone',
      }),
      dataIndex: 'phone',
      width: 120,
    },
    {
      title: intl.formatMessage({
        id: 'user.form.role',
        defaultMessage: 'Role',
      }),
      dataIndex: 'role',
      width: 150,
      valueType: 'select',
      valueEnum: {
        [Roles.USER]: {
          text: intl.formatMessage({
            id: 'user.role.user',
            defaultMessage: 'User',
          }),
          status: 'Default',
        },
        [Roles.ADMIN]: {
          text: intl.formatMessage({
            id: 'user.role.admin',
            defaultMessage: 'Admin',
          }),
          status: 'Success',
        },
      },
    },
    {
      title: intl.formatMessage({
        id: 'user.column.creditScore',
        defaultMessage: 'Credit score',
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
        defaultMessage: 'Blacklisted',
      }),
      dataIndex: 'blacklisted',
      valueType: 'select',
      valueEnum: {
        1: {
          text: intl.formatMessage({ id: 'common.yes', defaultMessage: 'Yes' }),
          status: 'Error',
        },
        0: {
          text: intl.formatMessage({ id: 'common.no', defaultMessage: 'No' }),
          status: 'Success',
        },
      },
      fieldProps: {
        allowClear: true,
      },
      width: 100,
      render: (_, record) => (
        <Tag color={record.blacklisted ? 'red' : 'green'}>
          {record.blacklisted
            ? intl.formatMessage({ id: 'common.yes', defaultMessage: 'Yes' })
            : intl.formatMessage({ id: 'common.no', defaultMessage: 'No' })}
        </Tag>
      ),
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
        id: 'user.column.createdAt',
        defaultMessage: 'Created at',
      }),
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      width: 160,
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'common.action',
        defaultMessage: 'Action',
      }),
      valueType: 'option',
      ...STANDARD_ACTION_COLUMN,
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
            {intl.formatMessage({ id: 'common.edit', defaultMessage: 'Edit' })}
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
        id: 'menu.user',
        defaultMessage: 'User management',
      })}
    >
      <ProTable<UserType>
        headerTitle={intl.formatMessage({
          id: 'user.listTitle',
          defaultMessage: 'User list',
        })}
        actionRef={actionRef}
        rowKey="id"
        scroll={STANDARD_TABLE_SCROLL}
        search={STANDARD_TABLE_SEARCH}
        toolBarRender={() => [
          <Button
            key="export"
            onClick={() => {
              if (!selectedRows || selectedRows.length === 0) {
                message.info(
                  intl.formatMessage({
                    id: 'user.export.selectFirst',
                    defaultMessage: 'Please select users to export (checkbox)',
                  }),
                );
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
              defaultMessage: 'Export CSV',
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
              defaultMessage: 'Batch set status',
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
              defaultMessage: 'New user',
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
            return toTableDataSource<UserType>(res);
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
        title={
          editingUser
            ? intl.formatMessage({
                id: 'user.modal.edit',
                defaultMessage: 'Edit user',
              })
            : intl.formatMessage({
                id: 'user.modal.new',
                defaultMessage: 'New user',
              })
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingUser(null);
          form.resetFields();
          setAvatarPreview(undefined);
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
                  uploadRes?.data?.url ||
                  uploadRes?.data?.data?.url ||
                  (typeof uploadRes === 'string' ? uploadRes : undefined);
                if (avatarUrl) {
                  values.avatar = avatarUrl;
                  setAvatarPreview(avatarUrl);
                }
              } catch (e) {
                console.error(
                  intl.formatMessage({
                    id: 'userProfile.uploadFailed',
                    defaultMessage: 'Upload avatar failed',
                  }),
                  e,
                );
              }
            }
            if (editingUser && editingUser.id) {
              // 编辑时不发送密码字段（除非用户填写了新密码）
              if (!values.password) delete values.password;
              await updateUser(editingUser.id, values);
              message.success(
                intl.formatMessage({
                  id: 'user.updateSuccess',
                  defaultMessage: 'Updated successfully',
                }),
              );

              const rawCurrentUser =
                modelCurrentUser ||
                (() => {
                  try {
                    const raw = localStorage.getItem('currentUser');
                    return raw ? JSON.parse(raw) : null;
                  } catch (e) {
                    return null;
                  }
                })();
              if (
                rawCurrentUser &&
                String(rawCurrentUser.id) === String(editingUser.id)
              ) {
                const nextCurrentUser = { ...rawCurrentUser, ...values };
                if (modelSetCurrentUser) {
                  try {
                    modelSetCurrentUser(nextCurrentUser);
                  } catch (e) {
                    // ignore
                  }
                }
                try {
                  localStorage.setItem(
                    'currentUser',
                    JSON.stringify(nextCurrentUser),
                  );
                  window.dispatchEvent(new Event('currentUserUpdated'));
                } catch (e) {
                  // ignore
                }
              }
            } else {
              await createUser(values);
              message.success(
                intl.formatMessage({
                  id: 'user.createSuccess',
                  defaultMessage: 'Created successfully',
                }),
              );
            }
            setModalVisible(false);
            setEditingUser(null);
            form.resetFields();
            actionRef.current?.reload?.();
          } catch (err: any) {
            if (err?.errorFields) return;
            message.error(
              err?.message ||
                intl.formatMessage({
                  id: 'common.operationFailed',
                  defaultMessage: 'Operation failed',
                }),
            );
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
              defaultMessage: 'Avatar',
            })}
          >
            <Upload
              listType="picture-card"
              showUploadList={false}
              accept="image/*"
              beforeUpload={handleAvatarBeforeUpload}
            >
              {avatarPreview && !avatarPreviewError ? (
                <img
                  src={avatarPreview}
                  alt="avatar"
                  style={{
                    width: 96,
                    height: 96,
                    objectFit: 'cover',
                    borderRadius: '50%',
                  }}
                  onError={() => setAvatarPreviewError(true)}
                />
              ) : (
                <div>
                  {intl.formatMessage({
                    id: 'user.upload',
                    defaultMessage: 'Upload',
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
            <Input />
          </Form.Item>
          <Form.Item
            name="name"
            label={intl.formatMessage({
              id: 'user.form.name',
              defaultMessage: 'Name',
            })}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="studentId"
            label={intl.formatMessage({
              id: 'user.form.studentId',
              defaultMessage: 'Student ID',
            })}
            rules={[
              {
                pattern: /^[0-9A-Za-z_-]{4,20}$/,
                message: intl.formatMessage({
                  id: 'user.form.studentIdInvalid',
                  defaultMessage: 'Please enter valid student ID',
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
              defaultMessage: 'Email',
            })}
            rules={[
              {
                type: 'email',
                message: intl.formatMessage({
                  id: 'user.form.emailInvalid',
                  defaultMessage: 'Please enter valid email',
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
              defaultMessage: 'Phone',
            })}
            rules={[
              {
                pattern: /^\d{10,15}$/,
                message: intl.formatMessage({
                  id: 'user.form.phoneInvalid',
                  defaultMessage: 'Please enter valid phone number',
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
                defaultMessage: 'Password',
              })}
              rules={[
                {
                  required: !editingUser,
                  message: intl.formatMessage({
                    id: 'user.form.passwordRequired',
                    defaultMessage: 'Please enter password',
                  }),
                },
                {
                  min: 6,
                  message: intl.formatMessage({
                    id: 'user.form.passwordMin',
                    defaultMessage: 'Password must be at least 6 characters',
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
                defaultMessage: 'New password (leave blank to keep unchanged)',
              })}
              rules={[
                {
                  min: 6,
                  message: intl.formatMessage({
                    id: 'user.form.passwordMin',
                    defaultMessage: 'Password must be at least 6 characters',
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
              defaultMessage: 'Role',
            })}
          >
            <Select>
              <Select.Option value={Roles.USER}>
                {intl.formatMessage({
                  id: 'user.role.user',
                  defaultMessage: 'User',
                })}
              </Select.Option>
              <Select.Option value={Roles.ADMIN}>
                {intl.formatMessage({
                  id: 'user.role.admin',
                  defaultMessage: 'Admin',
                })}
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="blacklisted"
            label={intl.formatMessage({
              id: 'credit.tab.blacklist',
              defaultMessage: 'Blacklisted',
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
          defaultMessage: 'Batch set user status',
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
            message.success(
              intl.formatMessage({
                id: 'user.batch.updateSuccess',
                defaultMessage: 'Batch update succeeded',
              }),
            );
            setBatchModalVisible(false);
            setSelectedRows([]);
            batchForm.resetFields();
            actionRef.current?.reload?.();
          } catch (e: any) {
            message.error(
              e?.message ||
                intl.formatMessage({
                  id: 'user.batch.updateFailed',
                  defaultMessage: 'Batch update failed',
                }),
            );
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
              defaultMessage: 'Status',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'user.batch.statusRequired',
                  defaultMessage: 'Please select a status',
                }),
              },
            ]}
          >
            <Select onChange={(v) => setBatchStatus(Number(v))}>
              <Select.Option value="0">
                {intl.formatMessage({
                  id: 'user.batch.status.normal',
                  defaultMessage: 'Normal',
                })}
              </Select.Option>
              <Select.Option value="1">
                {intl.formatMessage({
                  id: 'credit.tab.blacklist',
                  defaultMessage: 'Blacklisted',
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
