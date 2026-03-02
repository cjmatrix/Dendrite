import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useEffect } from "react";
import ProtectedRoute from "./components/ProtectedRoute";
import ChatPage from "./pages/ChatPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import { useAppDispatch } from "./store/store";
import { checkAuth, forceLogout } from "./store/authSlice";
import "./App.css";
import ChatWindow from "./components/ChatWindow";
import EmptyChatState from "./components/EmptyChatState";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Signup />,
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <ChatPage />,
        children:[
          {
            index:true,
            element:<EmptyChatState></EmptyChatState>
          },
          {
            path:"/:id",
            element:<ChatWindow></ChatWindow>
          }
        ]
        
      },
    ],
  },
]);

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);


  useEffect(() => {
    const handleSessionExpired = () => {
      dispatch(forceLogout());
    };

    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () =>
      window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, [dispatch]);

  return <RouterProvider router={router} />;
}

export default App;
