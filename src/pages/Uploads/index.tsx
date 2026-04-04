import { deleteUpload, getUploads } from '@/services/library/uploads';
import type { ActionType } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, Image, Modal, Popconfirm, message } from 'antd';
import React, { useRef, useState } from 'react';

const UploadsPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [preview, setPreview] = useState<string | null>(null);

  const columns = [
    {
      title: '预览',
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
    { title: '文件名', dataIndex: 'filename' },
    { title: 'MIME', dataIndex: 'mime' },
    {
      title: '大小 (bytes)',
      dataIndex: 'size',
    },
    { title: '上传时间', dataIndex: 'createdAt', valueType: 'dateTime' },
    {
      title: '操作',
      valueType: 'option',
      render: (_: any, record: any) => [
        <Button
          key="preview"
          type="link"
          onClick={() => setPreview(record.url)}
        >
          预览
        </Button>,
        <Popconfirm
          key="del"
          title="确认删除该文件吗？"
          onConfirm={async () => {
            try {
              await deleteUpload(record._id);
              message.success('删除成功');
              actionRef.current?.reload();
            } catch (e: any) {
              message.error(e?.message || '删除失败');
            }
          }}
        >
          <Button type="link" danger>
            删除
          </Button>
        </Popconfirm>,
      ],
    },
  ];

  return (
    <PageContainer title="图片管理">
      <ProTable
        actionRef={actionRef}
        rowKey={(r) => r._id}
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
