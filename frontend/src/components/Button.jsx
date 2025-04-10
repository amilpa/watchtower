function Button({ children, onClick, variant = "primary", type = "button" }) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };

  const buttonClass = `px-4 py-2 rounded font-medium transition-colors ${variants[variant]}`;

  return (
    <button type={type} className={buttonClass} onClick={onClick}>
      {children}
    </button>
  );
}

export default Button;
