import { useGetAllUsers, type UserFilters } from "./hook/useGetAllUsers";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { Pagination } from "../../../components/common/Pagination";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { useDebouncedValue } from "../../../components/common/useDebouncedValue";

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

      <div className="bg-zinc-950/70 border border-blue-500/10 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/5">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900/40 text-zinc-300">
            <tr>
              <th className="text-left px-6 py-4 font-medium">User</th>
              <th className="text-left px-6 py-4 font-medium">Role</th>
              <th className="text-left px-6 py-4 font-medium">Status</th>
              <th
                className="text-left px-6 py-4 font-medium cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort("totalTokens")}
              >
                <div className="flex items-center gap-2">
                  Tokens
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                className="text-left px-6 py-4 font-medium cursor-pointer hover:text-white transition-colors"
                onClick={() => toggleSort("createdAt")}
              >
                <div className="flex items-center gap-2">
                  Created
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="text-left px-6 py-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-blue-500/10">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 animate-pulse uppercase tracking-widest text-xs">
                  Updating User List...
                </td>
              </tr>
            ) : data && data.users.length > 0 ? (
              data.users.map((user: AdminUser) => (
                <tr
                  key={user._id}
                  className="bg-zinc-900/60 hover:bg-blue-500/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{user.name}</div>
                    <div className="text-xs text-zinc-400">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 capitalize text-zinc-200">
                    {user.role}
                  </td>
                  <td className="px-6 py-4">
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
                  </td>
                  <td className="px-6 py-4 text-zinc-300">
                    {user.totalTokens.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-zinc-300">
                    {new Date(user.createdAt).toISOString().split("T")[0]}
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-300 hover:text-blue-200 text-sm font-medium">
                      <Link to={`/admin/users/${user._id}`}>View</Link>
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                  No users found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {data && (
          <Pagination
            currentPage={page}
            totalPages={data.totalPages}
            onPageChange={(newPage) => setPage(newPage)}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}

export default UserManagementPage;
