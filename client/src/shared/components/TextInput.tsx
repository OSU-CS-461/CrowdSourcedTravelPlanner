type TextInputProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange"
> & {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export default function TextInput({
  value,
  onChange,
  error,
  ...props
}: TextInputProps) {
  return (
    <>
      <input
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
      />
      {error && <p className="input-error">{error}</p>}
    </>
  );
}
