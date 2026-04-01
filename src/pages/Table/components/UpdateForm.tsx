import {
  ProFormDateTimePicker,
  ProFormRadio,
  ProFormSelect,
  ProFormText,
  ProFormTextArea,
  StepsForm,
} from '@ant-design/pro-components';
import { useIntl } from '@umijs/max';
import { Modal } from 'antd';
import React from 'react';

export interface FormValueType extends Partial<API.UserInfo> {
  target?: string;
  template?: string;
  type?: string;
  time?: string;
  frequency?: string;
}

export interface UpdateFormProps {
  onCancel: (flag?: boolean, formVals?: FormValueType) => void;
  onSubmit: (values: FormValueType) => Promise<void>;
  updateModalVisible: boolean;
  values: Partial<API.UserInfo>;
}

const UpdateForm: React.FC<UpdateFormProps> = (props) => {
  const intl = useIntl();
  return (
    <StepsForm
      stepsProps={{
        size: 'small',
      }}
      stepsFormRender={(dom, submitter) => {
        return (
          <Modal
            width={640}
            bodyStyle={{ padding: '32px 40px 48px' }}
            destroyOnClose
            title={intl.formatMessage({
              id: 'table.update.title',
              defaultMessage: '规则配置',
            })}
            open={props.updateModalVisible}
            footer={submitter}
            onCancel={() => props.onCancel()}
          >
            {dom}
          </Modal>
        );
      }}
      onFinish={props.onSubmit}
    >
      <StepsForm.StepForm
        initialValues={{
          name: props.values.name,
          nickName: props.values.nickName,
        }}
        title={intl.formatMessage({
          id: 'table.update.step.basic',
          defaultMessage: '基本信息',
        })}
      >
        <ProFormText
          width="md"
          name="name"
          label={intl.formatMessage({
            id: 'table.update.field.name',
            defaultMessage: '规则名称',
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'table.update.field.nameRequired',
                defaultMessage: '请输入规则名称！',
              }),
            },
          ]}
        />
        <ProFormTextArea
          name="desc"
          width="md"
          label={intl.formatMessage({
            id: 'table.update.field.desc',
            defaultMessage: '规则描述',
          })}
          placeholder="请输入至少五个字符"
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'table.update.field.descRequired',
                defaultMessage: '请输入至少五个字符的规则描述！',
              }),
              min: 5,
            },
          ]}
        />
      </StepsForm.StepForm>
      <StepsForm.StepForm
        initialValues={{
          target: '0',
          template: '0',
        }}
        title={intl.formatMessage({
          id: 'table.update.step.config',
          defaultMessage: '配置规则属性',
        })}
      >
        <ProFormSelect
          width="md"
          name="target"
          label={intl.formatMessage({
            id: 'table.update.field.target',
            defaultMessage: '监控对象',
          })}
          valueEnum={{
            0: '表一',
            1: '表二',
          }}
        />
        <ProFormSelect
          width="md"
          name="template"
          label={intl.formatMessage({
            id: 'table.update.field.template',
            defaultMessage: '规则模板',
          })}
          valueEnum={{
            0: '规则模板一',
            1: '规则模板二',
          }}
        />
        <ProFormRadio.Group
          name="type"
          width="md"
          label={intl.formatMessage({
            id: 'table.update.field.type',
            defaultMessage: '规则类型',
          })}
          options={[
            {
              value: '0',
              label: intl.formatMessage({
                id: 'table.value.strong',
                defaultMessage: '强',
              }),
            },
            {
              value: '1',
              label: intl.formatMessage({
                id: 'table.value.weak',
                defaultMessage: '弱',
              }),
            },
          ]}
        />
      </StepsForm.StepForm>
      <StepsForm.StepForm
        initialValues={{
          type: '1',
          frequency: 'month',
        }}
        title={intl.formatMessage({
          id: 'table.update.step.schedule',
          defaultMessage: '设定调度周期',
        })}
      >
        <ProFormDateTimePicker
          name="time"
          label={intl.formatMessage({
            id: 'table.schedule.startTime',
            defaultMessage: '开始时间',
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'table.schedule.startTimeRequired',
                defaultMessage: '请选择开始时间！',
              }),
            },
          ]}
        />
        <ProFormSelect
          name="frequency"
          label={intl.formatMessage({
            id: 'table.update.field.target',
            defaultMessage: '监控对象',
          })}
          width="xs"
          valueEnum={{
            month: '月',
            week: '周',
          }}
        />
      </StepsForm.StepForm>
    </StepsForm>
  );
};

export default UpdateForm;
