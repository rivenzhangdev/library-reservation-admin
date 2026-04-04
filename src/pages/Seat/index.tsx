import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Switch,
  Tag,
  message,
} from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import {
  SeatStatus,
  SeatStatusText,
  SeatType as SeatTypeEnum,
  SeatTypeText,
} from '../../constants/status';
import { getFloors } from '../../services/library/floor';
import {
  batchCreateSeats,
  createSeat,
  deleteSeat,
  getSeatList,
  updateSeat,
} from '../../services/library/seat';
import { getZones } from '../../services/library/zone';

/**
 * 座位数据类型
 */
interface SeatType {
  id: number;
  floorId: string;
  floorName: string;
  rowNum: number;
  colNum: number;
  // status: 0=available,1=maintenance
  status: SeatStatus;
  // type: 0=single,1=double,2=group
  type: SeatTypeEnum;
  hasSocket: boolean;
  isWindow: boolean;
  zone: string;
}

/**
 * 座位管理页面
 */
const SeatManagement: React.FC = () => {
  const intl = useIntl();

  const actionRef = useRef<ActionType>();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [batchModalVisible, setBatchModalVisible] = useState(false);
  const [batchStatusModalVisible, setBatchStatusModalVisible] = useState(false);
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [editingSeat, setEditingSeat] = useState<Partial<SeatType> | null>(
    null,
  );
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [batchStatusForm] = Form.useForm();
  const [batchStatus, setBatchStatus] = useState<number>(SeatStatus.Available);
  const [floors, setFloors] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    (async () => {
      try {
        const res: any = await getFloors();
        const raw = res?.data;
        let list: any[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (Array.isArray(raw?.floors)) list = raw.floors;
        else list = [];
        setFloors(list.map((f) => ({ id: f.id, name: f.name })));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const [zones, setZones] = useState<Array<{ id: string; name: string }>>([]);
  useEffect(() => {
    (async () => {
      try {
        const res: any = await getZones();
        const raw = res?.data;
        let list: any[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (Array.isArray(raw?.zones)) list = raw.zones;
        else list = [];
        setZones(list.map((z) => ({ id: z.id, name: z.name })));
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: intl.formatMessage({
        id: 'user.confirmDeleteTitle',
        defaultMessage: '确认删除',
      }),
      content: '确定要删除该座位吗？',
      onOk: async () => {
        try {
          await deleteSeat(id);
          message.success('删除成功');
          actionRef.current?.reload?.();
        } catch (e: any) {
          message.error(e?.message || '删除失败');
        }
      },
    });
  };

  const handleToggleStatus = async (record: SeatType) => {
    const newStatus =
      record.status === SeatStatus.Available
        ? SeatStatus.Maintenance
        : SeatStatus.Available;
    try {
      await updateSeat(record.id, { status: newStatus });
      message.success('更新成功');
      actionRef.current?.reload?.();
    } catch (e: any) {
      message.error(e?.message || '更新失败');
    }
  };

  const handleEdit = (record: Partial<SeatType>) => {
    setEditingSeat(record);
    form.setFieldsValue(record as any);
    setEditModalVisible(true);
  };

  const columns: ProColumns<SeatType>[] = [
    {
      title: intl.formatMessage({
        id: 'seat.form.floor',
        defaultMessage: '楼层',
      }),
      dataIndex: 'floorId',
      valueType: 'select',
      renderFormItem: (_, { defaultRender }) => defaultRender(_),
      valueEnum: (() => {
        const map: Record<string, any> = {};
        floors.forEach((f) => {
          map[f.id] = { text: f.name };
        });
        return map;
      })(),
      render: (_, record) => record.floorName || '',
      width: 100,
    },
    {
      title: intl.formatMessage({
        id: 'seat.column.position',
        defaultMessage: '位置',
      }),
      dataIndex: 'position',
      hideInSearch: true,
      width: 140,
      render: (_, record) => `第${record.rowNum}行 - 第${record.colNum}列`,
    },
    {
      title: intl.formatMessage({
        id: 'seat.form.row',
        defaultMessage: '行号',
      }),
      dataIndex: 'rowNum',
      sorter: true,
      width: 70,
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'seat.form.col',
        defaultMessage: '列号',
      }),
      dataIndex: 'colNum',
      sorter: true,
      width: 70,
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'seat.form.status',
        defaultMessage: '状态',
      }),
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        [SeatStatus.Available]: {
          text: SeatStatusText[SeatStatus.Available],
          status: 'Success',
        },
        [SeatStatus.Maintenance]: {
          text: SeatStatusText[SeatStatus.Maintenance],
          status: 'Error',
        },
      },
      render: (_, record) => (
        <Tag color={record.status === SeatStatus.Available ? 'green' : 'red'}>
          {SeatStatusText[record.status]}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'seat.form.type',
        defaultMessage: '类型',
      }),
      dataIndex: 'type',
      valueType: 'select',
      valueEnum: {
        [SeatTypeEnum.Single]: { text: SeatTypeText[SeatTypeEnum.Single] },
        [SeatTypeEnum.Double]: { text: SeatTypeText[SeatTypeEnum.Double] },
        [SeatTypeEnum.Group]: { text: SeatTypeText[SeatTypeEnum.Group] },
      },
    },
    {
      title: intl.formatMessage({
        id: 'seat.column.facility',
        defaultMessage: '设施',
      }),
      hideInSearch: true,
      render: (_, record) => (
        <Space>
          {record.hasSocket && (
            <Tag color="blue">
              {intl.formatMessage({
                id: 'seat.facility.socket',
                defaultMessage: '插座',
              })}
            </Tag>
          )}
          {record.isWindow && (
            <Tag color="green">
              {intl.formatMessage({
                id: 'seat.form.isWindow',
                defaultMessage: '靠窗',
              })}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'seat.form.zone',
        defaultMessage: '区域',
      }),
      dataIndex: 'zoneName',
      render: (_, record) => (
        <Tag color="#108ee9">{record.zoneName || record.zone || '-'}</Tag>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'common.action',
        defaultMessage: '操作',
      }),
      valueType: 'option',
      width: 260,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4} wrap={false}>
          <Button
            type="link"
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          >
            {intl.formatMessage({ id: 'common.edit', defaultMessage: '编辑' })}
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleToggleStatus(record as SeatType)}
          >
            {record.status === SeatStatus.Available ? '设为维护' : '设为可用'}
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
        id: 'menu.seat',
        defaultMessage: '座位管理',
      })}
    >
      <ProTable<SeatType>
        headerTitle="座位列表"
        actionRef={actionRef}
        rowKey="id"
        scroll={{ x: 1300 }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
        rowSelection={{
          onChange: (_, rows) => setSelectedSeatIds(rows.map((r: any) => r.id)),
        }}
        toolBarRender={() => [
          <Button key="batchCreate" onClick={() => setBatchModalVisible(true)}>
            {intl.formatMessage({
              id: 'seat.batchCreate',
              defaultMessage: '批量建座位',
            })}
          </Button>,
          <Button
            key="batchStatus"
            disabled={selectedSeatIds.length === 0}
            onClick={() => setBatchStatusModalVisible(true)}
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
            onClick={() => {
              setEditingSeat(null);
              form.resetFields();
              setEditModalVisible(true);
            }}
          >
            {intl.formatMessage({ id: 'seat.new', defaultMessage: '新建座位' })}
          </Button>,
        ]}
        request={async (params) => {
          try {
            const res: any = await getSeatList(params);
            const raw = res?.data;
            let list: any[] = [];
            if (Array.isArray(raw)) list = raw;
            else if (Array.isArray(raw?.list)) list = raw.list;
            else if (Array.isArray(raw?.seats)) list = raw.seats;
            else list = [];
            const total = raw?.total ?? (Array.isArray(list) ? list.length : 0);
            return { data: list, success: true, total };
          } catch (e) {
            return { data: [], success: false, total: 0 };
          }
        }}
        columns={columns}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={intl.formatMessage({
          id: 'seat.batchStatusModal.title',
          defaultMessage: '批量设置座位状态',
        })}
        open={batchStatusModalVisible}
        onCancel={() => {
          setBatchStatusModalVisible(false);
          batchStatusForm.resetFields();
        }}
        onOk={async () => {
          try {
            if (!selectedSeatIds || selectedSeatIds.length === 0) {
              message.info('请先选择座位');
              return;
            }
            // 动态导入服务以避免循环依赖问题
            const { batchUpdateSeatStatus } = await import(
              '../../services/library/seat'
            );
            await batchUpdateSeatStatus(selectedSeatIds, batchStatus);
            message.success('批量更新成功');
            setSelectedSeatIds([]);
            setBatchStatusModalVisible(false);
            actionRef.current?.reload?.();
          } catch (e: any) {
            message.error(e?.message || '批量更新失败');
          }
        }}
      >
        <Form form={batchStatusForm} layout="vertical">
          <Form.Item
            label={intl.formatMessage({
              id: 'seat.form.status',
              defaultMessage: '状态',
            })}
          >
            <Select
              value={String(batchStatus)}
              onChange={(v) => setBatchStatus(Number(v))}
            >
              <Select.Option value={SeatStatus.Available}>
                {intl.formatMessage({
                  id: 'seat.status.available',
                  defaultMessage: '可用',
                })}
              </Select.Option>
              <Select.Option value={SeatStatus.Maintenance}>
                {intl.formatMessage({
                  id: 'seat.status.maintenance',
                  defaultMessage: '维护中',
                })}
              </Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingSeat ? '编辑座位' : '新建座位'}
        open={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setEditingSeat(null);
          form.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            if (editingSeat && editingSeat.id) {
              await updateSeat(editingSeat.id, values);
              message.success('更新成功');
            } else {
              await createSeat(values);
              message.success('创建成功');
            }
            setEditModalVisible(false);
            setEditingSeat(null);
            form.resetFields();
            actionRef.current?.reload?.();
          } catch (e: any) {
            if (e?.errorFields) return;
            message.error(e?.message || '操作失败');
          }
        }}
      >
        <Form
          form={form}
          initialValues={{
            floorId: '',
            status: SeatStatus.Available,
            type: SeatTypeEnum.Single,
            hasSocket: false,
            isWindow: false,
          }}
          layout="vertical"
        >
          <Form.Item
            name="floorId"
            label={intl.formatMessage({
              id: 'seat.form.floor',
              defaultMessage: '楼层',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'seat.form.floorRequired',
                  defaultMessage: '请选择楼层',
                }),
              },
            ]}
          >
            <Select>
              {floors.map((f) => (
                <Select.Option key={f.id} value={f.id}>
                  {f.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="rowNum"
            label={intl.formatMessage({
              id: 'seat.form.row',
              defaultMessage: '行号',
            })}
            rules={[{ required: true }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="colNum"
            label={intl.formatMessage({
              id: 'seat.form.col',
              defaultMessage: '列号',
            })}
            rules={[{ required: true }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="zone"
            label={intl.formatMessage({
              id: 'seat.form.zone',
              defaultMessage: '区域',
            })}
          >
            <Select>
              {zones.map((z) => (
                <Select.Option key={z.id} value={z.name}>
                  {z.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="type"
            label={intl.formatMessage({
              id: 'seat.form.type',
              defaultMessage: '类型',
            })}
          >
            <Select>
              <Select.Option value={SeatTypeEnum.Single}>
                {intl.formatMessage({
                  id: 'seat.type.single',
                  defaultMessage: '单人桌',
                })}
              </Select.Option>
              <Select.Option value={SeatTypeEnum.Double}>
                {intl.formatMessage({
                  id: 'seat.type.double',
                  defaultMessage: '双人桌',
                })}
              </Select.Option>
              <Select.Option value={SeatTypeEnum.Group}>
                {intl.formatMessage({
                  id: 'seat.type.group',
                  defaultMessage: '多人桌',
                })}
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="hasSocket"
            label={intl.formatMessage({
              id: 'seat.form.hasSocket',
              defaultMessage: '有无插座',
            })}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="isWindow"
            label={intl.formatMessage({
              id: 'seat.form.isWindow',
              defaultMessage: '靠窗',
            })}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="status"
            label={intl.formatMessage({
              id: 'seat.form.status',
              defaultMessage: '状态',
            })}
          >
            <Select>
              <Select.Option value={SeatStatus.Available}>
                {intl.formatMessage({
                  id: 'seat.status.available',
                  defaultMessage: '可用',
                })}
              </Select.Option>
              <Select.Option value={SeatStatus.Maintenance}>
                {intl.formatMessage({
                  id: 'seat.status.maintenance',
                  defaultMessage: '维护中',
                })}
              </Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={intl.formatMessage({
          id: 'seat.batchCreateModal.title',
          defaultMessage: '批量创建座位',
        })}
        open={batchModalVisible}
        onCancel={() => {
          setBatchModalVisible(false);
          batchForm.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await batchForm.validateFields();
            const {
              floorId,
              zone,
              startRow,
              endRow,
              startCol,
              endCol,
              type,
              hasSocket,
              isWindow,
            } = values;
            if (startRow > endRow || startCol > endCol)
              throw new Error('行/列范围无效，起始不得大于结束');
            const seats = [] as any[];
            for (let r = startRow; r <= endRow; r++) {
              for (let c = startCol; c <= endCol; c++) {
                const floor = floors.find((x) => x.id === floorId);
                seats.push({
                  floorId,
                  floorName: floor?.name || '',
                  zone,
                  rowNum: r,
                  colNum: c,
                  type,
                  hasSocket,
                  isWindow,
                  status: SeatStatus.Available,
                });
              }
            }
            await batchCreateSeats(seats);
            message.success('批量创建成功');
            setBatchModalVisible(false);
            batchForm.resetFields();
            actionRef.current?.reload?.();
          } catch (err: any) {
            if (err?.errorFields) return;
            message.error(err?.message || '创建失败');
          }
        }}
      >
        <Form
          form={batchForm}
          initialValues={{
            floorId: '',
            type: SeatTypeEnum.Single,
            hasSocket: false,
            isWindow: false,
          }}
          layout="vertical"
        >
          <Form.Item
            name="floorId"
            label={intl.formatMessage({
              id: 'seat.form.floor',
              defaultMessage: '楼层',
            })}
          >
            <Select>
              {floors.map((f) => (
                <Select.Option key={f.id} value={f.id}>
                  {f.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="zone"
            label={intl.formatMessage({
              id: 'seat.form.zone',
              defaultMessage: '区域',
            })}
          >
            <Select>
              {zones.map((z) => (
                <Select.Option key={z.id} value={z.name}>
                  {z.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({
              id: 'seat.form.rowRange',
              defaultMessage: '行范围',
            })}
          >
            <Input.Group compact>
              <Form.Item
                name="startRow"
                noStyle
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: 'seat.form.startRowRequired',
                      defaultMessage: '请输入起始行',
                    }),
                  },
                ]}
              >
                <InputNumber min={1} placeholder="起始行" />
              </Form.Item>
              <Form.Item
                name="endRow"
                noStyle
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: 'seat.form.endRowRequired',
                      defaultMessage: '请输入结束行',
                    }),
                  },
                ]}
              >
                <InputNumber min={1} placeholder="结束行" />
              </Form.Item>
            </Input.Group>
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({
              id: 'seat.form.colRange',
              defaultMessage: '列范围',
            })}
          >
            <Input.Group compact>
              <Form.Item
                name="startCol"
                noStyle
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: 'seat.form.startColRequired',
                      defaultMessage: '请输入起始列',
                    }),
                  },
                ]}
              >
                <InputNumber min={1} placeholder="起始列" />
              </Form.Item>
              <Form.Item
                name="endCol"
                noStyle
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: 'seat.form.endColRequired',
                      defaultMessage: '请输入结束列',
                    }),
                  },
                ]}
              >
                <InputNumber min={1} placeholder="结束列" />
              </Form.Item>
            </Input.Group>
          </Form.Item>
          <Form.Item
            name="type"
            label={intl.formatMessage({
              id: 'seat.form.type',
              defaultMessage: '类型',
            })}
          >
            <Select>
              <Select.Option value={SeatTypeEnum.Single}>
                {intl.formatMessage({
                  id: 'seat.type.single',
                  defaultMessage: '单人桌',
                })}
              </Select.Option>
              <Select.Option value={SeatTypeEnum.Double}>
                {intl.formatMessage({
                  id: 'seat.type.double',
                  defaultMessage: '双人桌',
                })}
              </Select.Option>
              <Select.Option value={SeatTypeEnum.Group}>
                {intl.formatMessage({
                  id: 'seat.type.group',
                  defaultMessage: '多人桌',
                })}
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="hasSocket"
            label={intl.formatMessage({
              id: 'seat.form.hasSocket',
              defaultMessage: '有无插座',
            })}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="isWindow"
            label={intl.formatMessage({
              id: 'seat.form.isWindow',
              defaultMessage: '靠窗',
            })}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default SeatManagement;
