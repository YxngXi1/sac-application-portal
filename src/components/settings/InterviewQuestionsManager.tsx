import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface InterviewQuestion {
  id: string;
  text: string;
  category: 'general' | 'position-specific' | 'scenario';
  maxScore: number;
}

const InterviewQuestionsManager: React.FC = () => {
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [newQuestion, setNewQuestion] = useState<Partial<InterviewQuestion>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const questionsDoc = await getDoc(doc(db, 'settings', 'interviewQuestions'));
      if (questionsDoc.exists()) {
        setQuestions(questionsDoc.data().questions || []);
      }
    } catch (error) {
      console.error('Error loading interview questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveQuestions = async () => {
    try {
      await setDoc(doc(db, 'settings', 'interviewQuestions'), { questions });
      console.log('Interview questions saved successfully');
    } catch (error) {
      console.error('Error saving interview questions:', error);
    }
  };

  const addQuestion = () => {
    if (!newQuestion.text) return;

    const question: InterviewQuestion = {
      id: Date.now().toString(),
      text: newQuestion.text,
      category: newQuestion.category || 'general',
      maxScore: newQuestion.maxScore || 10,
    };

    setQuestions(prev => [...prev, question]);
    setNewQuestion({});
  };

  const updateQuestion = (questionId: string, updates: Partial<InterviewQuestion>) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, ...updates } : q
    ));
  };

  const deleteQuestion = (questionId: string) => {
    setQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  if (loading) {
    return <div className="text-center py-8">Loading interview questions...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Interview Questions Management</CardTitle>
          <CardDescription>
            Manage questions used during interviews. These will be available to executives during the interview process.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-end">
            <Button onClick={saveQuestions} className="bg-green-600 hover:bg-green-700">
              <Save className="h-4 w-4 mr-2" />
              Save All Changes
            </Button>
          </div>

          {/* Existing Questions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Interview Questions</h3>
            {questions.map((question) => (
              <Card key={question.id} className="border">
                <CardContent className="p-4">
                  {editingQuestion === question.id ? (
                    <div className="space-y-3">
                      <Textarea
                        value={question.text}
                        onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                        placeholder="Question text"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <select 
                          value={question.category}
                          onChange={(e) => updateQuestion(question.id, { category: e.target.value as any })}
                          className="border rounded px-3 py-2"
                        >
                          <option value="general">General</option>
                          <option value="position-specific">Position Specific</option>
                          <option value="scenario">Scenario</option>
                        </select>
                        <Input
                          type="number"
                          value={question.maxScore}
                          onChange={(e) => updateQuestion(question.id, { maxScore: parseInt(e.target.value) || 10 })}
                          placeholder="Max Score"
                          className="w-24"
                        />
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
                        <p className="font-medium mb-2">{question.text}</p>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{question.category}</Badge>
                          <Badge variant="outline">Max Score: {question.maxScore}</Badge>
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
              <h4 className="font-medium mb-3">Add New Interview Question</h4>
              <div className="space-y-3">
                <Textarea
                  placeholder="Question text"
                  value={newQuestion.text || ''}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, text: e.target.value }))}
                  rows={3}
                />
                <div className="flex gap-2">
                  <select 
                    value={newQuestion.category || 'general'}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, category: e.target.value as any }))}
                    className="border rounded px-3 py-2"
                  >
                    <option value="general">General</option>
                    <option value="position-specific">Position Specific</option>
                    <option value="scenario">Scenario</option>
                  </select>
                  <Input
                    type="number"
                    placeholder="Max Score"
                    value={newQuestion.maxScore || ''}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, maxScore: parseInt(e.target.value) || 10 }))}
                    className="w-24"
                  />
                  <Button onClick={addQuestion} disabled={!newQuestion.text}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default InterviewQuestionsManager;
