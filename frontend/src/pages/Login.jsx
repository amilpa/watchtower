import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import InputField from "../components/InputField";
import Button from "../components/Button";

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear errors when field is edited
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Invalid credentials");
      }

      // Store the token in localStorage
      localStorage.setItem("authToken", data.token);

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      setApiError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full relative">
        {/* Back button positioned at the top left */}
        <button
          onClick={handleBack}
          className="absolute top-4 left-4 text-gray-600 hover:text-gray-900 flex items-center text-sm"
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
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
          Back to Home
        </button>

        <div className="mb-6 pt-12">
          <h2 className="text-center text-3xl font-bold text-gray-900">
            Login to WatchTower
          </h2>
        </div>

        {apiError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <InputField
            label="Email Address"
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
          />

          <InputField
            label="Password"
            type="password"
            name="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
          />

          <div className="flex justify-center">
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </div>
        </form>

        {/* Alternative back link at the bottom */}
        <div className="mt-6 text-center">
          <button
            onClick={handleBack}
            className="text-blue-600 hover:text-blue-800 text-sm"
            type="button"
          >
            Return to homepage
          </button>
        </div>
      </Card>
    </div>
  );
}

export default Login;
