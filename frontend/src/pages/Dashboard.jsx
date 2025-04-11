import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import InputField from "../components/InputField";

function Dashboard() {
  const [urlData, setUrlData] = useState({
    url: "",
    name: "",
  });
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingUrl, setAddingUrl] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [addError, setAddError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch all monitored URLs when component mounts
    fetchWebsites();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUrlData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    // Clear related error when user types
    setAddError(null);
  };

  const fetchWebsites = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch("http://localhost:5000/api/urls", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired or invalid
          localStorage.removeItem("authToken");
          navigate("/login");
          return;
        }
        throw new Error("Failed to fetch websites");
      }

      const data = await response.json();
      setWebsites(data);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching websites:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUrl = async () => {
    if (!urlData.url.trim()) {
      setAddError("Please enter a valid URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(urlData.url); // This will throw an error if the URL is invalid
    } catch (e) {
      console.log(e);
      setAddError("Please enter a valid URL with http:// or https://");
      return;
    }

    setAddingUrl(true);
    setAddError(null);

    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }

      // Use the provided name or extract hostname from URL
      const siteName = urlData.name.trim() || new URL(urlData.url).hostname;

      const response = await fetch("http://localhost:5000/api/urls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          url: urlData.url,
          name: siteName,
          checkInterval: 5, // Default to 5 minute interval
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to add website");
      }

      // Clear input and refresh the list
      setUrlData({ url: "", name: "" });
      fetchWebsites();
    } catch (err) {
      setAddError(err.message);
      console.error("Error adding website:", err);
    } finally {
      setAddingUrl(false);
    }
  };

  const handleDeleteUrl = async (id) => {
    try {
      setDeletingId(id);

      const token = localStorage.getItem("authToken");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await fetch(`http://localhost:5000/api/urls/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete website");
      }

      // Update the websites list after deletion
      setWebsites(websites.filter((site) => site._id !== id));
    } catch (err) {
      setError("Error deleting website: " + err.message);
      console.error("Error deleting website:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    // Remove auth token from localStorage
    localStorage.removeItem("authToken");

    // Redirect to homepage
    navigate("/");
  };

  // Function to get status color classes based on status
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button variant="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}

      <Card>
        <h2 className="text-xl font-semibold mb-4">Add New Website</h2>
        <div className="space-y-4">
          <InputField
            label="Website URL"
            type="url"
            name="url"
            placeholder="https://example.com"
            value={urlData.url}
            onChange={handleInputChange}
            error={addError}
          />

          <InputField
            label="Website Name"
            type="text"
            name="name"
            placeholder="My Website"
            value={urlData.name}
            onChange={handleInputChange}
          />

          <div className="flex justify-center">
            <Button onClick={handleAddUrl} disabled={addingUrl}>
              {addingUrl ? (
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
                  Adding...
                </span>
              ) : (
                "Add Website"
              )}
            </Button>
          </div>
        </div>
      </Card>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Your Websites</h2>

        {loading ? (
          <div className="text-center py-8">
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
            <p className="mt-2 text-gray-500">Loading websites...</p>
          </div>
        ) : websites.length === 0 ? (
          <Card>
            <p className="text-center py-4 text-gray-500">
              You don't have any websites yet. Add one above to get started.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {websites.map((site) => (
              <Card key={site._id}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">
                    {site.name || new URL(site.url).hostname}
                  </h3>
                  <button
                    onClick={() => handleDeleteUrl(site._id)}
                    disabled={deletingId === site._id}
                    className="text-gray-400 hover:text-red-600 transition-colors focus:outline-none"
                    aria-label="Delete website"
                  >
                    {deletingId === site._id ? (
                      <svg
                        className="animate-spin h-5 w-5"
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
                    ) : (
                      <svg
                        className="h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-gray-500 text-sm mb-3 truncate">
                  {site.url}
                </p>
                <div className="flex justify-between items-center">
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded ${getStatusClasses(
                      site.currentStatus
                    )}`}
                  >
                    Status:{" "}
                    {site.currentStatus
                      ? site.currentStatus.charAt(0).toUpperCase() +
                        site.currentStatus.slice(1)
                      : "Unknown"}
                  </span>
                  {site.responseTime && (
                    <span className="text-sm text-gray-500">
                      Response: {site.responseTime}ms
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
