import styles from "../styles/Main.module.css";

export function CloseIcon() {
  return (
    <svg
      className={styles.profileCloseIcon}
      viewBox="0 0 16 16"
      width={14}
      height={14}
      aria-hidden="true"
    >
      <path
        d="M4 4l8 8M12 4L4 12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
