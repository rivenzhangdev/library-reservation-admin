import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  PlusOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Alert,
  Button,
  Form,
  Input,
  message,
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  Upload,
} from 'antd';
import type { UploadFile } from 'antd';
import React, { useRef, useState } from 'react';
import {
  createStudentRegistryEntry,
  deleteStudentRegistryEntry,
  getStudentRegistryList,
  importStudentRegistry,
  StudentRegistryItem,
  updateStudentRegistryEntry,
} from '../../../services/library/studentRegistry';
import {
  STANDARD_TABLE_SCROLL,
  STANDARD_TABLE_SEARCH,
} from '../../../utils/table';

// CSV parser: splits by line, handles quoted fields
function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0]
    .split(',')
    .map((h) => h.trim().replace(/^\uFEFF/, ''));
  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cells = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? '';
    });
    rows.push(row);
  }
  return rows;
}

const StudentRegistry: React.FC = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<StudentRegistryItem | null>(
    null,
  );
  const [editForm] = Form.useForm();
  const [editLoading, setEditLoading] = useState(false);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFileList, setImportFileList] = useState<UploadFile[]>([]);
  const [importPreview, setImportPreview] = useState<
    Array<{
      studentId: string;
      realName: string;
      college?: string;
      major?: string;
      grade?: string;
    }>
  >([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [importLoading, setImportLoading] = useState(false);

  const openAdd = () => {
    setEditRecord(null);
    editForm.resetFields();
    editForm.setFieldsValue({ active: true });
    setEditModalOpen(true);
  };

  const openEdit = (record: StudentRegistryItem) => {
    setEditRecord(record);
    editForm.setFieldsValue({
      studentId: record.studentId,
      realName: record.realName,
      college: record.college ?? '',
      major: record.major ?? '',
      grade: record.grade ?? '',
      active: record.active,
    });
    setEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      const values = await editForm.validateFields();
      setEditLoading(true);
      if (editRecord) {
        await updateStudentRegistryEntry(editRecord.id, {
          realName: values.realName,
          college: values.college,
          major: values.major,
          grade: values.grade,
          active: values.active,
        });
        message.success('更新成功');
      } else {
        await createStudentRegistryEntry(values);
        message.success('添加成功');
      }
      setEditModalOpen(false);
      actionRef.current?.reload?.();
    } catch (err: any) {
      if (err?.errorFields) return; // form validation error
      message.error(err?.message || '操作失败');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = (record: StudentRegistryItem) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除学号 ${record.studentId}（${record.realName}）的学籍记录？此操作不可恢复。`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteStudentRegistryEntry(record.id);
          message.success('删除成功');
          actionRef.current?.reload?.();
        } catch (err: any) {
          message.error(err?.message || '删除失败');
        }
      },
    });
  };

  const downloadLocalTemplate = () => {
    const csvContent =
      'studentId,realName,college,major,grade\n' +
      '20210001234,张三,计算机学院,软件工程,2021级\n' +
      '20210001235,李四,经济管理学院,工商管理,2021级\n';
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student-registry-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/student-registry/template', {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) {
        throw new Error(
          `Template download failed with status ${response.status}`,
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student-registry-template.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('模板下载成功');
    } catch (error) {
      // Fallback to a local generated template to avoid browser/auth edge-case failures.
      downloadLocalTemplate();
      message.warning('接口下载失败，已为你生成本地模板文件');
    }
  };

  const handleFileChange = (info: { fileList: UploadFile[] }) => {
    setImportFileList(info.fileList.slice(-1));
    setImportPreview([]);
    setImportErrors([]);

    const file = info.fileList[info.fileList.length - 1]?.originFileObj;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      const errors: string[] = [];
      const preview: typeof importPreview = [];

      rows.forEach((row, idx) => {
        const sid = String(row.studentId ?? '').trim();
        const name = String(row.realName ?? '').trim();
        if (!sid || !name) {
          errors.push(`第 ${idx + 2} 行：studentId 和 realName 必填`);
          return;
        }
        if (!/^\d{11}$/.test(sid)) {
          errors.push(
            `第 ${idx + 2} 行：学号格式无效 "${sid}"（须为11位数字）`,
          );
          return;
        }
        preview.push({
          studentId: sid,
          realName: name,
          college: String(row.college ?? '').trim() || undefined,
          major: String(row.major ?? '').trim() || undefined,
          grade: String(row.grade ?? '').trim() || undefined,
        });
      });

      setImportPreview(preview);
      setImportErrors(errors);
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleImportConfirm = async () => {
    if (importPreview.length === 0) {
      message.warning('没有可导入的有效数据');
      return;
    }
    setImportLoading(true);
    try {
      const result = await importStudentRegistry(importPreview);
      const d = result.data;
      message.success(
        `导入完成：新增 ${d.inserted} 条，更新 ${d.updated} 条，跳过 ${d.skipped} 条`,
      );
      if (d.errors?.length) {
        Modal.warning({
          title: '部分行有问题',
          content: (
            <ul>
              {d.errors.map((e: string, i: number) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          ),
        });
      }
      setImportModalOpen(false);
      setImportFileList([]);
      setImportPreview([]);
      setImportErrors([]);
      actionRef.current?.reload?.();
    } catch (err: any) {
      message.error(err?.message || '导入失败');
    } finally {
      setImportLoading(false);
    }
  };

  const columns: ProColumns<StudentRegistryItem>[] = [
    {
      title: '学号',
      dataIndex: 'studentId',
      width: 140,
      copyable: true,
    },
    {
      title: '姓名',
      dataIndex: 'realName',
      width: 100,
    },
    {
      title: '学院',
      dataIndex: 'college',
      width: 160,
    },
    {
      title: '专业',
      dataIndex: 'major',
      width: 160,
    },
    {
      title: '年级',
      dataIndex: 'grade',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: 'active',
      width: 80,
      search: false,
      render: (val) =>
        val ? (
          <Tag icon={<CheckCircleOutlined />} color="success">
            有效
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="default">
            停用
          </Tag>
        ),
    },
    {
      title: '入库时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      width: 160,
      search: false,
      sorter: true,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => openEdit(record)}
          >
            编辑
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title="学籍信息库">
      <ProTable<StudentRegistryItem>
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        scroll={STANDARD_TABLE_SCROLL}
        search={STANDARD_TABLE_SEARCH}
        toolBarRender={() => [
          <Button
            key="import"
            icon={<UploadOutlined />}
            onClick={() => {
              setImportFileList([]);
              setImportPreview([]);
              setImportErrors([]);
              setImportModalOpen(true);
            }}
          >
            批量导入
          </Button>,
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={openAdd}
          >
            手动添加
          </Button>,
        ]}
        request={async (params) => {
          const {
            current,
            pageSize,
            studentId,
            realName,
            college,
            major,
            grade,
          } = params;
          const res = await getStudentRegistryList({
            page: current,
            pageSize,
            studentId,
            realName,
            college,
            major,
            grade,
          });
          return {
            data: res.data?.list ?? [],
            success: res.success,
            total: res.data?.total ?? 0,
          };
        }}
      />

      {/* 新增/编辑 Modal */}
      <Modal
        title={editRecord ? '编辑学籍记录' : '手动添加学籍记录'}
        open={editModalOpen}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalOpen(false)}
        confirmLoading={editLoading}
        okText="保存"
        cancelText="取消"
        destroyOnClose
      >
        <Form form={editForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            name="studentId"
            label="学号"
            rules={[
              { required: true, message: '请输入学号' },
              { pattern: /^\d{11}$/, message: '学号须为11位数字' },
            ]}
          >
            <Input placeholder="请输入11位学号" disabled={!!editRecord} />
          </Form.Item>
          <Form.Item
            name="realName"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input placeholder="请输入真实姓名" />
          </Form.Item>
          <Form.Item name="college" label="学院">
            <Input placeholder="请输入学院名称（可选）" />
          </Form.Item>
          <Form.Item name="major" label="专业">
            <Input placeholder="请输入专业名称（可选）" />
          </Form.Item>
          <Form.Item name="grade" label="年级">
            <Input placeholder="如：2021级（可选）" />
          </Form.Item>
          <Form.Item name="active" label="状态" valuePropName="checked">
            <Switch checkedChildren="有效" unCheckedChildren="停用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 批量导入 Modal */}
      <Modal
        title="批量导入学籍信息"
        open={importModalOpen}
        onOk={handleImportConfirm}
        onCancel={() => setImportModalOpen(false)}
        confirmLoading={importLoading}
        okText={`确认导入${
          importPreview.length > 0 ? `（${importPreview.length} 条）` : ''
        }`}
        cancelText="取消"
        width={700}
        destroyOnClose
      >
        <div style={{ marginBottom: 16 }}>
          <Alert
            type="info"
            showIcon
            message="请先下载模板并按表头填写，再上传 CSV 文件。支持 UTF-8 编码，导入时相同学号会覆盖更新已有记录。"
            style={{ marginBottom: 12 }}
          />
          <Space style={{ marginBottom: 12 }} wrap>
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownloadTemplate}
            >
              先下载导入模板
            </Button>
            <span style={{ color: '#666' }}>
              模板字段：studentId、realName、college、major、grade
            </span>
          </Space>
          <Upload
            accept=".csv"
            fileList={importFileList}
            beforeUpload={() => false}
            onChange={handleFileChange}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>选择 CSV 文件</Button>
          </Upload>
        </div>

        {importErrors.length > 0 && (
          <Alert
            type="warning"
            showIcon
            message={`${importErrors.length} 行有格式错误，将被跳过`}
            description={
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {importErrors.slice(0, 10).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {importErrors.length > 10 && (
                  <li>…（共 {importErrors.length} 个错误）</li>
                )}
              </ul>
            }
            style={{ marginBottom: 12 }}
          />
        )}

        {importPreview.length > 0 && (
          <div>
            <div style={{ marginBottom: 8, color: '#666' }}>
              预览（共 {importPreview.length} 条有效数据）：
            </div>
            <Table
              size="small"
              dataSource={importPreview.slice(0, 10)}
              rowKey="studentId"
              pagination={false}
              columns={[
                { title: '学号', dataIndex: 'studentId', width: 140 },
                { title: '姓名', dataIndex: 'realName', width: 80 },
                { title: '学院', dataIndex: 'college', width: 140 },
                { title: '专业', dataIndex: 'major', width: 140 },
                { title: '年级', dataIndex: 'grade', width: 80 },
              ]}
              footer={
                importPreview.length > 10
                  ? () => `…仅显示前10条，共 ${importPreview.length} 条将被导入`
                  : undefined
              }
            />
          </div>
        )}

        {!importPreview.length && !importErrors.length && (
          <div style={{ color: '#999', fontSize: 12, marginTop: 8 }}>
            模板下载后如果浏览器拦截了新窗口或下载，请检查当前登录态是否有效，再重新点击模板按钮。
          </div>
        )}
      </Modal>
    </PageContainer>
  );
};

export default StudentRegistry;
