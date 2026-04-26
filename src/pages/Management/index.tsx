import { PageContainer } from '@ant-design/pro-components';
import { history, useIntl, useLocation } from '@umijs/max';
import { Tabs } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import FloorManagement from '../Floor';
import ZoneManagement from '../Zone';

const Management: React.FC = () => {
  const intl = useIntl();
  const location = useLocation();
  const tabFromQuery = useMemo(() => {
    const tab = new URLSearchParams(location.search || '').get('tab');
    return tab === 'zone' ? 'zone' : 'floor';
  }, [location.search]);
  const [activeKey, setActiveKey] = useState<'floor' | 'zone'>(tabFromQuery);

  useEffect(() => {
    setActiveKey(tabFromQuery);
  }, [tabFromQuery]);

  const handleTabChange = (key: string) => {
    const nextKey = key === 'zone' ? 'zone' : 'floor';
    setActiveKey(nextKey);
    history.replace(`/management?tab=${nextKey}`);
  };

  return (
    <PageContainer
      title={intl.formatMessage({
        id: 'menu.management',
        defaultMessage: 'Management',
      })}
    >
      <Tabs
        activeKey={activeKey}
        onChange={handleTabChange}
        items={[
          {
            key: 'floor',
            label: intl.formatMessage({
              id: 'floor.title',
              defaultMessage: 'Floor Management',
            }),
            children: <FloorManagement embedded />,
          },
          {
            key: 'zone',
            label: intl.formatMessage({
              id: 'zone.title',
              defaultMessage: 'Zone Management',
            }),
            children: <ZoneManagement embedded />,
          },
        ]}
      />
    </PageContainer>
  );
};

export default Management;
