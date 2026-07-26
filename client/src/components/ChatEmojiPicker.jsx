import EmojiPicker, { Theme } from "emoji-picker-react";

export default function ChatEmojiPicker({ onEmojiClick }) {
  return (
    <EmojiPicker
      theme={Theme.DARK}
      width="100%"
      height={220}
      searchPlaceholder="Search…"
      previewConfig={{ showPreview: false }}
      onEmojiClick={onEmojiClick}
      lazyLoadEmojis
      style={{
        "--epr-emoji-size": "22px",
        "--epr-emoji-padding": "3px",
        "--epr-horizontal-padding": "6px",
        "--epr-header-padding": "6px 8px",
        "--epr-category-label-height": "24px",
      }}
    />
  );
}
