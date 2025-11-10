import { isAxiosError } from "axios";
import { ChangeEvent, FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { authLogin } from "../services/api.service";

type LoginFormValues = {
  email: string;
  password: string;
};

type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

const initialValues: LoginFormValues = {
  email: "",
  password: "",
};

function LoginPage() {
  const [values, setValues] = useState<LoginFormValues>(initialValues);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [touched, setTouched] = useState<
    Record<keyof LoginFormValues, boolean>
  >({
    email: false,
    password: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { initialize } = useAuth();

  const validate = (fieldValues: LoginFormValues) => {
    const nextErrors: LoginFormErrors = {};

    // if (!fieldValues.email.trim()) {
    //   nextErrors.email = "Email is required.";
    // } else if (
    //   !/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/u.test(fieldValues.email.trim())
    // ) {
    //   nextErrors.email = "Enter a valid email.";
    // }

    if (!fieldValues.password) {
      nextErrors.password = "Password is required.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const validationErrors = validate(values);
    setTouched({ email: true, password: true });
    setErrors(validationErrors);

    if (!Object.keys(validationErrors).length) {
      try {
        setIsSubmitting(true);
        const authData = await authLogin(values.email, values.password);
        initialize(authData);
        navigate("/");
      } catch (error) {
        const message =
          isAxiosError(error) && error.response?.data?.message
            ? String(error.response.data.message)
            : "We couldn't sign you in. Please double-check your credentials.";
        setFormError(message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleChange =
    (field: keyof LoginFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValues = { ...values, [field]: event.target.value };
      setValues(nextValues);
      if (touched[field]) {
        const validationErrors = validate(nextValues);
        setErrors((prev) => ({ ...prev, [field]: validationErrors[field] }));
      }
    };

  const handleBlur = (field: keyof LoginFormValues) => () => {
    if (!touched[field]) {
      setTouched((prev) => ({ ...prev, [field]: true }));
    }
    const validationErrors = validate(values);
    setErrors(validationErrors);
  };

  return (
    <main className="auth-page">
      <section>
        <h1>Login</h1>
        <p>Sign in to access your travel plans.</p>

        <form noValidate onSubmit={handleSubmit}>
          {formError ? <p className="form-error">{formError}</p> : null}

          <div className="field">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={handleChange("email")}
              onBlur={handleBlur("email")}
              disabled={isSubmitting}
              aria-invalid={touched.email && !!errors.email}
              aria-describedby={errors.email ? "login-email-error" : undefined}
            />
            {touched.email && errors.email ? (
              <span className="field-error" id="login-email-error">
                {errors.email}
              </span>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={values.password}
              onChange={handleChange("password")}
              onBlur={handleBlur("password")}
              disabled={isSubmitting}
              aria-invalid={touched.password && !!errors.password}
              aria-describedby={
                errors.password ? "login-password-error" : undefined
              }
            />
            {touched.password && errors.password ? (
              <span className="field-error" id="login-password-error">
                {errors.password}
              </span>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || Object.values(errors).some(Boolean)}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? "Signing in..." : "Continue"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default LoginPage;
