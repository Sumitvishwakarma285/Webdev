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

  // useEffect(() => {
  //   let isMounted = true;
    
  //   const init = async () => {
  //     try {
  //       const response = await axios.post("http://localhost:3000/template", { prompt: prompt.trim() });
  //       if (!isMounted) return;
  //       const { prompts, uiPrompts } = response.data;
  //       if (!uiPrompts || uiPrompts.length === 0) throw new Error("uiPrompts is empty");

  //       setSteps(parseXml(uiPrompts[0]).map((x) => ({ ...x, status: "pending" })));

  //       const stepsResponse = await axios.post("http://localhost:3000/chat", {
  //         messages: [...prompts, prompt].map((content) => ({ role: "user", content })),
  //       });

  //       if (!isMounted) return;
  //       console.log("Response from /chat:", stepsResponse.data.response);
  //       setSteps(s=>[...s, ...parseXml(stepsResponse.data.response).map((x) => ({ ...x, status: "pending" }))]);
  
  //     } catch (error) {
  //       console.error("Error initializing AI steps:", error);
  //     }
  //   };

  //   init();
    
  //   return () => { isMounted = false; };
  // }, [prompt]);

  useEffect(() => {
    let isMounted = true;
  
    const init = async () => {
      try {
        const response = await axios.post("http://localhost:3000/template", { prompt: prompt.trim() });
        if (!isMounted) return;
        const { prompts, uiPrompts } = response.data;
        if (!uiPrompts || uiPrompts.length === 0) throw new Error("uiPrompts is empty");
  
        setSteps(parseXml(uiPrompts[0]).map((x, index) => ({ ...x, status: "pending", id: index + 1 })));
  
        const stepsResponse = await axios.post("http://localhost:3000/chat", {
          messages: [...prompts, prompt].map((content) => ({ role: "user", content })),
        });
  
        if (!isMounted) return;
        
        console.log("Raw Response from /chat:", stepsResponse.data.response);
  
        // Remove <think>...</think> section
        const cleanedResponse = stepsResponse.data.response.replace(/<think>.*?<\/think>/gs, "").trim();
  
        console.log("Cleaned Response:", cleanedResponse);
  
        // Extract file and code blocks
        const fileBlocks = cleanedResponse.match(/```typescript\n\/\/ src\/(.*?)\n([\s\S]*?)```/g) || [];
        
        const extractedFiles = fileBlocks.map((block, index) => {
          const match = block.match(/```typescript\n\/\/ src\/(.*?)\n([\s\S]*?)```/);
          if (!match) return null;
          const [, filePath, fileContent] = match;
          return {
            id: Date.now() + index, // Unique ID
            path: `src/${filePath.trim()}`,
            name: filePath.split("/").pop(),
            type: "file",
            content: fileContent.trim(),
            status: "pending",
          };
        }).filter(Boolean);
  
        console.log("Extracted Files:", extractedFiles);
  
        // Append extracted files to steps ensuring unique IDs
        setSteps((prevSteps) => [
          ...prevSteps,
          ...extractedFiles.map((file, index) => ({
            ...file,
            id: prevSteps.length + index + 1, // Ensuring uniqueness
          })),
        ]);
  
      } catch (error) {
        console.error("Error initializing AI steps:", error);
      }
    };
  
    init();
    
    return () => { isMounted = false; };
  }, [prompt]);
  

  useEffect(() => {
    let updateHappened = false;
    const updatedFiles = [...files];

    steps.forEach((step) => {
      if (step.status !== "pending") return;
      updateHappened = true;

      if (step.type === "CreateFile") {
        const parsedPath = step.path?.split("/") ?? [];
        let currentFileStructure = updatedFiles;

        parsedPath.reduce((currentPath, folderName, index, arr) => {
          const newPath = `${currentPath}/${folderName}`;
          let node = currentFileStructure.find((x) => x.path === newPath);

          if (!node) {
            node = {
              name: folderName,
              type: index === arr.length - 1 ? "file" : "folder",
              path: newPath,
              content: index === arr.length - 1 ? step.code : undefined,
              children: [],
            };
            currentFileStructure.push(node);
          }
          currentFileStructure = node.children || [];
          return newPath;
        }, "");
      }
    });

    if (updateHappened) {
      setFiles(updatedFiles);
      setSteps((prevSteps) => prevSteps.map((s) => ({ ...s, status: "completed" })));
    }
  }, [steps]);

  const mountStructure = useMemo(() => {
    const createStructure = (files) => {
      return files.reduce((acc, file) => {
        acc[file.name] = file.type === "folder"
          ? { directory: createStructure(file.children || []) }
          : { file: { contents: file.content || "" } };
        return acc;
      }, {});
    };
    return createStructure(files);
  }, [files]);

  useEffect(() => {
    if (!webcontainer || Object.keys(mountStructure).length === 0) return;
    webcontainer.mount(mountStructure).catch((error) => {
      console.error("Error mounting files in WebContainer:", error);
    });
  }, [webcontainer, mountStructure]);

  const getFileLanguage = (filename) => {
    const ext = filename.split(".").pop().toLowerCase();
    return {
      html: "html",
      css: "css",
      js: "javascript",
      jsx: "javascript",
    }[ext] || "plaintext";
  };

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
                  language={getFileLanguage(selectedFile.name)}
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


