import re

with open("src/components/admin/MultimediaCenter.tsx", "r") as f:
    content = f.read()

content = re.sub(
    r"const isUploading = uploadingId === spot\.id;\s*const progress = uploadProgress\[spot\.id\] \|\| 0;",
    "const status = uploadStatuses[spot.id];\n              const isUploading = status?.state === 'uploading' || status?.state === 'waiting';\n              const progress = status?.progress || 0;\n              const hasError = status?.state === 'error';\n              const errorMessage = status?.error;",
    content
)

def replace_is_uploading(match):
    loader_size = match.group(1)
    return f"""{{isUploading ? (
                        <div className="space-y-1">
                          <Loader2 className="w-{loader_size} h-{loader_size} text-[#D4AF37] animate-spin mx-auto" />
                          <span className="text-[9px] font-mono text-zinc-550">Upload: {{progress}}%</span>
                        </div>
                      ) : hasError ? (
                        <div className="space-y-2">
                          <span className="text-[10px] text-red-500 block">{{errorMessage}}</span>
                          <label className="inline-flex px-3 py-1.5 bg-red-950/20 text-red-400 font-bold uppercase text-[9px] rounded-lg cursor-pointer transition-all border border-red-950/30 hover:bg-red-950/40">
                            Réessayer
                            <input
                              type="file"
                              onChange={{(e) => {{
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(spot.id, file, "media");
                              }}}}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : ("""

content = re.sub(
    r"\{isUploading \? \(\s*<div className=\"space-y-1\">\s*<Loader2 className=\"w-(\d+) h-\d+ text-\[\#D4AF37\] animate-spin mx-auto\" \/>\s*<span className=\"text-\[9px\] font-mono text-zinc-550\">Upload: \{progress\}%<\/span>\s*<\/div>\s*\) : \(",
    replace_is_uploading,
    content
)

with open("src/components/admin/MultimediaCenter.tsx", "w") as f:
    f.write(content)

