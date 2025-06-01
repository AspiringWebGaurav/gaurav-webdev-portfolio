export function getEnvURL(type) {
  const isDev = process.env.NODE_ENV === "development";

  if (type === "admin") {
    return isDev
      ? "http://localhost:5173"
      : "https://gaurav-portfolio-admin-services.netlify.app";
  }

  if (type === "portfolio") {
    return isDev
      ? "http://localhost:3000"
      : "https://gaurav-webdev-portfolio.vercel.app";
  }

  throw new Error("Invalid type passed to getEnvURL");
}
