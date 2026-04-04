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
              defaultMessage: 'Rule configuration',
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
          defaultMessage: 'Basic info',
        })}
      >
        <ProFormText
          width="md"
          name="name"
          label={intl.formatMessage({
            id: 'table.update.field.name',
            defaultMessage: 'Rule name',
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'table.update.field.nameRequired',
                defaultMessage: 'Please enter rule name!',
              }),
            },
          ]}
        />
        <ProFormTextArea
          name="desc"
          width="md"
          label={intl.formatMessage({
            id: 'table.update.field.desc',
            defaultMessage: 'Rule description',
          })}
          placeholder={intl.formatMessage({
            id: 'table.update.field.descPlaceholder',
            defaultMessage: 'Please enter at least five characters',
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'table.update.field.descRequired',
                defaultMessage:
                  'Please enter a rule description at least five characters long!',
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
          defaultMessage: 'Configure rule properties',
        })}
      >
        <ProFormSelect
          width="md"
          name="target"
          label={intl.formatMessage({
            id: 'table.update.field.target',
            defaultMessage: 'Target',
          })}
          valueEnum={{
            0: intl.formatMessage({
              id: 'table.value.tableOne',
              defaultMessage: 'Table one',
            }),
            1: intl.formatMessage({
              id: 'table.value.tableTwo',
              defaultMessage: 'Table two',
            }),
          }}
        />
        <ProFormSelect
          width="md"
          name="template"
          label={intl.formatMessage({
            id: 'table.update.field.template',
            defaultMessage: 'Rule template',
          })}
          valueEnum={{
            0: intl.formatMessage({
              id: 'table.value.templateOne',
              defaultMessage: 'Template one',
            }),
            1: intl.formatMessage({
              id: 'table.value.templateTwo',
              defaultMessage: 'Template two',
            }),
          }}
        />
        <ProFormRadio.Group
          name="type"
          width="md"
          label={intl.formatMessage({
            id: 'table.update.field.type',
            defaultMessage: 'Rule type',
          })}
          options={[
            {
              value: '0',
              label: intl.formatMessage({
                id: 'table.value.strong',
                defaultMessage: 'Strong',
              }),
            },
            {
              value: '1',
              label: intl.formatMessage({
                id: 'table.value.weak',
                defaultMessage: 'Weak',
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
          defaultMessage: 'Set schedule',
        })}
      >
        <ProFormDateTimePicker
          name="time"
          label={intl.formatMessage({
            id: 'table.schedule.startTime',
            defaultMessage: 'Start time',
          })}
          rules={[
            {
              required: true,
              message: intl.formatMessage({
                id: 'table.schedule.startTimeRequired',
                defaultMessage: 'Please select start time!',
              }),
            },
          ]}
        />
        <ProFormSelect
          name="frequency"
          label={intl.formatMessage({
            id: 'table.update.field.target',
            defaultMessage: 'Target',
          })}
          width="xs"
          valueEnum={{
            month: intl.formatMessage({
              id: 'table.value.month',
              defaultMessage: 'Month',
            }),
            week: intl.formatMessage({
              id: 'table.value.week',
              defaultMessage: 'Week',
            }),
          }}
        />
      </StepsForm.StepForm>
    </StepsForm>
  );
};

export default UpdateForm;
