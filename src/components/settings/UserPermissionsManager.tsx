
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, UserPlus, Edit, Save, X } from 'lucide-react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'student' | 'exec' | 'teacher' | 'superadmin';
  fullName?: string;
  studentNumber?: string;
  grade?: string;
}

const UserPermissionsManager: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user => 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.studentNumber && user.studentNumber.includes(searchTerm))
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const loadUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      })) as UserProfile[];
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (uid: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      setUsers(prev => prev.map(user => 
        user.uid === uid ? { ...user, role: newRole as any } : user
      ));
      setEditingUser(null);
      console.log('User role updated successfully');
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'superadmin': return 'bg-red-100 text-red-800';
      case 'exec': return 'bg-blue-100 text-blue-800';
      case 'teacher': return 'bg-green-100 text-green-800';
      case 'student': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>User Permissions Management</CardTitle>
          <CardDescription>
            Manage user roles and permissions. Be careful when changing roles as this affects system access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by email, name, or student number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Users Table */}
          <div className="border rounded-lg">
            <div className="grid grid-cols-5 gap-4 p-4 bg-gray-50 font-medium text-sm">
              <div>Name</div>
              <div>Email</div>
              <div>Student Number</div>
              <div>Current Role</div>
              <div>Actions</div>
            </div>
            
            {filteredUsers.map((user) => (
              <div key={user.uid} className="grid grid-cols-5 gap-4 p-4 border-t items-center">
                <div>
                  <p className="font-medium">{user.name || user.fullName}</p>
                  <p className="text-sm text-gray-500">{user.grade && `Grade ${user.grade}`}</p>
                </div>
                <div className="text-sm">{user.email}</div>
                <div className="text-sm">{user.studentNumber || 'N/A'}</div>
                <div>
                  {editingUser === user.uid ? (
                    <Select 
                      value={user.role} 
                      onValueChange={(newRole) => updateUserRole(user.uid, newRole)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="exec">Executive</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="superadmin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  {editingUser === user.uid ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingUser(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingUser(user.uid)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No users found matching your search criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserPermissionsManager;
