import {
  createConfigSeatFacility,
  createConfigSeatType,
  createConfigTimeSlot,
  deleteConfigSeatFacility,
  deleteConfigSeatType,
  deleteConfigTimeSlot,
  getConfigCreditRules,
  getConfigSeatFacilities,
  getConfigSeatTypes,
  getConfigTimeSlots,
  updateConfigCreditRules,
  updateConfigSeatFacility,
  updateConfigSeatType,
  updateConfigTimeSlot,
} from '@/services/library/config';
import { getFloors } from '@/services/library/floor';
import { getZones } from '@/services/library/zone';
import { PageContainer } from '@ant-design/pro-components';
import { history, useIntl } from '@umijs/max';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Row,
  Space,
  Spin,
  Statistic,
  Switch,
  Table,
  Tag,
  Tabs,
  TimePicker,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import vantIconConfig from '@vant/icons';
import React, { useEffect, useMemo, useState } from 'react';
import '@vant/icons/src/index.less';

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

interface IconGroup {
  key: string;
  label: string;
  icons: string[];
}

const SEARCH_TAG_ICON_GROUPS: IconGroup[] = [
  {
    key: 'basic',
    label: 'Basic',
    icons: vantIconConfig.basic || [],
  },
  {
    key: 'outline',
    label: 'Outline',
    icons: vantIconConfig.outline || [],
  },
  {
    key: 'filled',
    label: 'Filled',
    icons: vantIconConfig.filled || [],
  },
];

function renderVantIcon(icon?: string) {
  const iconName = String(icon || '').trim() || 'search';
  return (
    <Space size={8}>
      <i
        className={`van-icon van-icon-${iconName}`}
        style={{
          color: '#1677ff',
          fontSize: 18,
          lineHeight: 1,
        }}
      />
      <Text code>{iconName}</Text>
    </Space>
  );
}

const SystemConfig: React.FC = () => {
  const intl = useIntl();
  const [timeSlots, setTimeSlots] = useState<TimeSlotItem[]>([]);
  const [timeSlotLoading, setTimeSlotLoading] = useState<boolean>(false);
  const [floors, setFloors] = useState<any[]>([]);
  const [floorsLoading, setFloorsLoading] = useState<boolean>(false);
  const [zones, setZones] = useState<any[]>([]);
  const [zonesLoading, setZonesLoading] = useState<boolean>(false);
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
  const [creditRules, setCreditRules] = useState<any>(null);
  const [creditRulesLoading, setCreditRulesLoading] = useState<boolean>(false);
  const [rulesSaving, setRulesSaving] = useState<boolean>(false);
  const [iconKeyword, setIconKeyword] = useState('');
  const [form] = Form.useForm<TimeSlotItem>();
  const [creditRulesForm] = Form.useForm<any>();
  const [seatConfigForm] = Form.useForm<any>();
  const selectedSeatConfigIcon = String(
    Form.useWatch('icon', seatConfigForm) || 'search',
  ).trim();
  const filteredIconGroups = useMemo(() => {
    const keyword = iconKeyword.trim().toLowerCase();
    const groups = SEARCH_TAG_ICON_GROUPS.map((group) => ({
      ...group,
      icons: group.icons.filter((icon) =>
        keyword ? icon.toLowerCase().includes(keyword) : true,
      ),
    })).filter((group) => group.icons.length > 0);

    if (
      selectedSeatConfigIcon &&
      !groups.some((group) => group.icons.includes(selectedSeatConfigIcon))
    ) {
      groups.unshift({
        key: 'current',
        label: 'Current',
        icons: [selectedSeatConfigIcon],
      });
    }

    return groups;
  }, [iconKeyword, selectedSeatConfigIcon]);

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

  const loadZones = async () => {
    setZonesLoading(true);
    try {
      const res: any = await getZones();
      const list = Array.isArray(res?.data?.list) ? res.data.list : [];
      setZones(list);
    } catch (error) {
      console.error(error);
      setZones([]);
    } finally {
      setZonesLoading(false);
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

  const loadCreditRules = async () => {
    setCreditRulesLoading(true);
    try {
      const res: any = await getConfigCreditRules();
      const data = res?.data || null;
      setCreditRules(data);
      creditRulesForm.setFieldsValue(data || {});
    } catch (error) {
      console.error(error);
      message.error(
        intl.formatMessage({
          id: 'booking.config.creditRules.loadFailed',
          defaultMessage: 'Failed to load credit rules.',
        }),
      );
    } finally {
      setCreditRulesLoading(false);
    }
  };

  const handleSaveCreditRules = async (values: any) => {
    setRulesSaving(true);
    try {
      await updateConfigCreditRules(values);
      message.success(
        intl.formatMessage({
          id: 'booking.config.creditRules.saveSuccess',
          defaultMessage: 'Credit rules saved successfully.',
        }),
      );
      await loadCreditRules();
    } catch (error: any) {
      console.error(error);
      message.error(
        error?.message ||
          intl.formatMessage({
            id: 'booking.config.creditRules.saveFailed',
            defaultMessage: 'Failed to save credit rules.',
          }),
      );
    } finally {
      setRulesSaving(false);
    }
  };

  useEffect(() => {
    loadTimeSlots();
    loadFloors();
    loadZones();
    loadSeatConfigs();
    loadCreditRules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      width: 180,
      fixed: 'right' as const,
      render: (_: any, record: TimeSlotItem) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setCurrentRecord(record);
              form.setFieldsValue({
                ...record,
                startTime: dayjs(record.startTime, 'HH:mm') as any,
                endTime: dayjs(record.endTime, 'HH:mm') as any,
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

  const floorColumns = [
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
        id: 'floor.form.description',
        defaultMessage: 'Description',
      }),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: 'floor.form.totalSeats',
        defaultMessage: 'Total Seats',
      }),
      dataIndex: 'totalSeats',
      key: 'totalSeats',
    },
    {
      title: intl.formatMessage({
        id: 'common.updatedBy',
        defaultMessage: 'Updated By',
      }),
      dataIndex: 'updatedByName',
      key: 'updatedByName',
      render: (value: any) => value || '-',
    },
  ];

  const zoneColumns = [
    {
      title: intl.formatMessage({
        id: 'zone.column.name',
        defaultMessage: 'Area Name',
      }),
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: intl.formatMessage({
        id: 'floor.form.description',
        defaultMessage: 'Description',
      }),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: 'common.status',
        defaultMessage: 'Status',
      }),
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Tag color={status ? 'success' : 'default'}>
          {status
            ? intl.formatMessage({
                id: 'common.enabled',
                defaultMessage: 'Enabled',
              })
            : intl.formatMessage({
                id: 'common.disabled',
                defaultMessage: 'Disabled',
              })}
        </Tag>
      ),
    },
  ];

  const floorSummary = {
    totalFloors: floors.length,
    totalSeats: floors.reduce(
      (sum, item) => sum + Number(item.totalSeats || 0),
      0,
    ),
    totalZones: zones.length,
    activeZones: zones.filter((item: any) => Number(item.status) === 1).length,
  };

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
        icon: String(values.icon || '').trim() || 'search',
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
      setIconKeyword('');
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
                  scroll={{ x: 'max-content' }}
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
                      setIconKeyword('');
                      seatConfigForm.resetFields();
                      seatConfigForm.setFieldsValue({
                        enabled: true,
                        order: 0,
                        icon: 'location-o',
                      });
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
                          id: 'booking.config.icon',
                          defaultMessage: 'Icon',
                        }),
                        dataIndex: 'icon',
                        key: 'icon',
                        render: (value: string) => renderVantIcon(value),
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
                        width: 180,
                        fixed: 'right',
                        render: (_: any, record: any) => (
                          <Space>
                            <Button
                              type="link"
                              onClick={() => {
                                setSeatConfigMode('type');
                                setCurrentSeatConfig(record);
                                setIconKeyword('');
                                seatConfigForm.setFieldsValue({
                                  ...record,
                                  icon: record?.icon || 'search',
                                });
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
                    scroll={{ x: 'max-content' }}
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
                      setIconKeyword('');
                      seatConfigForm.resetFields();
                      seatConfigForm.setFieldsValue({
                        enabled: true,
                        order: 0,
                        icon: 'underway-o',
                      });
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
                          id: 'booking.config.icon',
                          defaultMessage: 'Icon',
                        }),
                        dataIndex: 'icon',
                        key: 'icon',
                        render: (value: string) => renderVantIcon(value),
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
                        width: 180,
                        fixed: 'right',
                        render: (_: any, record: any) => (
                          <Space>
                            <Button
                              type="link"
                              onClick={() => {
                                setSeatConfigMode('facility');
                                setCurrentSeatConfig(record);
                                setIconKeyword('');
                                seatConfigForm.setFieldsValue({
                                  ...record,
                                  icon: record?.icon || 'search',
                                });
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
                    scroll={{ x: 'max-content' }}
                  />
                </Card>
              </Card>
            ),
          },
          {
            key: 'creditRules',
            label: intl.formatMessage({
              id: 'booking.config.tab.creditRules',
              defaultMessage: 'Credit Rules',
            }),
            children: (
              <Card>
                <Title level={5}>
                  {intl.formatMessage({
                    id: 'booking.config.creditRules.title',
                    defaultMessage: 'Credit Rule Settings',
                  })}
                </Title>
                <Paragraph>
                  {intl.formatMessage({
                    id: 'booking.config.creditRules.description',
                    defaultMessage:
                      'Configure the credit rule values used for booking rewards, missed checkout penalties, and violation deductions.',
                  })}
                </Paragraph>
                <Spin spinning={creditRulesLoading}>
                  <Form
                    form={creditRulesForm}
                    layout="vertical"
                    onFinish={handleSaveCreditRules}
                    initialValues={creditRules || {}}
                  >
                    <Form.Item
                      label={intl.formatMessage({
                        id: 'credit.rule.bookingCheckoutReward',
                        defaultMessage: 'Booking checkout reward',
                      })}
                      name="bookingCheckoutRewardPoints"
                      rules={[
                        {
                          required: true,
                          message: intl.formatMessage({
                            id: 'common.required',
                            defaultMessage: 'This field is required',
                          }),
                        },
                      ]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                      label={intl.formatMessage({
                        id: 'credit.rule.activityCheckoutReward',
                        defaultMessage: 'Activity checkout reward',
                      })}
                      name="activityCheckoutRewardPoints"
                      rules={[
                        {
                          required: true,
                          message: intl.formatMessage({
                            id: 'common.required',
                            defaultMessage: 'This field is required',
                          }),
                        },
                      ]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                      label={intl.formatMessage({
                        id: 'credit.rule.activityMissedCheckoutPenalty',
                        defaultMessage: 'Missed checkout penalty',
                      })}
                      name="activityMissedCheckoutPenaltyPoints"
                      rules={[
                        {
                          required: true,
                          message: intl.formatMessage({
                            id: 'common.required',
                            defaultMessage: 'This field is required',
                          }),
                        },
                      ]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                      label={intl.formatMessage({
                        id: 'credit.rule.violationDeduct',
                        defaultMessage: 'Violation deduction',
                      })}
                      name="violationDeductPoints"
                      rules={[
                        {
                          required: true,
                          message: intl.formatMessage({
                            id: 'common.required',
                            defaultMessage: 'This field is required',
                          }),
                        },
                      ]}
                    >
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item>
                      <Space>
                        <Button
                          type="primary"
                          htmlType="submit"
                          loading={rulesSaving}
                        >
                          {intl.formatMessage({
                            id: 'booking.config.creditRules.save',
                            defaultMessage: 'Save Credit Rules',
                          })}
                        </Button>
                        <Button
                          onClick={() => {
                            creditRulesForm.resetFields();
                            creditRulesForm.setFieldsValue(creditRules || {});
                          }}
                        >
                          {intl.formatMessage({
                            id: 'common.reset',
                            defaultMessage: 'Reset',
                          })}
                        </Button>
                      </Space>
                    </Form.Item>
                  </Form>
                </Spin>
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
                      '楼层与区域配置可在此处统一规划，确保座位展示与管理页面保持一致。',
                  })}
                </Paragraph>
                <Row gutter={16} style={{ marginBottom: 16 }}>
                  <Col xs={24} sm={12} lg={6}>
                    <Card type="inner">
                      <Statistic
                        title={intl.formatMessage({
                          id: 'booking.config.floorRules.totalFloors',
                          defaultMessage: 'Total Floors',
                        })}
                        value={floorSummary.totalFloors}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card type="inner">
                      <Statistic
                        title={intl.formatMessage({
                          id: 'booking.config.floorRules.totalSeats',
                          defaultMessage: 'Total Seats',
                        })}
                        value={floorSummary.totalSeats}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card type="inner">
                      <Statistic
                        title={intl.formatMessage({
                          id: 'booking.config.floorRules.totalZones',
                          defaultMessage: 'Total Areas',
                        })}
                        value={floorSummary.totalZones}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} lg={6}>
                    <Card type="inner">
                      <Statistic
                        title={intl.formatMessage({
                          id: 'booking.config.floorRules.activeZones',
                          defaultMessage: 'Active Areas',
                        })}
                        value={floorSummary.activeZones}
                      />
                    </Card>
                  </Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} lg={12}>
                    <Card
                      type="inner"
                      title={intl.formatMessage({
                        id: 'booking.config.floorRules.floorCardTitle',
                        defaultMessage: 'Floor Overview',
                      })}
                    >
                      {floorsLoading ? (
                        <Spin />
                      ) : (
                        <Table
                          rowKey="id"
                          dataSource={floors}
                          pagination={false}
                          columns={floorColumns}
                          scroll={{ x: 'max-content' }}
                        />
                      )}
                    </Card>
                  </Col>
                  <Col xs={24} lg={12}>
                    <Card
                      type="inner"
                      title={intl.formatMessage({
                        id: 'booking.config.floorRules.zoneCardTitle',
                        defaultMessage: 'Area Management',
                      })}
                    >
                      {zonesLoading ? (
                        <Spin />
                      ) : (
                        <Table
                          rowKey="id"
                          dataSource={zones}
                          pagination={false}
                          columns={zoneColumns}
                          scroll={{ x: 'max-content' }}
                        />
                      )}
                    </Card>
                  </Col>
                </Row>
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
          setIconKeyword('');
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
          initialValues={{ enabled: true, order: 0, icon: 'search' }}
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
              id: 'booking.config.icon',
              defaultMessage: 'Icon',
            })}
            required
          >
            <>
              <Form.Item name="icon" rules={[{ required: true }]} noStyle>
                <Input type="hidden" />
              </Form.Item>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Input
                  allowClear
                  value={iconKeyword}
                  onChange={(e) => setIconKeyword(e.target.value)}
                  placeholder={intl.formatMessage({
                    id: 'booking.config.icon.searchPlaceholder',
                    defaultMessage: 'Search icon name',
                  })}
                />

                <div
                  style={{
                    maxHeight: 320,
                    overflowY: 'auto',
                    border: '1px solid #f0f0f0',
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  {filteredIconGroups.length === 0 ? (
                    <Text type="secondary">
                      {intl.formatMessage({
                        id: 'booking.config.icon.empty',
                        defaultMessage: 'No icons found',
                      })}
                    </Text>
                  ) : (
                    filteredIconGroups.map((group) => (
                      <div key={group.key} style={{ marginBottom: 16 }}>
                        <Text
                          type="secondary"
                          style={{ display: 'block', marginBottom: 8 }}
                        >
                          {group.label}
                        </Text>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns:
                              'repeat(auto-fill, minmax(96px, 1fr))',
                            gap: 8,
                          }}
                        >
                          {group.icons.map((icon) => {
                            const selected = selectedSeatConfigIcon === icon;
                            return (
                              <button
                                key={`${group.key}-${icon}`}
                                type="button"
                                onClick={() =>
                                  seatConfigForm.setFieldsValue({ icon })
                                }
                                style={{
                                  border: selected
                                    ? '1px solid #1677ff'
                                    : '1px solid #d9d9d9',
                                  borderRadius: 8,
                                  background: selected ? '#e6f4ff' : '#fff',
                                  minHeight: 82,
                                  padding: '8px 6px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'center',
                                  alignItems: 'center',
                                  gap: 6,
                                }}
                              >
                                <i
                                  className={`van-icon van-icon-${icon}`}
                                  style={{
                                    color: '#1677ff',
                                    fontSize: 20,
                                    lineHeight: 1,
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: 12,
                                    color: '#666',
                                    lineHeight: '16px',
                                    textAlign: 'center',
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {icon}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Text type="secondary">
                  {intl.formatMessage({
                    id: 'booking.config.icon.selected',
                    defaultMessage: 'Selected icon',
                  })}
                  : <Text code>{selectedSeatConfigIcon || '-'}</Text>
                </Text>
              </Space>
            </>
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
