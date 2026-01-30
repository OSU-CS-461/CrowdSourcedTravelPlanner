type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
};

export default function Button({
  variant = "primary",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`btn btn-${variant}`}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}
