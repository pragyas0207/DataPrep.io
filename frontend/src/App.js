import { useState, useRef } from "react"

export default function App() {
  const [file, setFile] = useState(null)
  const inputRef = useRef(null)
  const [report, setReport] = useState(null)
  const [cleanedFile, setCleanedFile] = useState(null)
  const [loading, setLoading] = useState(false)      //to show "Processing..." while waiting for API to give output.csv

  const [strategy, setStrategy] = useState("median")
  const [encoding, setEncoding] = useState("label")
  const [scaling, setScaling] = useState("standard")



  const handleSubmit = async () => {
    if (!file) {
      alert("Please upload a CSV file first!")
      return
    }

    setLoading(true)
    // await new Promise(resolve => setTimeout(resolve, 2000))
    // for now, smaller dataset are being processes fast so we cant see the "Processing..." msg
    //Hence, added an artificial delay just to understand how that works



    try {
      console.log("starting...")
      const formData = new FormData()
      formData.append("file", file)
      formData.append("strategy", strategy)
      formData.append("encoding", encoding)
      formData.append("scaling", scaling)

      const [reportRes, fileRes] = await Promise.all([
        fetch("http://127.0.0.1:8000/report", { method: "POST", body: formData }),
        fetch("http://127.0.0.1:8000/preprocess", { method: "POST", body: formData })
      ])

      const reportData = await reportRes.json()
      const fileBlob = await fileRes.blob()
      console.log("fileBlob:", fileBlob)

      setReport(reportData)
      setCleanedFile(fileBlob)
      console.log("done!", reportData)
    } catch (err) {
      console.error("Error:", err)
    }
    setLoading(false)
  }


  const handleDownload = () => {
    const url = window.URL.createObjectURL(cleanedFile)
    const a = document.createElement("a")
    a.href = url
    a.download = "cleaned.csv"
    a.click()
  }

  // reset button available only after report is displayed
  const handleReset = () => {
  setFile(null)
  setReport(null)
  setCleanedFile(null)
  setLoading(false)
}



  return (
    <div className="min-h-screen bg-gray-900">

      {/* Header */}
      <div className="bg-gray-800 py-6 text-center">
        <h1 className="text-4xl font-bold text-cyan-500">DataPrep.io</h1>
        <p className="text-gray-400 mt-2">Upload your CSV and get it cleaned instantly</p>
      </div>

      {/* Upload Area */}
      <div className="max-w-xl mx-auto mt-12">
        <div
          onClick={() => inputRef.current.click()}
          className="border-2 border-dashed border-cyan-500 rounded-xl p-12 text-center cursor-pointer hover:bg-gray-800 transition"
        >
          <p className="text-cyan-400 text-lg font-semibold">Click to upload CSV</p>
          <p className="text-gray-500 text-sm mt-1">Only .csv files accepted</p>
          {file && <p className="text-cyan-300 mt-4 font-medium">{file.name}</p>}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => setFile(e.target.files[0])}
        />
      </div>

      <div className="flex justify-center gap-4 mt-6">

        <div>
          <label className="text-gray-400 block mb-1 text-sm">Missing Value Strategy</label>
          <select value={strategy} onChange={(e) => setStrategy(e.target.value)}
            className="bg-gray-800 text-cyan-300 border border-cyan-500 rounded-lg px-4 py-2 w-40">
            <option value="drop">Drop</option>
            <option value="mean">Mean</option>
            <option value="median">Median</option>
            <option value="mode">Mode</option>
          </select>
        </div>

        <div>
          <label className="text-gray-400 block mb-1 text-sm">Categorical Encoding</label>
          <select
            value={encoding}
            onChange={(e) => setEncoding(e.target.value)}
            className="bg-gray-800 text-cyan-300 border border-cyan-500 rounded-lg px-4 py-2 w-40"
          >
            <option value="label">Label</option>
            <option value="onehot">One-Hot</option>
          </select>
        </div>

        <div>
          <label className="text-gray-400 block mb-1 text-sm">Numerical Scaling</label>
          <select
            value={scaling}
            onChange={(e) => setScaling(e.target.value)}
            className="bg-gray-800 text-cyan-300 border border-cyan-500 rounded-lg px-4 py-2 w-40"
          >
            <option value="minmax">Min-Max</option>
            <option value="standard">Standard</option>
            <option value="robust">Robust</option>
          </select>
        </div>

      </div>

      <div className="flex justify-center gap-5">
        <button onClick={handleSubmit} disabled={loading} className="mt-10 bg-cyan-500 text-gray-900 font-bold px-6 py-2 rounded-lg hover:bg-cyan-400">
          {loading ? "Processing..." : "Clean My Data"}
        </button>
        {/* <button onClick={handleSubmit} disabled={loading} className="mt-10 bg-cyan-500 text-gray-900 font-bold px-6 py-2 rounded-lg hover:bg-cyan-400">
          Clean My Data
        </button> */}
        {cleanedFile && (
          <button onClick={handleDownload} className="mt-10 bg-green-500 text-gray-900 font-bold px-6 py-2 rounded-lg hover:bg-green-400">
            Download Cleaned CSV
          </button>
        )}
      </div>

      <div className="flex justify-center">
        {report && (
          <div className="max-w-xl mx-auto mt-8 bg-gray-800 rounded-xl p-6 text-cyan-300">
            <h2 className="text-xl font-bold mb-4">Processing Report</h2>
            <p>Original Shape: {report.original_shape[0]} rows, {report.original_shape[1]} columns</p>
            <p>Cleaned Shape: {report.cleaned_shape[0]} rows, {report.cleaned_shape[1]} columns</p>
            <p>Missing Values Filled: {report.missing_filled}</p>
            <p>Columns Encoded: {report.columns_encoded.join(", ")}</p>
            <p>Columns Scaled: {report.columns_scaled.join(", ")}</p>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        {report &&(
          <button onClick={handleReset} className="mt-6 border text-cyan-400 font-bold px-8 py-2 rounded-lg hover:bg-cyan-400 hover:text-black">
            Reset
          </button>
        )}
      </div>


    </div>
  )
}

