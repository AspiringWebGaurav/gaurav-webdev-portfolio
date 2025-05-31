"use client";

export default function AdminPage() {
  const isDev = process.env.NODE_ENV === "development";

  const loginUrl = isDev
    ? "http://localhost:5173/login"
    : "https://gaurav-portfolio-admin-services.netlify.app/login";

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>Admin Access</h1>
      <p>Click below to open the Admin Panel in a new tab:</p>
      <a
        href={loginUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop: "1rem",
          padding: "0.75rem 1.5rem",
          backgroundColor: "#0070f3",
          color: "#fff",
          borderRadius: "8px",
          textDecoration: "none",
          display: "inline-block",
          fontWeight: "bold",
        }}
      >
        Open Admin Panel
      </a>
    </div>
  );
}
