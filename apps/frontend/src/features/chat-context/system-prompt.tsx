import { shikiToMonaco } from '@shikijs/monaco'
import * as monaco from 'monaco-editor'
import * as monacoCore from 'monaco-editor-core'
import { createHighlighter } from 'shiki'

import { Component, createEffect, onCleanup, onMount } from 'solid-js'

// --- Custom Variable Configuration ---
const availableVariables = [
  {
    name: 'parent.system_prompt',
    description: 'The system prompt inherited from the parent context.',
  },
  {
    name: 'branch.name',
    description: 'The name of the currently active branch.',
  },
  {
    name: 'persona.zoe.prompt',
    description: 'The prompt of the currently active persona.',
  },
  {
    name: 'chat.01JRTBVGAXW14AST4FJHMCWSCP.summary',
    description: 'The summary of chat: Zoe history.',
  },
  // Add more variables here as needed
]
// Regex to find variables like {{ variable_name }}
const variableRegex = /{{\s*([a-zA-Z0-9_.]+)\s*}}/g
const variableClassName = 'mynth-variable-token' // CSS class for styling

const SystemPrompt: Component<{ branchId: string }> = (props) => {
  let containerRef!: HTMLDivElement
  let editorInstance: monaco.editor.IStandaloneCodeEditor | undefined
  let currentDecorations: string[] = [] // Store decoration IDs for cleanup

  onMount(async () => {
    // --- Add dynamic style for custom variables ---
    const style = document.createElement('style')
    style.textContent = `
      .monaco-editor .${variableClassName} {
        color: #a6e22e !important; /* Use a distinct color */
        font-weight: bold;
        cursor: help; /* Indicate interactable element */
      }
    `
    document.head.appendChild(style)
    onCleanup(() => document.head.removeChild(style)) // Clean up style on component unmount

    // Create the highlighter, it can be reused
    const highlighter = await createHighlighter({
      themes: ['everforest-dark'],
      langs: [
        'javascript',
        'typescript',
        'python',
        'vue',
        'markdown',
        'c',
        'c++',
        'c#',
        'java',
      ],
    })

    const theme = highlighter.getTheme('everforest-dark')

    // Map Shiki theme settings (token rules) to Monaco theme rules format
    // Shiki theme structure might vary slightly, adjust mapping if needed
    const monacoRules = (theme.settings || []).map((setting) => ({
      // Shiki scope can be string or array, Monaco token is space-separated string
      token: Array.isArray(setting.scope)
        ? setting.scope.join(' ')
        : setting.scope || '',
      foreground: setting.settings.foreground,
      fontStyle: setting.settings.fontStyle, // e.g., 'italic', 'bold underline'
    }))

    monaco.languages.register({ id: 'vue' })
    monaco.languages.register({ id: 'typescript' })
    monaco.languages.register({ id: 'javascript' })
    monaco.languages.register({ id: 'markdown' })
    monaco.languages.register({ id: 'python' })
    monaco.languages.register({ id: 'c' })
    monaco.languages.register({ id: 'c++' })
    monaco.languages.register({ id: 'c#' })
    monaco.languages.register({ id: 'java' })

    // Register the themes from Shiki, and provide syntax highlighting for Monaco. //
    // shikiToMonaco(highlighter, monacoCore);

    // Define our custom theme, including Shiki's rules and our background override
    monaco.editor.defineTheme('everforest-dark-custom', {
      base: 'vs-dark', // Use vs-dark as the base for Monaco's UI elements
      inherit: true, // Inherit base styles
      rules: monacoRules, // Apply the token coloring rules from Shiki
      colors: {
        ...theme.colors, // Spread the UI colors from the Shiki theme
        'editor.background': '#191b1b', // Override the background color
      },
    })

    editorInstance = monaco.editor.create(containerRef, {
      value: `Hello! You can use variables like {{parent.system_prompt}} here.`, // Example initial value
      language: 'markdown',
      theme: 'everforest-dark-custom', // Use your custom theme
      minimap: {
        enabled: false,
      },
      lineNumbers: 'off',
      placeholder: 'Write your system prompt here...',
      padding: {
        top: 16,
        bottom: 16,
      },
      renderLineHighlight: 'none',
      scrollbar: {
        useShadows: false,
      },
    })

    // --- Function to Update Decorations ---
    const updateDecorations = () => {
      if (!editorInstance) return
      const model = editorInstance.getModel()
      if (!model) return

      const text = model.getValue()
      const newDecorations: monaco.editor.IModelDeltaDecoration[] = []
      let match
      while ((match = variableRegex.exec(text)) !== null) {
        const variableName = match[1]
        // Optional: Check if variable is known
        const isKnown = availableVariables.some((v) => v.name === variableName)
        if (isKnown) {
          // Find the start and end positions of the match
          const startPos = model.getPositionAt(match.index)
          const endPos = model.getPositionAt(match.index + match[0].length)
          newDecorations.push({
            range: new monaco.Range(
              startPos.lineNumber,
              startPos.column,
              endPos.lineNumber,
              endPos.column
            ),
            options: {
              inlineClassName: variableClassName,
              // You could add hover message here too, but provider is better for dynamic content
              // hoverMessage: { value: `Variable: ${variableName}` }
            },
          })
        }
      }
      // Update decorations, removing old ones and applying new ones
      currentDecorations = editorInstance.deltaDecorations(
        currentDecorations,
        newDecorations
      )
    }

    // --- Register Hover Provider ---
    const hoverProvider = monaco.languages.registerHoverProvider('markdown', {
      provideHover: (model, position) => {
        const lineContent = model.getLineContent(position.lineNumber)
        // Find variable matches on the current line
        for (const match of lineContent.matchAll(variableRegex)) {
          const startColumn = (match.index ?? 0) + 1
          const endColumn = startColumn + match[0].length
          // Check if the cursor position is within this match's range
          if (position.column >= startColumn && position.column <= endColumn) {
            const variableName = match[1]
            const variableInfo = availableVariables.find(
              (v) => v.name === variableName
            )
            if (variableInfo) {
              return {
                range: new monaco.Range(
                  position.lineNumber,
                  startColumn,
                  position.lineNumber,
                  endColumn
                ),
                contents: [
                  { value: `**Variable: ${variableInfo.name}**` },
                  { value: variableInfo.description },
                ],
              }
            }
          }
        }
        return null // No hover info
      },
    })

    // --- Register Completion Provider ---
    const completionProvider = monaco.languages.registerCompletionItemProvider(
      'markdown',
      {
        triggerCharacters: ['{'], // Trigger on opening curly brace
        provideCompletionItems: (model, position) => {
          const textUntilPosition = model.getValueInRange({
            startLineNumber: position.lineNumber,
            startColumn: Math.max(1, position.column - 2), // Check the preceding characters
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          })

          // Check for "{" or partial variable syntax
          if (textUntilPosition.includes('{') || position.column > 1) {
            // Get the current line content to analyze
            const lineContent = model.getLineContent(position.lineNumber)

            // Find if we're inside a variable expression
            const beforeCursor = lineContent.substring(0, position.column - 1)
            const afterCursor = lineContent.substring(position.column - 1)

            // Check for different cases
            const hasOpeningBraces = beforeCursor.endsWith('{{')
            const hasSingleBrace =
              beforeCursor.endsWith('{') && !beforeCursor.endsWith('{{')
            const hasClosingBraces = afterCursor.startsWith('}}')

            const suggestions = availableVariables.map((variable) => {
              let insertText
              let range

              // Handle different insertion scenarios
              if (hasOpeningBraces && hasClosingBraces) {
                // Case: {{|}}
                insertText = variable.name
                range = {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                }
              } else if (hasOpeningBraces) {
                // Case: {{|
                insertText = `${variable.name}}}`
                range = {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                }
              } else if (hasSingleBrace) {
                // Case: {|
                insertText = `{${variable.name}}}`
                range = {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column - 1,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                }
              } else {
                // Default case: |
                insertText = `{{${variable.name}}}`
                range = {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                }
              }

              return {
                label: `{{${variable.name}}}`, // What the user sees in the list
                kind: monaco.languages.CompletionItemKind.Variable,
                insertText: insertText,
                documentation: variable.description,
                range: range,
              }
            })

            return { suggestions: suggestions }
          }

          return { suggestions: [] } // No suggestions otherwise
        },
      }
    )

    // --- Update decorations on content change ---
    const changeListener = editorInstance.onDidChangeModelContent(() => {
      updateDecorations()
    })

    // --- Initial decoration update ---
    updateDecorations()

    // --- Cleanup Monaco resources ---
    onCleanup(() => {
      hoverProvider.dispose()
      completionProvider.dispose()
      changeListener.dispose()
      editorInstance?.dispose() // Dispose editor itself
    })
  })

  return <div ref={containerRef} class="w-full h-full" />
}

export default SystemPrompt
