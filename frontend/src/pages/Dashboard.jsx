import { useState } from "react";
import Card from "../components/Card";
import Button from "../components/Button";
import InputField from "../components/InputField";

function Dashboard() {
  const [url, setUrl] = useState("");

  const handleAddUrl = () => {
    // TODO: Implement API call to add URL
    console.log("Adding URL:", url);
    setUrl("");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <Card>
        <h2 className="text-xl font-semibold mb-4">Add New Website</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <InputField
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <Button onClick={handleAddUrl}>Add Website</Button>
        </div>
      </Card>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Your Websites</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Sample website card */}
          <Card>
            <h3 className="font-medium mb-2">example.com</h3>
            <div className="flex justify-between items-center">
              <span className="inline-block px-2 py-1 text-xs rounded bg-green-100 text-green-800">
                Status: Up
              </span>
              <span className="text-sm text-gray-500">Response: 235ms</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
