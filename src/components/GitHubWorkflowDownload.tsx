import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Copy, Check, Github, FileCode, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const WORKFLOW_YAML = `name: Code Analysis

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  analyze:
    runs-on: ubuntu-latest
    name: Traditional Code Analysis
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Create analyzer script
        run: |
          cat > analyze.js << 'EOF'
          const fs = require('fs');
          const path = require('path');

          // Pattern definitions
          const CODE_PATTERNS = [
            // Security
            { regex: /console\\.(log|debug|info|warn|error)\\s*\\(/g, type: 'warning', category: 'Security', message: 'Console statement found' },
            { regex: /(password|secret|api[_-]?key|token)\\s*[:=]\\s*['\"][^'\"]+['\"]/gi, type: 'error', category: 'Security', message: 'Potential hardcoded secret' },
            { regex: /eval\\s*\\(/g, type: 'error', category: 'Security', message: 'eval() is dangerous' },
            { regex: /innerHTML\\s*=/g, type: 'warning', category: 'Security', message: 'innerHTML can lead to XSS' },
            { regex: /dangerouslySetInnerHTML/g, type: 'warning', category: 'Security', message: 'dangerouslySetInnerHTML XSS risk' },
            
            // Error Handling
            { regex: /catch\\s*\\([^)]*\\)\\s*\\{\\s*\\}/g, type: 'error', category: 'Error Handling', message: 'Empty catch block' },
            { regex: /\\.catch\\s*\\(\\s*\\(\\s*\\)\\s*=>\\s*\\{\\s*\\}\\s*\\)/g, type: 'error', category: 'Error Handling', message: 'Empty .catch() handler' },
            
            // Code Quality
            { regex: /var\\s+\\w+/g, type: 'warning', category: 'Code Quality', message: 'Using var instead of let/const' },
            { regex: /==(?!=)/g, type: 'warning', category: 'Code Quality', message: 'Using loose equality (==)' },
            { regex: /!=(?!=)/g, type: 'warning', category: 'Code Quality', message: 'Using loose inequality (!=)' },
            { regex: /debugger\\s*;?/g, type: 'error', category: 'Code Quality', message: 'Debugger statement found' },
            
            // React
            { regex: /key\\s*=\\s*\\{?\\s*index\\s*\\}?/g, type: 'warning', category: 'React', message: 'Using array index as key' },
            { regex: /useEffect\\s*\\(\\s*async/g, type: 'error', category: 'React', message: 'useEffect callback should not be async' },
            
            // TypeScript
            { regex: /:\\s*any\\b/g, type: 'warning', category: 'TypeScript', message: 'Using any type' },
            { regex: /@ts-ignore/g, type: 'warning', category: 'TypeScript', message: '@ts-ignore suppresses type checking' },
            { regex: /as\\s+any\\b/g, type: 'warning', category: 'TypeScript', message: 'Type assertion to any' },
            
            // Potential Bugs
            { regex: /if\\s*\\([^)]*\\)\\s*;/g, type: 'error', category: 'Potential Bug', message: 'Empty if statement' },
            { regex: /for\\s*\\([^)]*\\)\\s*;/g, type: 'error', category: 'Potential Bug', message: 'Empty for loop' },
          ];

          function findFiles(dir, extensions, ignore = ['node_modules', '.git', 'dist', 'build', '.next']) {
            let results = [];
            try {
              const items = fs.readdirSync(dir);
              for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                  if (!ignore.includes(item)) {
                    results = results.concat(findFiles(fullPath, extensions, ignore));
                  }
                } else if (extensions.some(ext => item.endsWith(ext))) {
                  results.push(fullPath);
                }
              }
            } catch (e) {}
            return results;
          }

          function analyzeFile(filePath) {
            const content = fs.readFileSync(filePath, 'utf-8');
            const issues = [];
            
            for (const pattern of CODE_PATTERNS) {
              const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
              let match;
              while ((match = regex.exec(content)) !== null) {
                const line = content.substring(0, match.index).split('\\n').length;
                issues.push({
                  file: filePath,
                  line,
                  type: pattern.type,
                  category: pattern.category,
                  message: pattern.message
                });
              }
            }
            
            return issues;
          }

          // Main execution
          const files = findFiles('.', ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);
          let allIssues = [];

          for (const file of files) {
            const issues = analyzeFile(file);
            allIssues = allIssues.concat(issues);
          }

          // Output results
          const errors = allIssues.filter(i => i.type === 'error');
          const warnings = allIssues.filter(i => i.type === 'warning');

          console.log('\\n📊 Code Analysis Results');
          console.log('========================\\n');
          console.log(\`Files analyzed: \${files.length}\`);
          console.log(\`Errors: \${errors.length}\`);
          console.log(\`Warnings: \${warnings.length}\\n\`);

          if (allIssues.length > 0) {
            console.log('Issues found:\\n');
            for (const issue of allIssues) {
              const icon = issue.type === 'error' ? '❌' : '⚠️';
              console.log(\`\${icon} [\${issue.category}] \${issue.file}:\${issue.line}\`);
              console.log(\`   \${issue.message}\\n\`);
            }
          }

          // Exit with error code if errors found
          if (errors.length > 0) {
            console.log('\\n❌ Analysis failed: errors found');
            process.exit(1);
          } else if (warnings.length > 0) {
            console.log('\\n⚠️ Analysis passed with warnings');
            process.exit(0);
          } else {
            console.log('\\n✅ Analysis passed: no issues found');
            process.exit(0);
          }
          EOF

      - name: Run analysis
        run: node analyze.js
`;

const INSTRUCTIONS = [
  {
    step: 1,
    title: "Download the workflow file",
    description: "Click the download button or copy the YAML content below."
  },
  {
    step: 2,
    title: "Add to your repository",
    description: "Create a `.github/workflows` folder in your repo if it doesn't exist, then save the file as `code-analysis.yml`."
  },
  {
    step: 3,
    title: "Commit and push",
    description: "Commit the workflow file to your main branch. The analysis will run automatically on every push and pull request."
  },
  {
    step: 4,
    title: "View results",
    description: "Check the 'Actions' tab in your GitHub repository to see analysis results. Failed checks will block merges if branch protection is enabled."
  }
];

export function GitHubWorkflowDownload() {
  const [showYaml, setShowYaml] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const blob = new Blob([WORKFLOW_YAML], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "code-analysis.yml";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Workflow downloaded",
      description: "Add it to .github/workflows/ in your repository.",
    });
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(WORKFLOW_YAML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied to clipboard",
      description: "Paste it into .github/workflows/code-analysis.yml",
    });
  };

  return (
    <div className="glass-panel glow-border rounded-lg p-6 space-y-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-primary/20 rounded-lg">
          <Github className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            GitHub Actions Workflow
          </h3>
          <p className="text-sm text-muted-foreground">
            Automatically analyze your code on every push and pull request. Catches issues before they reach production.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleDownload} variant="glow" className="gap-2">
          <Download className="w-4 h-4" />
          Download Workflow
        </Button>
        <Button onClick={handleCopy} variant="outline" className="gap-2">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Copied!" : "Copy YAML"}
        </Button>
        <Button
          onClick={() => setShowYaml(!showYaml)}
          variant="ghost"
          className="gap-2"
        >
          <FileCode className="w-4 h-4" />
          {showYaml ? "Hide" : "View"} YAML
          {showYaml ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {/* YAML Preview */}
      {showYaml && (
        <div className="relative">
          <pre className="bg-muted/50 rounded-lg p-4 overflow-x-auto text-xs font-mono text-muted-foreground max-h-96">
            {WORKFLOW_YAML}
          </pre>
        </div>
      )}

      {/* Instructions */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold text-foreground">Setup Instructions</h4>
        <div className="grid sm:grid-cols-2 gap-3">
          {INSTRUCTIONS.map((instruction) => (
            <div
              key={instruction.step}
              className="flex gap-3 p-3 bg-muted/30 rounded-lg"
            >
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/20 text-primary text-sm font-medium flex items-center justify-center">
                {instruction.step}
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {instruction.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {instruction.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          <span className="text-primary font-medium">Features:</span> Security checks • Error handling validation • Code quality rules • React best practices • TypeScript type safety • Automatic PR blocking on errors
        </p>
      </div>
    </div>
  );
}
