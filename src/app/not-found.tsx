import Link from "next/link";

export default function NotFound() {
  return <main style={{ minHeight: "100vh", display: "grid", placeContent: "center", textAlign: "center", padding: 24, background: "#f8faf9", color: "#18252c" }}><p style={{ color: "#188b80", fontWeight: 700, letterSpacing: 2 }}>SEARCHLIGHT</p><h1>That page is not here.</h1><p style={{ color: "#7b898e" }}>Return to your workspace and choose a module from the navigation.</p><Link href="/" style={{ color: "#108b80", fontWeight: 700 }}>Back to workspace →</Link></main>;
}
