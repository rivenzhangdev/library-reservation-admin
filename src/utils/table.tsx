import { Tooltip, Typography } from 'antd';
import React from 'react';

export const STANDARD_TABLE_SEARCH = {
  labelWidth: 'auto' as const,
  defaultCollapsed: false,
};

export const STANDARD_TABLE_SCROLL = {
  x: 'max-content' as const,
};

export const STANDARD_ACTION_COLUMN = {
  width: 160,
  fixed: 'right' as const,
};

export function toTableDataSource<T = any>(response: any) {
  const list = Array.isArray(response?.data?.list) ? response.data.list : [];
  const total = Number.isFinite(response?.data?.total)
    ? Number(response.data.total)
    : list.length;
  return {
    data: list as T[],
    total,
    success: response?.success !== false,
  };
}

export function renderOverflowText(value: unknown) {
  const text =
    value === undefined || value === null || value === '' ? '-' : String(value);
  return (
    <Tooltip title={text}>
      <Typography.Text
        ellipsis
        style={{ maxWidth: '100%', display: 'inline-block' }}
      >
        {text}
      </Typography.Text>
    </Tooltip>
  );
}
