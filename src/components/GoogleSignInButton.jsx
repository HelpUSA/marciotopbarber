
import React, {
  useEffect,
  useRef,
  useState,
} from "react";

const GOOGLE_SCRIPT_URL =
  "https://accounts.google.com/gsi/client";

let googleScriptPromise = null;

function loadGoogleScript() {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (googleScriptPromise) {
    return googleScriptPromise;
  }

  googleScriptPromise = new Promise(
    (resolve, reject) => {
      const existing = document.querySelector(
        `script[src="${GOOGLE_SCRIPT_URL}"]`
      );

      if (existing) {
        existing.addEventListener(
          "load",
          () => resolve(),
          { once: true }
        );

        existing.addEventListener(
          "error",
          () => reject(
            new Error(
              "Não foi possível carregar o login Google."
            )
          ),
          { once: true }
        );

        return;
      }

      const script = document.createElement("script");
      script.src = GOOGLE_SCRIPT_URL;
      script.async = true;
      script.defer = true;

      script.onload = () => resolve();
      script.onerror = () => reject(
        new Error(
          "Não foi possível carregar o login Google."
        )
      );

      document.head.appendChild(script);
    }
  );

  return googleScriptPromise;
}

export default function GoogleSignInButton({
  onCredential,
  disabled = false,
}) {
  const containerRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const clientId = (
      import.meta.env.VITE_GOOGLE_CLIENT_ID || ""
    ).trim();

    if (!clientId) {
      setError(
        "Login Google aguardando configuração do Client ID."
      );
      return undefined;
    }

    async function renderButton() {
      try {
        await loadGoogleScript();

        if (
          !active ||
          !containerRef.current
        ) {
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            const credential = response?.credential;

            if (!credential) {
              setError(
                "O Google não retornou uma credencial válida."
              );
              return;
            }

            onCredential(credential);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true,
        });

        containerRef.current.replaceChildren();

        window.google.accounts.id.renderButton(
          containerRef.current,
          {
            type: "standard",
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "rectangular",
            logo_alignment: "left",
            width: 360,
          }
        );
      } catch (loadError) {
        if (active) {
          setError(
            loadError.message ||
            "Não foi possível iniciar o login Google."
          );
        }
      }
    }

    renderButton();

    return () => {
      active = false;
    };
  }, [onCredential]);

  return (
    <div>
      <div
        ref={containerRef}
        aria-disabled={disabled}
        className={
          disabled
            ? "pointer-events-none opacity-50"
            : ""
        }
      />

      {error && (
        <p
          role="alert"
          className="mt-3 text-sm text-amber-200"
        >
          {error}
        </p>
      )}
    </div>
  );
}
