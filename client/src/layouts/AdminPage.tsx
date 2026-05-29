import { Outlet } from "react-router-dom";
import AdminSidebar from "../features/admin/sidebar/AdminSidebar";

function AdminPage(){
    return(
        <div className="relative flex h-screen bg-[#050510] text-white overflow-hidden">
            <div className="absolute -top-32 right-0 w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[140px]" />
            <div className="absolute -bottom-32 left-0 w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[140px]" />
            <AdminSidebar />
            <main className="relative flex-1 h-screen overflow-y-auto">
                <Outlet />
            </main>
        </div>
    )

}

export default AdminPage;