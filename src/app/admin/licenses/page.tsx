'use client';
import { useState, useEffect } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import Table, { Column } from '@/components/ui/Table';
import StatusBadge from '@/components/features/StatusBadge';
import LicenseKey from '@/components/features/LicenseKey';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { formatDate } from '@/lib/format';

export default function AdminLicensesPage() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLicenses = () => {
    setLoading(true);
    // Placeholder fetch logic
    setTimeout(() => {
      setLicenses([]);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const filteredLicenses = licenses.filter(l => 
    l.license_key?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns: Column<any>[] = [
    {
      key: 'license_key',
      title: 'License Key',
      render: (item) => (
        <div className="w-48 sm:w-64">
          <LicenseKey value={item.license_key} status={item.status} className="border-transparent bg-transparent" />
        </div>
      )
    },
    {
      key: 'email',
      title: 'Khách hàng',
      render: (item) => <span className="text-[var(--fha-text)]">{item.email}</span>
    },
    {
      key: 'plan_id',
      title: 'Gói',
      render: (item) => <span className="font-bold uppercase text-[var(--fha-text)]">{item.plan_id}</span>
    },
    {
      key: 'expires_at',
      title: 'Hết hạn',
      render: (item) => (
        <span className="text-[var(--fha-text-muted)] font-medium">
          {item.expires_at ? formatDate(item.expires_at) : 'Không giới hạn'}
        </span>
      )
    },
    {
      key: 'status',
      title: 'Trạng Thái',
      render: (item) => <StatusBadge status={item.status} size="sm" />
    }
  ];

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Quản Lý Licenses" 
        description="Theo dõi toàn bộ license key đã cấp phát"
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="w-full sm:w-[400px]">
          <Input 
            placeholder="Tìm kiếm license key, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={
              <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            }
          />
        </div>
        <Button variant="secondary" onClick={fetchLicenses} size="sm" className="bg-white">
          <svg className="w-[16px] h-[16px] mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          Làm Mới
        </Button>
      </div>

      <div className="bg-white rounded-fha-lg border border-[var(--fha-border)] overflow-hidden shadow-sm">
        <Table
          columns={columns}
          data={filteredLicenses}
          rowKey={(item) => item.id || item.license_key}
          loading={loading}
          emptyState={
            <div className="py-12 text-center text-[var(--fha-text-muted)] text-[14px]">Chưa có license nào hoặc tính năng đang được cập nhật</div>
          }
        />
      </div>
    </div>
  );
}
