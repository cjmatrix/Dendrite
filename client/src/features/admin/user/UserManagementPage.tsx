import { useGetAllUsers, type UserFilters } from "./hook/useGetAllUsers";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Pagination } from "../../../components/common/Pagination";
import { Search, Filter } from "lucide-react";
import { useDebouncedValue } from "../../../components/common/useDebouncedValue";
import { Table, type Column } from "../../../components/common/Table";

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  totalTokens: number;
  createdAt: string;
}

function UserManagementPage() {
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<UserFilters>({
    search: "",
    status: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  const debouncedSearch = useDebouncedValue(searchTerm, 500);

  useEffect(() => {
    setFilters((prev) => ({ ...prev, search: debouncedSearch }));
    setPage(1); 
  }, [debouncedSearch]);

  const { data, isLoading, error } = useGetAllUsers(page, 5, filters);

  const toggleSort = (column: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: column,
      sortOrder: prev.sortBy === column && prev.sortOrder === "desc" ? "asc" : "desc",
    }));
  };

  const columns: Column<AdminUser>[] = [
    {
      header: "User",
      key: "name",
      render: (user) => (
        <>
          <div className="font-medium text-white">{user.name}</div>
          <div className="text-xs text-zinc-400">{user.email}</div>
        </>
      ),
    },
    {
      header: "Role",
      key: "role",
      render: (user) => <span className="capitalize text-zinc-200">{user.role}</span>,
    },
    {
      header: "Status",
      key: "status",
      render: (user) => (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold capitalize ${
            user.status === "active"
              ? "bg-emerald-500/10 text-emerald-300"
              : user.status === "pending"
              ? "bg-amber-500/10 text-amber-300"
              : user.status === "suspended"
              ? "bg-orange-500/10 text-orange-300"
              : "bg-rose-500/10 text-rose-300"
          }`}
        >
          {user.status}
        </span>
      ),
    },
    {
      header: "Tokens",
      key: "totalTokens",
      sortable: true,
      render: (user) => user.totalTokens.toLocaleString(),
    },
    {
      header: "Created",
      key: "createdAt",
      sortable: true,
      render: (user) => new Date(user.createdAt).toISOString().split("T")[0],
    },
    {
      header: "Actions",
      key: "actions",
      render: (user) => (
        <button className="text-blue-300 hover:text-blue-200 text-sm font-medium">
          <Link to={`/admin/users/${user._id}`}>View</Link>
        </button>
      ),
    },
  ];

  if (error) {
    return <div className="p-8 text-rose-500 text-sm">Error loading users...</div>;
  }

  return (
    <div className="p-8 text-white">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold">User Management</h2>
          <p className="text-sm text-zinc-400 mt-1">
            Manage admin and user accounts across the platform.
          </p>
        </div>
       
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by name..."
            className="w-full bg-zinc-900/60 border border-blue-500/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500/30 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500" />
          <select
            className="bg-zinc-950/50 border border-blue-500/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500/30 transition-all appearance-none cursor-pointer"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="banned">Banned</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      <Table
        columns={columns}
        data={data?.users || []}
        keyExtractor={(user) => user._id}
        isLoading={isLoading}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSort={toggleSort}
      />
      {data && (
        <div className="mt-4">
          <Pagination
            currentPage={page}
            totalPages={data.totalPages}
            onPageChange={(newPage) => setPage(newPage)}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
}

export default UserManagementPage;
