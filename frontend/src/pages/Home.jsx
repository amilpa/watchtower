import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";

function Home() {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem("authToken") !== null;

  return (
    <div className="container mx-auto px-12 py-8">
      <h1 className="text-3xl font-bold mb-6">Welcome to WatchTower</h1>
      <Card>
        <h2 className="text-xl font-semibold mb-4">Monitor Your Websites</h2>
        <p className="mb-4">
          WatchTower helps you monitor your website uptime and performance. 
        </p>
        <div className="flex flex-wrap gap-4">
          <Button onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </Button>

          {!isAuthenticated && (
            <Button variant="secondary" onClick={() => navigate("/login")}>
              Login
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

export default Home;
