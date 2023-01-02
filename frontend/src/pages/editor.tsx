import dynamic from "next/dynamic"
import { useState } from "react"

const MonacoEditor = dynamic(
  async () => (await import("../components/YamlEditor/monacoEditor")).default,
  {
    ssr: false,
  },
)

/** Add your relevant code here for the issue to reproduce */
export default function Home() {
  const [code, setCode] = useState("")

  return (
    <div style={{ height: "100vh" }}>
      <MonacoEditor
        width="100%"
        height="100%"
        language="yaml"
        theme="vs-dark"
        value={code}
        options={{ selectOnLineNumbers: true }}
        onChange={setCode}
      />
    </div>
  )
}
