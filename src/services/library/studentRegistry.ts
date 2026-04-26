import { request } from '@umijs/max';

export interface StudentRegistryItem {
  id: string;
  studentId: string;
  realName: string;
  college?: string;
  major?: string;
  grade?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StudentRegistryListParams {
  page?: number;
  pageSize?: number;
  studentId?: string;
  realName?: string;
  college?: string;
  major?: string;
  grade?: string;
  active?: boolean | '';
}

export async function getStudentRegistryList(
  params: StudentRegistryListParams,
) {
  return request<{
    success: boolean;
    data: { list: StudentRegistryItem[]; total: number };
  }>('/api/student-registry', {
    method: 'GET',
    params,
  });
}

export async function createStudentRegistryEntry(
  data: Omit<StudentRegistryItem, 'id' | 'createdAt' | 'updatedAt'>,
) {
  return request<{ success: boolean; data: StudentRegistryItem }>(
    '/api/student-registry',
    {
      method: 'POST',
      data,
    },
  );
}

export async function updateStudentRegistryEntry(
  id: string,
  data: Partial<
    Omit<StudentRegistryItem, 'id' | 'studentId' | 'createdAt' | 'updatedAt'>
  >,
) {
  return request<{ success: boolean; data: StudentRegistryItem }>(
    `/api/student-registry/${id}`,
    {
      method: 'PUT',
      data,
    },
  );
}

export async function deleteStudentRegistryEntry(id: string) {
  return request<{ success: boolean }>(`/api/student-registry/${id}`, {
    method: 'DELETE',
  });
}

export async function importStudentRegistry(
  records: Array<{
    studentId: string;
    realName: string;
    college?: string;
    major?: string;
    grade?: string;
  }>,
) {
  return request<{
    success: boolean;
    data: {
      total: number;
      inserted: number;
      updated: number;
      skipped: number;
      errors: string[];
    };
  }>('/api/student-registry/import', {
    method: 'POST',
    data: { records },
  });
}
