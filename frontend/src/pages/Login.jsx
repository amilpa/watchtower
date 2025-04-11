import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import InputField from "../components/InputField";
import Button from "../components/Button";

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    // Clear errors when field is edited
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
    // Clear API error when user types
    setApiError("");
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
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    // Additional validations for registration
    if (!isLogin) {
      if (!formData.name) {
        newErrors.name = "Name is required";
      }

      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");
    setRegisterSuccess("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Determine if we're logging in or registering
      const endpoint = isLogin ? "login" : "register";

      const response = await fetch(
        `http://localhost:5000/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...(isLogin ? {} : { name: formData.name }), // Include name only for registration
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            (isLogin ? "Invalid credentials" : "Registration failed")
        );
      }

      if (isLogin) {
        // Store the token in localStorage and redirect to dashboard
        localStorage.setItem("authToken", data.token);
        navigate("/dashboard");
      } else {
        // Show success message and switch to login
        setRegisterSuccess(
          "Registration successful! Please log in with your new account."
        );
        setIsLogin(true);
        // Clear form except for email (convenience for login)
        setFormData({
          name: "",
          email: formData.email,
          password: "",
          confirmPassword: "",
        });
      }
    } catch (err) {
      setApiError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setApiError("");
    setRegisterSuccess("");
    setErrors({});
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
            {isLogin ? "Login to WatchTower" : "Create Your Account"}
          </h2>
        </div>

        {apiError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {apiError}
          </div>
        )}

        {registerSuccess && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
            {registerSuccess}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name field - only shown for registration */}
          {!isLogin && (
            <InputField
              label="Full Name"
              type="text"
              name="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
            />
          )}

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

          {/* Confirm Password - only shown for registration */}
          {!isLogin && (
            <InputField
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
            />
          )}

          <div className="flex justify-center">
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading
                ? isLogin
                  ? "Logging in..."
                  : "Registering..."
                : isLogin
                ? "Login"
                : "Register"}
            </Button>
          </div>
        </form>

        {/* Toggle between login and register */}
        <div className="mt-6 text-center">
          <button
            onClick={toggleForm}
            className="text-blue-600 hover:text-blue-800 text-sm"
            type="button"
          >
            {isLogin
              ? "Need an account? Register here"
              : "Already have an account? Login here"}
          </button>
        </div>

        {/* Alternative back link at the bottom */}
        <div className="mt-3 text-center">
          <button
            onClick={handleBack}
            className="text-gray-600 hover:text-gray-800 text-sm"
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
