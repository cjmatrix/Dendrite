const stats = [
  { label: "Total Users", value: "1,240" },
  { label: "Active Today", value: "312" },
  { label: "Pending Approvals", value: "18" },
  { label: "Suspended", value: "6" },
];

function AdminDashboardPage() {
  return (
    <div className="p-8 text-white">
      <div className="mb-8">
        <h2 className="text-2xl font-semibold">Admin Dashboard</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Overview of platform activity and admin metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-zinc-950/70 border border-blue-500/10 rounded-2xl p-6 shadow-lg shadow-blue-500/5"
          >
            <p className="text-sm text-zinc-400">{stat.label}</p>
            <p className="text-2xl font-semibold mt-3">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 bg-zinc-950/70 border border-blue-500/10 rounded-2xl p-6 shadow-lg shadow-blue-500/5">
        <h3 className="text-lg font-semibold">Activity Summary</h3>
        <p className="text-sm text-zinc-400 mt-2">
          Keep track of recent admin actions, approvals, and system notices.
        </p>
        <ul className="mt-6 space-y-3 text-sm text-zinc-300">
          <li>✅ Approved 8 new user registrations</li>
          <li>📌 Updated platform permissions for 3 roles</li>
          <li>🧠 Scheduled nightly data maintenance job</li>
        </ul>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
