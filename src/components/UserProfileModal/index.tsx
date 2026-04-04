import { UploadOutlined } from '@ant-design/icons';
import { useIntl } from '@umijs/max';
import { Button, Form, Input, Modal, Upload, message } from 'antd';
import type { RcFile } from 'antd/es/upload';
import React, { useEffect, useState } from 'react';

export interface UserProfile {
  id?: string;
  username?: string;
  name?: string;
  email?: string;
  phone?: string;
  studentId?: string;
  avatar?: string;
}

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const UserProfileModal: React.FC<{
  visible: boolean;
  initialValues?: UserProfile;
  onClose: () => void;
  onSave: (data: UserProfile) => Promise<void> | void;
}> = ({ visible, initialValues, onClose, onSave }) => {
  const [form] = Form.useForm();
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>(
    initialValues?.avatar,
  );
  const [uploading, setUploading] = useState(false);
  const intl = useIntl();

  useEffect(() => {
    form.setFieldsValue(initialValues || {});
    setAvatarPreview(initialValues?.avatar);
  }, [initialValues, form]);

  const handleBeforeUpload = async (file: RcFile) => {
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error(
        intl.formatMessage({
          id: 'userProfile.imageTooLarge',
          defaultMessage: '图片必须小于 2MB',
        }),
      );
      return Upload.LIST_IGNORE;
    }
    const base64 = await getBase64(file);
    setAvatarPreview(base64);
    // prevent auto upload
    return Upload.LIST_IGNORE;
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setUploading(true);
      const payload: UserProfile = {
        ...initialValues,
        ...values,
        avatar: avatarPreview,
      };
      await onSave(payload);
      message.success(
        intl.formatMessage({
          id: 'userProfile.saveSuccess',
          defaultMessage: '保存成功',
        }),
      );
      onClose();
    } catch (err) {
      // validation errors handled by Form
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      title={intl.formatMessage({
        id: 'userProfile.title',
        defaultMessage: '编辑个人信息',
      })}
      open={visible}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={uploading}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label={intl.formatMessage({
            id: 'userProfile.avatar',
            defaultMessage: '头像',
          })}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: 8,
                overflow: 'hidden',
                background: '#f5f5f5',
              }}
            >
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : null}
            </div>
            <Upload
              beforeUpload={handleBeforeUpload}
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />}>
                {intl.formatMessage({
                  id: 'userProfile.upload',
                  defaultMessage: '上传头像',
                })}
              </Button>
            </Upload>
          </div>
        </Form.Item>

        <Form.Item
          name="username"
          label={intl.formatMessage({
            id: 'userProfile.username',
            defaultMessage: '用户名',
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'userProfile.usernameRequired',
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
            id: 'userProfile.name',
            defaultMessage: '姓名',
          })}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="email"
          label={intl.formatMessage({
            id: 'userProfile.email',
            defaultMessage: '邮箱',
          })}
          rules={[
            {
              type: 'email',
              message: intl.formatMessage({
                id: 'userProfile.emailInvalid',
                defaultMessage: '请输入正确的邮箱',
              }),
            },
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="phone"
          label={intl.formatMessage({
            id: 'userProfile.phone',
            defaultMessage: '手机号',
          })}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="studentId"
          label={intl.formatMessage({
            id: 'userProfile.studentId',
            defaultMessage: '学号/工号',
          })}
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UserProfileModal;
