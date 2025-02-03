
import React, { useState, useCallback } from "react";
import { FolderTree, File, ChevronRight, ChevronDown } from "lucide-react";

const FileNode = ({ item, depth, onFileClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleClick = useCallback(() => {
    if (item.type === "folder") {
      setIsExpanded((prev) => !prev);
    } else {
      onFileClick(item);
    }
  }, [item, onFileClick]);

  return (
    <div className="select-none">
      <div
        className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-md cursor-pointer transition-all duration-200"
        style={{ paddingLeft: `${depth * 1.5}rem` }}
        onClick={handleClick}
        onKeyDown={(e) => e.key === "Enter" && handleClick()}
        role="button"
        tabIndex={0}
      >
        {item.type === "folder" && (
          <span className="text-gray-400">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        )}
        {item.type === "folder" ? (
          <FolderTree className="w-4 h-4 text-blue-400" />
        ) : (
          <File className="w-4 h-4 text-gray-400" />
        )}
        <span className="text-gray-200">{item.name}</span>
      </div>
      {item.type === "folder" && isExpanded && item.children && (
        <div className="pl-4 border-l border-gray-700">
          {item.children.map((child, index) => (
            <FileNode
              key={`${child.path}-${index}`}
              item={child}
              depth={depth + 1}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileExplorer = ({ files, onFileSelect }) => {
  const sortedFiles = [...files].sort((a, b) => {
    if (a.name === "src") return -1;
    if (b.name === "src") return 1;
    return 0;
  });

  return (
    <div className="bg-gray-900 rounded-lg shadow-lg p-4 h-full overflow-auto">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-100">
        <FolderTree className="w-5 h-5" />
        File Explorer
      </h2>
      <div className="space-y-1">
        {sortedFiles.map((file, index) => (
          <FileNode
            key={`${file.path}-${index}`}
            item={file}
            depth={0}
            onFileClick={onFileSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default FileExplorer;
