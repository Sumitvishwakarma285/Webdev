import React, { useEffect, useState, useMemo } from "react";
import { useLocation, Navigate } from "react-router-dom";
import Editor from "@monaco-editor/react";
import StepsList from "../components/StepsList";
import FileExplorer from "../components/FileExplorer";
import TabView from "../components/TabView";
import axios from "axios";
import { useWebContainer } from "../hooks/useWebContainer";
import { parseXml } from "../steps";

const Builder = () => {
  const location = useLocation();
  const prompt = location.state?.prompt;
  const webcontainer = useWebContainer();

  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState("code");
  const [steps, setSteps] = useState([]);
  const [files, setFiles] = useState([]);

  if (!prompt) return <Navigate to="/" replace />;

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const response = await axios.post("http://localhost:3000/template", { prompt: prompt.trim() });
        if (!isMounted) return;
        const { prompts, uiPrompts } = response.data;
        if (!uiPrompts || uiPrompts.length === 0) throw new Error("uiPrompts is empty");

        setSteps(parseXml(uiPrompts[0]).map((x, index) => ({
          ...x,
          status: "pending",
          id: index + 1
        })));

        const stepsResponse = await axios.post("http://localhost:3000/chat", {
          messages: [...prompts, prompt].map((content) => ({ role: "user", content })),
        });

        if (!isMounted) return;

        console.log("Raw Response from /chat:", stepsResponse.data.response);

        const cleanedResponse = stepsResponse.data.response.replace(/<think>.*?<\/think>/gs, "").trim();
        console.log("Cleaned Response:", cleanedResponse);

        const fileBlocks = cleanedResponse.match(/```typescript\n\/\/ src\/(.*?)\n([\s\S]*?)```/g) || [];
        
        const extractedFiles = fileBlocks.map((block, index) => {
          const match = block.match(/```typescript\n\/\/ src\/(.*?)\n([\s\S]*?)```/);
          if (!match) return null;
          const [, filePath, fileContent] = match;

          return {
            id: Date.now() + index,
            path: `src/${filePath.trim()}`,
            name: filePath.split("/").pop(),
            type: "file",
            content: fileContent.trim(),
            status: "pending",
          };
        }).filter(Boolean);

        console.log("Extracted Files:", extractedFiles);

        setFiles((prevFiles) => [...prevFiles, ...extractedFiles]);

      } catch (error) {
        console.error("Error initializing AI steps:", error);
      }
    };

    init();
    
    return () => { isMounted = false; };
  }, [prompt]);

  useEffect(() => {
    if (!webcontainer || files.length === 0) return;
    
    const mountFiles = async () => {
      for (const file of files) {
        await webcontainer.fs.writeFile(file.path, file.content || "");
      }
    };

    mountFiles().catch((error) => {
      console.error("Error mounting files in WebContainer:", error);
    });
  }, [webcontainer, files]);

  return (
    <div className="h-screen bg-gray-900 flex flex-col text-gray-100">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <h1 className="text-xl font-semibold">Website Builder</h1>
        <p className="text-sm text-gray-400 mt-1">Prompt: {prompt}</p>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-1/4 overflow-y-auto border-r border-gray-700">
          <StepsList steps={steps} />
        </div>
        <div className="w-1/4 overflow-y-auto border-r border-gray-700">
          <FileExplorer files={files} onFileSelect={setSelectedFile} />
        </div>
        <div className="flex-1 flex flex-col">
          <TabView activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex-1">
            {activeTab === "code" ? (
              selectedFile ? (
                <Editor
                  height="100%"
                  theme="vs-dark"
                  language={selectedFile.name.split(".").pop() || "plaintext"}
                  value={selectedFile?.content || ""}
                  onChange={(newValue) => {
                    setFiles((prevFiles) =>
                      prevFiles.map((file) =>
                        file.path === selectedFile.path ? { ...file, content: newValue } : file
                      )
                    );
                  }}
                  options={{
                    readOnly: false,
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Select a file to view its content
                </div>
              )
            ) : (
              <iframe src="/preview" className="w-full h-full bg-white" title="Website Preview" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Builder;
