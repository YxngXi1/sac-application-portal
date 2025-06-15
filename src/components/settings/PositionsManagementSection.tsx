
import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Pencil, Plus } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, addDoc, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { toast } from "@/hooks/use-toast";

// Data model for a SAC position
export interface SACPosition {
  id: string;
  name: string;
}

const PositionsManagementSection: React.FC = () => {
  const [positions, setPositions] = useState<SACPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPositionName, setNewPositionName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  // Fetch all positions from Firestore ('positions' collection)
  const fetchPositions = async () => {
    setLoading(true);
    try {
      const ref = collection(db, "positions");
      const snap = await getDocs(ref);
      setPositions(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as { name: string }) })));
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Could not load positions",
        description: (e as any).message || "Failed to fetch positions from the server."
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const handleAdd = async () => {
    if (!newPositionName.trim()) return;
    try {
      await addDoc(collection(db, "positions"), { name: newPositionName.trim() });
      toast({ title: "Position added", description: newPositionName });
      setNewPositionName("");
      fetchPositions();
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as any).message });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this position? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "positions", id));
      setPositions(positions.filter(p => p.id !== id));
      toast({ title: "Deleted." });
    } catch (e) {
      toast({ variant: "destructive", title: "Error", description: (e as any).message });
    }
  };

  const handleEdit = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await updateDoc(doc(db, "positions", id), { name: editName.trim() });
      setEditing(null);
      setEditName("");
      fetchPositions();
      toast({ title: "Position updated." });
    } catch (e) {
      toast({ variant: "destructive", title: "Update failed", description: (e as any).message });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Positions Management</CardTitle>
        <CardDescription>
          Add, edit, or remove available executive and general member positions. All changes update instantly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add position row */}
          <div className="flex gap-2">
            <Input
              placeholder="New position name"
              value={newPositionName}
              onChange={e => setNewPositionName(e.target.value)}
              className="flex-1"
              onKeyDown={e => { if (e.key === "Enter") handleAdd(); }}
              disabled={loading}
            />
            <Button onClick={handleAdd} disabled={loading || !newPositionName.trim()} variant="outline">
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
          {/* List current positions */}
          <ul className="divide-y border rounded bg-gray-50">
            {loading && <li className="p-4 text-gray-500">Loading...</li>}
            {!loading && positions.length === 0 && (
              <li className="p-4 text-gray-400">No positions found.</li>
            )}
            {positions.map((pos) => (
              <li key={pos.id} className="flex items-center gap-3 px-2 py-2 group hover:bg-white/80 transition">
                {editing === pos.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      className="flex-1"
                      onKeyDown={e => { if (e.key === "Enter") handleEdit(pos.id); }}
                    />
                    <Button variant="outline" size="sm" onClick={() => handleEdit(pos.id)}>
                      Save
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-lg">{pos.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setEditing(pos.id); setEditName(pos.name); }}
                      aria-label="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(pos.id)}
                      aria-label="Delete"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default PositionsManagementSection;
