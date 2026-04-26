import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Button, message, Modal, Space, Tag } from 'antd';
import React, { useRef } from 'react';
import {
  approveStudentIdChangeRequest,
  getStudentIdChangeRequests,
  rejectStudentIdChangeRequest,
} from '../../../services/library/studentIdChangeRequest';
import {
  STANDARD_ACTION_COLUMN,
  STANDARD_TABLE_SCROLL,
  STANDARD_TABLE_SEARCH,
} from '../../../utils/table';

interface StudentIdChangeRequestType {
  id: string;
  userName?: string;
  userId: {
    id: string;
    username: string;
    name?: string;
    studentId?: string;
  };
  oldStudentId?: string;
  oldName?: string;
  newStudentId: string;
  newRealName: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewerName?: string;
  reviewComment?: string;
  reviewedAt?: string;
  createdAt: string;
}

const StudentIdChangeRequests: React.FC = () => {
  const intl = useIntl();
  const actionRef = useRef<ActionType>();

  const openReviewConfirm = (params: {
    action: 'approve' | 'reject';
    record: StudentIdChangeRequestType;
    onConfirm: () => Promise<void>;
  }) => {
    const { action, record, onConfirm } = params;
    const isApprove = action === 'approve';

    Modal.confirm({
      title: intl.formatMessage({
        id: isApprove
          ? 'studentIdChangeRequest.approveConfirmTitle'
          : 'studentIdChangeRequest.rejectConfirmTitle',
        defaultMessage: isApprove
          ? 'Approve student ID change request?'
          : 'Reject student ID change request?',
      }),
      content: (
        <div>
          <div style={{ marginBottom: 8 }}>
            {intl.formatMessage({
              id: isApprove
                ? 'studentIdChangeRequest.approveConfirmContent'
                : 'studentIdChangeRequest.rejectConfirmContent',
              defaultMessage: isApprove
                ? 'Approve this request and transfer the student ID to the requester. If the student ID is currently bound by another user, the previous binding will be removed automatically.'
                : 'Reject this request and keep the existing student ID unchanged.',
            })}
          </div>
          <div style={{ color: '#666' }}>
            {record.userId?.name || '-'} · {record.newStudentId} ·{' '}
            {record.newRealName}
          </div>
        </div>
      ),
      okText: intl.formatMessage({
        id: isApprove
          ? 'studentIdChangeRequest.action.approve'
          : 'studentIdChangeRequest.action.reject',
        defaultMessage: isApprove ? 'Approve' : 'Reject',
      }),
      okButtonProps: isApprove ? undefined : { danger: true },
      cancelText: intl.formatMessage({
        id: 'common.cancel',
        defaultMessage: 'Cancel',
      }),
      onOk: onConfirm,
    });
  };

  const handleApprove = async (record: StudentIdChangeRequestType) => {
    openReviewConfirm({
      action: 'approve',
      record,
      onConfirm: async () => {
        try {
          await approveStudentIdChangeRequest(record.id);
          message.success(
            intl.formatMessage({
              id: 'studentIdChangeRequest.approveSuccess',
              defaultMessage: 'Approved successfully',
            }),
          );
          actionRef.current?.reload?.();
        } catch (error: any) {
          message.error(
            error?.message ||
              intl.formatMessage({
                id: 'studentIdChangeRequest.approveFailed',
                defaultMessage: 'Approval failed, please try again',
              }),
          );
        }
      },
    });
  };

  const handleReject = async (record: StudentIdChangeRequestType) => {
    openReviewConfirm({
      action: 'reject',
      record,
      onConfirm: async () => {
        try {
          await rejectStudentIdChangeRequest(record.id);
          message.success(
            intl.formatMessage({
              id: 'studentIdChangeRequest.rejectSuccess',
              defaultMessage: 'Rejected successfully',
            }),
          );
          actionRef.current?.reload?.();
        } catch (error: any) {
          message.error(
            error?.message ||
              intl.formatMessage({
                id: 'studentIdChangeRequest.rejectFailed',
                defaultMessage: 'Rejection failed, please try again',
              }),
          );
        }
      },
    });
  };

  const columns: ProColumns<StudentIdChangeRequestType>[] = [
    {
      title: intl.formatMessage({
        id: 'studentIdChangeRequest.column.requester',
        defaultMessage: 'Requester',
      }),
      dataIndex: ['userId', 'name'],
      width: 240,
      render: (_, record) => (
        <div>
          <div>{record.userId?.name || record.userName || '-'}</div>
          <div style={{ color: '#999', fontSize: 12 }}>
            {(record.userId?.username || record.userName || '-').toString()}
            {record.userId?.studentId ? ` · ${record.userId.studentId}` : ''}
          </div>
        </div>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'studentIdChangeRequest.column.oldStudentId',
        defaultMessage: 'Student ID Before Request',
      }),
      dataIndex: 'oldStudentId',
      width: 160,
      ellipsis: true,
      render: (_, record) => record.oldStudentId || '-',
    },
    {
      title: intl.formatMessage({
        id: 'studentIdChangeRequest.column.currentStudentId',
        defaultMessage: 'Current Student ID',
      }),
      width: 140,
      ellipsis: true,
      render: (_, record) => record.userId?.studentId || '-',
    },
    {
      title: intl.formatMessage({
        id: 'studentIdChangeRequest.column.requestedStudentId',
        defaultMessage: 'Requested Student ID',
      }),
      dataIndex: 'newStudentId',
      width: 140,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: 'studentIdChangeRequest.column.currentName',
        defaultMessage: 'Current Name',
      }),
      width: 140,
      ellipsis: true,
      render: (_, record) => {
        const current = record.userId?.name || record.oldName;
        const oldValue = record.oldName;
        return (
          <div>
            <div>{current || '-'}</div>
            {record.userId?.name &&
            oldValue &&
            record.userId.name !== oldValue ? (
              <div style={{ color: '#999', fontSize: 12 }}>
                {intl.formatMessage({
                  id: 'studentIdChangeRequest.column.requestSnapshot',
                  defaultMessage: 'Requested snapshot:',
                })}{' '}
                {oldValue}
              </div>
            ) : null}
          </div>
        );
      },
    },
    {
      title: intl.formatMessage({
        id: 'studentIdChangeRequest.column.requestedName',
        defaultMessage: 'Requested Name',
      }),
      dataIndex: 'newRealName',
      width: 180,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: 'studentIdChangeRequest.column.reason',
        defaultMessage: 'Reason',
      }),
      dataIndex: 'reason',
      width: 260,
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: 'studentIdChangeRequest.column.status',
        defaultMessage: 'Status',
      }),
      dataIndex: 'status',
      width: 120,
      valueType: 'select',
      valueEnum: {
        pending: {
          text: intl.formatMessage({
            id: 'studentIdChangeRequest.status.pending',
            defaultMessage: 'Pending',
          }),
          status: 'Warning',
        },
        approved: {
          text: intl.formatMessage({
            id: 'studentIdChangeRequest.status.approved',
            defaultMessage: 'Approved',
          }),
          status: 'Success',
        },
        rejected: {
          text: intl.formatMessage({
            id: 'studentIdChangeRequest.status.rejected',
            defaultMessage: 'Rejected',
          }),
          status: 'Error',
        },
      },
    },
    {
      title: intl.formatMessage({
        id: 'studentIdChangeRequest.column.reviewedAt',
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
      ...STANDARD_ACTION_COLUMN,
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
                  id: 'studentIdChangeRequest.action.approve',
                  defaultMessage: 'Approve',
                })}
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                onClick={() => handleReject(record)}
              >
                {intl.formatMessage({
                  id: 'studentIdChangeRequest.action.reject',
                  defaultMessage: 'Reject',
                })}
              </Button>
            </>
          ) : (
            <Tag color={record.status === 'approved' ? 'green' : 'red'}>
              {intl.formatMessage({
                id:
                  record.status === 'approved'
                    ? 'studentIdChangeRequest.status.approved'
                    : 'studentIdChangeRequest.status.rejected',
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
        id: 'menu.studentIdChangeRequests',
        defaultMessage: 'Student ID Change Requests',
      })}
    >
      <ProTable<StudentIdChangeRequestType>
        headerTitle={intl.formatMessage({
          id: 'studentIdChangeRequest.listTitle',
          defaultMessage: 'Student ID change requests',
        })}
        actionRef={actionRef}
        rowKey="id"
        search={STANDARD_TABLE_SEARCH}
        request={async (params) => {
          const response: any = await getStudentIdChangeRequests({
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
        scroll={STANDARD_TABLE_SCROLL}
      />
    </PageContainer>
  );
};

export default StudentIdChangeRequests;
