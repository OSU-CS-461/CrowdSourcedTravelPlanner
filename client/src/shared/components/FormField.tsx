type FormFieldProps = {
  label: string;
  error?: string;
  children: React.ReactNode;
};

export default function FormField({
  label,
  error,
  children,
}: FormFieldProps) {
  return (
    <div className="form-field">
      <label>{label}</label>
      {children}
      {error && <p className="input-error">{error}</p>}
    </div>
  );
}
