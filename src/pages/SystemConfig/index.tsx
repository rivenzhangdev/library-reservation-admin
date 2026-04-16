import {
  createConfigSeatFacility,
  createConfigSeatType,
  createConfigTimeSlot,
  deleteConfigSeatFacility,
  deleteConfigSeatType,
  deleteConfigTimeSlot,
  getConfigSeatFacilities,
  getConfigSeatTypes,
  getConfigTimeSlots,
  updateConfigSeatFacility,
  updateConfigSeatType,
  updateConfigTimeSlot,
} from '@/services/library/config';
import { getFloors } from '@/services/library/floor';
import { PageContainer } from '@ant-design/pro-components';
import { history, useIntl } from '@umijs/max';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Space,
  Spin,
  Switch,
  Table,
  Tabs,
  TimePicker,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

const { Paragraph, Text, Title } = Typography;

interface TimeSlotItem {
  id?: number;
  timeSlot: number;
  value: string;
  label: string;
  startTime: string;
  endTime: string;
  order: number;
  enabled: boolean;
}

const SystemConfig: React.FC = () => {
  const intl = useIntl();
  const [timeSlots, setTimeSlots] = useState<TimeSlotItem[]>([]);
  const [timeSlotLoading, setTimeSlotLoading] = useState<boolean>(false);
  const [floors, setFloors] = useState<any[]>([]);
  const [floorsLoading, setFloorsLoading] = useState<boolean>(false);
  const [seatTypeConfigs, setSeatTypeConfigs] = useState<any[]>([]);
  const [seatFacilityConfigs, setSeatFacilityConfigs] = useState<any[]>([]);
  const [seatConfigLoading, setSeatConfigLoading] = useState<boolean>(false);
  const [seatConfigModalVisible, setSeatConfigModalVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [seatConfigMode, setSeatConfigMode] = useState<'type' | 'facility'>(
    'type',
  );
  const [currentSeatConfig, setCurrentSeatConfig] = useState<any | null>(null);
  const [currentRecord, setCurrentRecord] = useState<TimeSlotItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<TimeSlotItem>();
  const [seatConfigForm] = Form.useForm<any>();

  const loadTimeSlots = async () => {
    setTimeSlotLoading(true);
    try {
      const res: any = await getConfigTimeSlots();
      const raw = res?.data ?? res;
      setTimeSlots(Array.isArray(raw) ? raw : []);
    } catch (error) {
      console.error(error);
      message.error(
        intl.formatMessage({
          id: 'booking.config.loadFailed',
          defaultMessage: 'Failed to load time slots.',
        }),
      );
    } finally {
      setTimeSlotLoading(false);
    }
  };

  const loadFloors = async () => {
    setFloorsLoading(true);
    try {
      const list: any[] = await getFloors();
      setFloors(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error(error);
    } finally {
      setFloorsLoading(false);
    }
  };

  const loadSeatConfigs = async () => {
    setSeatConfigLoading(true);
    try {
      const [typesRes, facilitiesRes] = await Promise.all([
        getConfigSeatTypes(),
        getConfigSeatFacilities(),
      ]);
      const rawTypes = typesRes?.data ?? typesRes;
      const rawFacilities = facilitiesRes?.data ?? facilitiesRes;
      setSeatTypeConfigs(Array.isArray(rawTypes) ? rawTypes : []);
      setSeatFacilityConfigs(Array.isArray(rawFacilities) ? rawFacilities : []);
    } catch (error) {
      console.error(error);
      setSeatTypeConfigs([]);
      setSeatFacilityConfigs([]);
    } finally {
      setSeatConfigLoading(false);
    }
  };

  useEffect(() => {
    loadTimeSlots();
    loadFloors();
    loadSeatConfigs();
  }, []);

  const columns = [
    {
      title: intl.formatMessage({
        id: 'booking.form.timeSlot',
        defaultMessage: 'Time Slot',
      }),
      dataIndex: 'label',
      key: 'label',
      render: (_: string, record: TimeSlotItem) => record.label || record.value,
    },
    {
      title: intl.formatMessage({
        id: 'booking.form.startTime',
        defaultMessage: 'Start time',
      }),
      dataIndex: 'startTime',
      key: 'startTime',
    },
    {
      title: intl.formatMessage({
        id: 'booking.form.endTime',
        defaultMessage: 'End time',
      }),
      dataIndex: 'endTime',
      key: 'endTime',
    },
    {
      title: intl.formatMessage({
        id: 'booking.config.enabled',
        defaultMessage: 'Enabled',
      }),
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: TimeSlotItem) => (
        <Switch
          checked={enabled}
          onChange={async (checked) => {
            try {
              await updateConfigTimeSlot(record.id!, { enabled: checked });
              message.success(
                intl.formatMessage({
                  id: 'booking.config.updateSuccess',
                  defaultMessage: 'Updated successfully',
                }),
              );
              loadTimeSlots();
            } catch (err: any) {
              console.error(err);
              message.error(
                intl.formatMessage({
                  id: 'booking.config.updateFailed',
                  defaultMessage: 'Update failed',
                }),
              );
            }
          }}
        />
      ),
    },
    {
      title: intl.formatMessage({
        id: 'common.action',
        defaultMessage: 'Action',
      }),
      valueType: 'option',
      key: 'action',
      render: (_: any, record: TimeSlotItem) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setCurrentRecord(record);
              form.setFieldsValue({
                ...record,
                startTime: dayjs(record.startTime, 'HH:mm'),
                endTime: dayjs(record.endTime, 'HH:mm'),
              });
              setModalVisible(true);
            }}
          >
            {intl.formatMessage({ id: 'common.edit', defaultMessage: 'Edit' })}
          </Button>
          <Button
            type="link"
            danger
            onClick={() => {
              Modal.confirm({
                title: intl.formatMessage({
                  id: 'common.confirm',
                  defaultMessage: 'Confirm',
                }),
                content: intl.formatMessage({
                  id: 'booking.config.deleteConfirm',
                  defaultMessage: 'Delete this time slot?',
                }),
                onOk: async () => {
                  try {
                    await deleteConfigTimeSlot(record.id!);
                    message.success(
                      intl.formatMessage({
                        id: 'booking.config.deleteSuccess',
                        defaultMessage: 'Deleted successfully',
                      }),
                    );
                    loadTimeSlots();
                  } catch (err: any) {
                    console.error(err);
                    message.error(
                      intl.formatMessage({
                        id: 'booking.config.deleteFailed',
                        defaultMessage: 'Delete failed',
                      }),
                    );
                  }
                },
              });
            }}
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

  const handleSubmit = async (values: any) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        startTime: values.startTime.format('HH:mm'),
        endTime: values.endTime.format('HH:mm'),
      };
      if (currentRecord?.id) {
        await updateConfigTimeSlot(currentRecord.id, payload);
        message.success(
          intl.formatMessage({
            id: 'booking.config.updateSuccess',
            defaultMessage: 'Updated successfully',
          }),
        );
      } else {
        await createConfigTimeSlot(payload);
        message.success(
          intl.formatMessage({
            id: 'booking.config.createSuccess',
            defaultMessage: 'Created successfully',
          }),
        );
      }
      setModalVisible(false);
      setCurrentRecord(null);
      form.resetFields();
      loadTimeSlots();
    } catch (err: any) {
      console.error(err);
      message.error(
        intl.formatMessage({
          id: 'booking.config.saveFailed',
          defaultMessage: 'Save failed',
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  const getNextSeatTypeCode = () => {
    const maxCode = seatTypeConfigs.reduce((max, item) => {
      const typeCode = Number(item.type);
      return Number.isFinite(typeCode) ? Math.max(max, typeCode) : max;
    }, -1);
    return maxCode + 1;
  };

  const handleSeatConfigSubmit = async (values: any) => {
    setSaving(true);
    try {
      const payload = {
        ...values,
        order: Number.isFinite(Number(values.order)) ? Number(values.order) : 0,
        enabled: typeof values.enabled === 'boolean' ? values.enabled : true,
      };
      if (!currentSeatConfig?.id) {
        delete payload.value;
        delete payload.key;
      }

      if (seatConfigMode === 'type') {
        if (typeof payload.type === 'undefined') {
          payload.type = currentSeatConfig?.type ?? getNextSeatTypeCode();
        }

        if (currentSeatConfig?.id) {
          await updateConfigSeatType(currentSeatConfig.id, payload);
          message.success(
            intl.formatMessage({
              id: 'booking.config.updateSuccess',
              defaultMessage: 'Updated successfully',
            }),
          );
        } else {
          await createConfigSeatType(payload);
          message.success(
            intl.formatMessage({
              id: 'booking.config.createSuccess',
              defaultMessage: 'Created successfully',
            }),
          );
        }
      } else {
        if (currentSeatConfig?.id) {
          await updateConfigSeatFacility(currentSeatConfig.id, payload);
          message.success(
            intl.formatMessage({
              id: 'booking.config.updateSuccess',
              defaultMessage: 'Updated successfully',
            }),
          );
        } else {
          await createConfigSeatFacility(payload);
          message.success(
            intl.formatMessage({
              id: 'booking.config.createSuccess',
              defaultMessage: 'Created successfully',
            }),
          );
        }
      }
      setSeatConfigModalVisible(false);
      setCurrentSeatConfig(null);
      seatConfigForm.resetFields();
      loadSeatConfigs();
    } catch (err: any) {
      console.error(err);
      message.error(
        intl.formatMessage({
          id: 'booking.config.saveFailed',
          defaultMessage: 'Save failed',
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'menu.systemConfig',
        defaultMessage: 'Configuration Center',
      })}
      extra={[
        <Button
          key="goBooking"
          type="primary"
          onClick={() => history.push('/booking')}
        >
          {intl.formatMessage({
            id: 'booking.config.goBack',
            defaultMessage: 'Back to Booking',
          })}
        </Button>,
      ]}
    >
      <Tabs
        defaultActiveKey="timeSlots"
        tabBarStyle={{ flexWrap: 'wrap', gap: 8 }}
        items={[
          {
            key: 'timeSlots',
            label: intl.formatMessage({
              id: 'booking.config.tab.timeSlots',
              defaultMessage: 'Time Slots',
            }),
            children: (
              <Card>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24,
                  }}
                >
                  <div>
                    <Title level={5} style={{ margin: 0 }}>
                      {intl.formatMessage({
                        id: 'booking.config.timeSlots.title',
                        defaultMessage: 'Time slot规范配置',
                      })}
                    </Title>
                    <Paragraph style={{ margin: 0 }}>
                      {intl.formatMessage({
                        id: 'booking.config.timeSlots.description',
                        defaultMessage:
                          '系统使用统一的时间段配置，预约页面和规则都会基于此生效。',
                      })}
                    </Paragraph>
                  </div>
                  <Button
                    type="primary"
                    onClick={() => {
                      setCurrentRecord(null);
                      form.resetFields();
                      setModalVisible(true);
                    }}
                  >
                    {intl.formatMessage({
                      id: 'booking.config.newTimeSlot',
                      defaultMessage: 'New Time Slot',
                    })}
                  </Button>
                </div>
                <Table<TimeSlotItem>
                  rowKey={(record) => record.id || record.value || record.label}
                  loading={timeSlotLoading}
                  dataSource={timeSlots}
                  columns={columns}
                  pagination={false}
                />
                {timeSlots.length === 0 && !timeSlotLoading && (
                  <Paragraph type="secondary">
                    {intl.formatMessage({
                      id: 'booking.config.noTimeSlots',
                      defaultMessage: 'No time slot configuration found.',
                    })}
                  </Paragraph>
                )}
              </Card>
            ),
          },
          {
            key: 'seatOptions',
            label: intl.formatMessage({
              id: 'booking.config.tab.seatOptions',
              defaultMessage: 'Seat Options',
            }),
            children: (
              <Card>
                <Title level={5}>
                  {intl.formatMessage({
                    id: 'booking.config.seatOptions.title',
                    defaultMessage: 'Seat option configuration',
                  })}
                </Title>
                <Paragraph>
                  {intl.formatMessage({
                    id: 'booking.config.seatOptions.description',
                    defaultMessage:
                      'Manage seat type labels and facility labels used by seat creation and reservation filters.',
                  })}
                </Paragraph>
                <Card
                  type="inner"
                  title={intl.formatMessage({
                    id: 'booking.config.seatOptions.typeTitle',
                    defaultMessage: 'Seat Types',
                  })}
                  style={{ marginBottom: 24 }}
                >
                  <Button
                    type="primary"
                    onClick={() => {
                      setSeatConfigMode('type');
                      setCurrentSeatConfig(null);
                      seatConfigForm.resetFields();
                      setSeatConfigModalVisible(true);
                    }}
                    style={{ marginBottom: 16 }}
                  >
                    {intl.formatMessage({
                      id: 'booking.config.seatOptions.newType',
                      defaultMessage: 'New seat type',
                    })}
                  </Button>
                  <Table
                    rowKey={(record) => record.id}
                    loading={seatConfigLoading}
                    dataSource={seatTypeConfigs}
                    pagination={false}
                    columns={[
                      {
                        title: intl.formatMessage({
                          id: 'booking.form.label',
                          defaultMessage: 'Label',
                        }),
                        dataIndex: 'label',
                        key: 'label',
                      },
                      {
                        title: intl.formatMessage({
                          id: 'booking.config.enabled',
                          defaultMessage: 'Enabled',
                        }),
                        dataIndex: 'enabled',
                        key: 'enabled',
                        render: (enabled: boolean, record: any) => (
                          <Switch
                            checked={enabled}
                            onChange={async (checked) => {
                              try {
                                await updateConfigSeatType(record.id, {
                                  enabled: checked,
                                });
                                message.success(
                                  intl.formatMessage({
                                    id: 'booking.config.updateSuccess',
                                    defaultMessage: 'Updated successfully',
                                  }),
                                );
                                loadSeatConfigs();
                              } catch (err: any) {
                                console.error(err);
                                message.error(
                                  intl.formatMessage({
                                    id: 'booking.config.updateFailed',
                                    defaultMessage: 'Update failed',
                                  }),
                                );
                              }
                            }}
                          />
                        ),
                      },
                      {
                        title: intl.formatMessage({
                          id: 'booking.config.order',
                          defaultMessage: 'Order',
                        }),
                        dataIndex: 'order',
                        key: 'order',
                      },
                      {
                        title: intl.formatMessage({
                          id: 'common.action',
                          defaultMessage: 'Action',
                        }),
                        key: 'action',
                        render: (_: any, record: any) => (
                          <Space>
                            <Button
                              type="link"
                              onClick={() => {
                                setSeatConfigMode('type');
                                setCurrentSeatConfig(record);
                                seatConfigForm.setFieldsValue(record);
                                setSeatConfigModalVisible(true);
                              }}
                            >
                              {intl.formatMessage({
                                id: 'common.edit',
                                defaultMessage: 'Edit',
                              })}
                            </Button>
                            <Button
                              type="link"
                              danger
                              onClick={() => {
                                Modal.confirm({
                                  title: intl.formatMessage({
                                    id: 'common.confirm',
                                    defaultMessage: 'Confirm',
                                  }),
                                  content: intl.formatMessage({
                                    id: 'booking.config.deleteConfirm',
                                    defaultMessage: 'Delete this seat type?',
                                  }),
                                  onOk: async () => {
                                    try {
                                      await deleteConfigSeatType(record.id);
                                      message.success(
                                        intl.formatMessage({
                                          id: 'booking.config.deleteSuccess',
                                          defaultMessage:
                                            'Deleted successfully',
                                        }),
                                      );
                                      loadSeatConfigs();
                                    } catch (err: any) {
                                      console.error(err);
                                      message.error(
                                        intl.formatMessage({
                                          id: 'booking.config.deleteFailed',
                                          defaultMessage: 'Delete failed',
                                        }),
                                      );
                                    }
                                  },
                                });
                              }}
                            >
                              {intl.formatMessage({
                                id: 'common.delete',
                                defaultMessage: 'Delete',
                              })}
                            </Button>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </Card>
                <Card
                  type="inner"
                  title={intl.formatMessage({
                    id: 'booking.config.seatOptions.facilityTitle',
                    defaultMessage: 'Seat Facilities',
                  })}
                >
                  <Button
                    type="primary"
                    onClick={() => {
                      setSeatConfigMode('facility');
                      setCurrentSeatConfig(null);
                      seatConfigForm.resetFields();
                      setSeatConfigModalVisible(true);
                    }}
                    style={{ marginBottom: 16 }}
                  >
                    {intl.formatMessage({
                      id: 'booking.config.seatOptions.newFacility',
                      defaultMessage: 'New facility',
                    })}
                  </Button>
                  <Table
                    rowKey={(record) => record.id}
                    loading={seatConfigLoading}
                    dataSource={seatFacilityConfigs}
                    pagination={false}
                    columns={[
                      {
                        title: intl.formatMessage({
                          id: 'booking.form.label',
                          defaultMessage: 'Label',
                        }),
                        dataIndex: 'label',
                        key: 'label',
                      },
                      {
                        title: intl.formatMessage({
                          id: 'booking.config.enabled',
                          defaultMessage: 'Enabled',
                        }),
                        dataIndex: 'enabled',
                        key: 'enabled',
                        render: (enabled: boolean, record: any) => (
                          <Switch
                            checked={enabled}
                            onChange={async (checked) => {
                              try {
                                await updateConfigSeatFacility(record.id, {
                                  enabled: checked,
                                });
                                message.success(
                                  intl.formatMessage({
                                    id: 'booking.config.updateSuccess',
                                    defaultMessage: 'Updated successfully',
                                  }),
                                );
                                loadSeatConfigs();
                              } catch (err: any) {
                                console.error(err);
                                message.error(
                                  intl.formatMessage({
                                    id: 'booking.config.updateFailed',
                                    defaultMessage: 'Update failed',
                                  }),
                                );
                              }
                            }}
                          />
                        ),
                      },
                      {
                        title: intl.formatMessage({
                          id: 'booking.config.order',
                          defaultMessage: 'Order',
                        }),
                        dataIndex: 'order',
                        key: 'order',
                      },
                      {
                        title: intl.formatMessage({
                          id: 'common.action',
                          defaultMessage: 'Action',
                        }),
                        key: 'action',
                        render: (_: any, record: any) => (
                          <Space>
                            <Button
                              type="link"
                              onClick={() => {
                                setSeatConfigMode('facility');
                                setCurrentSeatConfig(record);
                                seatConfigForm.setFieldsValue(record);
                                setSeatConfigModalVisible(true);
                              }}
                            >
                              {intl.formatMessage({
                                id: 'common.edit',
                                defaultMessage: 'Edit',
                              })}
                            </Button>
                            <Button
                              type="link"
                              danger
                              onClick={() => {
                                Modal.confirm({
                                  title: intl.formatMessage({
                                    id: 'common.confirm',
                                    defaultMessage: 'Confirm',
                                  }),
                                  content: intl.formatMessage({
                                    id: 'booking.config.deleteConfirm',
                                    defaultMessage: 'Delete this facility?',
                                  }),
                                  onOk: async () => {
                                    try {
                                      await deleteConfigSeatFacility(record.id);
                                      message.success(
                                        intl.formatMessage({
                                          id: 'booking.config.deleteSuccess',
                                          defaultMessage:
                                            'Deleted successfully',
                                        }),
                                      );
                                      loadSeatConfigs();
                                    } catch (err: any) {
                                      console.error(err);
                                      message.error(
                                        intl.formatMessage({
                                          id: 'booking.config.deleteFailed',
                                          defaultMessage: 'Delete failed',
                                        }),
                                      );
                                    }
                                  },
                                });
                              }}
                            >
                              {intl.formatMessage({
                                id: 'common.delete',
                                defaultMessage: 'Delete',
                              })}
                            </Button>
                          </Space>
                        ),
                      },
                    ]}
                  />
                </Card>
              </Card>
            ),
          },
          {
            key: 'floorRules',
            label: intl.formatMessage({
              id: 'booking.config.tab.floorRules',
              defaultMessage: 'Floors / Areas / Rules',
            }),
            children: (
              <Card>
                <Title level={5}>
                  {intl.formatMessage({
                    id: 'booking.config.floorRules.title',
                    defaultMessage: 'Floor / Area / Rule Management',
                  })}
                </Title>
                <Paragraph>
                  {intl.formatMessage({
                    id: 'booking.config.floorRules.description',
                    defaultMessage:
                      '楼层与区域配置可在此处统一规划，确保预约规则、座位展示和管理页面保持一致。',
                  })}
                </Paragraph>
                {floorsLoading ? (
                  <Spin />
                ) : (
                  <Table
                    rowKey={(record) => record.id}
                    dataSource={floors}
                    pagination={false}
                    columns={[
                      {
                        title: intl.formatMessage({
                          id: 'common.name',
                          defaultMessage: 'Name',
                        }),
                        dataIndex: 'name',
                        key: 'name',
                      },
                      {
                        title: intl.formatMessage({
                          id: 'booking.config.floorRules.status',
                          defaultMessage: 'Status',
                        }),
                        dataIndex: 'status',
                        key: 'status',
                        render: (status: any) =>
                          status ? (
                            <Text type="success">{status}</Text>
                          ) : (
                            <Text type="secondary">
                              {intl.formatMessage({
                                id: 'common.normal',
                                defaultMessage: 'Normal',
                              })}
                            </Text>
                          ),
                      },
                    ]}
                  />
                )}
                <Space style={{ marginTop: 16 }}>
                  <Button type="primary" onClick={() => history.push('/floor')}>
                    {intl.formatMessage({
                      id: 'booking.config.goToFloor',
                      defaultMessage: 'Go to Floor Management',
                    })}
                  </Button>
                  <Button type="default" onClick={() => history.push('/zone')}>
                    {intl.formatMessage({
                      id: 'booking.config.goToZone',
                      defaultMessage: 'Go to Zone Management',
                    })}
                  </Button>
                </Space>
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title={
          currentRecord
            ? intl.formatMessage({
                id: 'booking.config.editTimeSlot',
                defaultMessage: 'Edit Time Slot',
              })
            : intl.formatMessage({
                id: 'booking.config.newTimeSlot',
                defaultMessage: 'New Time Slot',
              })
        }
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setCurrentRecord(null);
          form.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await form.validateFields();
            await handleSubmit(values);
          } catch (error) {
            // Validate errors are displayed by form
          }
        }}
        confirmLoading={saving}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ enabled: true, order: 0 }}
        >
          <Form.Item
            label={intl.formatMessage({
              id: 'booking.form.label',
              defaultMessage: 'Label',
            })}
            name="label"
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'booking.config.labelRequired',
                  defaultMessage: 'Please enter a label',
                }),
              },
            ]}
          >
            <Input
              placeholder={intl.formatMessage({
                id: 'booking.config.labelPlaceholder',
                defaultMessage: 'e.g. 上午',
              })}
            />
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({
              id: 'booking.form.startTime',
              defaultMessage: 'Start Time',
            })}
            name="startTime"
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'booking.config.startTimeRequired',
                  defaultMessage: 'Please choose a start time',
                }),
              },
            ]}
          >
            <TimePicker format="HH:mm" minuteStep={15} />
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({
              id: 'booking.form.endTime',
              defaultMessage: 'End Time',
            })}
            name="endTime"
            rules={[
              {
                required: true,
                message: intl.formatMessage({
                  id: 'booking.config.endTimeRequired',
                  defaultMessage: 'Please choose an end time',
                }),
              },
            ]}
          >
            <TimePicker format="HH:mm" minuteStep={15} />
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({
              id: 'booking.config.enabled',
              defaultMessage: 'Enabled',
            })}
            name="enabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({
              id: 'booking.config.order',
              defaultMessage: 'Order',
            })}
            name="order"
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={
          seatConfigMode === 'type'
            ? currentSeatConfig
              ? intl.formatMessage({
                  id: 'booking.config.editSeatType',
                  defaultMessage: 'Edit Seat Type',
                })
              : intl.formatMessage({
                  id: 'booking.config.newSeatType',
                  defaultMessage: 'New Seat Type',
                })
            : currentSeatConfig
            ? intl.formatMessage({
                id: 'booking.config.editSeatFacility',
                defaultMessage: 'Edit Seat Facility',
              })
            : intl.formatMessage({
                id: 'booking.config.newSeatFacility',
                defaultMessage: 'New Seat Facility',
              })
        }
        open={seatConfigModalVisible}
        onCancel={() => {
          setSeatConfigModalVisible(false);
          setCurrentSeatConfig(null);
          seatConfigForm.resetFields();
        }}
        onOk={async () => {
          try {
            const values = await seatConfigForm.validateFields();
            await handleSeatConfigSubmit(values);
          } catch (error) {
            // Validate errors are displayed by form
          }
        }}
        confirmLoading={saving}
      >
        <Form
          form={seatConfigForm}
          layout="vertical"
          initialValues={{ enabled: true, order: 0 }}
        >
          <Form.Item
            label={intl.formatMessage({
              id: 'booking.form.label',
              defaultMessage: 'Label',
            })}
            name="label"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({
              id: 'booking.config.enabled',
              defaultMessage: 'Enabled',
            })}
            name="enabled"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          <Form.Item
            label={intl.formatMessage({
              id: 'booking.config.order',
              defaultMessage: 'Order',
            })}
            name="order"
          >
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default SystemConfig;
