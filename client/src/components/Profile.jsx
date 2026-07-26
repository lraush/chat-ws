import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Main.module.css";
import LobbyMenu from "./LobbyMenu";
import RequireAuth from "./RequireAuth";
import { updateProfileName, updateProfilePassword } from "../utils/api";
import { getAuthUser, isAdmin } from "../utils/auth";
import {
  DISPLAY_NAME_MAX,
  sanitizeDisplayName,
  validateDisplayName,
} from "../utils/displayName";
import { CloseIcon } from "./CloseIcon";

const Profile = () => {
  const navigate = useNavigate();
  const user = getAuthUser();

  const [savedName, setSavedName] = useState(user?.name ?? "");
  const [displayName, setDisplayName] = useState(user?.name ?? "");
  const [nameEditOpen, setNameEditOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [nameError, setNameError] = useState("");
  const [nameSuccess, setNameSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFormOpen, setPasswordFormOpen] = useState(false);

  const openNameEdit = () => {
    setNameError("");
    setNameSuccess("");
    setDisplayName(savedName);
    setNameEditOpen(true);
  };

  const openPasswordEdit = () => {
    setPasswordError("");
    setPasswordSuccess("");
    setPasswordFormOpen(true);
  };

  const handleCancelName = () => {
    setNameEditOpen(false);
    setNameError("");
    setDisplayName(savedName);
  };

  const handleNameChange = (e) => {
    setDisplayName(sanitizeDisplayName(e.target.value));
  };

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    if (savingName) return;
    setNameError("");
    setNameSuccess("");

    const checked = validateDisplayName(displayName);
    if (checked.error) {
      setNameError(
        "Use 2–100 characters: letters, numbers, spaces, dot, hyphen, underscore.",
      );
      return;
    }

    setSavingName(true);

    try {
      await updateProfileName(checked.name);
      setSavedName(checked.name);
      setDisplayName(checked.name);
      setNameSuccess("Name updated.");
      setNameEditOpen(false);
    } catch (err) {
      if (err?.message === "invalid_name") {
        setNameError(
          "Use 2–100 characters: letters, numbers, spaces, dot, hyphen, underscore.",
        );
      } else if (err?.message === "name_taken") {
        setNameError("This name is already taken.");
      } else if (err?.message === "network") {
        setNameError("Cannot reach the server.");
      } else if (err?.message === "unauthorized") {
        navigate("/", { replace: true });
      } else {
        setNameError("Could not update name.");
      }
    } finally {
      setSavingName(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (savingPassword) return;
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setSavingPassword(true);

    try {
      await updateProfilePassword(currentPassword, newPassword);
      setPasswordSuccess("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordFormOpen(false);
    } catch (err) {
      if (err?.message === "invalid_current_password") {
        setPasswordError("Current password is incorrect.");
      } else if (err?.message === "weak_password") {
        setPasswordError("New password must be at least 6 characters.");
      } else if (err?.message === "network") {
        setPasswordError("Cannot reach the server.");
      } else if (err?.message === "unauthorized") {
        navigate("/", { replace: true });
      } else {
        setPasswordError("Could not update password.");
      }
    } finally {
      setSavingPassword(false);
    }
  };

  const handleCancelPassword = () => {
    setPasswordFormOpen(false);
    setPasswordError("");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <RequireAuth>
      <div className={styles.wrap}>
      <header className={styles.lobbyHeader}>
        <LobbyMenu />
      </header>
      <div
        className={`${styles.container} ${styles.centered} ${styles.flatCorners} ${styles.profilePage}`}
      >
        <h1 className={styles.heading}>Profile</h1>

        {nameError && !nameEditOpen ? (
          <p className={styles.error}>{nameError}</p>
        ) : null}
        {nameSuccess ? <p className={styles.hint}>{nameSuccess}</p> : null}
        {passwordSuccess ? <p className={styles.hint}>{passwordSuccess}</p> : null}

        <dl className={styles.profileList}>
          <div className={styles.profileRow}>
            <dt className={styles.profileLabel}>Name</dt>
            <dd className={styles.profileNameValue}>
              {!nameEditOpen ? (
                <>
                  <span className={styles.profileValue}>{savedName || "—"}</span>
                  <button
                    type="button"
                    className={styles.profileIconButton}
                    aria-label="Edit name"
                    title="Edit name"
                    onClick={openNameEdit}
                  >
                    ⚙
                  </button>
                </>
              ) : (
                <form
                  className={`${styles.profileNameForm} ${styles.flatCorners}`}
                  onSubmit={handleNameSubmit}
                >
                  <div className={styles.profileEditHeader}>
                    <button
                      type="button"
                      className={styles.profileCloseButton}
                      aria-label="Close"
                      title="Close"
                      onClick={handleCancelName}
                      disabled={savingName}
                    >
                      <CloseIcon />
                    </button>
                  </div>
                  {nameError ? (
                    <p className={styles.error}>{nameError}</p>
                  ) : null}
                  <input
                    type="text"
                    className={styles.input}
                    value={displayName}
                    maxLength={DISPLAY_NAME_MAX}
                    required
                    autoComplete="name"
                    autoFocus
                    onChange={handleNameChange}
                  />
                  <button
                    type="submit"
                    className={styles.button}
                    disabled={savingName}
                  >
                    {savingName ? "Saving…" : "Save"}
                  </button>
                </form>
              )}
            </dd>
          </div>
          <div className={styles.profileRow}>
            <dt className={styles.profileLabel}>Email</dt>
            <dd className={styles.profileValue}>{user?.email ?? "—"}</dd>
          </div>
          <div className={styles.profileRow}>
            <dt className={styles.profileLabel}>Password</dt>
            <dd className={styles.profileNameValue}>
              {!passwordFormOpen ? (
                <>
                  <span className={styles.profileValue}>••••••••</span>
                  <button
                    type="button"
                    className={styles.profileIconButton}
                    aria-label="Change password"
                    title="Change password"
                    onClick={openPasswordEdit}
                  >
                    ⚙
                  </button>
                </>
              ) : (
                <form
                  className={`${styles.profileNameForm} ${styles.flatCorners}`}
                  onSubmit={handlePasswordSubmit}
                >
                  <div className={styles.profileEditHeader}>
                    <button
                      type="button"
                      className={styles.profileCloseButton}
                      aria-label="Close"
                      title="Close"
                      onClick={handleCancelPassword}
                      disabled={savingPassword}
                    >
                      <CloseIcon />
                    </button>
                  </div>
                  {passwordError ? (
                    <p className={styles.error}>{passwordError}</p>
                  ) : null}
                  <label className={styles.group}>
                    <span className={styles.label}>Current password</span>
                    <input
                      type="password"
                      className={styles.input}
                      value={currentPassword}
                      required
                      autoComplete="current-password"
                      autoFocus
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </label>
                  <label className={styles.group}>
                    <span className={styles.label}>New password</span>
                    <input
                      type="password"
                      className={styles.input}
                      value={newPassword}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </label>
                  <label className={styles.group}>
                    <span className={styles.label}>Confirm new password</span>
                    <input
                      type="password"
                      className={styles.input}
                      value={confirmPassword}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </label>
                  <button
                    type="submit"
                    className={styles.button}
                    disabled={savingPassword}
                  >
                    {savingPassword ? "Saving…" : "Save"}
                  </button>
                </form>
              )}
            </dd>
          </div>
          {isAdmin() ? (
            <div className={styles.profileRow}>
              <dt className={styles.profileLabel}>Role</dt>
              <dd className={styles.profileValue}>Administrator</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </div>
    </RequireAuth>
  );
};

export default Profile;
