import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, Input, message, Modal, Space, Tag } from 'antd';
import React, { useRef } from 'react';
import {
  approvePhoneChangeRequest,
  getPhoneChangeRequests,
  rejectPhoneChangeRequest,
} from '../../../services/library/phoneChangeRequest';

interface PhoneChangeRequestType {
  id: string;
  userId: {
    id: string;
    username: string;
    name?: string;
    studentId?: string;
  };
  oldPhone?: string;
  newPhone: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewerName?: string;
  reviewComment?: string;
  reviewedAt?: string;
  createdAt: string;
}

const PhoneChangeRequests: React.FC = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();

  const handleApprove = async (record: PhoneChangeRequestType) => {
    let comment = '';
    Modal.confirm({
      title: intl.formatMessage({
        id: 'phoneChangeRequest.approveConfirmTitle',
        defaultMessage: 'Approve phone change request?',
      }),
      content: (
        <Input.TextArea
          rows={4}
          placeholder={intl.formatMessage({
            id: 'phoneChangeRequest.reviewCommentPlaceholder',
            defaultMessage: 'Optional approval comment',
          })}
          onChange={(e) => {
            comment = e.target.value;
          }}
        />
      ),
      onOk: async () => {
        try {
          await approvePhoneChangeRequest(record.id, comment);
          message.success(
            intl.formatMessage({
              id: 'phoneChangeRequest.approveSuccess',
              defaultMessage: 'Approved successfully',
            }),
          );
          actionRef.current?.reload?.();
        } catch (error: any) {
          message.error(
            error?.message ||
              intl.formatMessage({
                id: 'phoneChangeRequest.approveFailed',
                defaultMessage: 'Approval failed, please try again',
              }),
          );
        }
      },
    });
  };

  const handleReject = async (record: PhoneChangeRequestType) => {
    let comment = '';
    Modal.confirm({
      title: intl.formatMessage({
        id: 'phoneChangeRequest.rejectConfirmTitle',
        defaultMessage: 'Reject phone change request?',
      }),
      content: (
        <Input.TextArea
          rows={4}
          placeholder={intl.formatMessage({
            id: 'phoneChangeRequest.reviewCommentPlaceholder',
            defaultMessage: 'Optional rejection comment',
          })}
          onChange={(e) => {
            comment = e.target.value;
          }}
        />
      ),
      onOk: async () => {
        try {
          await rejectPhoneChangeRequest(record.id, comment);
          message.success(
            intl.formatMessage({
              id: 'phoneChangeRequest.rejectSuccess',
              defaultMessage: 'Rejected successfully',
            }),
          );
          actionRef.current?.reload?.();
        } catch (error: any) {
          message.error(
            error?.message ||
              intl.formatMessage({
                id: 'phoneChangeRequest.rejectFailed',
                defaultMessage: 'Rejection failed, please try again',
              }),
          );
        }
      },
    });
  };

  const columns: ProColumns<PhoneChangeRequestType>[] = [
    {
      title: intl.formatMessage({
        id: 'phoneChangeRequest.column.requester',
        defaultMessage: 'Requester',
      }),
      dataIndex: ['userId', 'name'],
      width: 260,
      render: (_, record) => (
        <div>
          <div>{record.userName || '-'}</div>
          <div style={{ color: '#999', fontSize: 12 }}>
            {record.userId?.username}
            {record.userId?.studentId ? ` · ${record.userId.studentId}` : ''}
          </div>
        </div>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'phoneChangeRequest.column.currentPhone',
        defaultMessage: 'Current Phone',
      }),
      dataIndex: 'oldPhone',
      width: 160,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: 'phoneChangeRequest.column.requestedPhone',
        defaultMessage: 'Requested Phone',
      }),
      dataIndex: 'newPhone',
      width: 160,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: 'phoneChangeRequest.column.reason',
        defaultMessage: 'Reason',
      }),
      dataIndex: 'reason',
      width: 260,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: 'phoneChangeRequest.column.reviewer',
        defaultMessage: 'Reviewer',
      }),
      dataIndex: 'reviewerName',
      width: 180,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: 'phoneChangeRequest.column.reviewComment',
        defaultMessage: 'Review Comment',
      }),
      dataIndex: 'reviewComment',
      width: 260,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: 'phoneChangeRequest.column.status',
        defaultMessage: 'Status',
      }),
      dataIndex: 'status',
      width: 120,
      valueType: 'select',
      valueEnum: {
        pending: {
          text: intl.formatMessage({
            id: 'phoneChangeRequest.status.pending',
            defaultMessage: 'Pending',
          }),
          status: 'Warning',
        },
        approved: {
          text: intl.formatMessage({
            id: 'phoneChangeRequest.status.approved',
            defaultMessage: 'Approved',
          }),
          status: 'Success',
        },
        rejected: {
          text: intl.formatMessage({
            id: 'phoneChangeRequest.status.rejected',
            defaultMessage: 'Rejected',
          }),
          status: 'Error',
        },
      },
    },
    {
      title: intl.formatMessage({
        id: 'phoneChangeRequest.column.reviewedAt',
        defaultMessage: 'Reviewed At',
      }),
      dataIndex: 'reviewedAt',
      width: 180,
      valueType: 'dateTime',
    },
    {
      title: intl.formatMessage({
        id: 'common.action',
        defaultMessage: 'Action',
      }),
      valueType: 'option',
      width: 180,
      render: (_, record) => (
        <Space>
          {record.status === 'pending' ? (
            <>
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(record)}
              >
                {intl.formatMessage({
                  id: 'phoneChangeRequest.action.approve',
                  defaultMessage: 'Approve',
                })}
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleReject(record)}
              >
                {intl.formatMessage({
                  id: 'phoneChangeRequest.action.reject',
                  defaultMessage: 'Reject',
                })}
              </Button>
            </>
          ) : (
            <Tag color={record.status === 'approved' ? 'green' : 'red'}>
              {intl.formatMessage({
                id:
                  record.status === 'approved'
                    ? 'phoneChangeRequest.status.approved'
                    : 'phoneChangeRequest.status.rejected',
                defaultMessage:
                  record.status === 'approved' ? 'Approved' : 'Rejected',
              })}
            </Tag>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'menu.phoneChangeRequests',
        defaultMessage: 'Phone Change Requests',
      })}
    >
      <ProTable<PhoneChangeRequestType>
        headerTitle={intl.formatMessage({
          id: 'phoneChangeRequest.listTitle',
          defaultMessage: 'Phone change requests',
        })}
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
        request={async (params) => {
          const response: any = await getPhoneChangeRequests({
            page: params.current,
            limit: params.pageSize,
            status: params.status,
            q: params?.q,
          });
          return {
            data: response?.data?.list || [],
            success: !!response?.success,
            total: response?.data?.total || 0,
          };
        }}
        columns={columns}
        rowSelection={{}}
        scroll={{ x: 1400 }}
      />
    </PageContainer>
  );
};

export default PhoneChangeRequests;
