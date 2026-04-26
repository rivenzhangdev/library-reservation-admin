import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import {
  Button,
  Descriptions,
  Drawer,
  Input,
  message,
  Modal,
  Space,
} from 'antd';
import React, { useMemo, useRef, useState } from 'react';
import {
  approveBookingChangeRequest,
  getBookingChangeRequestsAdmin,
  rejectBookingChangeRequest,
} from '@/services/library/bookingChangeRequest';
import { STANDARD_TABLE_SCROLL, STANDARD_TABLE_SEARCH } from '@/utils/table';

interface ChangeRequestItem {
  id: number;
  bookingId: number;
  userId: string;
  userName?: string;
  changeType: 'cancel' | 'reschedule' | 'seat_change';
  status: 'pending' | 'approved' | 'rejected' | 'auto_approved';
  reason?: string;
  reviewComment?: string;
  reviewerName?: string;
  reviewedAt?: string;
  createdAt?: string;
  targetDate?: string;
  targetTimeSlot?: number;
  targetTimeSlotLabel?: string;
  targetSeatId?: number;
  targetSeatLabel?: string;
}

const ApprovalPage: React.FC = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();
  const [detailOpen, setDetailOpen] = useState(false);
  const [activeItem, setActiveItem] = useState<ChangeRequestItem | null>(null);

  const statusValueEnum = useMemo(
    () => ({
      pending: {
        text: intl.formatMessage({ id: 'approval.status.pending' }),
        status: 'Warning' as const,
      },
      approved: {
        text: intl.formatMessage({ id: 'approval.status.approved' }),
        status: 'Success' as const,
      },
      rejected: {
        text: intl.formatMessage({ id: 'approval.status.rejected' }),
        status: 'Error' as const,
      },
      auto_approved: {
        text: intl.formatMessage({ id: 'approval.status.auto_approved' }),
        status: 'Processing' as const,
      },
    }),
    [intl],
  );

  const typeValueEnum = useMemo(
    () => ({
      cancel: {
        text: intl.formatMessage({ id: 'approval.changeType.cancel' }),
      },
      reschedule: {
        text: intl.formatMessage({ id: 'approval.changeType.reschedule' }),
      },
      seat_change: {
        text: intl.formatMessage({ id: 'approval.changeType.seat_change' }),
      },
    }),
    [intl],
  );

  const onApprove = (record: ChangeRequestItem) => {
    let reviewComment = '';
    Modal.confirm({
      title: intl.formatMessage({ id: 'approval.action.approveTitle' }),
      content: (
        <Input.TextArea
          rows={4}
          placeholder={intl.formatMessage({
            id: 'approval.action.approvePlaceholder',
          })}
          onChange={(e) => {
            reviewComment = e.target.value;
          }}
        />
      ),
      onOk: async () => {
        try {
          await approveBookingChangeRequest(record.id, reviewComment);
          message.success(
            intl.formatMessage({ id: 'approval.action.successApprove' }),
          );
          actionRef.current?.reload?.();
        } catch (error: any) {
          message.error(
            error?.message ||
              intl.formatMessage({ id: 'approval.action.failedApprove' }),
          );
        }
      },
    });
  };

  const onReject = (record: ChangeRequestItem) => {
    let reviewComment = '';
    Modal.confirm({
      title: intl.formatMessage({ id: 'approval.action.rejectTitle' }),
      content: (
        <Input.TextArea
          rows={4}
          placeholder={intl.formatMessage({
            id: 'approval.action.rejectPlaceholder',
          })}
          onChange={(e) => {
            reviewComment = e.target.value;
          }}
        />
      ),
      onOk: async () => {
        try {
          await rejectBookingChangeRequest(record.id, reviewComment);
          message.success(
            intl.formatMessage({ id: 'approval.action.successReject' }),
          );
          actionRef.current?.reload?.();
        } catch (error: any) {
          message.error(
            error?.message ||
              intl.formatMessage({ id: 'approval.action.failedReject' }),
          );
        }
      },
    });
  };

  const getTargetText = (record: ChangeRequestItem) => {
    if (record.changeType === 'cancel') {
      return intl.formatMessage({ id: 'approval.changeType.cancel' });
    }

    if (record.changeType === 'reschedule') {
      const slotLabel =
        record.targetTimeSlotLabel ||
        intl.formatMessage(
          { id: 'approval.target.timeSlot', defaultMessage: 'Slot {slot}' },
          { slot: String(record.targetTimeSlot ?? '-') },
        );
      return `${record.targetDate || '-'} ${slotLabel}`;
    }

    if (record.targetSeatLabel) {
      return record.targetSeatLabel;
    }

    return intl.formatMessage(
      { id: 'approval.target.seat', defaultMessage: 'Seat #{id}' },
      { id: String(record.targetSeatId || '-') },
    );
  };

  const columns: ProColumns<ChangeRequestItem>[] = [
    {
      title: intl.formatMessage({ id: 'approval.column.id' }),
      dataIndex: 'id',
      width: 90,
      search: false,
    },
    {
      title: intl.formatMessage({ id: 'approval.column.user' }),
      dataIndex: 'userId',
      width: 220,
      render: (_, record) => (
        <div>
          <div>{record.userName || '-'}</div>
          <div style={{ color: '#999', fontSize: 12 }}>
            {record.userId || '-'}
          </div>
        </div>
      ),
      fieldProps: {
        placeholder: intl.formatMessage({
          id: 'approval.filter.userIdPlaceholder',
        }),
      },
    },
    {
      title: intl.formatMessage({ id: 'approval.column.type' }),
      dataIndex: 'changeType',
      width: 140,
      valueType: 'select',
      valueEnum: typeValueEnum,
    },
    {
      title: intl.formatMessage({ id: 'approval.column.status' }),
      dataIndex: 'status',
      width: 140,
      valueType: 'select',
      valueEnum: statusValueEnum,
    },
    {
      title: intl.formatMessage({ id: 'approval.column.reason' }),
      dataIndex: 'reason',
      search: false,
      ellipsis: true,
      width: 260,
    },
    {
      title: intl.formatMessage({ id: 'approval.column.createdAt' }),
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      width: 180,
      search: false,
    },
    {
      title: intl.formatMessage({ id: 'common.action' }),
      valueType: 'option',
      width: 260,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setActiveItem(record);
              setDetailOpen(true);
            }}
          >
            {intl.formatMessage({ id: 'approval.action.view' })}
          </Button>
          {record.status === 'pending' ? (
            <>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => onApprove(record)}
              >
                {intl.formatMessage({ id: 'approval.action.approve' })}
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => onReject(record)}
              >
                {intl.formatMessage({ id: 'approval.action.reject' })}
              </Button>
            </>
          ) : null}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer title={intl.formatMessage({ id: 'approval.pageTitle' })}>
      <ProTable<ChangeRequestItem>
        rowKey="id"
        actionRef={actionRef}
        search={STANDARD_TABLE_SEARCH}
        scroll={STANDARD_TABLE_SCROLL}
        columns={columns}
        request={async (params) => {
          try {
            const response: any = await getBookingChangeRequestsAdmin({
              page: params.current,
              pageSize: params.pageSize,
              status: params.status,
              userId: params.userId,
              changeType: params.changeType,
            });

            const payload = response?.data || {};
            const list = Array.isArray(payload.list)
              ? payload.list
              : Array.isArray(payload.requests)
              ? payload.requests
              : [];
            const normalizedList = list.map((item: any) => ({
              ...item,
              createdAt: item?.createdAt || item?.created_at,
              reviewedAt: item?.reviewedAt || item?.reviewed_at,
              reviewComment: item?.reviewComment || item?.review_comment,
              reviewerName: item?.reviewerName || item?.reviewer_name,
            }));
            const total = Number(payload.total || list.length);
            return {
              success: response?.success !== false,
              data: normalizedList,
              total,
            };
          } catch (error: any) {
            const backendMessage =
              error?.data?.error?.message ||
              error?.data?.message ||
              error?.message;
            const backendCode = error?.code || error?.data?.error?.code;
            message.error(
              backendCode
                ? `${intl.formatMessage({ id: 'common.operationFailed' })}: ${
                    backendMessage || '-'
                  } (${backendCode})`
                : `${intl.formatMessage({ id: 'common.operationFailed' })}: ${
                    backendMessage || '-'
                  }`,
            );
            return {
              success: false,
              data: [],
              total: 0,
            };
          }
        }}
      />

      <Drawer
        title={intl.formatMessage({ id: 'approval.detail.title' })}
        width={640}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setActiveItem(null);
        }}
      >
        {activeItem ? (
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item
              label={intl.formatMessage({ id: 'approval.column.id' })}
            >
              {activeItem.id}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'approval.column.user' })}
            >
              {activeItem.userName || activeItem.userId || '-'}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'approval.column.type' })}
            >
              {typeValueEnum[activeItem.changeType]?.text ||
                activeItem.changeType}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'approval.column.status' })}
            >
              {statusValueEnum[activeItem.status]?.text || activeItem.status}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'approval.column.target' })}
            >
              {getTargetText(activeItem)}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'approval.column.reason' })}
            >
              {activeItem.reason || '-'}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({
                id: 'approval.column.reviewComment',
              })}
            >
              {activeItem.reviewComment || '-'}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'approval.column.reviewer' })}
            >
              {activeItem.reviewerName || '-'}
            </Descriptions.Item>
            <Descriptions.Item
              label={intl.formatMessage({ id: 'approval.column.reviewedAt' })}
            >
              {activeItem.reviewedAt || '-'}
            </Descriptions.Item>
          </Descriptions>
        ) : null}
      </Drawer>
    </PageContainer>
  );
};

export default ApprovalPage;
