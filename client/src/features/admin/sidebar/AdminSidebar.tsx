import { NavLink } from "react-router-dom";
import { LayoutDashboard, LogOut, Users, ShieldAlert, Activity } from "lucide-react";
import { useAdminLogout } from "../../auth/hooks/useAdminLogout";

const navItems = [
  {
    label: "Admin Dashboard",
    to: "/admin",
    icon: LayoutDashboard,
  },
  {
    label: "User Management",
    to: "/admin/users",
    icon: Users,
  },
  {
    label: "Rate Limits",
    to: "/admin/rate-limits",
    icon: ShieldAlert,
  },
  {
    label: "System Health",
    to: "/admin/health",
    icon: Activity,
  },
];

function AdminSidebar({ onClose }: { onClose?: () => void }) {
  const adminLogoutMutation = useAdminLogout();

  return (
    <aside className="relative w-64 h-screen bg-zinc-950/80 border-r border-blue-500/10 text-white flex flex-col backdrop-blur-2xl">
      <div className="px-6 py-6 border-b border-blue-500/10">
        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <LayoutDashboard size={18} />
        </div>
        <h1 className="text-lg font-semibold tracking-wide mt-4">Dendrites Admin</h1>
        <p className="text-xs text-zinc-400 mt-1">Management Console</p>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all border ${
                  isActive
                    ? "bg-blue-500/10 border-blue-500/30 text-white shadow-lg shadow-blue-500/10"
                    : "border-transparent text-zinc-400 hover:border-blue-500/20 hover:text-white hover:bg-blue-500/5"
                }`
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
      <div className="px-4 py-4 border-t border-blue-500/10">
        <button
          type="button"
          onClick={() => adminLogoutMutation.mutate()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs uppercase tracking-wider border border-blue-500/20 text-zinc-300 hover:text-white hover:border-blue-500/40 hover:bg-blue-500/10 transition-all disabled:opacity-60"
          disabled={adminLogoutMutation.isPending}
        >
          <LogOut size={16} />
          {adminLogoutMutation.isPending ? "Logging out..." : "Logout"}
        </button>
        <div className="mt-3 text-center text-xs text-zinc-500">v1.0 · Admin</div>
      </div>
    </aside>
  );
}

export default AdminSidebar;
