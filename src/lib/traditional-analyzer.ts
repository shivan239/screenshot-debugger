// Traditional code analyzer - pattern-based error detection without AI
// Privacy-first: no code is sent to external services

export interface TraditionalAnalysisResult {
  issues: Array<{
    type: "error" | "warning" | "info";
    category: string;
    message: string;
    line?: number;
    suggestion?: string;
    code?: string;
  }>;
  summary: string;
  stats: {
    errors: number;
    warnings: number;
    info: number;
  };
}

interface Pattern {
  regex: RegExp;
  type: "error" | "warning" | "info";
  category: string;
  message: string;
  suggestion?: string;
  fixCode?: string;
}

const CODE_PATTERNS: Pattern[] = [
  // Security Issues
  {
    regex: /console\.(log|debug|info|warn|error)\s*\(/g,
    type: "warning",
    category: "Security",
    message: "Console statement found - should be removed in production",
    suggestion: "Remove console statements or use a logging library with environment checks"
  },
  {
    regex: /(password|secret|api[_-]?key|token)\s*[:=]\s*['"][^'"]+['"]/gi,
    type: "error",
    category: "Security",
    message: "Potential hardcoded secret detected",
    suggestion: "Use environment variables instead of hardcoding secrets"
  },
  {
    regex: /eval\s*\(/g,
    type: "error",
    category: "Security",
    message: "eval() is dangerous and can lead to code injection",
    suggestion: "Avoid eval() - use safer alternatives like JSON.parse() for data"
  },
  {
    regex: /innerHTML\s*=/g,
    type: "warning",
    category: "Security",
    message: "innerHTML can lead to XSS vulnerabilities",
    suggestion: "Use textContent or sanitize HTML with DOMPurify"
  },
  {
    regex: /dangerouslySetInnerHTML/g,
    type: "warning",
    category: "Security",
    message: "dangerouslySetInnerHTML can lead to XSS attacks",
    suggestion: "Sanitize content with DOMPurify before rendering"
  },

  // Error Handling
  {
    regex: /catch\s*\([^)]*\)\s*\{\s*\}/g,
    type: "error",
    category: "Error Handling",
    message: "Empty catch block - errors are silently ignored",
    suggestion: "Log errors or handle them appropriately",
    fixCode: "catch (error) {\n  console.error('Error:', error);\n  // Handle error appropriately\n}"
  },
  {
    regex: /\.catch\s*\(\s*\(\s*\)\s*=>\s*\{\s*\}\s*\)/g,
    type: "error",
    category: "Error Handling",
    message: "Empty .catch() handler - Promise errors are silently ignored",
    suggestion: "Handle Promise rejections properly"
  },
  {
    regex: /async\s+function[^{]+\{(?:(?!try\s*\{).)*\}$/gm,
    type: "warning",
    category: "Error Handling",
    message: "Async function without try-catch block",
    suggestion: "Wrap async code in try-catch for proper error handling"
  },

  // Code Quality
  {
    regex: /var\s+\w+/g,
    type: "warning",
    category: "Code Quality",
    message: "Using 'var' instead of 'let' or 'const'",
    suggestion: "Use 'const' for constants, 'let' for variables that change"
  },
  {
    regex: /==(?!=)/g,
    type: "warning",
    category: "Code Quality",
    message: "Using loose equality (==) instead of strict equality (===)",
    suggestion: "Use === for strict type comparison"
  },
  {
    regex: /!=(?!=)/g,
    type: "warning",
    category: "Code Quality",
    message: "Using loose inequality (!=) instead of strict inequality (!==)",
    suggestion: "Use !== for strict type comparison"
  },
  {
    regex: /\/\/\s*TODO/gi,
    type: "info",
    category: "Code Quality",
    message: "TODO comment found - incomplete implementation",
    suggestion: "Complete the TODO or create a tracked issue"
  },
  {
    regex: /\/\/\s*FIXME/gi,
    type: "warning",
    category: "Code Quality",
    message: "FIXME comment found - known issue needs attention",
    suggestion: "Fix the issue or create a tracked bug report"
  },
  {
    regex: /\/\/\s*HACK/gi,
    type: "warning",
    category: "Code Quality",
    message: "HACK comment found - workaround in place",
    suggestion: "Consider refactoring to a proper solution"
  },
  {
    regex: /debugger\s*;?/g,
    type: "error",
    category: "Code Quality",
    message: "Debugger statement found - must be removed for production",
    suggestion: "Remove debugger statements before deploying"
  },

  // React Specific
  {
    regex: /key\s*=\s*\{?\s*index\s*\}?/g,
    type: "warning",
    category: "React",
    message: "Using array index as key - can cause rendering issues",
    suggestion: "Use unique identifiers instead of array indices as keys"
  },
  {
    regex: /useEffect\s*\(\s*async/g,
    type: "error",
    category: "React",
    message: "useEffect callback should not be async directly",
    suggestion: "Define async function inside useEffect and call it",
    fixCode: "useEffect(() => {\n  const fetchData = async () => {\n    // async code here\n  };\n  fetchData();\n}, []);"
  },
  {
    regex: /useState\s*<[^>]+>\s*\(\s*\[\s*\]\s*\)/g,
    type: "info",
    category: "React",
    message: "Consider using useMemo for expensive array initializations",
    suggestion: "If this array requires computation, use useMemo"
  },

  // TypeScript
  {
    regex: /:\s*any\b/g,
    type: "warning",
    category: "TypeScript",
    message: "Using 'any' type defeats TypeScript's type safety",
    suggestion: "Define proper types or use 'unknown' for truly unknown types"
  },
  {
    regex: /@ts-ignore/g,
    type: "warning",
    category: "TypeScript",
    message: "@ts-ignore suppresses type checking",
    suggestion: "Fix the type error instead of ignoring it"
  },
  {
    regex: /as\s+any\b/g,
    type: "warning",
    category: "TypeScript",
    message: "Type assertion to 'any' bypasses type checking",
    suggestion: "Use proper type narrowing or define correct types"
  },

  // Potential Bugs
  {
    regex: /if\s*\([^)]*\)\s*;/g,
    type: "error",
    category: "Potential Bug",
    message: "Empty if statement - likely a typo",
    suggestion: "Remove the semicolon or add the intended code block"
  },
  {
    regex: /for\s*\([^)]*\)\s*;/g,
    type: "error",
    category: "Potential Bug",
    message: "Empty for loop - likely a typo",
    suggestion: "Remove the semicolon or add the intended code block"
  },
  {
    regex: /return\s*\n\s*\{/g,
    type: "error",
    category: "Potential Bug",
    message: "Return statement with line break before object - returns undefined",
    suggestion: "Put the opening brace on the same line as return"
  },
  {
    regex: /=\s*=\s*=/g,
    type: "error",
    category: "Potential Bug",
    message: "Invalid operator (three equals with spaces)",
    suggestion: "Use === without spaces for strict equality"
  },

  // Performance
  {
    regex: /\.map\([^)]+\)\.filter\([^)]+\)/g,
    type: "info",
    category: "Performance",
    message: "Chained .map().filter() - consider using .reduce() for efficiency",
    suggestion: "Use .reduce() to iterate only once"
  },
  {
    regex: /JSON\.parse\(JSON\.stringify\(/g,
    type: "warning",
    category: "Performance",
    message: "Deep clone via JSON - slow and loses functions/dates",
    suggestion: "Use structuredClone() or a proper deep clone library"
  },
];

// Terminal log patterns
const TERMINAL_PATTERNS: Pattern[] = [
  {
    regex: /Error:\s*.+/gi,
    type: "error",
    category: "Runtime Error",
    message: "Error detected in terminal output"
  },
  {
    regex: /TypeError:\s*.+/gi,
    type: "error",
    category: "Type Error",
    message: "Type error - likely accessing property of undefined/null"
  },
  {
    regex: /ReferenceError:\s*.+/gi,
    type: "error",
    category: "Reference Error",
    message: "Reference error - undefined variable used"
  },
  {
    regex: /SyntaxError:\s*.+/gi,
    type: "error",
    category: "Syntax Error",
    message: "Syntax error - malformed code"
  },
  {
    regex: /ENOENT/gi,
    type: "error",
    category: "File System",
    message: "File or directory not found"
  },
  {
    regex: /ECONNREFUSED/gi,
    type: "error",
    category: "Network",
    message: "Connection refused - service may be down"
  },
  {
    regex: /ETIMEDOUT/gi,
    type: "error",
    category: "Network",
    message: "Connection timeout - network or service issue"
  },
  {
    regex: /Cannot find module/gi,
    type: "error",
    category: "Module",
    message: "Missing module - check package.json or imports"
  },
  {
    regex: /deprecated/gi,
    type: "warning",
    category: "Deprecation",
    message: "Deprecated feature in use"
  },
  {
    regex: /warning/gi,
    type: "warning",
    category: "Warning",
    message: "Warning detected in terminal output"
  },
  {
    regex: /out of memory|heap|memory leak/gi,
    type: "error",
    category: "Memory",
    message: "Potential memory issue detected"
  },
  {
    regex: /cors|cross-origin/gi,
    type: "error",
    category: "CORS",
    message: "CORS issue - cross-origin request blocked"
  },
  {
    regex: /401|unauthorized/gi,
    type: "error",
    category: "Authentication",
    message: "Authentication error - invalid or missing credentials"
  },
  {
    regex: /403|forbidden/gi,
    type: "error",
    category: "Authorization",
    message: "Authorization error - insufficient permissions"
  },
  {
    regex: /404|not found/gi,
    type: "warning",
    category: "Not Found",
    message: "Resource not found"
  },
  {
    regex: /500|internal server error/gi,
    type: "error",
    category: "Server Error",
    message: "Internal server error"
  },
];

function findLineNumber(content: string, matchIndex: number): number {
  const beforeMatch = content.substring(0, matchIndex);
  return (beforeMatch.match(/\n/g) || []).length + 1;
}

export function analyzeCode(codeSnippet: string, terminalLogs: string): TraditionalAnalysisResult {
  const issues: TraditionalAnalysisResult["issues"] = [];
  
  // Analyze code patterns
  if (codeSnippet.trim()) {
    for (const pattern of CODE_PATTERNS) {
      let match;
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      
      while ((match = regex.exec(codeSnippet)) !== null) {
        const line = findLineNumber(codeSnippet, match.index);
        issues.push({
          type: pattern.type,
          category: pattern.category,
          message: pattern.message,
          line,
          suggestion: pattern.suggestion,
          code: pattern.fixCode
        });
      }
    }
  }

  // Analyze terminal logs
  if (terminalLogs.trim()) {
    for (const pattern of TERMINAL_PATTERNS) {
      let match;
      const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
      
      while ((match = regex.exec(terminalLogs)) !== null) {
        // Avoid duplicates for same category
        const existingIssue = issues.find(
          i => i.category === pattern.category && i.type === pattern.type
        );
        
        if (!existingIssue) {
          const line = findLineNumber(terminalLogs, match.index);
          issues.push({
            type: pattern.type,
            category: pattern.category,
            message: `${pattern.message}: "${match[0].substring(0, 50)}${match[0].length > 50 ? '...' : ''}"`,
            line,
            suggestion: pattern.suggestion
          });
        }
      }
    }
  }

  // Sort by severity
  const severityOrder = { error: 0, warning: 1, info: 2 };
  issues.sort((a, b) => severityOrder[a.type] - severityOrder[b.type]);

  const stats = {
    errors: issues.filter(i => i.type === "error").length,
    warnings: issues.filter(i => i.type === "warning").length,
    info: issues.filter(i => i.type === "info").length
  };

  let summary: string;
  if (issues.length === 0) {
    summary = "No issues detected. Code looks clean!";
  } else if (stats.errors > 0) {
    summary = `Found ${stats.errors} error${stats.errors > 1 ? 's' : ''}, ${stats.warnings} warning${stats.warnings !== 1 ? 's' : ''}, and ${stats.info} info message${stats.info !== 1 ? 's' : ''}. Address errors first.`;
  } else if (stats.warnings > 0) {
    summary = `Found ${stats.warnings} warning${stats.warnings > 1 ? 's' : ''} and ${stats.info} info message${stats.info !== 1 ? 's' : ''}. Consider addressing warnings for better code quality.`;
  } else {
    summary = `Found ${stats.info} info message${stats.info > 1 ? 's' : ''}. Minor improvements suggested.`;
  }

  return { issues, summary, stats };
}
