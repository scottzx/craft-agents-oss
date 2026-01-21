/**
 * WorkingDirectoryFiles - Displays files in the working directory as a tree view
 *
 * Features:
 * - Recursive tree view with expandable folders
 * - File watcher for auto-refresh when files change
 * - Click to reveal in Finder, double-click to open
 * - Persisted expanded folder state
 * - Shows working directory path in header
 */

import * as React from 'react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { AnimatePresence, motion, type Variants } from 'motion/react'
import { File, Folder, FolderOpen, FileText, Image, FileCode, ChevronRight, FolderOpen as FolderRoot } from 'lucide-react'
import type { SessionFile } from '../../../shared/types'
import { cn } from '@/lib/utils'
import * as storage from '@/lib/local-storage'
import { useSession as useSessionData } from '@/context/AppShellContext'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.025,
      delayChildren: 0.01,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.015,
      staggerDirection: -1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.15, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    x: -8,
    transition: { duration: 0.1, ease: 'easeIn' },
  },
}

export interface WorkingDirectoryFilesProps {
  sessionId?: string
  className?: string
}

function formatFileSize(bytes?: number): string {
  if (bytes === undefined) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(file: SessionFile, isExpanded?: boolean) {
  const iconClass = "h-3.5 w-3.5 text-muted-foreground"

  if (file.type === 'directory') {
    return isExpanded
      ? <FolderOpen className={iconClass} />
      : <Folder className={iconClass} />
  }

  const ext = file.name.split('.').pop()?.toLowerCase()

  if (ext === 'md' || ext === 'markdown') {
    return <FileText className={iconClass} />
  }

  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'ico'].includes(ext || '')) {
    return <Image className={iconClass} />
  }

  if (['ts', 'tsx', 'js', 'jsx', 'json', 'yaml', 'yml', 'py', 'rb', 'go', 'rs'].includes(ext || '')) {
    return <FileCode className={iconClass} />
  }

  return <File className={iconClass} />
}

interface FileTreeItemProps {
  file: SessionFile
  depth: number
  expandedPaths: Set<string>
  onToggleExpand: (path: string) => void
  onFileClick: (file: SessionFile) => void
  onFileDoubleClick: (file: SessionFile) => void
  isNested?: boolean
}

function FileTreeItem({
  file,
  depth,
  expandedPaths,
  onToggleExpand,
  onFileClick,
  onFileDoubleClick,
  isNested,
}: FileTreeItemProps) {
  const isDirectory = file.type === 'directory'
  const isExpanded = expandedPaths.has(file.path)
  const hasChildren = isDirectory && file.children && file.children.length > 0

  const handleClick = () => {
    if (isDirectory && hasChildren) {
      onToggleExpand(file.path)
    } else {
      onFileClick(file)
    }
  }

  const handleDoubleClick = () => {
    onFileDoubleClick(file)
  }

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (hasChildren) {
      onToggleExpand(file.path)
    }
  }

  const buttonElement = (
    <button
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "group flex w-full min-w-0 overflow-hidden items-center gap-2 rounded-[6px] py-[5px] text-[13px] select-none outline-none text-left",
        "focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring",
        "hover:bg-foreground/5 transition-colors",
        "px-2"
      )}
      style={{ paddingLeft: `${8 + depth * 16}px` }}
      title={`${file.path}\n${file.type === 'file' ? formatFileSize(file.size) : 'Directory'}\n\nClick to ${hasChildren ? 'expand' : 'reveal'}, double-click to open`}
    >
      <span className="relative h-3.5 w-3.5 shrink-0 flex items-center justify-center">
        {hasChildren ? (
          <>
            <span className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity duration-150">
              {getFileIcon(file, isExpanded)}
            </span>
            <span
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
              onClick={handleChevronClick}
            >
              <ChevronRight
                className={cn(
                  "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200",
                  isExpanded && "rotate-90"
                )}
              />
            </span>
          </>
        ) : (
          getFileIcon(file, isExpanded)
        )}
      </span>

      <span className="flex-1 min-w-0 truncate">{file.name}</span>
    </button>
  )

  if (!isNested) {
    return (
      <motion.div
        variants={itemVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {buttonElement}
      </motion.div>
    )
  }

  return buttonElement
}

export function WorkingDirectoryFiles({ sessionId, className }: WorkingDirectoryFilesProps) {
  const [files, setFiles] = useState<SessionFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [workingDir, setWorkingDir] = useState<string>('')
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
  const mountedRef = useRef(true)

  const session = useSessionData(sessionId || '')

  // Load working directory from session
  useEffect(() => {
    if (session?.workingDirectory) {
      setWorkingDir(session.workingDirectory)
    } else {
      setWorkingDir('')
      setFiles([])
    }
  }, [session?.workingDirectory])

  // Load expanded paths from storage
  useEffect(() => {
    const saved = storage.get<string[]>(storage.KEYS.sessionFilesExpandedFolders, [], 'workspace')
    setExpandedPaths(new Set(saved))
  }, [])

  // Save expanded paths to storage
  const saveExpandedPaths = useCallback((paths: Set<string>) => {
    storage.set(storage.KEYS.sessionFilesExpandedFolders, Array.from(paths), 'workspace')
  }, [])

  // Load files
  const loadFiles = useCallback(async () => {
    if (!workingDir) {
      setFiles([])
      return
    }

    setIsLoading(true)
    try {
      const workspaceFiles = await window.electronAPI.getWorkingDirectoryFiles(workingDir)
      if (mountedRef.current) {
        setFiles(workspaceFiles)
      }
    } catch (error) {
      console.error('Failed to load working directory files:', error)
      if (mountedRef.current) {
        setFiles([])
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [workingDir])

  // Initial load and file watcher setup
  useEffect(() => {
    mountedRef.current = true
    loadFiles()

    if (workingDir) {
      // Start watching for file changes
      window.electronAPI.watchDirectoryFiles(workingDir)

      // Listen for file change events
      const unsubscribe = window.electronAPI.onDirectoryFilesChanged((changedPath) => {
        if (changedPath === workingDir && mountedRef.current) {
          loadFiles()
        }
      })

      return () => {
        mountedRef.current = false
        unsubscribe()
        window.electronAPI.unwatchDirectoryFiles()
      }
    }

    return () => {
      mountedRef.current = false
    }
  }, [workingDir, loadFiles])

  // Handle file click - reveal in Finder
  const handleFileClick = useCallback((file: SessionFile) => {
    if (file.type === 'directory') {
      // For directories, also reveal in finder
      window.electronAPI.revealInFinder(file.path)
    } else {
      window.electronAPI.revealInFinder(file.path)
    }
  }, [])

  // Handle file double click - open with default app
  const handleFileDoubleClick = useCallback((file: SessionFile) => {
    window.electronAPI.openFile(file.path)
  }, [])

  // Toggle folder expansion
  const handleToggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const newPaths = new Set(prev)
      if (newPaths.has(path)) {
        newPaths.delete(path)
      } else {
        newPaths.add(path)
      }
      saveExpandedPaths(newPaths)
      return newPaths
    })
  }, [saveExpandedPaths])

  // Recursive render of file tree
  const renderFileTree = (fileList: SessionFile[], depth: number = 0, isNested: boolean = false): React.ReactNode => {
    return fileList.map((file) => {
      const isExpanded = expandedPaths.has(file.path)

      return (
        <div key={file.path}>
          <FileTreeItem
            file={file}
            depth={depth}
            expandedPaths={expandedPaths}
            onToggleExpand={handleToggleExpand}
            onFileClick={handleFileClick}
            onFileDoubleClick={handleFileDoubleClick}
            isNested={isNested}
          />
          {file.type === 'directory' && isExpanded && file.children && (
            <div className="overflow-hidden">
              {renderFileTree(file.children, depth + 1, true)}
            </div>
          )}
        </div>
      )
    })
  }

  if (!workingDir) {
    return (
      <div className={cn("h-full flex flex-col", className)}>
        <div className="px-3 py-2 border-b border-border/50">
          <p className="text-xs text-muted-foreground">No working directory set</p>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground p-4">
          <p className="text-sm text-center">Set a working directory to browse workspace files</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("h-full flex flex-col", className)}>
      {/* Header with path */}
      <div className="shrink-0 px-3 py-2 border-b border-border/50 space-y-1">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <FolderRoot className="h-3.5 w-3.5" />
          <p className="text-xs font-medium truncate" title={workingDir}>
            {workingDir}
          </p>
        </div>
      </div>

      {/* File tree */}
      <div className="flex-1 min-h-0 overflow-auto px-1.5 py-2">
        {isLoading ? (
          <div className="flex items-center justify-center text-muted-foreground py-8">
            <p className="text-sm">Loading...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="flex items-center justify-center text-muted-foreground py-8">
            <p className="text-sm">Empty directory</p>
          </div>
        ) : (
          <AnimatePresence mode="sync">
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
            >
              {renderFileTree(files)}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
