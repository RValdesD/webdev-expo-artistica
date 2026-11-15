import { useRef, useState } from "react";
import axiosSecure from "../utils/axiosSecure";
import { apiError } from "../services/auth";
interface Props {
  value: string;
  onChange: (url: string) => void;
  label: string;
  circle?: boolean;
  onBusy: (busy: boolean) => void;
  disabled?: boolean;
}

export default function ImageUpload({
  value,
  onChange,
  label,
  circle = false,
  onBusy,
  disabled = false,
}: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  async function upload(file?: File) {
    if (!file || busy || disabled) return;
    setError("");
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 5 * 1024 * 1024
    ) {
      setError("Selecciona JPG, PNG o WebP de hasta 5 MB.");
      return;
    }
    setBusy(true);
    onBusy(true);
    try {
      const { data } = await axiosSecure.post<{ url: string }>(
        "/api/artist-account/images",
        file,
        { headers: { "Content-Type": "application/octet-stream" } },
      );
      onChange(data.url);
    } catch (reason) {
      setError(apiError(reason));
    } finally {
      setBusy(false);
      onBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <div
      className={`image-upload ${dragging ? "image-upload--dragging" : ""}`}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (event.dataTransfer.files.length !== 1) {
          setError("Selecciona una imagen a la vez.");
          return;
        }
        void upload(event.dataTransfer.files[0]);
      }}
    >
      {value ? (
        <img
          className={circle ? "profile-picture" : "submission-preview"}
          src={value}
          alt={label}
        />
      ) : (
        <div
          className={
            circle
              ? "profile-picture profile-picture--empty"
              : "image-upload__empty"
          }
          aria-hidden="true"
        >
          ＋
        </div>
      )}
      <p>
        {busy
          ? "Subiendo imagen…"
          : "Arrastra una imagen aquí o selecciónala desde tu equipo. Por favor, asegurese que la imagen respete las consideraciones de contenido Visual."}
      </p>
      <input
        ref={input}
        className="visually-hidden"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        tabIndex={-1}
        aria-label={label}
        disabled={busy || disabled}
        onChange={(event) => void upload(event.target.files?.[0])}
      />
      <button
        className="button"
        type="button"
        disabled={busy || disabled}
        onClick={() => input.current?.click()}
      >
        {busy ? "Subiendo…" : "Seleccionar imagen"}
      </button>
      {error && (
        <p role="alert" className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
