import Button from "../components/Button";
import Card from "../components/Card";

function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Welcome to WatchTower</h1>
      <Card>
        <h2 className="text-xl font-semibold mb-4">Monitor Your Websites</h2>
        <p className="mb-4">
          WatchTower helps you monitor your website uptime and performance. Get
          real-time alerts when your websites go down.
        </p>
        <Button onClick={() => (window.location.href = "/dashboard")}>
          Go to Dashboard
        </Button>
      </Card>
    </div>
  );
}

export default Home;
