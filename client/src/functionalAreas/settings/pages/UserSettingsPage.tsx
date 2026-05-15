import { isAxiosError } from "axios";
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { changeMyPassword } from "../../../shared/services/api.service";
import "./UserSettingsPage.css";

type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

type PasswordFormErrors = Partial<Record<keyof PasswordFormValues, string>>;

const PASSWORD_MIN_LENGTH = 8;

const initialValues: PasswordFormValues = {
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: "",
};

function validate(values: PasswordFormValues) {
  const nextErrors: PasswordFormErrors = {};

  if (!values.currentPassword) {
    nextErrors.currentPassword = "Current password is required.";
  }

  if (!values.newPassword) {
    nextErrors.newPassword = "New password is required.";
  } else if (values.newPassword.length < PASSWORD_MIN_LENGTH) {
    nextErrors.newPassword = `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  if (!values.confirmNewPassword) {
    nextErrors.confirmNewPassword = "Confirm your new password.";
  } else if (values.confirmNewPassword !== values.newPassword) {
    nextErrors.confirmNewPassword = "Passwords must match.";
  }

  return nextErrors;
}

function formatSubmitError(error: unknown) {
  if (!isAxiosError(error)) {
    return "Unable to update password right now. Please try again.";
  }

  const status = error.response?.status;
  const responseData = error.response?.data as
    | { error?: unknown; details?: Array<{ message?: string }> }
    | undefined;

  if (status === 401) {
    return "Session expired. Please sign in again.";
  }

  if (status === 400 && responseData?.error === "Validation failed") {
    const firstDetail = responseData.details?.[0]?.message;
    if (typeof firstDetail === "string" && firstDetail.trim()) {
      return firstDetail;
    }
  }

  if (typeof responseData?.error === "string" && responseData.error.trim()) {
    return responseData.error;
  }

  if (status === 429) {
    return "Too many attempts. Please try again later.";
  }

  return "Unable to update password right now. Please try again.";
}

export default function UserSettingsPage() {
  const [values, setValues] = useState<PasswordFormValues>(initialValues);
  const [errors, setErrors] = useState<PasswordFormErrors>({});
  const [touched, setTouched] = useState<
    Record<keyof PasswordFormValues, boolean>
  >({
    currentPassword: false,
    newPassword: false,
    confirmNewPassword: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { logout } = useAuth();

  const onChange =
    (field: keyof PasswordFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValues = { ...values, [field]: event.target.value };
      setValues(nextValues);
      if (touched[field]) {
        const validationErrors = validate(nextValues);
        setErrors((prev) => ({ ...prev, [field]: validationErrors[field] }));
      }
    };

  const onBlur = (field: keyof PasswordFormValues) => () => {
    if (!touched[field]) {
      setTouched((prev) => ({ ...prev, [field]: true }));
    }
    setErrors(validate(values));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const validationErrors = validate(values);
    setTouched({
      currentPassword: true,
      newPassword: true,
      confirmNewPassword: true,
    });
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await changeMyPassword(values);
      setSuccessMessage(result.message || "Password updated successfully.");
      setValues(initialValues);
      setTouched({
        currentPassword: false,
        newPassword: false,
        confirmNewPassword: false,
      });
      setErrors({});
    } catch (error) {
      const message = formatSubmitError(error);
      setFormError(message);
      if (isAxiosError(error) && error.response?.status === 401) {
        logout();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="settings-page">
      <section className="settings-panel">
        <h1>User Settings</h1>
        <p>Change your password below.</p>

        <form noValidate onSubmit={onSubmit}>
          {formError ? (
            <p className="form-error" role="alert">
              {formError}
            </p>
          ) : null}

          {successMessage ? (
            <p className="form-success" role="status">
              {successMessage}
            </p>
          ) : null}

          <div className="field">
            <label htmlFor="current-password">Current password</label>
            <input
              id="current-password"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={values.currentPassword}
              onChange={onChange("currentPassword")}
              onBlur={onBlur("currentPassword")}
              disabled={isSubmitting}
              aria-invalid={touched.currentPassword && !!errors.currentPassword}
              aria-describedby={
                errors.currentPassword ? "current-password-error" : undefined
              }
            />
            {touched.currentPassword && errors.currentPassword ? (
              <span className="field-error" id="current-password-error">
                {errors.currentPassword}
              </span>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              value={values.newPassword}
              onChange={onChange("newPassword")}
              onBlur={onBlur("newPassword")}
              disabled={isSubmitting}
              aria-invalid={touched.newPassword && !!errors.newPassword}
              aria-describedby={errors.newPassword ? "new-password-error" : undefined}
            />
            {touched.newPassword && errors.newPassword ? (
              <span className="field-error" id="new-password-error">
                {errors.newPassword}
              </span>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor="confirm-new-password">Confirm new password</label>
            <input
              id="confirm-new-password"
              name="confirmNewPassword"
              type="password"
              autoComplete="new-password"
              value={values.confirmNewPassword}
              onChange={onChange("confirmNewPassword")}
              onBlur={onBlur("confirmNewPassword")}
              disabled={isSubmitting}
              aria-invalid={
                touched.confirmNewPassword && !!errors.confirmNewPassword
              }
              aria-describedby={
                errors.confirmNewPassword
                  ? "confirm-new-password-error"
                  : undefined
              }
            />
            {touched.confirmNewPassword && errors.confirmNewPassword ? (
              <span className="field-error" id="confirm-new-password-error">
                {errors.confirmNewPassword}
              </span>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update password"}
          </button>
        </form>
      </section>
    </main>
  );
}
