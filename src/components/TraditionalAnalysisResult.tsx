import { AlertCircle, AlertTriangle, Info, Shield, ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { useState } from "react";
import type { TraditionalAnalysisResult as AnalysisType } from "@/lib/traditional-analyzer";

interface TraditionalAnalysisResultProps {
  analysis: AnalysisType;
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group mt-2">
      <pre className="bg-terminal rounded-lg p-3 overflow-x-auto font-mono text-sm text-foreground/90 scrollbar-thin">
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 bg-muted/80 hover:bg-muted rounded-md transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Copy code"
      >
        {copied ? (
          <Check className="w-3 h-3 text-success" />
        ) : (
          <Copy className="w-3 h-3 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

function IssueIcon({ type }: { type: "error" | "warning" | "info" }) {
  switch (type) {
    case "error":
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    case "warning":
      return <AlertTriangle className="w-4 h-4 text-warning" />;
    case "info":
      return <Info className="w-4 h-4 text-primary" />;
  }
}

function CategorySection({ 
  category, 
  issues 
}: { 
  category: string; 
  issues: AnalysisType["issues"];
}) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="glass-panel glow-border rounded-lg overflow-hidden animate-fade-in">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
      >
        <Shield className="w-5 h-5 text-primary" />
        <span className="font-medium text-foreground flex-1 text-left">{category}</span>
        <span className="text-xs text-muted-foreground">
          {issues.length} issue{issues.length !== 1 ? 's' : ''}
        </span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          {issues.map((issue, index) => (
            <div 
              key={index}
              className={`border-l-2 pl-4 py-2 ${
                issue.type === 'error' ? 'border-destructive/50' :
                issue.type === 'warning' ? 'border-warning/50' :
                'border-primary/50'
              }`}
            >
              <div className="flex items-start gap-2">
                <IssueIcon type={issue.type} />
                <div className="flex-1">
                  <p className="text-foreground text-sm">
                    {issue.message}
                    {issue.line && (
                      <span className="text-muted-foreground ml-2">
                        (line {issue.line})
                      </span>
                    )}
                  </p>
                  {issue.suggestion && (
                    <p className="text-muted-foreground text-xs mt-1">
                      💡 {issue.suggestion}
                    </p>
                  )}
                  {issue.code && <CodeBlock code={issue.code} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function TraditionalAnalysisResult({ analysis }: TraditionalAnalysisResultProps) {
  // Group issues by category
  const groupedIssues = analysis.issues.reduce((acc, issue) => {
    if (!acc[issue.category]) {
      acc[issue.category] = [];
    }
    acc[issue.category].push(issue);
    return acc;
  }, {} as Record<string, AnalysisType["issues"]>);

  const categories = Object.keys(groupedIssues);

  return (
    <div className="space-y-4">
      {/* Summary Banner */}
      <div className={`border rounded-lg p-4 animate-fade-in ${
        analysis.stats.errors > 0 
          ? 'bg-gradient-to-r from-destructive/20 to-destructive/5 border-destructive/30'
          : analysis.stats.warnings > 0
          ? 'bg-gradient-to-r from-warning/20 to-warning/5 border-warning/30'
          : 'bg-gradient-to-r from-success/20 to-success/5 border-success/30'
      }`}>
        <p className="text-foreground font-medium">{analysis.summary}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-panel rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-destructive">{analysis.stats.errors}</div>
          <div className="text-xs text-muted-foreground">Errors</div>
        </div>
        <div className="glass-panel rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-warning">{analysis.stats.warnings}</div>
          <div className="text-xs text-muted-foreground">Warnings</div>
        </div>
        <div className="glass-panel rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-primary">{analysis.stats.info}</div>
          <div className="text-xs text-muted-foreground">Info</div>
        </div>
      </div>

      {/* Issues by Category */}
      {categories.length > 0 ? (
        categories.map((category) => (
          <CategorySection 
            key={category} 
            category={category} 
            issues={groupedIssues[category]} 
          />
        ))
      ) : (
        <div className="glass-panel glow-border rounded-lg p-8 text-center">
          <div className="p-4 bg-success/20 rounded-full inline-block mb-4">
            <Check className="w-8 h-8 text-success" />
          </div>
          <h4 className="text-lg font-medium text-foreground mb-2">All Clear!</h4>
          <p className="text-muted-foreground">
            No issues detected by the traditional analyzer. Code looks clean!
          </p>
        </div>
      )}

      {/* Privacy Note */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center mt-6">
        <Shield className="w-4 h-4" />
        <span>Privacy-first: All analysis runs locally, no code sent to external services</span>
      </div>
    </div>
  );
}
