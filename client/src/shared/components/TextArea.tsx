type TextAreaProps = Omit<
  React.TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onChange"
> & {
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

export default function TextArea({
  value,
  onChange,
  error,
  ...props
}: TextAreaProps) {
  return (
    <>
      <textarea
        {...props}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
      />
      {error && <p className="input-error">{error}</p>}
    </>
  );
}
