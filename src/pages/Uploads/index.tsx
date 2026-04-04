import { deleteUpload, getUploads } from '@/services/library/uploads';
import type { ActionType } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Image, Modal, Popconfirm, message } from 'antd';
import React, { useRef, useState } from 'react';

const UploadsPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [preview, setPreview] = useState<string | null>(null);
  const intl = useIntl();

  const columns = [
    {
      title: intl.formatMessage({
        id: 'uploads.column.preview',
        defaultMessage: 'Preview',
      }),
      dataIndex: 'url',
      render: (_: any, record: any) => (
        <Image
          width={72}
          src={record.url}
          preview={{
            visible: false,
            onVisibleChange: (vis) => {
              if (vis) setPreview(record.url);
            },
          }}
        />
      ),
    },
    {
      title: intl.formatMessage({
        id: 'uploads.column.filename',
        defaultMessage: 'Filename',
      }),
      dataIndex: 'filename',
    },
    { title: 'MIME', dataIndex: 'mime' },
    {
      title: intl.formatMessage({
        id: 'uploads.column.sizeBytes',
        defaultMessage: 'Size (bytes)',
      }),
      dataIndex: 'size',
    },
    {
      title: intl.formatMessage({
        id: 'uploads.column.uploadedAt',
        defaultMessage: 'Uploaded at',
      }),
      dataIndex: 'createdAt',
      valueType: 'dateTime',
    },
    {
      title: intl.formatMessage({
        id: 'common.action',
        defaultMessage: 'Action',
      }),
      valueType: 'option',
      render: (_: any, record: any) => [
        <Button
          key="preview"
          type="link"
          onClick={() => setPreview(record.url)}
        >
          {intl.formatMessage({
            id: 'uploads.preview',
            defaultMessage: 'Preview',
          })}
        </Button>,
        <Popconfirm
          key="del"
          title={intl.formatMessage({
            id: 'uploads.confirmDelete',
            defaultMessage: 'Confirm delete this file?',
          })}
          onConfirm={async () => {
            try {
              await deleteUpload(record._id);
              message.success(
                intl.formatMessage({
                  id: 'common.deleteSuccessRefresh',
                  defaultMessage: 'Deleted successfully, refreshing',
                }),
              );
              actionRef.current?.reload();
            } catch (e: any) {
              message.error(
                e?.message ||
                  intl.formatMessage({
                    id: 'common.deleteFailed',
                    defaultMessage: 'Delete failed, please try again',
                  }),
              );
            }
          }}
        >
          <Button type="link" danger>
            {intl.formatMessage({
              id: 'common.delete',
              defaultMessage: 'Delete',
            })}
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'uploads.title',
        defaultMessage: 'Image management',
      })}
    >
      <ProTable
        actionRef={actionRef}
        rowKey={(r) => r._id}
        search={{ labelWidth: 'auto', defaultCollapsed: false }}
        request={async (params) => {
          try {
            const p = Number(params.current || 1);
            const l = Number(params.pageSize || 10);
            const res: any = await getUploads({ page: p, limit: l });
            const raw = res?.data || {};
            return {
              data: raw.list || [],
              success: res?.success !== false,
              total: raw.total || 0,
            };
          } catch (e) {
            return { data: [], success: false, total: 0 };
          }
        }}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        visible={!!preview}
        footer={null}
        onCancel={() => setPreview(null)}
      >
        {preview ? (
          <img src={preview} alt="preview" style={{ width: '100%' }} />
        ) : null}
      </Modal>
    </PageContainer>
  );
};

export default UploadsPage;
