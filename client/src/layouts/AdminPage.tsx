import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import AdminSidebar from "../features/admin/sidebar/AdminSidebar";

function AdminPage() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="relative flex h-screen bg-[#050510] text-white overflow-hidden">
            <div className="absolute -top-32 right-0 w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[140px] pointer-events-none" />
            <div className="absolute -bottom-32 left-0 w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[140px] pointer-events-none" />
            
            {/* Mobile Sidebar backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar container */}
            <div
                className={`fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out ${
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <AdminSidebar onClose={() => setIsSidebarOpen(false)} />
            </div>

            {/* Main view content */}
            <main className="relative flex-1 h-screen overflow-hidden flex flex-col">
                {/* Mobile top navigation header */}
                <header className="flex items-center justify-between px-6 py-4 border-b border-blue-500/10 bg-zinc-950/40 backdrop-blur-md lg:hidden z-30 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                            <span className="font-bold text-sm">D</span>
                        </div>
                        <span className="font-semibold text-sm tracking-wide">Dendrites Admin</span>
                    </div>
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 border border-blue-500/10 transition-all"
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </header>

                {/* Main page scrollable section */}
                <div className="flex-1 overflow-y-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

export default AdminPage;