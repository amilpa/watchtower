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

  useEffect(() => {
    if (history && history.history) {
      // Debug log to check history data (remove in production)
      console.log(`Got ${history.history.length} history entries`);

      if (history.history.length > 0) {
        const newest = new Date(history.history[0].timestamp);
        const oldest = new Date(
          history.history[history.history.length - 1].timestamp
        );
        console.log(
          `Newest: ${newest.toLocaleString()}, Oldest: ${oldest.toLocaleString()}`
        );
      }
    }
  }, [history]);

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

      // Increase limit to ensure we get enough data for the selected period
      // (Adjust based on your monitoring frequency - 200 is enough for hourly checks for a week)
      const response = await fetch(
        `http://localhost:5000/api/urls/${id}/history?limit=200&page=1`,
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

      // Refresh data
      await fetchWebsiteDetails();
      await fetchHistory();
      await fetchStats();
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

  // Function to get chart data with simple formatting
  const getChartData = () => {
    if (
      !history ||
      !history.history ||
      !Array.isArray(history.history) ||
      history.history.length === 0
    )
      return [];

    // Map the history data with simple formatting
    const chartData = history.history
      .map((check) => {
        if (!check.timestamp) return null;

        const timestamp = new Date(check.timestamp);
        if (isNaN(timestamp)) return null;

        return {
          timestamp: timestamp.getTime(),
          dateTime: timestamp.toLocaleString(), // Full date and time for tooltip
          formattedTime: formatTime(timestamp), // Formatted time for X-axis
          responseTime: check.responseTime || 0,
          status: check.status === "up" ? 1 : 0,
        };
      })
      .filter((item) => item !== null) // Remove any invalid entries
      .sort((a, b) => a.timestamp - b.timestamp); // Sort by timestamp

    return chartData;
  };

  // Simple function to format time in a readable way
  const formatTime = (date) => {
    return date.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Simple tooltip that shows the exact date and time
  const customTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-md">
          <p className="font-medium text-sm">{data.dateTime}</p>
          <p className="text-sm">
            <span className="font-medium">Status:</span>{" "}
            {data.status === 1 ? "Up" : "Down"}
          </p>
          {data.responseTime !== undefined && (
            <p className="text-sm">
              <span className="font-medium">Response Time:</span>{" "}
              {data.responseTime}ms
            </p>
          )}
        </div>
      );
    }
    return null;
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

      {/* Website Monitoring History */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold">Website Monitoring History</h2>
      </div>

      {/* Stats Summary */}
      <Card className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Performance Summary</h2>
        {chartData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-green-800 font-semibold text-sm">Uptime</p>
              <p className="text-2xl font-bold">
                {`${(
                  (chartData.filter((d) => d.status === 1).length /
                    chartData.length) *
                  100
                ).toFixed(2)}%`}
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-yellow-800 font-semibold text-sm">
                Avg. Response Time
              </p>
              <p className="text-2xl font-bold">
                {`${(
                  chartData.reduce((sum, d) => sum + d.responseTime, 0) /
                  chartData.length
                ).toFixed(1)} ms`}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">
            No statistics available.
          </p>
        )}
      </Card>

      {/* Single Response Time & Status Chart */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">Website Monitoring Chart</h2>
        {chartData.length > 0 ? (
          <div className="relative">
            {/* Chart header with fixed positioning */}
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-gray-500">
                {chartData.length} data points
              </div>
              <div className="text-sm text-blue-600">
                Scroll horizontally to view all data →
              </div>
            </div>

            {/* Horizontally scrollable container */}
            <div
              className="overflow-x-auto pb-4"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {/* Set a minimum width based on data points - adjust the multiplier as needed */}
              <div
                style={{
                  height: "400px",
                  width: `${Math.max(100, chartData.length * 20)}%`,
                  minWidth: "100%",
                  maxWidth: chartData.length <= 10 ? "100%" : undefined,
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60, // More space for X-axis labels
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      type="number"
                      domain={["dataMin", "dataMax"]}
                      tickFormatter={(timestamp) => {
                        const date = new Date(timestamp);
                        return date.toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                      }}
                      scale="time"
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={chartData.length <= 30 ? 0 : undefined} // Show all ticks if <= 30 points
                    />
                    <YAxis
                      yAxisId="left"
                      orientation="left"
                      label={{
                        value: "Response Time (ms)",
                        angle: -90,
                        position: "insideLeft",
                      }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 1]}
                      ticks={[0, 1]}
                      tickFormatter={(value) => (value === 1 ? "Up" : "Down")}
                      label={{
                        value: "Status",
                        angle: 90,
                        position: "insideRight",
                      }}
                    />
                    <Tooltip content={customTooltip} />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="responseTime"
                      name="Response Time"
                      stroke="#3B82F6"
                      dot={{ r: 3 }} // Smaller dots for less visual clutter
                      activeDot={{ r: 6 }} // Larger active dot for better interaction
                    />
                    <Line
                      yAxisId="right"
                      type="stepAfter"
                      dataKey="status"
                      name="Status"
                      stroke="#22C55E"
                      dot={{ r: 3 }} // Smaller dots for less visual clutter
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Optional shadow indicator for horizontal scroll */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
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
