import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Question {
  id: string;
  text: string;
  type: 'text' | 'textarea' | 'select';
  options?: string[];
  required: boolean;
  maxLength?: number;
}

interface PositionQuestions {
  [position: string]: Question[];
}

const ApplicationQuestionsManager: React.FC = () => {
  const [positionQuestions, setPositionQuestions] = useState<PositionQuestions>({});
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({});
  const [loading, setLoading] = useState(true);

  const positions = [
    'Secretary', 'Treasurer', 'Community Outreach', 'Athletics Liaison',
    'Promotions Officer', 'Photography Exec', 'Technology Executive', 'Arts Liaison'
  ];

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const questionsDoc = await getDoc(doc(db, 'settings', 'applicationQuestions'));
      if (questionsDoc.exists()) {
        setPositionQuestions(questionsDoc.data() as PositionQuestions);
      }
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveQuestions = async () => {
    try {
      await setDoc(doc(db, 'settings', 'applicationQuestions'), positionQuestions);
      console.log('Questions saved successfully');
    } catch (error) {
      console.error('Error saving questions:', error);
    }
  };

  const addQuestion = () => {
    if (!selectedPosition || !newQuestion.text) return;

    const question: Question = {
      id: Date.now().toString(),
      text: newQuestion.text,
      type: newQuestion.type || 'text',
      required: newQuestion.required || false,
      options: newQuestion.options,
      maxLength: newQuestion.maxLength,
    };

    setPositionQuestions(prev => ({
      ...prev,
      [selectedPosition]: [...(prev[selectedPosition] || []), question]
    }));

    setNewQuestion({});
  };

  const updateQuestion = (questionId: string, updates: Partial<Question>) => {
    if (!selectedPosition) return;

    setPositionQuestions(prev => ({
      ...prev,
      [selectedPosition]: prev[selectedPosition]?.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      ) || []
    }));
  };

  const deleteQuestion = (questionId: string) => {
    if (!selectedPosition) return;

    setPositionQuestions(prev => ({
      ...prev,
      [selectedPosition]: prev[selectedPosition]?.filter(q => q.id !== questionId) || []
    }));
  };

  if (loading) {
    return <div className="text-center py-8">Loading questions...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Application Questions Management</CardTitle>
          <CardDescription>
            Manage questions for each position. These questions will appear in the application form.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-between items-center">
            <Select value={selectedPosition} onValueChange={setSelectedPosition}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a position" />
              </SelectTrigger>
              <SelectContent>
                {positions.map(position => (
                  <SelectItem key={position} value={position}>{position}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={saveQuestions} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" />
              Save All Changes
            </Button>
          </div>

          {selectedPosition && (
            <>
              {/* Existing Questions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Questions for {selectedPosition}</h3>
                {positionQuestions[selectedPosition]?.map((question, index) => (
                  <Card key={question.id} className="border">
                    <CardContent className="p-4">
                      {editingQuestion === question.id ? (
                        <div className="space-y-3">
                          <Input
                            value={question.text}
                            onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                            placeholder="Question text"
                          />
                          <div className="flex gap-2">
                            <Select 
                              value={question.type} 
                              onValueChange={(value) => updateQuestion(question.id, { type: value as any })}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="textarea">Textarea</SelectItem>
                                <SelectItem value="select">Select</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              onClick={() => setEditingQuestion(null)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingQuestion(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{question.text}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="secondary">{question.type}</Badge>
                              {question.required && <Badge variant="destructive">Required</Badge>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingQuestion(question.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteQuestion(question.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Add New Question */}
              <Card className="border-dashed">
                <CardContent className="p-4">
                  <h4 className="font-medium mb-3">Add New Question</h4>
                  <div className="space-y-3">
                    <Input
                      placeholder="Question text"
                      value={newQuestion.text || ''}
                      onChange={(e) => setNewQuestion(prev => ({ ...prev, text: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <Select 
                        value={newQuestion.type || 'text'} 
                        onValueChange={(value) => setNewQuestion(prev => ({ ...prev, type: value as any }))}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="textarea">Textarea</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button onClick={addQuestion} disabled={!newQuestion.text}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Question
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplicationQuestionsManager;
