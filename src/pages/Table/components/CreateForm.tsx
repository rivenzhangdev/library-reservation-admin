import { useIntl } from '@umijs/max';
import { Modal } from 'antd';
import React, { PropsWithChildren } from 'react';

interface CreateFormProps {
  modalVisible: boolean;
  onCancel: () => void;
}

const CreateForm: React.FC<PropsWithChildren<CreateFormProps>> = (props) => {
  const intl = useIntl();

  const { modalVisible, onCancel } = props;

  return (
    <Modal
      destroyOnClose
      title={intl.formatMessage({ id: 'common.new', defaultMessage: 'New' })}
      width={420}
      open={modalVisible}
      onCancel={() => onCancel()}
      footer={null}
    >
      {props.children}
    </Modal>
  );
};

export default CreateForm;
