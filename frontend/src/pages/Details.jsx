import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";

// Import a chart library - you'll need to install this:
// npm install recharts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function Details() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [website, setWebsite] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [period, setPeriod] = useState("24h");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testingNow, setTestingNow] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    // Fetch website details when the component mounts or ID changes
    fetchWebsiteDetails();
  }, [id]);

  useEffect(() => {
    // Fetch history and stats when period changes
    if (website) {
      fetchHistory();
      fetchStats();
    }
  }, [website, period]);

  const fetchWebsiteDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`http://localhost:5000/api/urls/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("authToken");
          navigate("/login");
          return;
        } else if (response.status === 404) {
          throw new Error("Website not found");
        }
        throw new Error("Failed to fetch website details");
      }

      const data = await response.json();
      setWebsite(data);
      console.log(stats);

      // Now fetch the history and stats
      await Promise.all([fetchHistory(), fetchStats()]);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching website details:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(
        `http://localhost:5000/api/urls/${id}/history?limit=50&page=1`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch website history");
      }

      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error("Error fetching website history:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const response = await fetch(
        `http://localhost:5000/api/urls/${id}/stats?period=${period}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch website stats");
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error("Error fetching website stats:", err);
    }
  };

  // New function to test the URL in real-time
  const testUrlNow = async () => {
    if (!website || testingNow) return;

    try {
      setTestingNow(true);
      setTestResult(null);

      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(
        `http://localhost:5000/api/urls/${id}/test`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to test website");
      }

      const result = await response.json();
      setTestResult(result);

      // Refresh history after testing
      await fetchHistory();
      await fetchWebsiteDetails();
    } catch (err) {
      setTestResult({
        error: err.message,
        success: false,
      });
      console.error("Error testing website:", err);
    } finally {
      setTestingNow(false);
    }
  };

  // Function to get formatted data for charts
  const getChartData = () => {
    if (!history || !history.history || !Array.isArray(history.history))
      return [];

    // Map the history data and sort chronologically (oldest first)
    return history.history
      .map((check) => ({
        time: new Date(check.timestamp).toLocaleTimeString(),
        timestamp: new Date(check.timestamp).getTime(), // Store timestamp for sorting
        responseTime: check.responseTime || 0,
        status: check.status === "up" ? 1 : 0, // 1 for up, 0 for down
      }))
      .sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp, oldest first
  };

  // Function to get status color classes
  const getStatusClasses = (status) => {
    switch (status) {
      case "up":
        return "bg-green-100 text-green-800";
      case "down":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <svg
          className="animate-spin h-10 w-10 mx-auto text-blue-500"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        <p className="mt-2 text-gray-500">Loading website details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <div className="text-center py-8">
            <h2 className="text-xl font-bold text-red-600 mb-2">Error</h2>
            <p className="text-gray-700 mb-4">{error}</p>
            <Button variant="primary" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!website) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <div className="text-center py-8">
            <h2 className="text-xl font-bold mb-2">Website Not Found</h2>
            <p className="text-gray-700 mb-4">
              The requested website could not be found.
            </p>
            <Button variant="primary" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const chartData = getChartData();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Link
          to="/dashboard"
          className="text-blue-600 hover:text-blue-800 mr-4"
        >
          <svg
            className="inline-block h-5 w-5 mr-1"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Dashboard
        </Link>
      </div>
      <h1 className="text-3xl font-bold mb-8">
        {website.name || new URL(website.url).hostname}
      </h1>

      {/* Website Overview Card with Test Button */}
      <Card className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-semibold">Website Overview</h2>
          <Button variant="primary" onClick={testUrlNow} disabled={testingNow}>
            {testingNow ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Testing Now...
              </span>
            ) : (
              "Test Now"
            )}
          </Button>
        </div>

        {/* Test Result Display */}
        {testResult && (
          <div
            className={`p-3 mb-4 rounded ${
              testResult.success
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            <div className="flex items-center">
              {testResult.success ? (
                <svg
                  className="h-5 w-5 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 mr-2"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
              <span className="font-medium">
                {testResult.success
                  ? `Test successful! Response time: ${testResult.responseTime}ms`
                  : `Test failed: ${
                      testResult.error || "Could not reach the website"
                    }`}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-gray-700">
              <span className="font-medium">URL:</span>{" "}
              <a
                href={website.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 break-all"
              >
                {website.url}
              </a>
            </p>
            <p className="text-gray-700 mt-2">
              <span className="font-medium">Check Interval:</span>{" "}
              {website.checkInterval} minutes
            </p>
            <p className="text-gray-700 mt-2">
              <span className="font-medium">Monitoring Since:</span>{" "}
              {new Date(website.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-gray-700">
              <span className="font-medium">Current Status:</span>{" "}
              <span
                className={`inline-block px-2 py-1 text-xs rounded ${getStatusClasses(
                  website.currentStatus
                )}`}
              >
                {website.currentStatus
                  ? website.currentStatus.charAt(0).toUpperCase() +
                    website.currentStatus.slice(1)
                  : "Unknown"}
              </span>
            </p>
            {website.responseTime && (
              <p className="text-gray-700 mt-2">
                <span className="font-medium">Last Response Time:</span>{" "}
                {website.responseTime}ms
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Rest of the component remains the same */}
      {/* Time Period Selection */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          variant={period === "24h" ? "primary" : "secondary"}
          onClick={() => setPeriod("24h")}
        >
          Last 24 Hours
        </Button>
        <Button
          variant={period === "7d" ? "primary" : "secondary"}
          onClick={() => setPeriod("7d")}
        >
          Last 7 Days
        </Button>
        <Button
          variant={period === "30d" ? "primary" : "secondary"}
          onClick={() => setPeriod("30d")}
        >
          Last 30 Days
        </Button>
      </div>

      {/* Response Time Chart */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Response Time (ms)</h2>
        {chartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  reversed={false} // Setting to false ensures natural chronological order
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={Math.min(Math.floor(chartData.length / 10), 1)}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="responseTime"
                  stroke="#3B82F6"
                  activeDot={{ r: 8 }}
                  isAnimationActive={false} // Disable animation for better performance
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">
            No historical data available.
          </p>
        )}
      </Card>

      {/* Status Chart */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Status History</h2>
        {chartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  reversed={false}
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  interval={Math.min(Math.floor(chartData.length / 10), 1)}
                />
                <YAxis
                  domain={[0, 1]}
                  ticks={[0, 1]}
                  tickFormatter={(tick) => (tick === 1 ? "Up" : "Down")}
                />
                <Tooltip formatter={(value) => (value === 1 ? "Up" : "Down")} />
                <Legend />
                <Line
                  type="stepAfter"
                  dataKey="status"
                  stroke="#22C55E"
                  dot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">
            No historical data available.
          </p>
        )}
      </Card>
    </div>
  );
}

export default Details;
