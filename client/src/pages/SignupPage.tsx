import { ChangeEvent, FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { authSignup } from "../services/api.service";
import { useAuth } from "../hooks/useAuth";

type SignupFormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type SignupFormErrors = Partial<Record<keyof SignupFormValues, string>>;

const initialValues: SignupFormValues = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

function SignupPage() {
  const [values, setValues] = useState<SignupFormValues>(initialValues);
  const [errors, setErrors] = useState<SignupFormErrors>({});
  const [touched, setTouched] = useState<
    Record<keyof SignupFormValues, boolean>
  >({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { initialize } = useAuth();

  const validate = (fieldValues: SignupFormValues) => {
    const nextErrors: SignupFormErrors = {};

    if (!fieldValues.fullName.trim()) {
      nextErrors.fullName = "Name is required.";
    }

    if (!fieldValues.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (
      !/^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/u.test(fieldValues.email.trim())
    ) {
      nextErrors.email = "Enter a valid email.";
    }

    if (!fieldValues.password) {
      nextErrors.password = "Password is required.";
    } else if (fieldValues.password.length < 8) {
      nextErrors.password = "Use at least 8 characters.";
    }

    if (!fieldValues.confirmPassword) {
      nextErrors.confirmPassword = "Confirm your password.";
    } else if (fieldValues.confirmPassword !== fieldValues.password) {
      nextErrors.confirmPassword = "Passwords must match.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    const validationErrors = validate(values);
    setTouched({
      fullName: true,
      email: true,
      password: true,
      confirmPassword: true,
    });
    setErrors(validationErrors);

    if (!Object.keys(validationErrors).length) {
      try {
        setIsSubmitting(true);
        const authData = await authSignup({
          fullName: values.fullName.trim(),
          email: values.email.trim(),
          password: values.password,
        });
        initialize(authData);
        navigate("/");
      } catch (error) {
        const message =
          isAxiosError(error) && error.response?.data?.message
            ? String(error.response.data.message)
            : "We couldn't create your account. Please try again.";
        setFormError(message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleChange =
    (field: keyof SignupFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValues = { ...values, [field]: event.target.value };
      setValues(nextValues);
      if (touched[field]) {
        const validationErrors = validate(nextValues);
        setErrors((prev) => ({ ...prev, [field]: validationErrors[field] }));
      }
    };

  const handleBlur = (field: keyof SignupFormValues) => () => {
    if (!touched[field]) {
      setTouched((prev) => ({ ...prev, [field]: true }));
    }
    const validationErrors = validate(values);
    setErrors(validationErrors);
  };

  return (
    <main className="auth-page">
      <section>
        <h1>Sign Up</h1>
        <p>Create an account to collaborate on travel plans.</p>

        <form noValidate onSubmit={handleSubmit}>
          {formError ? <p className="form-error">{formError}</p> : null}

          <div className="field">
            <label htmlFor="signup-name">Full name</label>
            <input
              id="signup-name"
              name="fullName"
              type="text"
              autoComplete="name"
              value={values.fullName}
              onChange={handleChange("fullName")}
              onBlur={handleBlur("fullName")}
              disabled={isSubmitting}
              aria-invalid={touched.fullName && !!errors.fullName}
              aria-describedby={
                errors.fullName ? "signup-name-error" : undefined
              }
            />
            {touched.fullName && errors.fullName ? (
              <span className="field-error" id="signup-name-error">
                {errors.fullName}
              </span>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="signup-email">Email</label>
            <input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={handleChange("email")}
              onBlur={handleBlur("email")}
              disabled={isSubmitting}
              aria-invalid={touched.email && !!errors.email}
              aria-describedby={
                errors.email ? "signup-email-error" : undefined
              }
            />
            {touched.email && errors.email ? (
              <span className="field-error" id="signup-email-error">
                {errors.email}
              </span>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="signup-password">Password</label>
            <input
              id="signup-password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={handleChange("password")}
              onBlur={handleBlur("password")}
              disabled={isSubmitting}
              aria-invalid={touched.password && !!errors.password}
              aria-describedby={
                errors.password ? "signup-password-error" : undefined
              }
            />
            {touched.password && errors.password ? (
              <span className="field-error" id="signup-password-error">
                {errors.password}
              </span>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="signup-confirm-password">Confirm password</label>
            <input
              id="signup-confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={handleChange("confirmPassword")}
              onBlur={handleBlur("confirmPassword")}
              disabled={isSubmitting}
              aria-invalid={touched.confirmPassword && !!errors.confirmPassword}
              aria-describedby={
                errors.confirmPassword
                  ? "signup-confirm-password-error"
                  : undefined
              }
            />
            {touched.confirmPassword && errors.confirmPassword ? (
              <span
                className="field-error"
                id="signup-confirm-password-error"
              >
                {errors.confirmPassword}
              </span>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting || Object.values(errors).some(Boolean)}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default SignupPage;



