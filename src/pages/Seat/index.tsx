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

  const seatStatusDefault: Record<number, string> = {
    [SeatStatus.Available]: 'Available',
    [SeatStatus.Maintenance]: 'Maintenance',
  };

  const seatTypeDefault: Record<number, string> = {
    [SeatTypeEnum.Single]: 'Single',
    [SeatTypeEnum.Double]: 'Double',
    [SeatTypeEnum.Group]: 'Group',
  };

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
        defaultMessage: 'Confirm delete',
      }),
      content: intl.formatMessage({
        id: 'seat.confirmDeleteContent',
        defaultMessage: 'Are you sure you want to delete this seat?',
      }),
      onOk: async () => {
        try {
          await deleteSeat(id);
          message.success(
            intl.formatMessage({
              id: 'common.deleteSuccessRefresh',
              defaultMessage: 'Deleted successfully, refreshing...',
            }),
          );
          actionRef.current?.reload?.();
        } catch (e: any) {
          message.error(
            e?.message ||
              intl.formatMessage({
                id: 'common.deleteFailed',
                defaultMessage: 'Delete failed, please try again',
              }),
          );
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
      message.success(
        intl.formatMessage({
          id: 'seat.updateSuccess',
          defaultMessage: 'Updated successfully',
        }),
      );
      actionRef.current?.reload?.();
    } catch (e: any) {
      message.error(
        e?.message ||
          intl.formatMessage({
            id: 'seat.updateFailed',
            defaultMessage: 'Update failed',
          }),
      );
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
        defaultMessage: 'Floor',
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
        defaultMessage: 'Position',
      }),
      dataIndex: 'position',
      hideInSearch: true,
      width: 140,
      render: (_, record) =>
        `${intl.formatMessage({
          id: 'seat.position.row',
          defaultMessage: 'Row ',
        })}${record.rowNum}${intl.formatMessage({
          id: 'seat.position.rowSuffix',
          defaultMessage: ' - Col ',
        })}${record.colNum}${intl.formatMessage({
          id: 'seat.position.colSuffix',
          defaultMessage: '',
        })}`,
    },
    {
      title: intl.formatMessage({
        id: 'seat.form.row',
        defaultMessage: 'Row',
      }),
      dataIndex: 'rowNum',
      sorter: true,
      width: 70,
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'seat.form.col',
        defaultMessage: 'Column',
      }),
      dataIndex: 'colNum',
      sorter: true,
      width: 70,
      hideInSearch: true,
    },
    {
      title: intl.formatMessage({
        id: 'seat.form.status',
        defaultMessage: 'Status',
      }),
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        [SeatStatus.Available]: {
          text: intl.formatMessage({
            id: SeatStatusText[SeatStatus.Available],
            defaultMessage: seatStatusDefault[SeatStatus.Available],
          }),
          status: 'Success',
        },
        [SeatStatus.Maintenance]: {
          text: intl.formatMessage({
            id: SeatStatusText[SeatStatus.Maintenance],
            defaultMessage: seatStatusDefault[SeatStatus.Maintenance],
          }),
          status: 'Error',
        },
      },
      render: (_, record) => (
        <Tag color={record.status === SeatStatus.Available ? 'green' : 'red'}>
          {intl.formatMessage({
            id: SeatStatusText[record.status],
            defaultMessage: seatStatusDefault[record.status] || 'Unknown',
          })}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'seat.form.type',
        defaultMessage: 'Type',
      }),
      dataIndex: 'type',
      valueType: 'select',
      valueEnum: {
        [SeatTypeEnum.Single]: {
          text: intl.formatMessage({
            id: SeatTypeText[SeatTypeEnum.Single],
            defaultMessage: seatTypeDefault[SeatTypeEnum.Single],
          }),
        },
        [SeatTypeEnum.Double]: {
          text: intl.formatMessage({
            id: SeatTypeText[SeatTypeEnum.Double],
            defaultMessage: seatTypeDefault[SeatTypeEnum.Double],
          }),
        },
        [SeatTypeEnum.Group]: {
          text: intl.formatMessage({
            id: SeatTypeText[SeatTypeEnum.Group],
            defaultMessage: seatTypeDefault[SeatTypeEnum.Group],
          }),
        },
      },
    },
    {
      title: intl.formatMessage({
        id: 'seat.column.facility',
        defaultMessage: 'Facilities',
      }),
      hideInSearch: true,
      render: (_, record) => (
        <Space>
          {record.hasSocket && (
            <Tag color="blue">
              {intl.formatMessage({
                id: 'seat.facility.socket',
                defaultMessage: 'Socket',
              })}
            </Tag>
          )}
          {record.isWindow && (
            <Tag color="green">
              {intl.formatMessage({
                id: 'seat.form.isWindow',
                defaultMessage: 'Window seat',
              })}
            </Tag>
          )}
        </Space>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'seat.form.zone',
        defaultMessage: 'Zone',
      }),
      dataIndex: 'zoneName',
      render: (_, record) => (
        <Tag color="#108ee9">{record.zoneName || record.zone || '-'}</Tag>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'common.action',
        defaultMessage: 'Actions',
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
            {intl.formatMessage({ id: 'common.edit', defaultMessage: 'Edit' })}
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => handleToggleStatus(record as SeatType)}
          >
            {record.status === SeatStatus.Available
              ? intl.formatMessage({
                  id: 'seat.action.setMaintenance',
                  defaultMessage: 'Set maintenance',
                })
              : intl.formatMessage({
                  id: 'seat.action.setAvailable',
                  defaultMessage: 'Set available',
                })}
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
        id: 'menu.seat',
        defaultMessage: 'Seat Management',
      })}
    >
      <ProTable<SeatType>
        headerTitle={intl.formatMessage({
          id: 'seat.listTitle',
          defaultMessage: 'Seat List',
        })}
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
              defaultMessage: 'Batch create seats',
            })}
          </Button>,
          <Button
            key="batchStatus"
            disabled={selectedSeatIds.length === 0}
            onClick={() => setBatchStatusModalVisible(true)}
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
            onClick={() => {
              setEditingSeat(null);
              form.resetFields();
              setEditModalVisible(true);
            }}
          >
            {intl.formatMessage({ id: 'seat.new', defaultMessage: 'New Seat' })}
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
          defaultMessage: 'Batch update seat status',
        })}
        open={batchStatusModalVisible}
        onCancel={() => {
          setBatchStatusModalVisible(false);
          batchStatusForm.resetFields();
        }}
        onOk={async () => {
          try {
            if (!selectedSeatIds || selectedSeatIds.length === 0) {
              message.info(
                intl.formatMessage({
                  id: 'seat.pleaseSelectSeat',
                  defaultMessage: 'Please select seats first',
                }),
              );
              return;
            }
            // 动态导入服务以避免循环依赖问题
            const { batchUpdateSeatStatus } = await import(
              '../../services/library/seat'
            );
            await batchUpdateSeatStatus(selectedSeatIds, batchStatus);
            message.success(
              intl.formatMessage({
                id: 'seat.batchUpdateSuccess',
                defaultMessage: 'Batch update successful',
              }),
            );
            setSelectedSeatIds([]);
            setBatchStatusModalVisible(false);
            actionRef.current?.reload?.();
          } catch (e: any) {
            message.error(
              e?.message ||
                intl.formatMessage({
                  id: 'seat.batchUpdateFailed',
                  defaultMessage: 'Batch update failed',
                }),
            );
          }
        }}
      >
        <Form form={batchStatusForm} layout="vertical">
          <Form.Item
            label={intl.formatMessage({
              id: 'seat.form.status',
              defaultMessage: 'Status',
            })}
          >
            <Select
              value={String(batchStatus)}
              onChange={(v) => setBatchStatus(Number(v))}
            >
              <Select.Option value={SeatStatus.Available}>
                {intl.formatMessage({
                  id: 'seat.status.available',
                  defaultMessage: 'Available',
                })}
              </Select.Option>
              <Select.Option value={SeatStatus.Maintenance}>
                {intl.formatMessage({
                  id: 'seat.status.maintenance',
                  defaultMessage: 'Maintenance',
                })}
              </Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          editingSeat
            ? intl.formatMessage({
                id: 'seat.modal.edit',
                defaultMessage: 'Edit Seat',
              })
            : intl.formatMessage({
                id: 'seat.modal.new',
                defaultMessage: 'New Seat',
              })
        }
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
              message.success(
                intl.formatMessage({
                  id: 'seat.updateSuccess',
                  defaultMessage: 'Updated successfully',
                }),
              );
            } else {
              await createSeat(values);
              message.success(
                intl.formatMessage({
                  id: 'seat.createSuccess',
                  defaultMessage: 'Created successfully',
                }),
              );
            }
            setEditModalVisible(false);
            setEditingSeat(null);
            form.resetFields();
            actionRef.current?.reload?.();
          } catch (e: any) {
            if (e?.errorFields) return;
            message.error(
              e?.message ||
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
              defaultMessage: 'Floor',
            })}
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'seat.form.floorRequired',
                  defaultMessage: 'Please select a floor',
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
              defaultMessage: 'Row',
            })}
            rules={[{ required: true }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="colNum"
            label={intl.formatMessage({
              id: 'seat.form.col',
              defaultMessage: 'Column',
            })}
            rules={[{ required: true }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="zone"
            label={intl.formatMessage({
              id: 'seat.form.zone',
              defaultMessage: 'Zone',
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
              defaultMessage: 'Type',
            })}
          >
            <Select>
              <Select.Option value={SeatTypeEnum.Single}>
                {intl.formatMessage({
                  id: 'seat.type.single',
                  defaultMessage: 'Single',
                })}
              </Select.Option>
              <Select.Option value={SeatTypeEnum.Double}>
                {intl.formatMessage({
                  id: 'seat.type.double',
                  defaultMessage: 'Double',
                })}
              </Select.Option>
              <Select.Option value={SeatTypeEnum.Group}>
                {intl.formatMessage({
                  id: 'seat.type.group',
                  defaultMessage: 'Group',
                })}
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="hasSocket"
            label={intl.formatMessage({
              id: 'seat.form.hasSocket',
              defaultMessage: 'Has socket',
            })}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="isWindow"
            label={intl.formatMessage({
              id: 'seat.form.isWindow',
              defaultMessage: 'Window seat',
            })}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="status"
            label={intl.formatMessage({
              id: 'seat.form.status',
              defaultMessage: 'Status',
            })}
          >
            <Select>
              <Select.Option value={SeatStatus.Available}>
                {intl.formatMessage({
                  id: 'seat.status.available',
                  defaultMessage: 'Available',
                })}
              </Select.Option>
              <Select.Option value={SeatStatus.Maintenance}>
                {intl.formatMessage({
                  id: 'seat.status.maintenance',
                  defaultMessage: 'Maintenance',
                })}
              </Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={intl.formatMessage({
          id: 'seat.batchCreateModal.title',
          defaultMessage: 'Batch create seats',
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
              throw new Error(
                intl.formatMessage({
                  id: 'seat.batch.invalidRange',
                  defaultMessage:
                    'Invalid row/column range: start must not be greater than end',
                }),
              );
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
            message.success(
              intl.formatMessage({
                id: 'seat.batchCreateSuccess',
                defaultMessage: 'Batch created successfully',
              }),
            );
            setBatchModalVisible(false);
            batchForm.resetFields();
            actionRef.current?.reload?.();
          } catch (err: any) {
            if (err?.errorFields) return;
            message.error(
              err?.message ||
                intl.formatMessage({
                  id: 'seat.createFailed',
                  defaultMessage: 'Create failed',
                }),
            );
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
              defaultMessage: 'Floor',
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
              defaultMessage: 'Zone',
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
              defaultMessage: 'Row range',
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
                      defaultMessage: 'Please enter start row',
                    }),
                  },
                ]}
              >
                <InputNumber
                  min={1}
                  placeholder={intl.formatMessage({
                    id: 'seat.placeholder.startRow',
                    defaultMessage: 'Start row',
                  })}
                />
              </Form.Item>
              <Form.Item
                name="endRow"
                noStyle
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: 'seat.form.endRowRequired',
                      defaultMessage: 'Please enter end row',
                    }),
                  },
                ]}
              >
                <InputNumber
                  min={1}
                  placeholder={intl.formatMessage({
                    id: 'seat.placeholder.endRow',
                    defaultMessage: 'End row',
                  })}
                />
              </Form.Item>
            </Input.Group>
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({
              id: 'seat.form.colRange',
              defaultMessage: 'Column range',
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
                      defaultMessage: 'Please enter start column',
                    }),
                  },
                ]}
              >
                <InputNumber
                  min={1}
                  placeholder={intl.formatMessage({
                    id: 'seat.placeholder.startCol',
                    defaultMessage: 'Start column',
                  })}
                />
              </Form.Item>
              <Form.Item
                name="endCol"
                noStyle
                rules={[
                  {
                    required: true,
                    message: intl.formatMessage({
                      id: 'seat.form.endColRequired',
                      defaultMessage: 'Please enter end column',
                    }),
                  },
                ]}
              >
                <InputNumber
                  min={1}
                  placeholder={intl.formatMessage({
                    id: 'seat.placeholder.endCol',
                    defaultMessage: 'End column',
                  })}
                />
              </Form.Item>
            </Input.Group>
          </Form.Item>
          <Form.Item
            name="type"
            label={intl.formatMessage({
              id: 'seat.form.type',
              defaultMessage: 'Type',
            })}
          >
            <Select>
              <Select.Option value={SeatTypeEnum.Single}>
                {intl.formatMessage({
                  id: 'seat.type.single',
                  defaultMessage: 'Single',
                })}
              </Select.Option>
              <Select.Option value={SeatTypeEnum.Double}>
                {intl.formatMessage({
                  id: 'seat.type.double',
                  defaultMessage: 'Double',
                })}
              </Select.Option>
              <Select.Option value={SeatTypeEnum.Group}>
                {intl.formatMessage({
                  id: 'seat.type.group',
                  defaultMessage: 'Group',
                })}
              </Select.Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="hasSocket"
            label={intl.formatMessage({
              id: 'seat.form.hasSocket',
              defaultMessage: 'Has socket',
            })}
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            name="isWindow"
            label={intl.formatMessage({
              id: 'seat.form.isWindow',
              defaultMessage: 'Window seat',
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
