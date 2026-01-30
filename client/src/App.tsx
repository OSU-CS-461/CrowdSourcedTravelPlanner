import AppRoutes from "./routes";
import { useAuth } from "./features/auth/hooks/useAuth";

export default function App() {
  const { isAuthenticated } = useAuth();
  return <AppRoutes isAuthenticated={isAuthenticated} />;
}
