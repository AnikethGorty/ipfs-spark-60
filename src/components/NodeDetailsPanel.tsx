import { Card } from "@/components/ui/card";

export const NodeDetailsPanel = ({ selectedNode, blockchain }) => {
  if (!selectedNode) return null;

  const sentChunks = blockchain.filter(b => b.from === selectedNode);
  const receivedChunks = blockchain.filter(b => b.to === selectedNode);

  const sentFiles = [...new Set(sentChunks.map(b => b.fileName))];
  const receivedFiles = [...new Set(receivedChunks.map(b => b.fileName))];

  return (
    <Card className="p-4 space-y-3 bg-card border-border">
      <h3 className="text-lg font-bold text-foreground">
        Node Details: {selectedNode}
      </h3>

      <div>
        <h4 className="font-semibold">Files Sent:</h4>
        {sentFiles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files sent.</p>
        ) : (
          sentFiles.map(f => <p key={f}>• {f}</p>)
        )}
      </div>

      <div>
        <h4 className="font-semibold">Files Received:</h4>
        {receivedFiles.length === 0 ? (
          <p className="text-sm text-muted-foreground">No files received.</p>
        ) : (
          receivedFiles.map(f => <p key={f}>• {f}</p>)
        )}
      </div>

      <div>
        <h4 className="font-semibold">Chunks Sent:</h4>
        {sentChunks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No chunks sent.</p>
        ) : (
          sentChunks.map(c => (
            <p key={c.chunkId}>
              • {c.fileName} (chunk {c.chunkId}) → {c.to}
            </p>
          ))
        )}
      </div>

      <div>
        <h4 className="font-semibold">Chunks Received:</h4>
        {receivedChunks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No chunks received.</p>
        ) : (
          receivedChunks.map(c => (
            <p key={c.chunkId}>
              • {c.fileName} (chunk {c.chunkId}) ← {c.from}
            </p>
          ))
        )}
      </div>
    </Card>
  );
};
