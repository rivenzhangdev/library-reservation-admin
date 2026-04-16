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

interface StudentIdChangeRequestType {
  id: string;
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

  const handleApprove = async (record: StudentIdChangeRequestType) => {
    Modal.confirm({
      title: intl.formatMessage({
        id: 'studentIdChangeRequest.approveConfirmTitle',
        defaultMessage: 'Approve student ID change request?',
      }),
      content: intl.formatMessage({
        id: 'studentIdChangeRequest.approveConfirmContent',
        defaultMessage:
          'Approve this request and update the student ID for the user after review.',
      }),
      onOk: async () => {
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
    Modal.confirm({
      title: intl.formatMessage({
        id: 'studentIdChangeRequest.rejectConfirmTitle',
        defaultMessage: 'Reject student ID change request?',
      }),
      content: intl.formatMessage({
        id: 'studentIdChangeRequest.rejectConfirmContent',
        defaultMessage:
          'Reject this request and keep the existing student ID unchanged.',
      }),
      onOk: async () => {
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
        id: 'studentIdChangeRequest.column.currentStudentId',
        defaultMessage: 'Current Student ID',
      }),
      dataIndex: 'oldStudentId',
      width: 140,
      ellipsis: true,
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
      dataIndex: 'oldName',
      width: 140,
      ellipsis: true,
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
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
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
        scroll={{ x: 1400 }}
      />
    </PageContainer>
  );
};

export default StudentIdChangeRequests;
