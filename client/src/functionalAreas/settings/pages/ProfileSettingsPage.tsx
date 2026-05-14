import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  getUserSettings,
  patchUserSettings,
} from "../../../shared/services/api.service";
import { ClientRoutes } from "../../../shared/clientRoutes";
import {
  isUiTheme,
  setUiTheme,
  setUiThemeLive,
  type UiTheme,
} from "../../../shared/theme";
import "./ProfileSettingsPage.css";

export default function ProfileSettingsPage() {
  const [draft, setDraft] = useState<UiTheme>("light");
  const committedRef = useRef<UiTheme>("light");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void getUserSettings()
      .then((s) => {
        if (!active) return;
        const t = isUiTheme(s.themePreference) ? s.themePreference : "light";
        committedRef.current = t;
        setDraft(t);
        setUiTheme(t);
        setLoadError(null);
      })
      .catch(() => {
        if (!active) return;
        setLoadError("Could not load settings.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      setUiTheme(committedRef.current);
    };
  }, []);

  const onDraftChange = (next: UiTheme) => {
    setDraft(next);
    setUiThemeLive(next);
  };

  const onSave = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      const updated = await patchUserSettings({ themePreference: draft });
      const t = isUiTheme(updated.themePreference)
        ? updated.themePreference
        : "light";
      committedRef.current = t;
      setUiTheme(t);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2000);
    } catch {
      setSaveError("Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="profile-settings">
      <div className="profile-settings__header">
        <Link to={ClientRoutes.HOME}>← Home</Link>
        <h1>Profile settings</h1>
      </div>

      {loadError ? <p className="profile-settings__error">{loadError}</p> : null}

      <div className="profile-settings__panel">
        <h2>Appearance</h2>
        <p className="profile-settings__muted">
          Choose a light (day) or dark (night) interface. Save to store this on
          your account.
        </p>

        <div
          className="profile-settings__options"
          aria-busy={loading}
          aria-disabled={loading}
        >
          <label className="profile-settings__option">
            <input
              type="radio"
              name="theme"
              value="light"
              checked={draft === "light"}
              disabled={loading}
              onChange={() => onDraftChange("light")}
            />
            <span>
              Light
              <small>Bright background, best in daylight.</small>
            </span>
          </label>
          <label className="profile-settings__option">
            <input
              type="radio"
              name="theme"
              value="dark"
              checked={draft === "dark"}
              disabled={loading}
              onChange={() => onDraftChange("dark")}
            />
            <span>
              Dark
              <small>Dimmed colors, easier on the eyes at night.</small>
            </span>
          </label>
        </div>

        <div className="profile-settings__actions">
          <button type="button" disabled={loading || saving} onClick={onSave}>
            {saving ? "Saving…" : "Save appearance"}
          </button>
          {savedFlash ? (
            <span className="profile-settings__success">Saved.</span>
          ) : null}
          {saveError ? (
            <span className="profile-settings__error">{saveError}</span>
          ) : null}
        </div>
      </div>
    </section>
  );
}
