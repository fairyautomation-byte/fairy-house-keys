"use client";
import { useState, useEffect } from "react";
import PageHeader from "@/components/layout/PageHeader";
import Table, { Column } from "@/components/ui/Table";
import StatusBadge from "@/components/features/StatusBadge";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { formatCurrency } from "@/lib/format";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [error, setError] = useState("");

  const fetchOrders = async (cursor?: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        "/api/admin/orders" +
          (cursor ? "?cursor=" + encodeURIComponent(cursor) : ""),
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOrders((prev) => (cursor ? [...prev, ...data.items] : data.items));
      setNextCursor(data.nextCursor);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Không tải được đơn");
    } finally {
      setLoading(false);
    }
  };
  const processOrder = async (id: string, action: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${id}/${action}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchOrders();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Không xử lý được đơn");
    }
  };
  const reconcile = async () => {
    try {
      const res = await fetch("/api/admin/reconcile-payments", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await fetchOrders();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Không đối soát được");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = orders.filter(
    (o) =>
      o.transaction_code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.plan_id?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const columns: Column<any>[] = [
    {
      key: "transaction_code",
      title: "Mã GD",
      render: (item) => (
        <span className="font-mono text-[var(--fha-brand)] font-semibold">
          {item.transaction_code}
        </span>
      ),
    },
    {
      key: "email",
      title: "Khách hàng",
      render: (item) => (
        <span className="text-[var(--fha-text)]">{item.email || "N/A"}</span>
      ),
    },
    {
      key: "plan_id",
      title: "Gói",
      render: (item) => (
        <span className="font-bold uppercase text-[var(--fha-text)]">
          {item.plan_id}
        </span>
      ),
    },
    {
      key: "amount",
      title: "Số Tiền",
      render: (item) => (
        <span className="font-medium font-mono text-[var(--fha-text)]">
          {formatCurrency(item.amount)}
        </span>
      ),
    },
    {
      key: "status",
      title: "Trạng Thái",
      render: (item) => (
        <div>
          <StatusBadge status={item.status} size="sm" />
          {item.status === "PENDING_PAYMENT_REVIEW" && (
            <div className="flex gap-2 text-xs">
              <button onClick={() => processOrder(item.id, "approve")}>
                Duyệt
              </button>
              <button onClick={() => processOrder(item.id, "reject")}>
                Từ chối
              </button>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      {error && (
        <p role="alert" className="text-red-600">
          {error}
        </p>
      )}
      <button onClick={reconcile}>Đối soát thanh toán và gửi lại email</button>
      {nextCursor && (
        <button onClick={() => fetchOrders(nextCursor)}>Tải thêm đơn</button>
      )}
      <PageHeader
        title="Quản Lý Đơn Hàng"
        description="Tất cả giao dịch nạp tiền và mua gói trên hệ thống"
      />

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="w-full sm:w-[400px]">
          <Input
            placeholder="Tìm kiếm mã GD, email, gói..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={
              <svg
                className="w-[18px] h-[18px]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            }
          />
        </div>
        <Button
          variant="secondary"
          onClick={() => fetchOrders()}
          size="sm"
          className="bg-white"
        >
          <svg
            className="w-[16px] h-[16px] mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Làm Mới
        </Button>
      </div>

      <div className="bg-white rounded-fha-lg border border-[var(--fha-border)] overflow-hidden shadow-sm">
        <Table
          columns={columns}
          data={filteredOrders}
          rowKey={(item) => item.id}
          loading={loading}
          mobileRender={(item) => (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-[var(--fha-brand)] font-bold">
                  {item.transaction_code}
                </span>
                <StatusBadge status={item.status} size="sm" />
              </div>
              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="font-bold text-sm text-[var(--fha-text)] truncate max-w-[200px]">
                    {item.email || "N/A"}
                  </div>
                  <div className="text-[11px] font-semibold uppercase text-[var(--fha-text-muted)] mt-0.5">
                    {item.plan_id}
                  </div>
                </div>
                <div className="font-mono font-bold text-sm text-[var(--fha-text)]">
                  {formatCurrency(item.amount)}
                </div>
              </div>
            </div>
          )}
          emptyState={
            <div className="py-12 text-center text-[var(--fha-text-muted)] text-[14px]">
              Không tìm thấy đơn hàng nào
            </div>
          }
        />
      </div>
    </div>
  );
}
