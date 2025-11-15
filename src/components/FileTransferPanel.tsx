import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NetworkNode } from '@/types/network';
import { Upload, Send, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface FileTransferPanelProps {
  nodes: NetworkNode[];
  onStartTransfer: (file: File, sourceId: string, destId: string, chunkSize: number) => void;
  isSimulating: boolean;
}

export const FileTransferPanel = ({
  nodes,
  onStartTransfer,
  isSimulating,
}: FileTransferPanelProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceNode, setSourceNode] = useState<string>('');
  const [destNode, setDestNode] = useState<string>('');
  const [chunkSize, setChunkSize] = useState<number>(256);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleStartTransfer = () => {
    if (!selectedFile || !sourceNode || !destNode) return;
    if (sourceNode === destNode) return;

    onStartTransfer(selectedFile, sourceNode, destNode, chunkSize * 1024);
  };

  const canTransfer = selectedFile && sourceNode && destNode && sourceNode !== destNode && !isSimulating;

  return (
    <Card className="p-4 space-y-4 bg-card border-border">
      <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
        <Upload className="h-5 w-5 text-secondary" />
        File Transfer
      </h3>

      <div className="space-y-3">
        <div>
          <Label htmlFor="fileInput">Select File</Label>
          <div className="mt-1">
            <Input
              id="fileInput"
              type="file"
              onChange={handleFileSelect}
              disabled={isSimulating}
              className="cursor-pointer"
            />
          </div>
          {selectedFile && (
            <p className="text-xs text-muted-foreground mt-1">
              {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <div>
          <Label>Chunk Size (KB)</Label>
          <Input
            type="number"
            value={chunkSize}
            onChange={(e) => setChunkSize(Number(e.target.value))}
            min="1"
            max="1024"
            disabled={isSimulating}
          />
        </div>

        <div>
          <Label>Source Node</Label>
          <Select value={sourceNode} onValueChange={setSourceNode} disabled={isSimulating}>
            <SelectTrigger>
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              {nodes.map((node) => (
                <SelectItem key={node.id} value={node.id}>
                  {node.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Destination Node</Label>
          <Select value={destNode} onValueChange={setDestNode} disabled={isSimulating}>
            <SelectTrigger>
              <SelectValue placeholder="Select destination" />
            </SelectTrigger>
            <SelectContent>
              {nodes.map((node) => (
                <SelectItem key={node.id} value={node.id}>
                  {node.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleStartTransfer}
          disabled={!canTransfer}
          className="w-full glow-secondary"
        >
          {isSimulating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Transferring...
            </>
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              Start Transfer
            </>
          )}
        </Button>
      </div>

      {isSimulating && (
        <div className="p-3 bg-muted rounded-lg border border-border">
          <p className="text-xs text-center text-muted-foreground animate-pulse">
            Simulating transfer...
          </p>
        </div>
      )}
    </Card>
  );
};
